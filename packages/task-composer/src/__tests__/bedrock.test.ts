import { test } from 'node:test';
import assert from 'node:assert/strict';
import { extractFenced, extractJson } from '../bedrock';

test('extractJson parses raw JSON', () => {
  const v = extractJson<{ a: number }>('{"a":1}');
  assert.deepEqual(v, { a: 1 });
});

test('extractJson prefers ```json fenced block even when other fences come first', () => {
  const text = [
    'Preamble',
    '```markdown',
    '# Not JSON',
    '```',
    '',
    '```json',
    '{"a":2}',
    '```',
  ].join('\n');
  const v = extractJson<{ a: number }>(text);
  assert.deepEqual(v, { a: 2 });
});

test('extractJson falls back to first parseable fenced block', () => {
  const text = ['```', '{"a":3}', '```'].join('\n');
  const v = extractJson<{ a: number }>(text);
  assert.deepEqual(v, { a: 3 });
});

test('extractJson handles case-insensitive JSON tag', () => {
  const v = extractJson<{ a: number }>('```JSON\n{"a":4}\n```');
  assert.deepEqual(v, { a: 4 });
});

test('extractJson falls back to balanced-brace scan', () => {
  const text = 'Here is the result: {"a": 5, "b": [1, "{"]} trailing text';
  const v = extractJson<{ a: number; b: (number | string)[] }>(text);
  assert.deepEqual(v, { a: 5, b: [1, '{'] });
});

test('extractJson throws descriptive error on garbage', () => {
  assert.throws(
    () => extractJson('this is not json at all no braces'),
    /non-JSON/,
  );
});

test('extractFenced supports yaml/yml aliases', () => {
  const y1 = extractFenced('```yaml\nkey: value\n```', 'yaml');
  const y2 = extractFenced('```yml\nkey: value\n```', 'yaml');
  assert.equal(y1, 'key: value');
  assert.equal(y2, 'key: value');
});

test('extractFenced supports markdown/md aliases', () => {
  const m1 = extractFenced('```markdown\n# Hi\n```', 'markdown');
  const m2 = extractFenced('```md\n# Hi\n```', 'markdown');
  assert.equal(m1, '# Hi');
  assert.equal(m2, '# Hi');
});

test('extractFenced throws if block is missing', () => {
  assert.throws(() => extractFenced('no fences here', 'yaml'), /no ```yaml block/);
});

test('extractFenced is case-insensitive on tag', () => {
  const v = extractFenced('```YAML\nkey: 1\n```', 'yaml');
  assert.equal(v, 'key: 1');
});

test('extractFenced returns first of multiple blocks', () => {
  const text = '```yaml\nfirst: 1\n```\n```yaml\nsecond: 2\n```';
  const v = extractFenced(text, 'yaml');
  assert.equal(v, 'first: 1');
});
