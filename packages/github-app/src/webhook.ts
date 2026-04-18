import { verify } from '@octokit/webhooks-methods';

export type WebhookPayload = {
  event: string;
  deliveryId: string;
  body: string;
  json: unknown;
};

export async function verifyAndParseWebhook(opts: {
  secret: string;
  headers: Headers;
  body: string;
}): Promise<WebhookPayload> {
  const signature = opts.headers.get('x-hub-signature-256');
  const event = opts.headers.get('x-github-event');
  const deliveryId = opts.headers.get('x-github-delivery');

  if (!signature) throw new WebhookError('missing x-hub-signature-256 header', 400);
  if (!event) throw new WebhookError('missing x-github-event header', 400);
  if (!deliveryId) throw new WebhookError('missing x-github-delivery header', 400);

  const ok = await verify(opts.secret, opts.body, signature);
  if (!ok) throw new WebhookError('invalid signature', 401);

  let json: unknown;
  try {
    json = JSON.parse(opts.body);
  } catch {
    throw new WebhookError('body is not valid JSON', 400);
  }

  return { event, deliveryId, body: opts.body, json };
}

export class WebhookError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = 'WebhookError';
  }
}
