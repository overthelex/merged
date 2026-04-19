import type { BedrockRuntimeClient } from '@aws-sdk/client-bedrock-runtime';

export interface FakeInvokeRequest {
  modelId: string;
  prompt: string;
  temperature: number;
  maxTokens: number;
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
  reset(): void;
  uninstall(): void;
}

const G = globalThis as unknown as {
  __mergedBedrockClients?: Map<string, BedrockRuntimeClient>;
};

/**
 * Install a fake Bedrock client on the global cache shared with
 * `@merged/task-composer`. A string response is returned as the model's raw
 * text; an error-shaped object is thrown so retry/timeout logic can be
 * exercised without talking to Bedrock.
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
      const req: FakeInvokeRequest = {
        modelId: cmd.input.modelId,
        prompt: parsed.messages?.[0]?.content ?? '',
        temperature: parsed.temperature ?? 0,
        maxTokens: parsed.max_tokens ?? 0,
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
