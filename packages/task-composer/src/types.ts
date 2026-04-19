import { z } from 'zod';
import { LEVEL } from '@merged/task-spec';

export const SURFACE_KIND = [
  'missing_tests',
  'feature_gap',
  'bug',
  'refactor',
  'docs',
  'perf',
  'security',
  'api_design',
  'error_handling',
  'concurrency',
  'data_model',
] as const;
export type SurfaceKind = (typeof SURFACE_KIND)[number];

export const SurfaceSchema = z.object({
  kind: z.enum(SURFACE_KIND),
  path: z.string().min(1).max(255),
  title: z.string().min(3).max(160),
  summary: z.string().min(10).max(800),
  estimated_effort_min: z.number().int().min(15).max(480),
  fit_levels: z.array(z.enum(LEVEL)).min(1).max(LEVEL.length),
  /** 0–100, Scout's confidence that this is a good screening task. */
  score: z.number().int().min(0).max(100),
});
export type Surface = z.infer<typeof SurfaceSchema>;

/**
 * Each worker is prompt-pinned to ≤8 surfaces; `max(20)` leaves some
 * headroom for small over-production without inflating token budgets.
 */
export const ScoutReportSchema = z.object({
  surfaces: z.array(SurfaceSchema).max(20),
  notes: z.string().max(2000).optional(),
});
export type ScoutReport = z.infer<typeof ScoutReportSchema>;

/**
 * A valid task.yaml is at minimum ~300 chars (version, id, title, level,
 * description_md≥20, 3 seeds, 3 rubric criteria summing to 100). `min(200)`
 * is a cheap pre-Calibrator filter; authoritative validation still happens
 * in `safeParseTaskSpec` inside the Calibrator.
 */
export const ComposerDraftSchema = z.object({
  task_yaml: z.string().min(200).max(40_000),
  assignment_md: z.string().min(80).max(40_000),
  design_notes: z.string().max(4000).optional(),
});
export type ComposerDraft = z.infer<typeof ComposerDraftSchema>;

/** Shape the LLM is asked to emit — only ok + coherence_notes. */
export const LlmCoherenceSchema = z.object({
  ok: z.boolean(),
  coherence_notes: z.array(z.string().max(500)).max(30),
});
export type LlmCoherence = z.infer<typeof LlmCoherenceSchema>;

/** Shape the Verifier LLM is asked to emit — only ok + issues. */
export const LlmVerificationSchema = z.object({
  ok: z.boolean(),
  issues: z.array(z.string().max(500)).max(30),
});
export type LlmVerification = z.infer<typeof LlmVerificationSchema>;

/** Final verdict produced by the calibrator. Enforces ok ⇔ no issues. */
export const CalibratorVerdictSchema = z
  .object({
    ok: z.boolean(),
    schema_errors: z.array(z.string().max(500)).max(30),
    coherence_notes: z.array(z.string().max(500)).max(30),
    /** Set whenever the YAML passes `safeParseTaskSpec`, even if LLM later rejects. */
    task_id: z.string().optional(),
  })
  .superRefine((val, ctx) => {
    const hasIssues = val.schema_errors.length > 0 || val.coherence_notes.length > 0;
    if (val.ok && hasIssues) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'ok=true but schema_errors/coherence_notes is non-empty',
        path: ['ok'],
      });
    }
    if (!val.ok && !hasIssues) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'ok=false but no schema_errors or coherence_notes provided',
        path: ['ok'],
      });
    }
  });
export type CalibratorVerdict = z.infer<typeof CalibratorVerdictSchema>;

/**
 * Verifier rev'yew of a Calibrator-approved draft. Different remit from
 * CalibratorVerdict: Verifier reads the task as the candidate will, flagging
 * ambiguity, seed/description mismatches, broken repo references,
 * non-gradable rubric criteria, unrealistic time budget, level/stack leaks.
 * Same invariant: ok ⇔ issues is empty.
 */
export const VerifierReportSchema = z
  .object({
    ok: z.boolean(),
    issues: z.array(z.string().max(500)).max(30),
    /** Copied from spec.id when available, for log correlation. */
    task_id: z.string().optional(),
  })
  .superRefine((val, ctx) => {
    if (val.ok && val.issues.length > 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'ok=true but issues is non-empty',
        path: ['ok'],
      });
    }
    if (!val.ok && val.issues.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'ok=false but no issues provided',
        path: ['ok'],
      });
    }
  });
export type VerifierReport = z.infer<typeof VerifierReportSchema>;

/**
 * Repo files scanned from disk. `content` bounded so future non-scanRepo
 * callers can't blow the Scout chunk budget.
 */
export const RepoFileSchema = z.object({
  path: z.string().min(1).max(255),
  size: z.number().int().min(0),
  content: z.string().max(10_000),
});
export type RepoFile = z.infer<typeof RepoFileSchema>;

export const RepoMetaSchema = z.object({
  name: z
    .string()
    .min(1)
    .max(80)
    .regex(/^[A-Za-z0-9._\-/]+$/, 'letters, digits, dot, hyphen, underscore, slash'),
  languages: z.array(z.string().max(40)).max(8),
  fileCount: z.number().int().min(0),
  totalSize: z.number().int().min(0),
});
export type RepoMeta = z.infer<typeof RepoMetaSchema>;
