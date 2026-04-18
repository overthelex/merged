import {
  createAppClient,
  readGitHubAppConfigFromEnv,
  type AppClient,
} from '@merged/github-app';

let _client: AppClient | null = null;
let _initialized = false;

export function getGitHubClient(): AppClient | null {
  if (_initialized) return _client;
  _initialized = true;
  const cfg = readGitHubAppConfigFromEnv();
  if (!cfg) {
    _client = null;
    return null;
  }
  _client = createAppClient(cfg);
  return _client;
}

export function getForkOrg(): string {
  return process.env.TASKS_ORG ?? 'imerged';
}
