import {
  BedrockRuntimeClient,
  InvokeModelCommand,
} from '@aws-sdk/client-bedrock-runtime';

export interface InvokeOptions {
  region?: string;
  modelId: string;
  prompt: string;
  maxTokens?: number;
  temperature?: number;
  maxInputTokens?: number;
  maxRetries?: number;
}

const DEFAULT_REGION = process.env.AWS_REGION ?? 'eu-central-1';

const _clients = new Map<string, BedrockRuntimeClient>();
function client(region: string): BedrockRuntimeClient {
  let c = _clients.get(region);
  if (!c) {
    c = new BedrockRuntimeClient({ region });
    _clients.set(region, c);
  }
  return c;
}

export async function invokeBedrock(opts: InvokeOptions): Promise<string> {
  const region = opts.region ?? DEFAULT_REGION;
  const maxTokens = opts.maxTokens ?? 2048;
  const temperature = opts.temperature ?? 0.15;
  const maxInputTokens = opts.maxInputTokens ?? 180_000;
  const maxRetries = opts.maxRetries ?? 3;

  const approxTokens = Math.ceil(opts.prompt.length / 4);
  if (approxTokens > maxInputTokens) {
    throw new Error(
      `bedrock prompt estimated at ${approxTokens} tokens, exceeds cap ${maxInputTokens}`,
    );
  }

  const body = JSON.stringify({
    anthropic_version: 'bedrock-2023-05-31',
    max_tokens: maxTokens,
    temperature,
    messages: [{ role: 'user', content: opts.prompt }],
  });

  let attempt = 0;
  let lastErr: unknown;
  while (attempt <= maxRetries) {
    try {
      const res = await client(region).send(
        new InvokeModelCommand({
          modelId: opts.modelId,
          contentType: 'application/json',
          accept: 'application/json',
          body,
        }),
      );
      const decoded = JSON.parse(new TextDecoder().decode(res.body));
      return extractText(decoded);
    } catch (err) {
      lastErr = err;
      if (!isRetryable(err) || attempt === maxRetries) throw err;
      await sleep(backoff(attempt));
      attempt++;
    }
  }
  throw lastErr;
}

export function extractJson<T = unknown>(text: string): T {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidate = (fenced?.[1] ?? text).trim();
  try {
    return JSON.parse(candidate) as T;
  } catch (e) {
    throw new Error(
      `bedrock returned non-JSON: ${candidate.slice(0, 200)} · parse err: ${(e as Error).message}`,
    );
  }
}

/** Extract the first fenced code block of a given language tag. */
export function extractFenced(text: string, lang: string): string {
  const re = new RegExp('```' + lang + '\\s*([\\s\\S]*?)```', 'i');
  const m = text.match(re);
  if (!m) throw new Error(`no \`\`\`${lang} block in response`);
  return m[1]!.trim();
}

function extractText(resp: unknown): string {
  const msg = resp as { content?: Array<{ text?: string; type?: string }> };
  const block = msg.content?.find((c) => c.type === 'text');
  if (!block?.text) throw new Error('Bedrock response had no text block');
  return block.text;
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
