import { safeParseTaskSpec, type Level, type TaskSpec } from '@merged/task-spec';
import { extractJson, invokeBedrock } from './bedrock';
import {
  LlmCoherenceSchema,
  type CalibratorVerdict,
  type ComposerDraft,
} from './types';

export interface CalibratorConfig {
  region?: string;
  modelId?: string;
  maxRetries?: number;
}

const DEFAULT_CALIBRATOR_MODEL =
  process.env.BEDROCK_CALIBRATOR_MODEL_ID ?? 'eu.anthropic.claude-opus-4-7-v1:0';

export interface CalibratorInputs {
  draft: ComposerDraft;
  level: Level;
}

export interface CalibratorResult {
  verdict: CalibratorVerdict;
  /** Parsed TaskSpec if schema validation passed — regardless of LLM coherence verdict. */
  spec?: TaskSpec;
}

/**
 * Two-stage calibration:
 *  1. Deterministic schema validation via `@merged/task-spec` — cheap, catches
 *     malformed YAML, rubric-weight-sum errors, duplicate keys.
 *  2. LLM coherence check — does the task match the level? Are seeds
 *     distinguishable? Is `time_limit_min` plausible? Does ASSIGNMENT.md
 *     agree with `task.yaml`?
 *
 * `spec` is populated whenever the schema stage passes, even if the LLM
 * later rejects — callers can inspect the parsed spec for diagnostics.
 */
export async function runCalibrator(
  inputs: CalibratorInputs,
  cfg: CalibratorConfig = {},
): Promise<CalibratorResult> {
  const schema = safeParseTaskSpec(inputs.draft.task_yaml);
  const schemaErrors: string[] = [];
  let spec: TaskSpec | undefined;

  if (schema.success) {
    spec = schema.data;
    if (spec.level !== inputs.level) {
      schemaErrors.push(
        `task.yaml level "${spec.level}" does not match target "${inputs.level}"`,
      );
    }
  } else {
    for (const issue of schema.issues) {
      const path = issue.path.map(String).join('.') || '(root)';
      schemaErrors.push(`${path}: ${issue.message}`);
    }
  }

  if (schemaErrors.length > 0) {
    return {
      verdict: {
        ok: false,
        schema_errors: schemaErrors.slice(0, 30),
        coherence_notes: [],
        task_id: spec?.id,
      },
      spec,
    };
  }

  const prompt = buildCalibratorPrompt(inputs);
  const text = await invokeBedrock({
    region: cfg.region,
    modelId: cfg.modelId ?? DEFAULT_CALIBRATOR_MODEL,
    prompt,
    maxTokens: 2048,
    temperature: 0.1,
    maxRetries: cfg.maxRetries,
  });

  let json: unknown;
  try {
    json = extractJson(text);
  } catch (e) {
    return {
      verdict: {
        ok: false,
        schema_errors: [],
        coherence_notes: [`calibrator response unparseable: ${(e as Error).message}`],
        task_id: spec?.id,
      },
      spec,
    };
  }

  const parsed = LlmCoherenceSchema.safeParse(json);
  if (!parsed.success) {
    return {
      verdict: {
        ok: false,
        schema_errors: [],
        coherence_notes: [
          `calibrator response failed schema: ${parsed.error.issues[0]?.message}`,
        ],
        task_id: spec?.id,
      },
      spec,
    };
  }

  const hasNotes = parsed.data.coherence_notes.length > 0;
  const ok = parsed.data.ok && !hasNotes;
  return {
    verdict: {
      ok,
      schema_errors: [],
      coherence_notes: ok ? [] : parsed.data.coherence_notes,
      task_id: spec?.id,
    },
    spec,
  };
}

function buildCalibratorPrompt(inputs: CalibratorInputs): string {
  return [
    CALIBRATOR_PREAMBLE,
    '',
    `Target seniority: ${inputs.level}`,
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
    'Judge coherence only — the schema has already passed. Flag any of:',
    '- Task scope does not match the declared level (too easy/hard).',
    '- `time_limit_min` is implausible for the scope.',
    '- Seeds look like cosmetic renames rather than distinct approaches.',
    '- Rubric rewards the wrong thing, or `auto`/`llm` sources are misassigned.',
    '- ASSIGNMENT.md contradicts task.yaml (different scope, wrong level).',
    '- Anti-cheat is weak (solution is trivially Googleable / AI one-shot).',
    '',
    '## Output schema (JSON only, no prose)',
    '```json',
    '{',
    '  "ok": <true|false>,',
    '  "coherence_notes": ["<actionable fix note>", ...]',
    '}',
    '```',
    'If the task is good as-is, return `{ "ok": true, "coherence_notes": [] }`.',
    'Each note must be a specific instruction the composer can act on — not vague praise or criticism.',
    'Return at most 8 notes. Empty notes array ⇔ ok must be true.',
  ].join('\n');
}

const CALIBRATOR_PREAMBLE = `You are a calibration reviewer for technical-screening tasks on the "merged" platform. A Composer has drafted a task.yaml and ASSIGNMENT.md. Your job: decide whether this task is ready to ship to a candidate, OR list specific fixes the Composer must apply.

You are strict but fair:
- You do NOT rewrite the task. You return a verdict + fix notes.
- You do NOT re-check schema rules (weights=100, 3+ seeds) — that passed already.
- You DO check realism, anti-cheat, rubric sanity, level fit, internal consistency.`;
