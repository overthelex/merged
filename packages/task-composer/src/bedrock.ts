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
  /** Wall-clock deadline for a single attempt, in ms. Default 120_000. */
  perRequestTimeoutMs?: number;
}

const DEFAULT_REGION = process.env.AWS_REGION ?? 'eu-central-1';

/**
 * Bedrock clients are cached on `globalThis` so Next.js HMR reloads don't
 * leak a new client on every rebuild. Keyed by region.
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

const LANG_ALIASES: Record<string, string[]> = {
  json: ['json'],
  yaml: ['yaml', 'yml'],
  markdown: ['markdown', 'md', 'mdx'],
  typescript: ['typescript', 'ts'],
  javascript: ['javascript', 'js'],
  bash: ['bash', 'sh', 'shell'],
  notes: ['notes'],
};

export async function invokeBedrock(opts: InvokeOptions): Promise<string> {
  const region = opts.region ?? DEFAULT_REGION;
  const maxTokens = opts.maxTokens ?? 2048;
  const temperature = opts.temperature ?? 0.15;
  const maxInputTokens = opts.maxInputTokens ?? 180_000;
  const maxRetries = opts.maxRetries ?? 3;
  const perRequestTimeoutMs = opts.perRequestTimeoutMs ?? 120_000;

  // Tokens ≈ UTF-8 bytes / 3.5 — conservative for Cyrillic/mixed content.
  // (`prompt.length` counts UTF-16 code units and undercounts Ukrainian.)
  const approxTokens = Math.ceil(Buffer.byteLength(opts.prompt, 'utf8') / 3.5);
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
    const ac = new AbortController();
    const timer = setTimeout(
      () => ac.abort(new Error('bedrock per-request timeout')),
      perRequestTimeoutMs,
    );
    try {
      const res = await client(region).send(
        new InvokeModelCommand({
          modelId: opts.modelId,
          contentType: 'application/json',
          accept: 'application/json',
          body,
        }),
        { abortSignal: ac.signal },
      );
      clearTimeout(timer);
      if (!res.body) throw new Error('bedrock response body was empty');
      const decoded = JSON.parse(new TextDecoder().decode(res.body));
      return extractText(decoded, opts.modelId);
    } catch (err) {
      clearTimeout(timer);
      lastErr = err;
      if (!isRetryable(err) || attempt === maxRetries) {
        throw wrapError(err, opts.modelId, attempt);
      }
      await sleep(backoff(attempt));
      attempt++;
    }
  }
  throw wrapError(lastErr, opts.modelId, attempt);
}

/**
 * Extract a JSON object from a Bedrock text response. Tries in order:
 *   1. ```json``` fenced block (any case)
 *   2. first fenced block with parseable JSON
 *   3. balanced-brace scan from the first `{` or `[`
 *   4. raw trimmed text as last resort
 */
export function extractJson<T = unknown>(text: string): T {
  const jsonFence = matchFence(text, 'json');
  if (jsonFence) {
    try {
      return JSON.parse(jsonFence) as T;
    } catch {
      /* fall through */
    }
  }
  const anyFence = text.match(/```[a-zA-Z]*[^\S\n]*\n?([\s\S]*?)\n?```/);
  if (anyFence?.[1]) {
    const candidate = anyFence[1].trim();
    try {
      return JSON.parse(candidate) as T;
    } catch {
      /* fall through */
    }
  }
  const braced = scanBalanced(text);
  if (braced) {
    try {
      return JSON.parse(braced) as T;
    } catch {
      /* fall through */
    }
  }
  const trimmed = text.trim();
  try {
    return JSON.parse(trimmed) as T;
  } catch (e) {
    throw new Error(
      `bedrock returned non-JSON: ${trimmed.slice(0, 200)} · parse err: ${(e as Error).message}`,
    );
  }
}

/** Extract the first fenced block of a given language tag or its known aliases. */
export function extractFenced(text: string, lang: string): string {
  const block = matchFence(text, lang);
  if (block !== null) return block;
  throw new Error(`no \`\`\`${lang} block (or alias) in response`);
}

function matchFence(text: string, lang: string): string | null {
  const aliases = LANG_ALIASES[lang] ?? [lang];
  for (const alias of aliases) {
    const re = new RegExp(
      '```' + escapeRegex(alias) + '[^\\S\\n]*\\n?([\\s\\S]*?)\\n?```',
      'i',
    );
    const m = text.match(re);
    if (m?.[1] !== undefined) return m[1].trim();
  }
  return null;
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function scanBalanced(text: string): string | null {
  const start = text.search(/[{[]/);
  if (start < 0) return null;
  const opener = text[start];
  const closer = opener === '{' ? '}' : ']';
  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let i = start; i < text.length; i++) {
    const c = text[i];
    if (escaped) {
      escaped = false;
      continue;
    }
    if (c === '\\' && inString) {
      escaped = true;
      continue;
    }
    if (c === '"') {
      inString = !inString;
      continue;
    }
    if (inString) continue;
    if (c === opener) depth++;
    else if (c === closer) {
      depth--;
      if (depth === 0) return text.slice(start, i + 1);
    }
  }
  return null;
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
      `bedrock response had no text blocks (stop_reason=${msg.stop_reason ?? 'unknown'}, model=${modelId})`,
    );
  }
  if (msg.stop_reason === 'max_tokens') {
    throw new Error(
      `bedrock response truncated by max_tokens (model=${modelId}); retry with higher max_tokens`,
    );
  }
  return texts;
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
const RETRYABLE_CODES = new Set([
  'ECONNRESET',
  'ETIMEDOUT',
  'EPIPE',
  'ENOTFOUND',
  'EAI_AGAIN',
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
  if (e.code && RETRYABLE_CODES.has(e.code)) return true;
  return false;
}

function wrapError(err: unknown, modelId: string, attempt: number): Error {
  const original = err instanceof Error ? err : new Error(String(err));
  const wrapped = new Error(
    `bedrock invoke failed after ${attempt + 1} attempt(s) (model=${modelId}): ${original.message}`,
  );
  (wrapped as { cause?: unknown }).cause = original;
  return wrapped;
}

function backoff(attempt: number): number {
  const cap = 30_000;
  const base = 500;
  const exp = Math.min(cap, base * 2 ** attempt);
  return Math.random() * exp;
}

function sleep(ms: number): Promise<void> {
  return new Promise((res) => setTimeout(res, ms));
}
