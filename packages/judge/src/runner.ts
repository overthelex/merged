import {
  BedrockRuntimeClient,
  InvokeModelCommand,
} from '@aws-sdk/client-bedrock-runtime';
import type { JudgeInputs } from './prompt';
import { buildJudgePrompt } from './prompt';
import { JudgeVerdictSchema, type JudgeVerdict } from './verdict';

export interface RunnerConfig {
  region?: string;
  modelId?: string;
  /** Hard ceiling on input tokens we'll send. Refuse to run if exceeded. */
  maxInputTokens?: number;
  /** Retries on throttle / transient 5xx from Bedrock. */
  maxRetries?: number;
  /** Wall-clock deadline for a single attempt, in ms. Default 120_000. */
  perRequestTimeoutMs?: number;
}

const DEFAULT: Required<RunnerConfig> = {
  region: process.env.AWS_REGION ?? 'eu-central-1',
  modelId: process.env.BEDROCK_MODEL_ID ?? 'eu.anthropic.claude-sonnet-4-6-v1:0',
  maxInputTokens: 180_000,
  maxRetries: 3,
  perRequestTimeoutMs: 120_000,
};

/**
 * Shared with `@merged/task-composer`'s bedrock client cache so both halves
 * of the pipeline reuse the same per-region connection pool AND tests can
 * inject a single fake without having to stub the module twice.
 */
const G = globalThis as unknown as {
  __mergedBedrockClients?: Map<string, BedrockRuntimeClient>;
};

function client(region: string): BedrockRuntimeClient {
  if (!G.__mergedBedrockClients) G.__mergedBedrockClients = new Map();
  let c = G.__mergedBedrockClients.get(region);
  if (!c) {
    c = new BedrockRuntimeClient({ region });
    G.__mergedBedrockClients.set(region, c);
  }
  return c;
}

export async function runJudge(
  inputs: JudgeInputs,
  cfg: RunnerConfig = {},
): Promise<JudgeVerdict> {
  const merged = { ...DEFAULT, ...cfg };
  const prompt = buildJudgePrompt(inputs);

  // Tokens ≈ UTF-8 bytes / 3.5 — conservative for Cyrillic/mixed content.
  // (`prompt.length` counts UTF-16 code units and undercounts Ukrainian.)
  const approxTokens = Math.ceil(Buffer.byteLength(prompt, 'utf8') / 3.5);
  if (approxTokens > merged.maxInputTokens) {
    throw new Error(
      `judge prompt estimated at ${approxTokens} tokens, exceeds cap ${merged.maxInputTokens}`,
    );
  }

  const body = JSON.stringify({
    anthropic_version: 'bedrock-2023-05-31',
    max_tokens: 2048,
    temperature: 0.15,
    messages: [{ role: 'user', content: prompt }],
  });

  let attempt = 0;
  let lastErr: unknown;
  while (attempt <= merged.maxRetries) {
    const ac = new AbortController();
    const timer = setTimeout(
      () => ac.abort(new Error('judge per-request timeout')),
      merged.perRequestTimeoutMs,
    );
    try {
      const res = await client(merged.region).send(
        new InvokeModelCommand({
          modelId: merged.modelId,
          contentType: 'application/json',
          accept: 'application/json',
          body,
        }),
        { abortSignal: ac.signal },
      );
      clearTimeout(timer);
      if (!res.body) throw new Error('judge bedrock response body was empty');
      const decoded = JSON.parse(new TextDecoder().decode(res.body));
      const text = extractText(decoded, merged.modelId);
      const json = extractJson(text);
      return JudgeVerdictSchema.parse(json);
    } catch (err) {
      clearTimeout(timer);
      lastErr = err;
      if (!isRetryable(err) || attempt === merged.maxRetries) throw err;
      await sleep(backoff(attempt));
      attempt++;
    }
  }
  throw lastErr;
}

function extractText(resp: unknown, modelId: string): string {
  const msg = resp as {
    content?: Array<{ text?: string; type?: string }>;
    stop_reason?: string;
  };
  const texts = (msg.content ?? [])
    .filter((c) => c.type === 'text' && typeof c.text === 'string')
    .map((c) => c.text!)
    .join('\n');
  if (!texts) {
    throw new Error(
      `judge bedrock response had no text blocks (stop_reason=${msg.stop_reason ?? 'unknown'}, model=${modelId})`,
    );
  }
  if (msg.stop_reason === 'max_tokens') {
    throw new Error(
      `judge bedrock response truncated by max_tokens (model=${modelId}); retry with higher max_tokens`,
    );
  }
  return texts;
}

function extractJson(text: string): unknown {
  // Accept raw JSON, a ```json fenced block, or any fenced block with JSON.
  const fenced = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/i);
  const candidate = (fenced?.[1] ?? text).trim();
  try {
    return JSON.parse(candidate);
  } catch (e) {
    throw new Error(
      `judge returned non-JSON: ${candidate.slice(0, 200)} · parse err: ${(e as Error).message}`,
    );
  }
}

const RETRYABLE_NAMES = new Set([
  'ThrottlingException',
  'ServiceUnavailableException',
  'InternalServerException',
  'ModelTimeoutException',
  'ModelStreamErrorException',
  'TimeoutError',
  'AbortError',
]);

function isRetryable(err: unknown): boolean {
  const e = err as {
    name?: string;
    code?: string;
    $metadata?: { httpStatusCode?: number };
    $retryable?: { throttling?: boolean };
  };
  const status = e.$metadata?.httpStatusCode;
  if (status && (status >= 500 || status === 408 || status === 425 || status === 429)) {
    return true;
  }
  if (e.$retryable) return true;
  if (e.name && RETRYABLE_NAMES.has(e.name)) return true;
  return false;
}

function backoff(attempt: number): number {
  return Math.min(30_000, 500 * 2 ** attempt + Math.random() * 250);
}

function sleep(ms: number): Promise<void> {
  return new Promise((res) => setTimeout(res, ms));
}
