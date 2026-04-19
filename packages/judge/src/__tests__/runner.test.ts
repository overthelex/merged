import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseTaskSpec, type TaskSpec } from '@merged/task-spec';
import { runJudge } from '../runner';
import { mergeScores } from '../verdict';
import { installFakeBedrock } from './bedrockMock';

const REGION = 'eu-central-1';

const SPEC: TaskSpec = parseTaskSpec(
  `version: 1
id: express-healthz
title: Add /healthz endpoint
level: middle
stack: [node, express]
time_limit_min: 60
description_md: |
  Add a /healthz endpoint returning { status: "ok" } with HTTP 200.
seeds: [alpha, bravo, charlie]
rubric:
  - key: tests_pass
    label: Tests pass
    source: auto
    weight: 30
  - key: focus
    label: Focused diff
    source: auto
    weight: 20
  - key: rationale
    label: Rationale in PR description
    source: llm
    weight: 30
  - key: code_quality
    label: Code quality and reasoning
    source: llm
    weight: 20
`,
);

const PR_BODY = 'Adds /healthz returning {status:"ok"} with basic tests.';
const DIFF = [
  'diff --git a/src/router.ts b/src/router.ts',
  '--- a/src/router.ts',
  '+++ b/src/router.ts',
  '@@',
  "+app.get('/healthz', (_, res) => res.json({ status: 'ok' }));",
].join('\n');
const CI_SUMMARY = '42 passed, 0 failed. Lint: clean.';

test('judge: happy path — evaluates PR and returns a verdict for LLM rubric criteria', async () => {
  const fake = installFakeBedrock({
    region: REGION,
    responder: () =>
      JSON.stringify({
        scores: {
          rationale: {
            score: 4,
            rationale: 'PR description explains the tradeoff between liveness and readiness.',
          },
          code_quality: {
            score: 4,
            rationale: 'Small, focused diff. Naming is consistent with the rest of the router.',
          },
        },
        strengths: ['Clear PR description', 'Minimal diff'],
        weaknesses: ['No test for the 500 branch'],
        overall_notes:
          'Solid middle-level submission with room for one more negative-path test. Ready for a human reviewer.',
      }),
  });
  try {
    const verdict = await runJudge({
      spec: SPEC,
      seed: 'alpha',
      prDescription: PR_BODY,
      diff: DIFF,
      ciSummary: CI_SUMMARY,
    });
    assert.equal(verdict.scores.rationale?.score, 4);
    assert.equal(verdict.scores.code_quality?.score, 4);
    assert.equal(verdict.strengths.length, 2);
    assert.equal(verdict.weaknesses.length, 1);
    assert.ok(verdict.overall_notes.length > 20);

    assert.equal(fake.calls.length, 1);
    const prompt = fake.calls[0]!.prompt;
    assert.match(prompt, /Seed \(variant\): alpha/);
    assert.match(prompt, /Add \/healthz/);
    assert.doesNotMatch(
      prompt,
      /\btests_pass\b[^:]{0,80}weight/,
      'auto-sourced criteria must not be shown to the LLM — they come from CI',
    );
    assert.match(prompt, /rationale.*weight 30%/s);
    assert.match(prompt, /code_quality.*weight 20%/s);
  } finally {
    fake.uninstall();
  }
});

test('judge: merges LLM + CI scores into a weighted 0-100 total', async () => {
  const fake = installFakeBedrock({
    region: REGION,
    responder: () =>
      JSON.stringify({
        scores: {
          rationale: { score: 5, rationale: 'Excellent reasoning.' },
          code_quality: { score: 4, rationale: 'Clean.' },
        },
        strengths: ['strong reasoning'],
        weaknesses: [],
        overall_notes: 'Strong submission, ready to hire with one follow-up interview.',
      }),
  });
  try {
    const verdict = await runJudge({
      spec: SPEC,
      seed: 'alpha',
      prDescription: PR_BODY,
      diff: DIFF,
      ciSummary: CI_SUMMARY,
    });
    const final = mergeScores(
      SPEC,
      {
        tests_pass: { score: 5, rationale: 'All tests green.' },
        focus: { score: 4, rationale: 'Small diff.' },
      },
      verdict,
    );
    // 5/5 * 30 + 4/5 * 20 + 5/5 * 30 + 4/5 * 20 = 30 + 16 + 30 + 16 = 92
    assert.equal(final.total, 92);
    assert.equal(final.missing.length, 0);
    assert.equal(final.breakdown.length, 4);
  } finally {
    fake.uninstall();
  }
});

test('judge: flags missing criteria in mergeScores when LLM omits a scored key', async () => {
  const fake = installFakeBedrock({
    region: REGION,
    responder: () =>
      JSON.stringify({
        scores: {
          // LLM forgot to score `code_quality`.
          rationale: { score: 4, rationale: 'Good.' },
        },
        strengths: [],
        weaknesses: [],
        overall_notes: 'Partial response; reviewer should re-run.',
      }),
  });
  try {
    const verdict = await runJudge({
      spec: SPEC,
      seed: 'alpha',
      prDescription: PR_BODY,
      diff: DIFF,
      ciSummary: CI_SUMMARY,
    });
    const final = mergeScores(
      SPEC,
      {
        tests_pass: { score: 5, rationale: 'green' },
        focus: { score: 5, rationale: 'focused' },
      },
      verdict,
    );
    assert.deepEqual(final.missing, ['code_quality']);
    // tests_pass 30 + focus 20 + rationale 24 + code_quality 0 = 74
    assert.equal(final.total, 74);
  } finally {
    fake.uninstall();
  }
});

test('judge: parses ```json fenced response (common model output shape)', async () => {
  const fake = installFakeBedrock({
    region: REGION,
    responder: () =>
      [
        'Preamble prose the model sometimes emits',
        '```json',
        JSON.stringify({
          scores: {
            rationale: { score: 3, rationale: 'Adequate.' },
            code_quality: { score: 3, rationale: 'Adequate.' },
          },
          strengths: ['ok'],
          weaknesses: ['nothing stands out'],
          overall_notes: 'Middle-of-the-road submission; hirable for junior-to-middle.',
        }),
        '```',
      ].join('\n'),
  });
  try {
    const verdict = await runJudge({
      spec: SPEC,
      seed: 'alpha',
      prDescription: PR_BODY,
      diff: DIFF,
      ciSummary: CI_SUMMARY,
    });
    assert.equal(verdict.scores.rationale?.score, 3);
  } finally {
    fake.uninstall();
  }
});

test('judge: throws when Bedrock returns non-JSON prose', async () => {
  const fake = installFakeBedrock({
    region: REGION,
    responder: () => 'I refuse to produce JSON. Here is a haiku instead.',
  });
  try {
    await assert.rejects(
      () =>
        runJudge({
          spec: SPEC,
          seed: 'alpha',
          prDescription: PR_BODY,
          diff: DIFF,
          ciSummary: CI_SUMMARY,
        }),
      /non-JSON/,
    );
  } finally {
    fake.uninstall();
  }
});

test('judge: retries on throttle (429) and succeeds on the second attempt', async () => {
  const fake = installFakeBedrock({
    region: REGION,
    responder: (_req, idx) => {
      if (idx === 0) return { name: 'ThrottlingException', $metadata: { httpStatusCode: 429 } };
      return JSON.stringify({
        scores: {
          rationale: { score: 4, rationale: 'Fine.' },
          code_quality: { score: 4, rationale: 'Fine.' },
        },
        strengths: [],
        weaknesses: [],
        overall_notes: 'Second attempt recovered, ship it.',
      });
    },
  });
  try {
    const verdict = await runJudge(
      {
        spec: SPEC,
        seed: 'alpha',
        prDescription: PR_BODY,
        diff: DIFF,
        ciSummary: CI_SUMMARY,
      },
      // keep backoff short in the test
      { maxRetries: 1 },
    );
    assert.equal(verdict.scores.rationale?.score, 4);
    assert.equal(fake.calls.length, 2, 'should have tried twice');
  } finally {
    fake.uninstall();
  }
});

test('judge: non-retryable 4xx (e.g. 400) fails fast without retry loop', async () => {
  const fake = installFakeBedrock({
    region: REGION,
    responder: () => ({
      name: 'ValidationException',
      $metadata: { httpStatusCode: 400 },
      message: 'bad input',
    }),
  });
  try {
    await assert.rejects(
      () =>
        runJudge(
          {
            spec: SPEC,
            seed: 'alpha',
            prDescription: PR_BODY,
            diff: DIFF,
            ciSummary: CI_SUMMARY,
          },
          { maxRetries: 3 },
        ),
      /bad input|ValidationException/,
    );
    assert.equal(fake.calls.length, 1, 'non-retryable error must not retry');
  } finally {
    fake.uninstall();
  }
});

test('judge: refuses to call Bedrock when prompt exceeds maxInputTokens', async () => {
  const fake = installFakeBedrock({
    region: REGION,
    responder: () => {
      throw new Error('should not be called — input cap should have rejected earlier');
    },
  });
  try {
    // buildJudgePrompt truncates diff/ci/dialogue. PR description is NOT
    // truncated, so that's where a hostile/huge input would surface.
    const hugePrBody = 'x'.repeat(2_000_000);
    await assert.rejects(
      () =>
        runJudge(
          {
            spec: SPEC,
            seed: 'alpha',
            prDescription: hugePrBody,
            diff: DIFF,
            ciSummary: CI_SUMMARY,
          },
          { maxInputTokens: 10_000 },
        ),
      /exceeds cap/,
    );
    assert.equal(fake.calls.length, 0);
  } finally {
    fake.uninstall();
  }
});

test('judge: respects region override (fake installed on the override region)', async () => {
  const fake = installFakeBedrock({
    region: 'us-west-2',
    responder: () =>
      JSON.stringify({
        scores: {
          rationale: { score: 2, rationale: 'Thin.' },
          code_quality: { score: 2, rationale: 'Thin.' },
        },
        strengths: [],
        weaknesses: ['needs more depth'],
        overall_notes: 'Below expected level.',
      }),
  });
  try {
    const verdict = await runJudge(
      {
        spec: SPEC,
        seed: 'alpha',
        prDescription: PR_BODY,
        diff: DIFF,
        ciSummary: CI_SUMMARY,
      },
      { region: 'us-west-2' },
    );
    assert.equal(verdict.scores.rationale?.score, 2);
    assert.equal(fake.calls.length, 1);
  } finally {
    fake.uninstall();
  }
});
