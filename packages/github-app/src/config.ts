export type GitHubAppConfig = {
  appId: string;
  privateKey: string;
  installationId: number;
  webhookSecret: string;
  forkOrg: string;
};

export function readGitHubAppConfigFromEnv(env: NodeJS.ProcessEnv = process.env): GitHubAppConfig | null {
  const appId = env.GITHUB_APP_ID;
  const privateKeyRaw = env.GITHUB_APP_PRIVATE_KEY;
  const installationIdRaw = env.GITHUB_APP_INSTALLATION_ID;
  const webhookSecret = env.GITHUB_WEBHOOK_SECRET;
  const forkOrg = env.TASKS_ORG ?? 'imerged';

  if (!appId || !privateKeyRaw || !installationIdRaw || !webhookSecret) {
    return null;
  }

  const installationId = Number(installationIdRaw);
  if (!Number.isInteger(installationId) || installationId <= 0) {
    throw new Error('GITHUB_APP_INSTALLATION_ID must be a positive integer');
  }

  // Support both raw PEM and base64-encoded PEM (Actions secrets often strip newlines).
  const privateKey = privateKeyRaw.includes('BEGIN')
    ? privateKeyRaw.replace(/\\n/g, '\n')
    : Buffer.from(privateKeyRaw, 'base64').toString('utf8');

  return { appId, privateKey, installationId, webhookSecret, forkOrg };
}
