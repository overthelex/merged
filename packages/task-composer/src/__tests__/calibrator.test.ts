import { test } from 'node:test';
import assert from 'node:assert/strict';
import { runCalibrator } from '../calibrator';
import type { ComposerDraft } from '../types';

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
