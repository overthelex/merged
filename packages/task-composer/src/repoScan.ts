import { readFile, readdir, lstat } from 'node:fs/promises';
import { extname, join, relative, sep } from 'node:path';
import type { RepoFile, RepoMeta } from './types';

const SKIP_DIRS = new Set([
  'node_modules',
  '.git',
  '.next',
  '.turbo',
  '.cache',
  '.venv',
  'venv',
  '__pycache__',
  'dist',
  'build',
  'out',
  'target',
  'coverage',
  'vendor',
  '.idea',
  '.vscode',
  'tmp',
  'temp',
]);

const SKIP_FILES = new Set([
  'pnpm-lock.yaml',
  'package-lock.json',
  'yarn.lock',
  'poetry.lock',
  'Pipfile.lock',
  'Cargo.lock',
  'go.sum',
  'composer.lock',
]);

const ALLOW_DOTFILES = new Set([
  '.gitignore',
  '.env.example',
  '.eslintrc.json',
  '.eslintrc.js',
  '.eslintrc.cjs',
  '.prettierrc',
  '.prettierrc.json',
  '.nvmrc',
  '.node-version',
  '.editorconfig',
  '.dockerignore',
]);

const SOURCE_EXT_LANG: Record<string, string> = {
  '.ts': 'typescript',
  '.tsx': 'typescript',
  '.js': 'javascript',
  '.jsx': 'javascript',
  '.mjs': 'javascript',
  '.cjs': 'javascript',
  '.py': 'python',
  '.go': 'go',
  '.rs': 'rust',
  '.java': 'java',
  '.kt': 'kotlin',
  '.rb': 'ruby',
  '.php': 'php',
  '.cs': 'csharp',
  '.swift': 'swift',
  '.scala': 'scala',
  '.c': 'c',
  '.h': 'c',
  '.cc': 'cpp',
  '.cpp': 'cpp',
  '.hpp': 'cpp',
  '.sh': 'shell',
  '.sql': 'sql',
};

const CONFIG_EXT_LANG: Record<string, string> = {
  '.md': 'markdown',
  '.yaml': 'yaml',
  '.yml': 'yaml',
  '.toml': 'toml',
  '.json': 'json',
};

const MAX_FILE_BYTES = 200_000;
const MAX_CONTENT_CHARS_PER_FILE = 8_000;
const BINARY_SNIFF_BYTES = 4_096;
const BINARY_NONPRINTABLE_RATIO = 0.3;

export interface ScanOptions {
  /** Override the default set of skip directories. */
  extraSkipDirs?: string[];
  /**
   * Human-readable repo name used in LLM prompts. Defaults to the basename
   * of `root`; callers working from temp dirs should pass the real
   * `<owner>/<repo>` so tempdir hashes don't leak into the prompt.
   */
  repoName?: string;
}

export interface ScanResult {
  files: RepoFile[];
  meta: RepoMeta;
}

export async function scanRepo(root: string, opts: ScanOptions = {}): Promise<ScanResult> {
  const skipDirs = new Set([...SKIP_DIRS, ...(opts.extraSkipDirs ?? [])]);
  const files: RepoFile[] = [];
  const langCount = new Map<string, number>();

  await walk(root, root, skipDirs, async (absPath, relPath, size) => {
    const ext = extname(relPath).toLowerCase();
    const lang = SOURCE_EXT_LANG[ext] ?? CONFIG_EXT_LANG[ext];
    if (!lang) return;
    if (!Number.isFinite(size) || size > MAX_FILE_BYTES) return;

    let raw: Buffer;
    try {
      raw = await readFile(absPath);
    } catch {
      return;
    }
    if (looksBinary(raw)) return;
    const content = safeTruncate(raw.toString('utf8'));
    files.push({ path: relPath, size, content });

    if (SOURCE_EXT_LANG[ext]) {
      langCount.set(lang, (langCount.get(lang) ?? 0) + 1);
    }
  });

  const languages = [...langCount.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([l]) => l);

  const meta: RepoMeta = {
    name: opts.repoName ?? deriveRepoName(root),
    languages,
    fileCount: files.length,
    totalSize: files.reduce((a, f) => a + f.size, 0),
  };

  return { files, meta };
}

async function walk(
  root: string,
  dir: string,
  skipDirs: Set<string>,
  visit: (abs: string, rel: string, size: number) => Promise<void>,
): Promise<void> {
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    const abs = join(dir, entry.name);

    if (entry.name.startsWith('.')) {
      if (entry.isDirectory()) {
        if (entry.name !== '.github') continue;
      } else if (!ALLOW_DOTFILES.has(entry.name)) {
        continue;
      }
    }

    // lstat so symlinks never resolve — a malicious repo could drop a
    // symlink named `foo.ts` pointing to /etc/shadow.
    let info;
    try {
      info = await lstat(abs);
    } catch {
      continue;
    }
    if (info.isSymbolicLink()) continue;

    if (info.isDirectory()) {
      if (skipDirs.has(entry.name)) continue;
      await walk(root, abs, skipDirs, visit);
      continue;
    }
    if (!info.isFile()) continue;
    if (SKIP_FILES.has(entry.name)) continue;
    await visit(abs, relative(root, abs), info.size);
  }
}

function looksBinary(buf: Buffer): boolean {
  if (buf.length === 0) return false;
  const n = Math.min(buf.length, BINARY_SNIFF_BYTES);
  let nonPrintable = 0;
  for (let i = 0; i < n; i++) {
    const b = buf[i]!;
    if (b === 0) return true;
    if (b < 9 || (b > 13 && b < 32)) nonPrintable++;
  }
  return nonPrintable / n > BINARY_NONPRINTABLE_RATIO;
}

function safeTruncate(s: string): string {
  if (s.length <= MAX_CONTENT_CHARS_PER_FILE) return s;
  const chars = Array.from(s);
  if (chars.length <= MAX_CONTENT_CHARS_PER_FILE) return s;
  const kept = chars.slice(0, MAX_CONTENT_CHARS_PER_FILE).join('');
  return `${kept}\n…[truncated ${chars.length - MAX_CONTENT_CHARS_PER_FILE} chars]`;
}

function deriveRepoName(root: string): string {
  const base = root.split(sep).filter(Boolean).pop() ?? 'repo';
  if (base.startsWith('merged-compose-')) return 'repo';
  return base;
}

/**
 * Split files into up to `maxWorkers` balanced chunks by total byte size.
 * Worker count scales with file count (one per ~400 files) but never exceeds
 * the cap. Largest-first greedy packing keeps chunks roughly equal.
 */
export function partitionFiles(files: RepoFile[], maxWorkers = 10): RepoFile[][] {
  if (files.length === 0) return [];
  const workers = Math.min(maxWorkers, Math.max(1, Math.ceil(files.length / 400)));
  const chunks: RepoFile[][] = Array.from({ length: workers }, () => []);
  const sizes = new Array<number>(workers).fill(0);
  const sorted = [...files].sort((a, b) => b.size - a.size);
  for (const f of sorted) {
    const size = Number.isFinite(f.size) ? f.size : 0;
    let min = 0;
    for (let i = 1; i < workers; i++) if (sizes[i]! < sizes[min]!) min = i;
    chunks[min]!.push(f);
    sizes[min]! += size;
  }
  return chunks;
}
