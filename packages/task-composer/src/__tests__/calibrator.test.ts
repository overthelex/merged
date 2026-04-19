import { test } from 'node:test';
import assert from 'node:assert/strict';
import { runCalibrator } from '../calibrator';
import type { ComposerDraft } from '../types';
import { installFakeBedrock } from './bedrockMock';

const REGION = 'eu-central-1';

const VALID_YAML = `
version: 1
id: express-healthz
title: Add /healthz endpoint
level: middle
stack: [node, express]
time_limit_min: 60
description_md: |
  Add a /healthz endpoint that returns { status: "ok" } with HTTP 200.
  Make sure the existing test suite still passes.
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
    weight: 50
`;

const VALID_DRAFT: ComposerDraft = {
  task_yaml: VALID_YAML,
  assignment_md:
    '# Merged assessment\n\nAdd /healthz. Open a PR. See acceptance criteria in task.yaml.',
};

test('calibrator schema stage fails fast on bad weights (no Bedrock call)', async () => {
  const bad = VALID_YAML.replace('weight: 50', 'weight: 40');
  const result = await runCalibrator({
    draft: { ...VALID_DRAFT, task_yaml: bad },
    level: 'middle',
  });
  assert.equal(result.verdict.ok, false);
  assert.ok(result.verdict.schema_errors.length > 0);
  assert.ok(
    result.verdict.schema_errors.some((e) => /sum to 100/.test(e)),
    'expected rubric-sum error in schema_errors',
  );
  assert.deepEqual(result.verdict.coherence_notes, []);
  assert.equal(result.spec, undefined);
});

test('calibrator flags level mismatch as schema error with spec populated', async () => {
  const result = await runCalibrator({
    draft: VALID_DRAFT,
    level: 'senior',
  });
  assert.equal(result.verdict.ok, false);
  assert.ok(
    result.verdict.schema_errors.some((e) => /level/.test(e) && /does not match/.test(e)),
  );
  assert.ok(result.spec, 'spec should be populated even on level mismatch');
  assert.equal(result.verdict.task_id, 'express-healthz');
});

test('calibrator reports duplicate rubric keys', async () => {
  const bad = VALID_YAML.replace('key: focus', 'key: tests_pass');
  const result = await runCalibrator({
    draft: { ...VALID_DRAFT, task_yaml: bad },
    level: 'middle',
  });
  assert.equal(result.verdict.ok, false);
  assert.ok(result.verdict.schema_errors.some((e) => /duplicate/.test(e)));
});

test('calibrator reports yaml parse errors', async () => {
  const bad = 'not: [valid yaml\n  with: : : colons';
  const result = await runCalibrator({
    draft: { ...VALID_DRAFT, task_yaml: bad },
    level: 'middle',
  });
  assert.equal(result.verdict.ok, false);
  assert.ok(result.verdict.schema_errors.length > 0);
});

test('calibrator returns ok when schema passes AND LLM coherence is clean', async () => {
  const fake = installFakeBedrock({
    region: REGION,
    responder: () => '```json\n{"ok": true, "coherence_notes": []}\n```',
  });
  try {
    const result = await runCalibrator({ draft: VALID_DRAFT, level: 'middle' });
    assert.equal(result.verdict.ok, true);
    assert.deepEqual(result.verdict.schema_errors, []);
    assert.deepEqual(result.verdict.coherence_notes, []);
    assert.ok(result.spec);
    assert.equal(result.verdict.task_id, 'express-healthz');
    assert.equal(fake.calls.length, 1);
    assert.match(fake.calls[0]!.prompt, /task\.yaml/);
    assert.match(fake.calls[0]!.prompt, /ASSIGNMENT\.md/);
  } finally {
    fake.uninstall();
  }
});

test('calibrator surfaces LLM coherence rejection as actionable notes for the composer', async () => {
  const fake = installFakeBedrock({
    region: REGION,
    responder: () =>
      JSON.stringify({
        ok: false,
        coherence_notes: [
          'time_limit_min=60 is too tight for a middle-level candidate to add endpoint + tests',
          'seeds alpha/bravo/charlie look like cosmetic renames, not distinct approaches',
        ],
      }),
  });
  try {
    const result = await runCalibrator({ draft: VALID_DRAFT, level: 'middle' });
    assert.equal(result.verdict.ok, false);
    assert.deepEqual(result.verdict.schema_errors, []);
    assert.equal(result.verdict.coherence_notes.length, 2);
    assert.match(result.verdict.coherence_notes[0]!, /time_limit_min/);
    assert.match(result.verdict.coherence_notes[1]!, /seeds/);
    assert.ok(result.spec, 'spec still populated — schema passed, only LLM rejected');
  } finally {
    fake.uninstall();
  }
});

test('calibrator forces ok=false when LLM claims ok but returns notes (invariant guard)', async () => {
  const fake = installFakeBedrock({
    region: REGION,
    responder: () =>
      JSON.stringify({
        ok: true,
        coherence_notes: ['but actually the rubric rewards the wrong thing'],
      }),
  });
  try {
    const result = await runCalibrator({ draft: VALID_DRAFT, level: 'middle' });
    assert.equal(
      result.verdict.ok,
      false,
      'non-empty notes must force ok=false regardless of LLM claim',
    );
    assert.equal(result.verdict.coherence_notes.length, 1);
  } finally {
    fake.uninstall();
  }
});

test('calibrator falls back to coherence_notes diagnostic when Bedrock returns non-JSON', async () => {
  const fake = installFakeBedrock({
    region: REGION,
    responder: () => 'I am not JSON, I am a poem about healthchecks.',
  });
  try {
    const result = await runCalibrator({ draft: VALID_DRAFT, level: 'middle' });
    assert.equal(result.verdict.ok, false);
    assert.equal(result.verdict.schema_errors.length, 0);
    assert.equal(result.verdict.coherence_notes.length, 1);
    assert.match(result.verdict.coherence_notes[0]!, /unparseable/);
    assert.ok(result.spec, 'spec from schema stage is preserved even on LLM parse failure');
  } finally {
    fake.uninstall();
  }
});

test('calibrator reports schema-shape mismatch when Bedrock returns malformed JSON', async () => {
  const fake = installFakeBedrock({
    region: REGION,
    responder: () => '{"ok": "not-a-bool", "coherence_notes": "not-an-array"}',
  });
  try {
    const result = await runCalibrator({ draft: VALID_DRAFT, level: 'middle' });
    assert.equal(result.verdict.ok, false);
    assert.equal(result.verdict.coherence_notes.length, 1);
    assert.match(result.verdict.coherence_notes[0]!, /failed schema/);
  } finally {
    fake.uninstall();
  }
});
