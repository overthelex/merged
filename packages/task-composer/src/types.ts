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
] as const;
export type SurfaceKind = (typeof SURFACE_KIND)[number];

export const SurfaceSchema = z.object({
  kind: z.enum(SURFACE_KIND),
  path: z.string().min(1).max(400),
  title: z.string().min(3).max(160),
  summary: z.string().min(10).max(800),
  estimated_effort_min: z.number().int().min(15).max(480),
  fit_levels: z.array(z.enum(LEVEL)).min(1).max(LEVEL.length),
  /** 0–100, Scout's confidence that this is a good screening task. */
  score: z.number().int().min(0).max(100),
});
export type Surface = z.infer<typeof SurfaceSchema>;

export const ScoutReportSchema = z.object({
  surfaces: z.array(SurfaceSchema).max(40),
  notes: z.string().max(2000).optional(),
});
export type ScoutReport = z.infer<typeof ScoutReportSchema>;

export const ComposerDraftSchema = z.object({
  /** Raw task.yaml contents — validated by the Calibrator, not here. */
  task_yaml: z.string().min(40).max(40_000),
  /** ASSIGNMENT.md for the fork's assessment branch. */
  assignment_md: z.string().min(40).max(40_000),
  /** Composer's explanation of design choices — kept for audit, not shown to candidate. */
  design_notes: z.string().max(4000).optional(),
});
export type ComposerDraft = z.infer<typeof ComposerDraftSchema>;

export const CalibratorVerdictSchema = z.object({
  ok: z.boolean(),
  schema_errors: z.array(z.string().max(500)).max(30),
  coherence_notes: z.array(z.string().max(500)).max(30),
  /** If ok=true, the parsed & validated TaskSpec id. Otherwise omitted. */
  task_id: z.string().optional(),
});
export type CalibratorVerdict = z.infer<typeof CalibratorVerdictSchema>;

export interface RepoFile {
  /** Path relative to repo root. */
  path: string;
  size: number;
  content: string;
}

export interface RepoMeta {
  name: string;
  /** Detected primary language tags, e.g. ["typescript", "python"]. */
  languages: string[];
  /** Total source files counted after filtering. */
  fileCount: number;
  /** Total bytes of source content after filtering. */
  totalSize: number;
}
