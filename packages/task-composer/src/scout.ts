import type { Level } from '@merged/task-spec';
import { extractJson, invokeBedrock } from './bedrock';
import { partitionFiles } from './repoScan';
import {
  ScoutReportSchema,
  type RepoFile,
  type RepoMeta,
  type ScoutReport,
  type Surface,
} from './types';

export interface ScoutConfig {
  region?: string;
  modelId?: string;
  maxWorkers?: number;
  maxRetries?: number;
}

const DEFAULT_SCOUT_MODEL =
  process.env.BEDROCK_SCOUT_MODEL_ID ?? 'eu.anthropic.claude-haiku-4-5-v1:0';

const MAX_CHUNK_CHARS = 70_000;
const TOP_SURFACES = 20;

export interface ScoutInputs {
  files: RepoFile[];
  meta: RepoMeta;
  level: Level;
}

/**
 * Run one Scout worker per chunk in parallel (capped by `maxWorkers`,
 * default 10). Uses `allSettled` so a single worker failure doesn't kill
 * the whole run. Post-hoc path validation drops surfaces whose `path`
 * isn't in the worker's chunk. Falls back to unfiltered surfaces when
 * the fit_levels filter strips everything.
 */
export async function runScout(inputs: ScoutInputs, cfg: ScoutConfig = {}): Promise<ScoutReport> {
  const chunks = partitionFiles(inputs.files, cfg.maxWorkers ?? 10);
  if (chunks.length === 0) {
    return { surfaces: [], notes: 'repo had no source files after filtering' };
  }

  const settled = await Promise.allSettled(
    chunks.map((chunk, idx) =>
      runWorker({ chunk, idx, total: chunks.length, meta: inputs.meta, level: inputs.level }, cfg),
    ),
  );

  const reports: ScoutReport[] = [];
  const failedNotes: string[] = [];
  settled.forEach((res, i) => {
    if (res.status === 'fulfilled') {
      reports.push(res.value);
    } else {
      const msg = res.reason instanceof Error ? res.reason.message : String(res.reason);
      failedNotes.push(`worker ${i} failed: ${truncateNote(msg)}`);
    }
  });

  const allSurfaces: Surface[] = reports.flatMap((r) => r.surfaces);
  const levelFit = allSurfaces.filter((s) => s.fit_levels.includes(inputs.level));
  const chosen = levelFit.length > 0 ? levelFit : allSurfaces;
  const surfaces = chosen.sort((a, b) => b.score - a.score).slice(0, TOP_SURFACES);

  const workerNotes = reports
    .map((r, i) => (r.notes ? `worker ${i}: ${r.notes}` : null))
    .filter(Boolean) as string[];
  const allNotes = [...workerNotes, ...failedNotes];
  const notes = allNotes.length > 0 ? allNotes.join(' · ') : undefined;

  if (surfaces.length === 0 && failedNotes.length === settled.length) {
    throw new Error(`all ${settled.length} scout workers failed · ${notes}`);
  }

  return { surfaces, notes };
}

interface WorkerArgs {
  chunk: RepoFile[];
  idx: number;
  total: number;
  meta: RepoMeta;
  level: Level;
}

async function runWorker(args: WorkerArgs, cfg: ScoutConfig): Promise<ScoutReport> {
  const prompt = buildScoutPrompt(args);
  const text = await invokeBedrock({
    region: cfg.region,
    modelId: cfg.modelId ?? DEFAULT_SCOUT_MODEL,
    prompt,
    maxTokens: 3072,
    temperature: 0.2,
    maxRetries: cfg.maxRetries,
  });

  let json: unknown;
  try {
    json = extractJson(text);
  } catch (e) {
    return {
      surfaces: [],
      notes: `worker ${args.idx} returned unparseable output: ${truncateNote(
        (e as Error).message,
      )}`,
    };
  }

  const parsed = ScoutReportSchema.safeParse(json);
  if (!parsed.success) {
    return {
      surfaces: [],
      notes: `worker ${args.idx} produced invalid scout report: ${parsed.error.issues[0]?.message}`,
    };
  }

  // Post-hoc path validation — the LLM is told to use "a real file from
  // this slice" but nothing in the protocol enforces it.
  const chunkPaths = new Set(args.chunk.map((f) => f.path));
  const kept: Surface[] = [];
  let dropped = 0;
  for (const s of parsed.data.surfaces) {
    if (chunkPaths.has(s.path)) kept.push(s);
    else dropped++;
  }
  const notes = dropped
    ? [parsed.data.notes, `worker ${args.idx} dropped ${dropped} hallucinated paths`]
        .filter(Boolean)
        .join(' · ')
    : parsed.data.notes;

  return { surfaces: kept, notes };
}

function buildScoutPrompt({ chunk, meta, level }: WorkerArgs): string {
  const fileList = chunk.map((f) => renderFile(f)).join('\n\n');
  const trimmed =
    fileList.length > MAX_CHUNK_CHARS
      ? fileList.slice(0, MAX_CHUNK_CHARS) +
        `\n…[${fileList.length - MAX_CHUNK_CHARS} chars dropped]`
      : fileList;

  return [
    SCOUT_PREAMBLE,
    '',
    `Repository: ${meta.name}`,
    `Primary languages: ${meta.languages.join(', ') || 'unknown'}`,
    `Target seniority: ${level}`,
    `You see a representative slice of the repo, not all of it.`,
    '',
    '## Files in this slice',
    trimmed,
    '',
    '## Output',
    'Return JSON matching this schema:',
    '```json',
    '{',
    '  "surfaces": [',
    '    {',
    '      "kind": "missing_tests|feature_gap|bug|refactor|docs|perf|security|api_design|error_handling|concurrency|data_model",',
    '      "path": "<repo-relative path, must be a real file from this slice>",',
    '      "title": "<short, actionable>",',
    '      "summary": "<2-4 sentences: what, why it\'s a good screening task>",',
    '      "estimated_effort_min": <integer 15-480>,',
    '      "fit_levels": ["junior"|"middle"|"senior"],',
    '      "score": <0-100 confidence>',
    '    }',
    '  ],',
    '  "notes": "<optional, <=500 chars: caveats about this slice>"',
    '}',
    '```',
    'Rules:',
    '- Return at most 8 surfaces per worker. Quality over quantity.',
    '- Prefer surfaces that fit the target seniority.',
    '- `path` MUST be one of the files shown in this slice, verbatim.',
    '- Skip vague suggestions ("add more tests") — point to a specific file/function.',
    '- A good surface is small enough to finish in one sitting and teaches us about the candidate.',
    '- No Markdown outside the JSON fence.',
  ].join('\n');
}

const SCOUT_PREAMBLE = `You are a technical-screening scout for the "merged" platform. Your job: scan a slice of a real codebase and propose candidate TASKS (not full solutions) that we could give to a developer during a calibrated take-home screening.

A good screening task:
- Fits in the repo's existing architecture; the candidate only touches a few files.
- Has a verifiable outcome (tests pass, endpoint returns X, lint is green).
- Needs judgement — not just typing. AI assistance is allowed but shouldn't solve it alone.
- Matches the target seniority (junior=small + clear, senior=architectural/trade-offs).`;

function renderFile(f: RepoFile): string {
  return `### ${f.path}\n\`\`\`\n${f.content}\n\`\`\``;
}

function truncateNote(s: string): string {
  return s.length > 200 ? s.slice(0, 200) + '…' : s;
}
