import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pipeline } from 'node:stream/promises';
import { Readable } from 'node:stream';
import * as tar from 'tar';
import { Octokit } from '@octokit/rest';
import { composeTask, type ComposeTaskResult } from '@merged/task-composer';
import { parseGitHubUrl } from '@merged/github-app';
import type { Seniority } from '@merged/db';
import type { Level } from '@merged/task-spec';

export interface ComposeResult {
  assignmentMd: string;
  taskYaml: string;
  pipeline: ComposeTaskResult;
}

export type ComposeStage = 'parse_url' | 'download' | 'extract' | 'pipeline';

export class ComposeError extends Error {
  constructor(
    public readonly stage: ComposeStage,
    message: string,
    public override readonly cause?: unknown,
  ) {
    super(message);
    this.name = 'ComposeError';
  }
}

/** Hard cap — reject larger tarballs before allocating. */
const MAX_TARBALL_BYTES = 150 * 1024 * 1024; // 150 MB

/**
 * Fetch the source repo as a tarball, extract to a scratch dir, run the
 * Scout → Composer → Calibrator pipeline, and return the generated
 * ASSIGNMENT.md + task.yaml. Scratch dir is always cleaned up.
 *
 * Throws `ComposeError` annotated with the failing stage so the caller
 * can distinguish a Bedrock failure from a GitHub 404 in logs.
 */
export async function composeAssignmentFromRepo(opts: {
  repoUrl: string;
  /** Optional PAT for private repos (contents:read). */
  accessToken?: string;
  seniority: Seniority;
}): Promise<ComposeResult> {
  const level = seniorityToLevel(opts.seniority);
  const calibrationHint = opts.seniority === 'architect' ? 'architect' : undefined;

  let src: { owner: string; repo: string };
  try {
    src = await parseGitHubUrl(opts.repoUrl);
  } catch (e) {
    throw new ComposeError('parse_url', (e as Error).message, e);
  }

  const scratch = await mkdtemp(join(tmpdir(), 'merged-compose-'));
  try {
    await downloadAndExtract({ src, accessToken: opts.accessToken, dest: scratch });
    let result: ComposeTaskResult;
    try {
      result = await composeTask({
        repoPath: scratch,
        level,
        calibrationHint,
        scan: { repoName: `${src.owner}/${src.repo}` },
      });
    } catch (e) {
      throw new ComposeError('pipeline', (e as Error).message, e);
    }
    return {
      assignmentMd: result.draft.assignment_md,
      taskYaml: result.draft.task_yaml,
      pipeline: result,
    };
  } finally {
    await rm(scratch, { recursive: true, force: true }).catch(() => {});
  }
}

/**
 * task-spec schema covers junior|middle|senior only; `architect` collapses to
 * `senior` at the schema level. The `calibrationHint` carried alongside tells
 * the Composer to weight the rubric accordingly.
 */
export function seniorityToLevel(s: Seniority): Level {
  switch (s) {
    case 'junior':
    case 'middle':
    case 'senior':
      return s;
    case 'architect':
      return 'senior';
  }
}

async function downloadAndExtract(opts: {
  src: { owner: string; repo: string };
  accessToken?: string;
  dest: string;
}): Promise<void> {
  const octokit = new Octokit({ auth: opts.accessToken });

  let buf: Buffer;
  try {
    const resp = await octokit.request('GET /repos/{owner}/{repo}/tarball', {
      owner: opts.src.owner,
      repo: opts.src.repo,
    });
    const data = resp.data as ArrayBuffer;
    if (data.byteLength > MAX_TARBALL_BYTES) {
      throw new Error(
        `tarball ${data.byteLength} bytes exceeds cap ${MAX_TARBALL_BYTES} (150 MB)`,
      );
    }
    buf = Buffer.from(data);
  } catch (e) {
    throw new ComposeError('download', (e as Error).message, e);
  }

  try {
    await pipeline(Readable.from(buf), tar.extract({ cwd: opts.dest, strip: 1 }));
  } catch (e) {
    throw new ComposeError('extract', (e as Error).message, e);
  }
}
