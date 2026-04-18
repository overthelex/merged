import { RequestError } from '@octokit/request-error';
import type { AppClient } from './client';

export type SourceRepo = { owner: string; repo: string };

export type ForkResult = {
  owner: string;
  name: string;
  url: string;
  defaultBranch: string;
};

export async function parseGitHubUrl(url: string): Promise<SourceRepo> {
  const m = url.match(/^https:\/\/github\.com\/([^/\s]+)\/([^/\s.]+)(?:\.git)?\/?$/i);
  if (!m || !m[1] || !m[2]) throw new Error(`Not a GitHub repo URL: ${url}`);
  return { owner: m[1], repo: m[2] };
}

/**
 * Create a fork under the merged org with a controlled name, poll until ready,
 * then set it private. GitHub's fork endpoint is async — the repo may 404 for
 * a few seconds after creation.
 */
export async function forkRepo(
  client: AppClient,
  source: SourceRepo,
  forkName: string,
): Promise<ForkResult> {
  const octokit = await client.getInstallationOctokit();

  await octokit.request('POST /repos/{owner}/{repo}/forks', {
    owner: source.owner,
    repo: source.repo,
    organization: client.forkOrg,
    name: forkName,
    default_branch_only: true,
  });

  // Poll up to ~60s for the fork to become accessible.
  const started = Date.now();
  let fork: {
    default_branch: string;
    html_url: string;
    private: boolean;
  } | null = null;
  while (Date.now() - started < 60_000) {
    try {
      const resp = await octokit.request('GET /repos/{owner}/{repo}', {
        owner: client.forkOrg,
        repo: forkName,
      });
      fork = {
        default_branch: resp.data.default_branch,
        html_url: resp.data.html_url,
        private: resp.data.private,
      };
      break;
    } catch (err) {
      if (err instanceof RequestError && err.status === 404) {
        await sleep(2000);
        continue;
      }
      throw err;
    }
  }
  if (!fork) throw new Error(`Fork ${client.forkOrg}/${forkName} did not become available within 60s`);

  if (!fork.private) {
    await octokit.request('PATCH /repos/{owner}/{repo}', {
      owner: client.forkOrg,
      repo: forkName,
      private: true,
      has_issues: false,
      has_wiki: false,
      has_projects: false,
    });
  }

  return {
    owner: client.forkOrg,
    name: forkName,
    url: fork.html_url,
    defaultBranch: fork.default_branch,
  };
}

export async function protectMain(client: AppClient, forkName: string, branch: string): Promise<void> {
  const octokit = await client.getInstallationOctokit();
  await octokit.request('PUT /repos/{owner}/{repo}/branches/{branch}/protection', {
    owner: client.forkOrg,
    repo: forkName,
    branch,
    required_status_checks: null,
    enforce_admins: false,
    required_pull_request_reviews: {
      required_approving_review_count: 0,
    },
    restrictions: null,
    allow_force_pushes: false,
    allow_deletions: false,
  });
}

export type AssessmentBranchInput = {
  forkName: string;
  defaultBranch: string;
  assignmentMarkdown: string;
  runnerShellScript: string;
};

/**
 * Seed a `merged/assessment` branch off default that contains only ASSIGNMENT.md
 * and .merged/runner.sh. Uses the low-level git data API so we don't need to
 * clone or push from the server.
 */
export async function seedAssessmentBranch(
  client: AppClient,
  input: AssessmentBranchInput,
): Promise<{ branch: string; sha: string }> {
  const octokit = await client.getInstallationOctokit();
  const { forkName, defaultBranch, assignmentMarkdown, runnerShellScript } = input;

  const { data: ref } = await octokit.request(
    'GET /repos/{owner}/{repo}/git/ref/{ref}',
    { owner: client.forkOrg, repo: forkName, ref: `heads/${defaultBranch}` },
  );
  const parentSha = ref.object.sha;

  const { data: parentCommit } = await octokit.request(
    'GET /repos/{owner}/{repo}/git/commits/{commit_sha}',
    { owner: client.forkOrg, repo: forkName, commit_sha: parentSha },
  );
  const baseTreeSha = parentCommit.tree.sha;

  const { data: tree } = await octokit.request(
    'POST /repos/{owner}/{repo}/git/trees',
    {
      owner: client.forkOrg,
      repo: forkName,
      base_tree: baseTreeSha,
      tree: [
        {
          path: 'ASSIGNMENT.md',
          mode: '100644',
          type: 'blob',
          content: assignmentMarkdown,
        },
        {
          path: '.merged/runner.sh',
          mode: '100755',
          type: 'blob',
          content: runnerShellScript,
        },
      ],
    },
  );

  const { data: commit } = await octokit.request(
    'POST /repos/{owner}/{repo}/git/commits',
    {
      owner: client.forkOrg,
      repo: forkName,
      message: 'chore(merged): seed assessment task',
      tree: tree.sha,
      parents: [parentSha],
    },
  );

  const branch = 'merged/assessment';
  await octokit.request('POST /repos/{owner}/{repo}/git/refs', {
    owner: client.forkOrg,
    repo: forkName,
    ref: `refs/heads/${branch}`,
    sha: commit.sha,
  });

  return { branch, sha: commit.sha };
}

export async function inviteCollaborator(
  client: AppClient,
  forkName: string,
  githubUsername: string,
): Promise<{ invitationId: number | null; alreadyMember: boolean }> {
  const octokit = await client.getInstallationOctokit();
  const resp = await octokit.request(
    'PUT /repos/{owner}/{repo}/collaborators/{username}',
    {
      owner: client.forkOrg,
      repo: forkName,
      username: githubUsername,
      permission: 'push',
    },
  );
  // 201 returns an invitation; 204 means already a collaborator (GitHub docs
  // cover both, Octokit typings expose only 201 — hence the cast).
  const status = resp.status as number;
  if (status === 204) return { invitationId: null, alreadyMember: true };
  const data = resp.data as { id?: number } | undefined;
  return { invitationId: data?.id ?? null, alreadyMember: false };
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
