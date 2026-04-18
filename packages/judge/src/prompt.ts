import type { TaskSpec, RubricCriterion } from '@merged/task-spec';

export interface JudgeInputs {
  spec: TaskSpec;
  /** The seeded variant shown to the candidate. */
  seed: string;
  /** PR title + body (markdown). */
  prDescription: string;
  /** Unified diff of the PR, truncated if huge. */
  diff: string;
  /** CI output summary — test results, coverage delta, lint errors. */
  ciSummary: string;
  /** Candidate's answers to bot review comments, if any. */
  reviewDialogue?: string;
}

/**
 * Returns a structured instruction for the LLM judge. The model is expected
 * to respond with a single JSON object that matches `JudgeVerdictSchema`.
 *
 * We only include LLM-sourced criteria in the request — auto-sourced criteria
 * are scored deterministically elsewhere and merged afterwards.
 */
export function buildJudgePrompt(inputs: JudgeInputs): string {
  const llmCriteria = inputs.spec.rubric.filter((c) => c.source === 'llm');
  return [
    SYSTEM_PREAMBLE,
    '',
    `## Assignment`,
    `Title: ${inputs.spec.title}`,
    `Level: ${inputs.spec.level}`,
    `Seed (variant): ${inputs.seed}`,
    inputs.spec.stack.length ? `Stack: ${inputs.spec.stack.join(', ')}` : '',
    '',
    `### Task description`,
    inputs.spec.description_md,
    '',
    `## Candidate submission`,
    '',
    `### PR description`,
    fence(inputs.prDescription, 'markdown'),
    '',
    `### Diff`,
    fence(truncate(inputs.diff, 25_000), 'diff'),
    '',
    `### CI summary`,
    fence(truncate(inputs.ciSummary, 4_000), 'text'),
    '',
    inputs.reviewDialogue
      ? `### Review dialogue\n${fence(truncate(inputs.reviewDialogue, 4_000), 'markdown')}\n`
      : '',
    '',
    `## Scoring rubric (you score only the LLM-sourced criteria)`,
    llmCriteria.map(formatCriterion).join('\n\n'),
    '',
    renderSchema(llmCriteria),
    '',
    `Respond with a single JSON object. No prose outside the JSON.`,
    inputs.spec.judge_prompt_override
      ? `\n---\nAdditional calibration notes from the task author:\n${inputs.spec.judge_prompt_override}`
      : '',
  ]
    .filter(Boolean)
    .join('\n');
}

const SYSTEM_PREAMBLE = `You are a calibrated technical-screening judge for the merged platform.
Your job: score a candidate's pull request by a structured rubric.

Principles you follow strictly:
1. Each criterion gets an integer score 0–5. Justify briefly (≤ 2 sentences).
2. AI assistance is allowed for candidates — do NOT penalise for clean, well-reasoned code just because it looks AI-authored.
3. Penalise shallow/generic work: missing rationale, oversized diff, commits as one blob, failing edge-case tests.
4. Trust the CI signal: you do NOT re-run tests. The CI summary is authoritative.
5. Never invent information that isn't in the diff, PR description, CI, or review dialogue.
6. Output valid JSON only. No Markdown fences.`;

function formatCriterion(c: RubricCriterion): string {
  return [
    `**${c.key}** — ${c.label} (weight ${c.weight}%)`,
    c.description ? c.description : '',
  ]
    .filter(Boolean)
    .join('\n');
}

function renderSchema(criteria: readonly RubricCriterion[]): string {
  const scoresObject = criteria
    .map((c) => `    "${c.key}": { "score": <0-5 integer>, "rationale": "<1-2 sentences>" }`)
    .join(',\n');
  return [
    '## Output schema (JSON)',
    '```',
    '{',
    '  "scores": {',
    scoresObject,
    '  },',
    '  "strengths": ["<short bullet>", ...],',
    '  "weaknesses": ["<short bullet>", ...],',
    '  "overall_notes": "<2-4 sentences summarising the submission>"',
    '}',
    '```',
  ].join('\n');
}

function fence(content: string, lang: string): string {
  return `\`\`\`${lang}\n${content}\n\`\`\``;
}

function truncate(s: string, max: number): string {
  if (s.length <= max) return s;
  return `${s.slice(0, max)}\n…[truncated ${s.length - max} chars]`;
}
