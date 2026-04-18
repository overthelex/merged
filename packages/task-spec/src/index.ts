import { parse as parseYaml } from 'yaml';
import { z } from 'zod';

/**
 * `task.yaml` — the single source of truth for a template assignment.
 * Lives at the root of every template repo under `merged-tasks` GitHub org.
 *
 * Рубрика відкалібрована вручну: кожен критерій має вагу, що дає ціле 100,
 * і прив'язаний до одного з джерел сигналу — auto (CI-based) або llm (judge).
 */

export const LEVEL = ['junior', 'middle', 'senior'] as const;
export type Level = (typeof LEVEL)[number];

export const SIGNAL_SOURCE = ['auto', 'llm'] as const;
export type SignalSource = (typeof SIGNAL_SOURCE)[number];

const RubricCriterion = z.object({
  key: z
    .string()
    .min(1)
    .max(60)
    .regex(/^[a-z0-9_]+$/, 'lowercase, digits, underscore only'),
  label: z.string().min(1).max(120),
  source: z.enum(SIGNAL_SOURCE),
  weight: z.number().int().min(1).max(100),
  description: z.string().max(500).optional(),
});

export type RubricCriterion = z.infer<typeof RubricCriterion>;

const TaskSpec = z
  .object({
    version: z.literal(1),
    id: z
      .string()
      .min(1)
      .max(80)
      .regex(/^[a-z0-9-]+$/, 'slug: lowercase, digits, hyphen'),
    title: z.string().min(3).max(200),
    level: z.enum(LEVEL),
    language: z.string().max(40).optional(),
    stack: z.array(z.string().max(40)).max(8).default([]),
    time_limit_min: z.number().int().min(15).max(480),
    description_md: z.string().min(20),

    // Anti-cheat seeds — one template, many variants. Must be at least 3 so
    // that one leaked solution doesn't invalidate the template.
    seeds: z.array(z.string().min(1).max(60)).min(3).max(50),

    // Rubric weights: sum MUST equal 100. Superset of criteria per level is
    // the product's secret sauce — enforce consistency at parse time.
    rubric: z.array(RubricCriterion).min(3).max(20),

    // Optional hook — shell command(s) the CI runs to check the PR beyond
    // the repo's own tests (e.g. `pnpm lint`, `cargo clippy`).
    ci_extra: z.array(z.string().max(400)).max(10).default([]),

    // LLM-judge prompt overrides. If unset, judge uses default rubric prompt.
    judge_prompt_override: z.string().max(10_000).optional(),
  })
  .superRefine((val, ctx) => {
    const total = val.rubric.reduce((a, c) => a + c.weight, 0);
    if (total !== 100) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `rubric weights must sum to 100, got ${total}`,
        path: ['rubric'],
      });
    }
    const keys = new Set<string>();
    for (const [i, c] of val.rubric.entries()) {
      if (keys.has(c.key)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `duplicate rubric key: ${c.key}`,
          path: ['rubric', i, 'key'],
        });
      }
      keys.add(c.key);
    }
  });

export type TaskSpec = z.infer<typeof TaskSpec>;

/** Parse and validate a task.yaml string. Throws a ZodError with `.issues`. */
export function parseTaskSpec(source: string): TaskSpec {
  const raw: unknown = parseYaml(source);
  return TaskSpec.parse(raw);
}

/** Non-throwing variant. */
export function safeParseTaskSpec(
  source: string,
): { success: true; data: TaskSpec } | { success: false; issues: z.ZodIssue[] } {
  let raw: unknown;
  try {
    raw = parseYaml(source);
  } catch (e) {
    return {
      success: false,
      issues: [
        {
          code: z.ZodIssueCode.custom,
          path: [],
          message: `YAML parse error: ${e instanceof Error ? e.message : String(e)}`,
        },
      ],
    };
  }
  const r = TaskSpec.safeParse(raw);
  return r.success ? { success: true, data: r.data } : { success: false, issues: r.error.issues };
}

/**
 * Pick a seed deterministically based on candidate email + assignment id.
 * Same candidate on the same assignment always gets the same variant —
 * attempts at the same task stay consistent across reloads.
 */
export function pickSeed(spec: TaskSpec, candidate: string, assignmentId: string): string {
  const h = fnv1a(`${candidate}::${assignmentId}`);
  return spec.seeds[h % spec.seeds.length]!;
}

function fnv1a(str: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

export { TaskSpec as TaskSpecSchema };
