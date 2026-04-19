import type { Level, TaskSpec } from '@merged/task-spec';
import { runCalibrator, type CalibratorConfig } from './calibrator';
import { runComposer, type ComposerConfig } from './composer';
import { scanRepo, type ScanOptions } from './repoScan';
import { runScout, type ScoutConfig } from './scout';
import type {
  CalibratorVerdict,
  ComposerDraft,
  RepoMeta,
  Surface,
} from './types';

export interface ComposeTaskInputs {
  /** Absolute path to a cloned repository on disk. */
  repoPath: string;
  level: Level;
  /**
   * HR-visible seniority, used for Composer calibration when it differs from
   * `level` (e.g. `architect` → schema-level `senior` + architect hint).
   */
  calibrationHint?: 'architect' | 'principal' | string;
  scout?: ScoutConfig;
  composer?: ComposerConfig;
  calibrator?: CalibratorConfig;
  scan?: ScanOptions;
  /** Max Composer↔Calibrator iterations. Default 2 (up to 3 Composer calls). */
  maxRevisions?: number;
}

export interface ComposeTaskResult {
  spec: TaskSpec;
  draft: ComposerDraft;
  surfaces: Surface[];
  meta: RepoMeta;
  /** Every verdict collected, in order. Last one has `ok: true`. */
  verdicts: CalibratorVerdict[];
}

/**
 * End-to-end pipeline: scan repo → Scout (parallel) → Composer → Calibrator.
 * Composer redrafts on each Calibrator rejection, up to `maxRevisions`.
 * Throws if every revision is rejected.
 */
export async function composeTask(inputs: ComposeTaskInputs): Promise<ComposeTaskResult> {
  const { files, meta } = await scanRepo(inputs.repoPath, inputs.scan);
  if (files.length === 0) {
    throw new Error(
      `no source files found under ${inputs.repoPath} — is it an empty or non-code repo?`,
    );
  }

  const scoutReport = await runScout({ files, meta, level: inputs.level }, inputs.scout);
  if (scoutReport.surfaces.length === 0) {
    throw new Error(
      `scout found no usable surfaces for level=${inputs.level}${
        scoutReport.notes ? ' · ' + scoutReport.notes : ''
      }`,
    );
  }

  const verdicts: CalibratorVerdict[] = [];
  const maxRevisions = Math.max(0, inputs.maxRevisions ?? 2);
  let revisionNotes: string[] | undefined;

  for (let round = 0; round <= maxRevisions; round++) {
    const draft = await runComposer(
      {
        surfaces: scoutReport.surfaces,
        level: inputs.level,
        calibrationHint: inputs.calibrationHint,
        meta,
        revisionNotes,
      },
      inputs.composer,
    );
    const { verdict, spec } = await runCalibrator(
      { draft, level: inputs.level },
      inputs.calibrator,
    );
    verdicts.push(verdict);
    if (verdict.ok && spec) {
      return { spec, draft, surfaces: scoutReport.surfaces, meta, verdicts };
    }
    revisionNotes = [...verdict.schema_errors, ...verdict.coherence_notes];
  }

  const last = verdicts[verdicts.length - 1];
  const tail = last
    ? [...last.schema_errors, ...last.coherence_notes].slice(0, 5).join(' | ')
    : 'no verdicts collected';
  throw new Error(`calibrator rejected all ${verdicts.length} drafts · last notes: ${tail}`);
}
