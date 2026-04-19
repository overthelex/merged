export { composeTask } from './pipeline';
export type { ComposeTaskInputs, ComposeTaskResult } from './pipeline';

export { runScout } from './scout';
export type { ScoutConfig, ScoutInputs } from './scout';

export { runComposer } from './composer';
export type { ComposerConfig, ComposerInputs } from './composer';

export { runCalibrator } from './calibrator';
export type {
  CalibratorConfig,
  CalibratorInputs,
  CalibratorResult,
} from './calibrator';

export { runVerifier } from './verifier';
export type { VerifierConfig, VerifierInputs } from './verifier';

export { scanRepo, partitionFiles } from './repoScan';
export type { ScanOptions, ScanResult } from './repoScan';

export {
  SurfaceSchema,
  ScoutReportSchema,
  ComposerDraftSchema,
  CalibratorVerdictSchema,
  LlmCoherenceSchema,
  LlmVerificationSchema,
  VerifierReportSchema,
  RepoFileSchema,
  RepoMetaSchema,
  SURFACE_KIND,
} from './types';
export type {
  Surface,
  SurfaceKind,
  ScoutReport,
  ComposerDraft,
  CalibratorVerdict,
  LlmCoherence,
  LlmVerification,
  VerifierReport,
  RepoFile,
  RepoMeta,
} from './types';
