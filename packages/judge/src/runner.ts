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
}

const DEFAULT: Required<RunnerConfig> = {
  region: process.env.AWS_REGION ?? 'eu-central-1',
  modelId: process.env.BEDROCK_MODEL_ID ?? 'eu.anthropic.claude-sonnet-4-6-v1:0',
  maxInputTokens: 180_000,
  maxRetries: 3,
};

let _client: BedrockRuntimeClient | null = null;

function client(region: string): BedrockRuntimeClient {
  if (!_client) _client = new BedrockRuntimeClient({ region });
  return _client;
}

export async function runJudge(
  inputs: JudgeInputs,
  cfg: RunnerConfig = {},
): Promise<JudgeVerdict> {
  const merged = { ...DEFAULT, ...cfg };
  const prompt = buildJudgePrompt(inputs);

  // Rough heuristic — 4 chars/token. Bedrock charges per-token so we'd rather
  // refuse the job than OOM the context.
  const approxTokens = Math.ceil(prompt.length / 4);
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
    try {
      const res = await client(merged.region).send(
        new InvokeModelCommand({
          modelId: merged.modelId,
          contentType: 'application/json',
          accept: 'application/json',
          body,
        }),
      );
      const decoded = JSON.parse(new TextDecoder().decode(res.body));
      const text = extractText(decoded);
      const json = extractJson(text);
      return JudgeVerdictSchema.parse(json);
    } catch (err) {
      lastErr = err;
      if (!isRetryable(err) || attempt === merged.maxRetries) throw err;
      await sleep(backoff(attempt));
      attempt++;
    }
  }
  throw lastErr;
}

function extractText(resp: unknown): string {
  const msg = resp as { content?: Array<{ text?: string; type?: string }> };
  const block = msg.content?.find((c) => c.type === 'text');
  if (!block?.text) throw new Error('Bedrock response had no text block');
  return block.text;
}

function extractJson(text: string): unknown {
  // Accept raw JSON or a ```json fenced block.
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidate = (fenced?.[1] ?? text).trim();
  try {
    return JSON.parse(candidate);
  } catch (e) {
    throw new Error(
      `judge returned non-JSON: ${candidate.slice(0, 200)} · parse err: ${(e as Error).message}`,
    );
  }
}

function isRetryable(err: unknown): boolean {
  const e = err as { name?: string; $metadata?: { httpStatusCode?: number } };
  const code = e.$metadata?.httpStatusCode;
  if (code && code >= 500) return true;
  return (
    e.name === 'ThrottlingException' ||
    e.name === 'ServiceUnavailableException' ||
    e.name === 'InternalServerException'
  );
}

function backoff(attempt: number): number {
  return Math.min(30_000, 500 * 2 ** attempt + Math.random() * 250);
}

function sleep(ms: number): Promise<void> {
  return new Promise((res) => setTimeout(res, ms));
}
