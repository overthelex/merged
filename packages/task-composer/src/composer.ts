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
  /** Feedback from a prior Calibrator run, if any. */
  revisionNotes?: string[];
}

/**
 * Pick top-N surfaces and draft a complete assignment: `task.yaml` + `ASSIGNMENT.md`.
 * Schema validity is enforced later by the Calibrator.
 */
export async function runComposer(
  inputs: ComposerInputs,
  cfg: ComposerConfig = {},
): Promise<ComposerDraft> {
  const prompt = buildComposerPrompt(inputs);
  const text = await invokeBedrock({
    region: cfg.region,
    modelId: cfg.modelId ?? DEFAULT_COMPOSER_MODEL,
    prompt,
    maxTokens: 6144,
    temperature: 0.3,
    maxRetries: cfg.maxRetries,
  });

  const yamlBlock = extractFenced(text, 'yaml');
  const mdBlock = extractFenced(text, 'markdown');
  const notesMatch = text.match(/```notes\s*([\s\S]*?)```/i);

  const draft: ComposerDraft = {
    task_yaml: yamlBlock,
    assignment_md: mdBlock,
    design_notes: notesMatch?.[1]?.trim(),
  };
  return ComposerDraftSchema.parse(draft);
}

function buildComposerPrompt(inputs: ComposerInputs): string {
  const top = inputs.surfaces.slice(0, 8);
  const revisions = inputs.revisionNotes?.length
    ? [
        '## Revision required',
        'Your previous draft was rejected by the calibrator. Address each item:',
        inputs.revisionNotes.map((n) => `- ${n}`).join('\n'),
        '',
      ].join('\n')
    : '';

  return [
    COMPOSER_PREAMBLE,
    '',
    `Repository: ${inputs.meta.name}`,
    `Primary languages: ${inputs.meta.languages.join(', ') || 'unknown'}`,
    `Target seniority: ${inputs.level}`,
    '',
    '## Candidate surfaces (ranked, pick the single best one)',
    top.map(renderSurface).join('\n\n'),
    '',
    revisions,
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
    `- time_limit_min: realistic for ${inputs.level} (junior 30–90, middle 60–180, senior 120–360)`,
    '- description_md: Ukrainian (uk-UA). Explain the task, acceptance criteria, what we grade.',
    '- seeds: 3–5 short slugs (e.g. alpha/bravo/charlie) — meaningful variant hooks, not just names',
    '- rubric: 3–6 criteria, weights MUST sum to exactly 100',
    '  - include at least one source: auto (CI-measurable) and one source: llm (judgement)',
    '  - key is lowercase_snake_case',
    '- ci_extra: optional shell commands the CI runs beyond the repo\'s own tests',
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
