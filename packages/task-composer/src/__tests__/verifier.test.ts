import { test } from 'node:test';
import assert from 'node:assert/strict';
import { finalizeVerification } from '../verifier';
import { VerifierReportSchema } from '../types';

const TASK_ID = 'express-healthz';

test('verifier returns ok with empty issues on clean verdict', () => {
  const text = '```json\n{"ok": true, "issues": []}\n```';
  const report = finalizeVerification(text, TASK_ID);
  assert.equal(report.ok, true);
  assert.deepEqual(report.issues, []);
  assert.equal(report.task_id, TASK_ID);
});

test('verifier accepts raw JSON without fenced block', () => {
  const text = '{"ok": true, "issues": []}';
  const report = finalizeVerification(text, TASK_ID);
  assert.equal(report.ok, true);
  assert.equal(report.task_id, TASK_ID);
});

test('verifier parses issues and forces ok=false when non-empty', () => {
  const text =
    '```json\n{"ok": true, "issues": ["ASSIGNMENT.md does not say how to run tests"]}\n```';
  const report = finalizeVerification(text, TASK_ID);
  assert.equal(report.ok, false, 'issues present must force ok=false regardless of LLM claim');
  assert.equal(report.issues.length, 1);
  assert.match(report.issues[0]!, /how to run tests/);
  assert.equal(report.task_id, TASK_ID);
});

test('verifier returns ok=false with notes when LLM says ok=false', () => {
  const text = '```json\n{"ok": false, "issues": ["seed names do not match description"]}\n```';
  const report = finalizeVerification(text, TASK_ID);
  assert.equal(report.ok, false);
  assert.equal(report.issues.length, 1);
  assert.match(report.issues[0]!, /seed names/);
});

test('verifier falls back to ok=false with diagnostic when response is unparseable', () => {
  const text = 'this is not JSON at all — just prose';
  const report = finalizeVerification(text, TASK_ID);
  assert.equal(report.ok, false);
  assert.equal(report.issues.length, 1);
  assert.match(report.issues[0]!, /unparseable/);
  assert.equal(report.task_id, TASK_ID);
});

test('verifier falls back to ok=false when schema validation fails', () => {
  const text = '```json\n{"ok": "yes", "issues": "none"}\n```';
  const report = finalizeVerification(text, TASK_ID);
  assert.equal(report.ok, false);
  assert.ok(report.issues.length > 0);
  assert.match(report.issues[0]!, /failed schema/);
});

test('verifier always stamps task_id into the report', () => {
  const text = '```json\n{"ok": true, "issues": []}\n```';
  const report = finalizeVerification(text, 'some-other-id');
  assert.equal(report.task_id, 'some-other-id');
});

test('VerifierReportSchema enforces ok ⇔ issues-empty invariant', () => {
  const badOk = VerifierReportSchema.safeParse({
    ok: true,
    issues: ['something'],
  });
  assert.equal(badOk.success, false, 'ok=true with non-empty issues must reject');

  const badNotOk = VerifierReportSchema.safeParse({
    ok: false,
    issues: [],
  });
  assert.equal(badNotOk.success, false, 'ok=false with empty issues must reject');

  const goodOk = VerifierReportSchema.safeParse({ ok: true, issues: [] });
  assert.equal(goodOk.success, true);

  const goodNotOk = VerifierReportSchema.safeParse({
    ok: false,
    issues: ['x'],
  });
  assert.equal(goodNotOk.success, true);
});
