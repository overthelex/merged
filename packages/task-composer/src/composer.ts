import type { Level } from '@merged/task-spec';
import { extractFenced, invokeBedrock } from './bedrock';
import {
  ComposerDraftSchema,
  type ComposerDraft,
  type RepoMeta,
  type Surface,
} from './types';

export interface ComposerConfig {
  region?: string;
  modelId?: string;
  maxRetries?: number;
}

const DEFAULT_COMPOSER_MODEL =
  process.env.BEDROCK_COMPOSER_MODEL_ID ?? 'eu.anthropic.claude-opus-4-7-v1:0';

export interface ComposerInputs {
  surfaces: Surface[];
  level: Level;
  meta: RepoMeta;
  /**
   * Original HR seniority string. `level` is always one of junior|middle|senior
   * (the task-spec schema). The portal additionally supports `architect`, which
   * is collapsed to `senior` before reaching the composer; pass the raw
   * seniority here so the prompt can calibrate the rubric upwards without
   * violating the YAML schema.
   */
  calibrationHint?: 'architect' | 'principal' | string;
  /** Feedback from a prior Calibrator run, if any. */
  revisionNotes?: string[];
}

const TIME_RANGES: Record<Level, string> = {
  junior: '30–90',
  middle: '60–180',
  senior: '120–360',
};

const ARCHITECT_TIME_RANGE = '180–480';

const TOP_SURFACES_FOR_PROMPT = 15;

/**
 * Pick top-N surfaces and draft a complete assignment: `task.yaml` + `ASSIGNMENT.md`.
 * On revision rounds, temperature drops to 0.1 so the composer sticks close to
 * the prior draft instead of regenerating from scratch.
 */
export async function runComposer(
  inputs: ComposerInputs,
  cfg: ComposerConfig = {},
): Promise<ComposerDraft> {
  const onRevision = !!inputs.revisionNotes?.length;
  const prompt = buildComposerPrompt(inputs);
  const text = await invokeBedrock({
    region: cfg.region,
    modelId: cfg.modelId ?? DEFAULT_COMPOSER_MODEL,
    prompt,
    maxTokens: 8192,
    temperature: onRevision ? 0.1 : 0.3,
    maxRetries: cfg.maxRetries,
  });

  const yamlBlock = extractFenced(text, 'yaml');
  const mdBlock = extractFenced(text, 'markdown');
  let notesText: string | undefined;
  try {
    notesText = extractFenced(text, 'notes');
  } catch {
    notesText = undefined;
  }

  // Cheap pre-Calibrator sanity check: YAML block must contain version/rubric.
  if (!/\bversion\s*:/.test(yamlBlock) || !/\brubric\s*:/.test(yamlBlock)) {
    throw new Error(
      'composer yaml block is missing version/rubric — likely block mis-ordering',
    );
  }

  const draft: ComposerDraft = {
    task_yaml: yamlBlock,
    assignment_md: mdBlock,
    design_notes: notesText,
  };
  return ComposerDraftSchema.parse(draft);
}

function buildComposerPrompt(inputs: ComposerInputs): string {
  const top = inputs.surfaces.slice(0, TOP_SURFACES_FOR_PROMPT);
  const isArchitect = inputs.calibrationHint === 'architect';
  const timeRange = isArchitect ? ARCHITECT_TIME_RANGE : TIME_RANGES[inputs.level];

  const architectBlock = isArchitect
    ? [
        '',
        '## Calibration hint — architect-level',
        'The HR recruiter selected "architect". The schema level stays `senior` (task-spec',
        'currently has only junior|middle|senior), but the task should emphasise system',
        'boundaries, migrations, backwards-compat, and reasoning documented in the PR.',
        'Weight the rubric toward judgement criteria (llm sources) over CI-measurable ones.',
      ].join('\n')
    : '';

  const revisions = inputs.revisionNotes?.length
    ? [
        '',
        '## Revision required',
        'Your previous draft was rejected by the calibrator. Your response MUST begin',
        'with a ```notes block that lists each item below and the specific edit you made',
        'to address it. Do not skip or summarise — one note per item.',
        inputs.revisionNotes.map((n, i) => `${i + 1}. ${n}`).join('\n'),
      ].join('\n')
    : '';

  return [
    COMPOSER_PREAMBLE,
    '',
    `Repository: ${inputs.meta.name}`,
    `Primary languages: ${inputs.meta.languages.join(', ') || 'unknown'}`,
    `Target seniority: ${inputs.level}`,
    architectBlock,
    '',
    '## Candidate surfaces (ranked, pick the single best one)',
    top.map(renderSurface).join('\n\n'),
    revisions,
    '',
    '## Output format',
    'Emit exactly three fenced blocks in this order:',
    '',
    '1. ```yaml``` — the `task.yaml` per the merged task-spec schema.',
    '2. ```markdown``` — the `ASSIGNMENT.md` shown to the candidate.',
    '3. ```notes``` — 2–4 sentences on your design choices (for audit; not shown to candidate).',
    '',
    '## task.yaml constraints',
    '- version: 1',
    '- id: slug (lowercase, digits, hyphens), 1–80 chars, derived from the task',
    '- level: one of junior|middle|senior (must match target seniority)',
    `- time_limit_min: realistic for this level (${timeRange} minutes)`,
    '- description_md: Ukrainian (uk-UA). Explain the task, acceptance criteria, what we grade.',
    '- seeds: 3–5 short slugs (e.g. alpha/bravo/charlie) — meaningful variant hooks, not just names',
    '- rubric: 3–6 criteria, weights MUST sum to exactly 100',
    '  - include at least one source: auto (CI-measurable) and one source: llm (judgement)',
    '  - key is lowercase_snake_case',
    "- ci_extra: optional shell commands the CI runs beyond the repo's own tests",
    '',
    '## ASSIGNMENT.md tone',
    '- Ukrainian. Clear, respectful, no hype.',
    '- Tell the candidate: what to build, where to branch from, how to open the PR, how self-check runs.',
    '- Remind them AI is allowed but the PR description reasoning is evaluated.',
    '',
    'No prose outside the three fenced blocks.',
  ]
    .filter(Boolean)
    .join('\n');
}

const COMPOSER_PREAMBLE = `You are a technical-screening task author for "merged". You take a ranked list of candidate "surfaces" (real gaps/bugs/refactors a scout found in a real repo) and compose ONE calibrated assignment from the single best-fit surface.

Principles:
1. Pick the surface that best matches the target seniority — not necessarily the highest-scored one.
2. The task must be completable in one sitting within time_limit_min.
3. The rubric is the product — it must reward the right things and penalise shallow work.
4. Seeds are anti-cheat: each should imply a distinct valid approach, not cosmetic renames.
5. Write in Ukrainian (uk-UA) for the candidate-facing text. Code/keys/paths stay as-is.`;

function renderSurface(s: Surface): string {
  return [
    `### [${s.score}] ${s.title}`,
    `- kind: ${s.kind}`,
    `- path: ${s.path}`,
    `- fit_levels: ${s.fit_levels.join(', ')}`,
    `- effort: ~${s.estimated_effort_min} min`,
    `- summary: ${s.summary}`,
  ].join('\n');
}
