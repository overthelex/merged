import { z } from 'zod';
import type { TaskSpec } from '@merged/task-spec';

const ScoreEntry = z.object({
  score: z.number().int().min(0).max(5),
  rationale: z.string().min(1).max(500),
});

export const JudgeVerdictSchema = z.object({
  scores: z.record(z.string(), ScoreEntry),
  strengths: z.array(z.string().max(400)).max(12),
  weaknesses: z.array(z.string().max(400)).max(12),
  overall_notes: z.string().min(1).max(4_000),
});
export type JudgeVerdict = z.infer<typeof JudgeVerdictSchema>;

/**
 * Deterministic signal from CI. Each key 0–5, produced by the CI step
 * before the LLM call. Keys MUST match rubric criteria with source='auto'.
 */
export type AutoScores = Record<string, { score: number; rationale: string }>;

export interface FinalScore {
  /** 0–100 weighted total. */
  total: number;
  /** Per-criterion breakdown, both auto and llm sources. */
  breakdown: Array<{
    key: string;
    label: string;
    source: 'auto' | 'llm';
    weight: number;
    raw: number; // 0–5
    weighted: number; // weight * raw / 5
    rationale: string;
  }>;
  missing: string[]; // criteria keys the judge/CI skipped
}

/**
 * Merge CI-sourced and LLM-sourced scores by the rubric, enforce weights,
 * and return the final 0–100 score + a full breakdown for the recruiter UI.
 */
export function mergeScores(
  spec: TaskSpec,
  auto: AutoScores,
  llm: JudgeVerdict,
): FinalScore {
  const breakdown: FinalScore['breakdown'] = [];
  const missing: string[] = [];
  let total = 0;

  for (const criterion of spec.rubric) {
    const src =
      criterion.source === 'auto' ? auto[criterion.key] : llm.scores[criterion.key];

    if (!src) {
      missing.push(criterion.key);
      breakdown.push({
        key: criterion.key,
        label: criterion.label,
        source: criterion.source,
        weight: criterion.weight,
        raw: 0,
        weighted: 0,
        rationale: 'no signal — criterion not scored',
      });
      continue;
    }

    const raw = Math.max(0, Math.min(5, src.score));
    const weighted = (criterion.weight * raw) / 5;
    total += weighted;

    breakdown.push({
      key: criterion.key,
      label: criterion.label,
      source: criterion.source,
      weight: criterion.weight,
      raw,
      weighted: round2(weighted),
      rationale: src.rationale,
    });
  }

  return { total: round2(total), breakdown, missing };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
