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

const MAX_CHUNK_CHARS = 90_000;

export interface ScoutInputs {
  files: RepoFile[];
  meta: RepoMeta;
  level: Level;
}

/**
 * Run one Scout worker per chunk in parallel (capped by `maxWorkers`,
 * default 10). Each worker returns a partial {@link ScoutReport}; we merge
 * and rank by the LLM's self-assigned score.
 */
export async function runScout(inputs: ScoutInputs, cfg: ScoutConfig = {}): Promise<ScoutReport> {
  const chunks = partitionFiles(inputs.files, cfg.maxWorkers ?? 10);
  if (chunks.length === 0) {
    return { surfaces: [], notes: 'repo had no source files after filtering' };
  }

  const workerReports = await Promise.all(
    chunks.map((chunk, idx) =>
      runWorker({ chunk, idx, total: chunks.length, meta: inputs.meta, level: inputs.level }, cfg),
    ),
  );

  const surfaces: Surface[] = workerReports
    .flatMap((r) => r.surfaces)
    .filter((s) => s.fit_levels.includes(inputs.level))
    .sort((a, b) => b.score - a.score)
    .slice(0, 20);

  const notes = workerReports
    .map((r, i) => (r.notes ? `worker ${i}: ${r.notes}` : null))
    .filter(Boolean)
    .join(' · ');

  return { surfaces, notes: notes || undefined };
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
  const json = extractJson(text);
  const parsed = ScoutReportSchema.safeParse(json);
  if (!parsed.success) {
    return {
      surfaces: [],
      notes: `worker ${args.idx} produced invalid scout report: ${parsed.error.issues[0]?.message}`,
    };
  }
  return parsed.data;
}

function buildScoutPrompt({ chunk, idx, total, meta, level }: WorkerArgs): string {
  const fileList = chunk.map((f) => renderFile(f)).join('\n\n');
  const trimmed = fileList.length > MAX_CHUNK_CHARS
    ? fileList.slice(0, MAX_CHUNK_CHARS) + `\n…[${fileList.length - MAX_CHUNK_CHARS} chars dropped]`
    : fileList;

  return [
    SCOUT_PREAMBLE,
    '',
    `Repository: ${meta.name}`,
    `Primary languages: ${meta.languages.join(', ') || 'unknown'}`,
    `Target seniority: ${level}`,
    `You are worker ${idx + 1} of ${total}. You see only a slice of the repo.`,
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
    '      "kind": "missing_tests|feature_gap|bug|refactor|docs|perf|security",',
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
