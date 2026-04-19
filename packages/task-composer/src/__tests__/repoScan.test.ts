import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { partitionFiles, scanRepo } from '../repoScan';
import type { RepoFile } from '../types';

function fakeFile(path: string, size: number): RepoFile {
  return { path, size, content: 'x'.repeat(Math.min(size, 100)) };
}

test('partitionFiles returns one chunk for a small repo', () => {
  const files = Array.from({ length: 50 }, (_, i) => fakeFile(`f${i}.ts`, 1_000));
  const chunks = partitionFiles(files, 10);
  assert.equal(chunks.length, 1);
  assert.equal(chunks[0]!.length, 50);
});

test('partitionFiles scales workers with file count, capped at maxWorkers', () => {
  const files = Array.from({ length: 5_000 }, (_, i) => fakeFile(`f${i}.ts`, 1_000));
  const chunks = partitionFiles(files, 10);
  assert.equal(chunks.length, 10);
  const total = chunks.reduce((a, c) => a + c.length, 0);
  assert.equal(total, 5_000);
});

test('partitionFiles balances chunk sizes', () => {
  const files = [
    fakeFile('big.ts', 100_000),
    ...Array.from({ length: 9 }, (_, i) => fakeFile(`s${i}.ts`, 10_000)),
  ];
  const chunks = partitionFiles(files, 10);
  const sizes = chunks.map((c) => c.reduce((a, f) => a + f.size, 0));
  const max = Math.max(...sizes);
  const min = Math.min(...sizes);
  // Greedy packer: the 100k chunk will dominate, but no chunk should be empty
  // once we have >= workers files.
  assert.ok(min > 0, `min chunk size was ${min}`);
  assert.ok(max <= 100_000, `max chunk size was ${max}`);
});

test('partitionFiles handles empty input', () => {
  assert.deepEqual(partitionFiles([], 10), []);
});

test('scanRepo skips node_modules and lockfiles', async () => {
  const root = await mkdtemp(join(tmpdir(), 'task-composer-scan-'));
  await writeFile(join(root, 'index.ts'), 'export const x = 1;\n');
  await writeFile(join(root, 'pnpm-lock.yaml'), 'lockfile-version: 6\n');
  await mkdir(join(root, 'node_modules', 'lodash'), { recursive: true });
  await writeFile(join(root, 'node_modules', 'lodash', 'index.js'), 'module.exports = {};\n');
  await mkdir(join(root, 'src'));
  await writeFile(join(root, 'src', 'a.py'), 'def f(): return 1\n');

  const { files, meta } = await scanRepo(root);
  const paths = files.map((f) => f.path).sort();
  assert.deepEqual(paths, ['index.ts', join('src', 'a.py')]);
  assert.equal(meta.fileCount, 2);
  assert.ok(meta.languages.includes('typescript'));
  assert.ok(meta.languages.includes('python'));
});
