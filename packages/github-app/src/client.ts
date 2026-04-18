import { App } from '@octokit/app';
import { Octokit } from '@octokit/rest';
import type { GitHubAppConfig } from './config';

export type AppClient = {
  app: App;
  installationId: number;
  forkOrg: string;
  getInstallationOctokit(): Promise<Octokit>;
};

export function createAppClient(cfg: GitHubAppConfig): AppClient {
  const app = new App({
    appId: cfg.appId,
    privateKey: cfg.privateKey,
    webhooks: { secret: cfg.webhookSecret },
    Octokit,
  });

  return {
    app,
    installationId: cfg.installationId,
    forkOrg: cfg.forkOrg,
    async getInstallationOctokit() {
      return (await app.getInstallationOctokit(cfg.installationId)) as unknown as Octokit;
    },
  };
}
