import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseTaskSpec, safeParseTaskSpec, pickSeed } from '../index';

const VALID_YAML = `
version: 1
id: express-healthz
title: Add /healthz endpoint
level: junior
stack: [node, express]
time_limit_min: 45
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

test('parses a valid task spec', () => {
  const spec = parseTaskSpec(VALID_YAML);
  assert.equal(spec.id, 'express-healthz');
  assert.equal(spec.rubric.length, 3);
});

test('rejects rubric weights that do not sum to 100', () => {
  const bad = VALID_YAML.replace('weight: 50', 'weight: 40');
  const r = safeParseTaskSpec(bad);
  assert.equal(r.success, false);
  if (!r.success) {
    assert.ok(r.issues.some((i) => i.message.includes('sum to 100')));
  }
});

test('rejects duplicate rubric keys', () => {
  const bad = VALID_YAML.replace('key: focus', 'key: tests_pass');
  const r = safeParseTaskSpec(bad);
  assert.equal(r.success, false);
  if (!r.success) {
    assert.ok(r.issues.some((i) => i.message.includes('duplicate rubric key')));
  }
});

test('rejects specs with fewer than 3 seeds', () => {
  const bad = VALID_YAML.replace('seeds: [alpha, bravo, charlie]', 'seeds: [alpha, bravo]');
  const r = safeParseTaskSpec(bad);
  assert.equal(r.success, false);
});

test('pickSeed is deterministic for same candidate+assignment', () => {
  const spec = parseTaskSpec(VALID_YAML);
  const a = pickSeed(spec, 'olena@example.com', 'asg-1');
  const b = pickSeed(spec, 'olena@example.com', 'asg-1');
  assert.equal(a, b);
});

test('pickSeed varies between assignments', () => {
  const spec = parseTaskSpec(VALID_YAML);
  const seen = new Set<string>();
  for (let i = 0; i < 20; i++) seen.add(pickSeed(spec, 'olena@example.com', `asg-${i}`));
  assert.ok(seen.size >= 2, 'expected at least two distinct seeds across assignments');
});
