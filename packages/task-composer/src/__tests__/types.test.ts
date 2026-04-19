import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  CalibratorVerdictSchema,
  LlmCoherenceSchema,
  RepoFileSchema,
  RepoMetaSchema,
  SurfaceSchema,
} from '../types';

test('SurfaceSchema rejects non-enum kind', () => {
  const r = SurfaceSchema.safeParse({
    kind: 'invented_kind',
    path: 'src/a.ts',
    title: 'x',
    summary: 'a'.repeat(40),
    estimated_effort_min: 30,
    fit_levels: ['middle'],
    score: 50,
  });
  assert.equal(r.success, false);
});

test('SurfaceSchema accepts new kinds (api_design, concurrency)', () => {
  const r = SurfaceSchema.safeParse({
    kind: 'api_design',
    path: 'src/a.ts',
    title: 'redesign REST',
    summary: 'a'.repeat(40),
    estimated_effort_min: 120,
    fit_levels: ['senior'],
    score: 80,
  });
  assert.equal(r.success, true);
});

test('CalibratorVerdictSchema enforces ok ⇔ no issues', () => {
  const contradict = CalibratorVerdictSchema.safeParse({
    ok: true,
    schema_errors: [],
    coherence_notes: ['but actually there is a problem'],
  });
  assert.equal(contradict.success, false);

  const silent = CalibratorVerdictSchema.safeParse({
    ok: false,
    schema_errors: [],
    coherence_notes: [],
  });
  assert.equal(silent.success, false);

  const clean = CalibratorVerdictSchema.safeParse({
    ok: true,
    schema_errors: [],
    coherence_notes: [],
  });
  assert.equal(clean.success, true);

  const withNotes = CalibratorVerdictSchema.safeParse({
    ok: false,
    schema_errors: ['rubric: sum to 100'],
    coherence_notes: [],
  });
  assert.equal(withNotes.success, true);
});

test('LlmCoherenceSchema accepts {ok, coherence_notes} only', () => {
  const r = LlmCoherenceSchema.safeParse({ ok: true, coherence_notes: [] });
  assert.equal(r.success, true);

  const missing = LlmCoherenceSchema.safeParse({ ok: true });
  assert.equal(missing.success, false);
});

test('RepoFileSchema caps content length', () => {
  const huge = RepoFileSchema.safeParse({
    path: 'a.ts',
    size: 1,
    content: 'x'.repeat(20_000),
  });
  assert.equal(huge.success, false);
});

test('RepoMetaSchema rejects weird characters in name', () => {
  const bad = RepoMetaSchema.safeParse({
    name: '<script>alert(1)</script>',
    languages: [],
    fileCount: 0,
    totalSize: 0,
  });
  assert.equal(bad.success, false);

  const ok = RepoMetaSchema.safeParse({
    name: 'acme/backend',
    languages: ['typescript'],
    fileCount: 10,
    totalSize: 1000,
  });
  assert.equal(ok.success, true);
});
