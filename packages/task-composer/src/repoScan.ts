import { readFile, readdir, stat } from 'node:fs/promises';
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

export interface ScanOptions {
  /** Override the default set of skip directories. */
  extraSkipDirs?: string[];
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
    if (size > MAX_FILE_BYTES) return;

    let content: string;
    try {
      content = await readFile(absPath, 'utf8');
    } catch {
      return;
    }
    if (content.length > MAX_CONTENT_CHARS_PER_FILE) {
      content =
        content.slice(0, MAX_CONTENT_CHARS_PER_FILE) +
        `\n…[truncated ${content.length - MAX_CONTENT_CHARS_PER_FILE} chars]`;
    }
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
    name: root.split(sep).filter(Boolean).pop() ?? 'repo',
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
    if (entry.name.startsWith('.') && entry.name !== '.github') {
      // keep .github but skip other dotfiles (locks, caches, editor junk)
      if (entry.isDirectory()) continue;
      if (entry.name !== '.gitignore' && entry.name !== '.env.example') continue;
    }
    const abs = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (skipDirs.has(entry.name)) continue;
      await walk(root, abs, skipDirs, visit);
      continue;
    }
    if (!entry.isFile()) continue;
    if (SKIP_FILES.has(entry.name)) continue;
    const s = await stat(abs);
    await visit(abs, relative(root, abs), s.size);
  }
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
    let min = 0;
    for (let i = 1; i < workers; i++) if (sizes[i]! < sizes[min]!) min = i;
    chunks[min]!.push(f);
    sizes[min]! += f.size;
  }
  return chunks;
}
