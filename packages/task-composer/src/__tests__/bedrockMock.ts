import type { BedrockRuntimeClient } from '@aws-sdk/client-bedrock-runtime';

export interface FakeInvokeRequest {
  modelId: string;
  prompt: string;
  temperature: number;
  maxTokens: number;
  raw: Record<string, unknown>;
}

export interface FakeInvokeError {
  name?: string;
  $metadata?: { httpStatusCode?: number };
  message?: string;
}

export type Responder = (
  req: FakeInvokeRequest,
  callIndex: number,
) => string | FakeInvokeError | Promise<string | FakeInvokeError>;

export interface FakeClientHandle {
  calls: FakeInvokeRequest[];
  /** Drop recorded calls without uninstalling the fake. */
  reset(): void;
  /** Remove the fake from the global cache so subsequent tests start clean. */
  uninstall(): void;
}

const G = globalThis as unknown as {
  __mergedBedrockClients?: Map<string, BedrockRuntimeClient>;
};

/**
 * Install a fake Bedrock client on the shared global cache used by
 * `task-composer/bedrock.ts` and `judge/runner.ts`. The fake intercepts
 * `InvokeModelCommand` sends and delegates to `responder`, which can return
 * either a string (the model's raw text) or an error-shaped object that the
 * fake will throw (so retry/timeout logic can be exercised).
 */
export function installFakeBedrock(opts: {
  region?: string;
  responder: Responder;
}): FakeClientHandle {
  const region = opts.region ?? process.env.AWS_REGION ?? 'eu-central-1';
  const calls: FakeInvokeRequest[] = [];
  let callIndex = 0;

  const fake = {
    async send(
      cmd: { input: { modelId: string; body: string | Uint8Array } },
      _opts?: { abortSignal?: AbortSignal },
    ): Promise<{ body: Uint8Array }> {
      const rawBody =
        typeof cmd.input.body === 'string'
          ? cmd.input.body
          : new TextDecoder().decode(cmd.input.body);
      const parsed = JSON.parse(rawBody) as {
        temperature?: number;
        max_tokens?: number;
        messages?: Array<{ content?: string }>;
      };
      const prompt = parsed.messages?.[0]?.content ?? '';
      const req: FakeInvokeRequest = {
        modelId: cmd.input.modelId,
        prompt,
        temperature: parsed.temperature ?? 0,
        maxTokens: parsed.max_tokens ?? 0,
        raw: parsed as Record<string, unknown>,
      };
      calls.push(req);
      const result = await opts.responder(req, callIndex++);
      if (typeof result !== 'string') {
        const err = Object.assign(new Error(result.message ?? 'fake bedrock error'), result);
        throw err;
      }
      const resBody = new TextEncoder().encode(
        JSON.stringify({
          content: [{ type: 'text', text: result }],
          stop_reason: 'end_turn',
        }),
      );
      return { body: resBody };
    },
  };

  if (!G.__mergedBedrockClients) G.__mergedBedrockClients = new Map();
  G.__mergedBedrockClients.set(region, fake as unknown as BedrockRuntimeClient);

  return {
    calls,
    reset() {
      calls.length = 0;
      callIndex = 0;
    },
    uninstall() {
      G.__mergedBedrockClients?.delete(region);
    },
  };
}

/** Utility: build a valid task.yaml (middle level) for composer mocks. */
export function validYaml(level: 'junior' | 'middle' | 'senior' = 'middle'): string {
  return `version: 1
id: sample-task
title: Add /healthz endpoint
level: ${level}
stack: [node, express]
time_limit_min: 60
description_md: |
  Реалізуйте ендпоінт /healthz, який повертає { status: "ok" }.
  Переконайтесь, що існуючі тести проходять.
seeds: [alpha, bravo, charlie]
rubric:
  - key: tests_pass
    label: Tests pass
    source: auto
    weight: 40
  - key: focus
    label: Focused diff
    source: auto
    weight: 20
  - key: rationale
    label: Rationale in PR description
    source: llm
    weight: 40
`;
}

export function validComposerResponse(
  yaml: string = validYaml(),
  md: string = [
    '# Завдання: додати /healthz',
    '',
    'Відгалузіть робочу гілку від `main`. Додайте ендпоінт `GET /healthz`, який',
    'повертає `{ "status": "ok" }` зі статусом 200 і оновіть таблицю маршрутизації.',
    '',
    '## Як здати',
    '',
    '- Відкрийте PR з коротким обґрунтуванням у описі.',
    '- Переконайтесь, що існуючі тести не падають.',
    '- AI допомога дозволена; ми оцінюємо ваше обґрунтування в описі PR.',
  ].join('\n'),
  notes: string = 'Picked healthz surface; rubric rewards CI pass and reasoning.',
): string {
  return [
    '```yaml',
    yaml.trimEnd(),
    '```',
    '',
    '```markdown',
    md,
    '```',
    '',
    '```notes',
    notes,
    '```',
  ].join('\n');
}
