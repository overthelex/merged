import type { Level, TaskSpec } from '@merged/task-spec';
import { runCalibrator, type CalibratorConfig } from './calibrator';
import { runComposer, type ComposerConfig } from './composer';
import { scanRepo, type ScanOptions } from './repoScan';
import { runScout, type ScoutConfig } from './scout';
import { runVerifier, type VerifierConfig } from './verifier';
import type {
  CalibratorVerdict,
  ComposerDraft,
  RepoMeta,
  Surface,
  VerifierReport,
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
  verifier?: VerifierConfig;
  scan?: ScanOptions;
  /**
   * Max Composer→Calibrator→Verifier iterations. Default 3. Each iteration
   * runs Composer, Calibrator, and (if Calibrator passes) Verifier. A
   * Calibrator rejection or a Verifier rejection both consume one iteration.
   */
  maxIterations?: number;
  /**
   * @deprecated Use `maxIterations` instead. Kept for backwards compatibility;
   * maps to `maxIterations = maxRevisions + 1` when `maxIterations` is not set.
   */
  maxRevisions?: number;
}

export interface ComposeTaskResult {
  spec: TaskSpec;
  draft: ComposerDraft;
  surfaces: Surface[];
  meta: RepoMeta;
  /** Calibrator verdicts, one per iteration that reached Calibrator. Last is ok. */
  verdicts: CalibratorVerdict[];
  /** Verifier reports, one per iteration that passed Calibrator. Last is ok. */
  verifications: VerifierReport[];
}

/**
 * End-to-end pipeline: scan repo → Scout (parallel) → loop of
 * Composer → Calibrator → Verifier. Verifier is only consulted when
 * Calibrator approved the draft; either rejection feeds `revisionNotes`
 * back into the next Composer call. Throws if every iteration is rejected.
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

  const maxIterations = Math.max(
    1,
    inputs.maxIterations ??
      (typeof inputs.maxRevisions === 'number' ? inputs.maxRevisions + 1 : 3),
  );
  const verdicts: CalibratorVerdict[] = [];
  const verifications: VerifierReport[] = [];
  let revisionNotes: string[] | undefined;

  for (let iter = 0; iter < maxIterations; iter++) {
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

    if (!verdict.ok || !spec) {
      revisionNotes = [...verdict.schema_errors, ...verdict.coherence_notes];
      continue;
    }

    const verification = await runVerifier(
      { draft, spec, level: inputs.level, meta },
      inputs.verifier,
    );
    verifications.push(verification);

    if (verification.ok) {
      return {
        spec,
        draft,
        surfaces: scoutReport.surfaces,
        meta,
        verdicts,
        verifications,
      };
    }
    revisionNotes = verification.issues;
  }

  const lastVerification = verifications[verifications.length - 1];
  const lastVerdict = verdicts[verdicts.length - 1];
  const tailSource = lastVerification?.issues.length
    ? lastVerification.issues
    : lastVerdict
      ? [...lastVerdict.schema_errors, ...lastVerdict.coherence_notes]
      : [];
  const tail = tailSource.slice(0, 5).join(' | ') || 'no notes collected';
  throw new Error(
    `pipeline failed after ${maxIterations} iterations · last notes: ${tail}`,
  );
}
