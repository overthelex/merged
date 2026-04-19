import type { Level, TaskSpec } from '@merged/task-spec';
import { extractJson, invokeBedrock } from './bedrock';
import {
  LlmVerificationSchema,
  type ComposerDraft,
  type RepoMeta,
  type VerifierReport,
} from './types';

export interface VerifierConfig {
  region?: string;
  modelId?: string;
  maxRetries?: number;
}

const DEFAULT_VERIFIER_MODEL =
  process.env.BEDROCK_VERIFIER_MODEL_ID ?? 'eu.anthropic.claude-opus-4-7-v1:0';

export interface VerifierInputs {
  draft: ComposerDraft;
  /** The spec is already parsed and Calibrator-approved when Verifier runs. */
  spec: TaskSpec;
  level: Level;
  meta: RepoMeta;
}

/**
 * Fourth stage: independent review of a Calibrator-approved task through the
 * candidate's and grader's eyes. Catches issues that fit the schema and look
 * coherent in isolation, but break the actual screening outcome:
 *  - ambiguous phrasing, hidden assumptions
 *  - seeds that don't match description_md's approach list
 *  - references to files/modules missing from the repo
 *  - rubric criteria without an observable signal
 *  - time_limit_min vs real scope mismatch
 *  - scope leaks beyond level or meta.languages
 *  - missing candidate instructions (run, test, submit)
 *
 * Emits a VerifierReport with the same ok ⇔ issues-empty invariant as the
 * Calibrator verdict, so the pipeline can merge feedback for the Composer.
 */
export async function runVerifier(
  inputs: VerifierInputs,
  cfg: VerifierConfig = {},
): Promise<VerifierReport> {
  const prompt = buildVerifierPrompt(inputs);
  const text = await invokeBedrock({
    region: cfg.region,
    modelId: cfg.modelId ?? DEFAULT_VERIFIER_MODEL,
    prompt,
    maxTokens: 2048,
    temperature: 0.1,
    maxRetries: cfg.maxRetries,
  });

  return finalizeVerification(text, inputs.spec.id);
}

/**
 * Parse a raw Bedrock response into a VerifierReport. Extracted so tests can
 * exercise extraction / schema / invariant handling without spinning up a
 * real Bedrock call. Exported from `index.ts` is NOT necessary — internal
 * helper, imported only by the test suite.
 */
export function finalizeVerification(text: string, taskId: string): VerifierReport {
  let json: unknown;
  try {
    json = extractJson(text);
  } catch (e) {
    return {
      ok: false,
      issues: [`verifier response unparseable: ${(e as Error).message}`],
      task_id: taskId,
    };
  }

  const parsed = LlmVerificationSchema.safeParse(json);
  if (!parsed.success) {
    return {
      ok: false,
      issues: [`verifier response failed schema: ${parsed.error.issues[0]?.message}`],
      task_id: taskId,
    };
  }

  const hasIssues = parsed.data.issues.length > 0;
  const ok = parsed.data.ok && !hasIssues;
  return {
    ok,
    issues: ok ? [] : parsed.data.issues,
    task_id: taskId,
  };
}

function buildVerifierPrompt(inputs: VerifierInputs): string {
  const languages = inputs.meta.languages.join(', ') || 'unknown';
  return [
    VERIFIER_PREAMBLE,
    '',
    `Target seniority: ${inputs.level}`,
    `Repository: ${inputs.meta.name}`,
    `Primary languages: ${languages}`,
    `File count: ${inputs.meta.fileCount}`,
    `Declared time_limit_min: ${inputs.spec.time_limit_min}`,
    '',
    '## task.yaml',
    '```yaml',
    inputs.draft.task_yaml,
    '```',
    '',
    '## ASSIGNMENT.md',
    '```markdown',
    inputs.draft.assignment_md,
    '```',
    '',
    '## Your job',
    'Read the task as the candidate will. Then read it as the grader will. Flag any issue',
    'that would make the assignment unfair, ambiguous, ungradable, or impossible:',
    '- Ambiguous phrasing or vague requirements ("make it better", "optimise").',
    '- Seeds that are cosmetic renames rather than distinct approaches implied by description_md.',
    '- References to files/modules/APIs that do not exist in this repo (languages: ' +
      languages +
      ').',
    '- Rubric criteria without a clear observable signal; source=auto on things that require human judgement.',
    '- `time_limit_min` inconsistent with the real scope given the level and file count.',
    '- Scope leaks: requirements outside the target level, or languages not in the repo stack.',
    '- Missing candidate instructions: how to run, how to test, how to submit, what "done" means.',
    '- Internal contradictions between task.yaml and ASSIGNMENT.md (different scope / acceptance criteria).',
    '',
    '## Output schema (JSON only, no prose)',
    '```json',
    '{',
    '  "ok": <true|false>,',
    '  "issues": ["<actionable fix note>", ...]',
    '}',
    '```',
    'If the task is ready to ship to a candidate, return `{ "ok": true, "issues": [] }`.',
    'Each issue must be a specific instruction the composer can act on — not vague criticism.',
    'Return at most 8 issues. Empty issues array ⇔ ok must be true.',
    'Do NOT re-check schema rules (weights=100, seed count, level enum) — Calibrator already passed those.',
  ].join('\n');
}

const VERIFIER_PREAMBLE = `You are the final reviewer for technical-screening tasks on the "merged" platform. A Composer drafted task.yaml + ASSIGNMENT.md and a Calibrator already approved schema and coherence. Before this task is shipped to a real candidate, your job is to catch anything that would make the candidate experience unfair or the grading subjective.

You are strict but fair:
- You do NOT rewrite the task. You return { ok, issues }.
- You do NOT re-check schema or coherence rules Calibrator already cleared.
- You DO read the task end-to-end twice: once as the candidate, once as the grader.
- You DO flag missing or ambiguous information the candidate would need to ask for.`;
