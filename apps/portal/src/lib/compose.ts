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

/**
 * Fetch the source repo as a tarball, extract to a scratch dir, run the
 * Scout → Composer → Calibrator pipeline, and return the generated
 * ASSIGNMENT.md + task.yaml. The scratch dir is always cleaned up.
 */
export async function composeAssignmentFromRepo(opts: {
  repoUrl: string;
  /** Optional PAT for private repos (contents:read). */
  accessToken?: string;
  seniority: Seniority;
}): Promise<ComposeResult> {
  const level = toComposerLevel(opts.seniority);
  const scratch = await mkdtemp(join(tmpdir(), 'merged-compose-'));
  try {
    await downloadAndExtract({
      repoUrl: opts.repoUrl,
      accessToken: opts.accessToken,
      dest: scratch,
    });
    const result = await composeTask({ repoPath: scratch, level });
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
 * task-spec schema currently covers junior|middle|senior only; the portal
 * additionally supports 'architect' which we map down to 'senior' for the
 * composer (it still gets the hardest calibrated task available).
 */
function toComposerLevel(s: Seniority): Level {
  return s === 'architect' ? 'senior' : s;
}

async function downloadAndExtract(opts: {
  repoUrl: string;
  accessToken?: string;
  dest: string;
}): Promise<void> {
  const src = await parseGitHubUrl(opts.repoUrl);
  const octokit = new Octokit({ auth: opts.accessToken });

  // GitHub redirects tarball requests to codeload — Octokit follows the
  // redirect and returns the archive bytes as an ArrayBuffer.
  const resp = await octokit.request('GET /repos/{owner}/{repo}/tarball', {
    owner: src.owner,
    repo: src.repo,
  });
  const buf = Buffer.from(resp.data as ArrayBuffer);

  await pipeline(
    Readable.from(buf),
    tar.extract({ cwd: opts.dest, strip: 1 }),
  );
}
