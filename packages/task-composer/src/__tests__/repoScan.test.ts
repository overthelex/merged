import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, symlink } from 'node:fs/promises';
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

test('partitionFiles handles empty input', () => {
  assert.deepEqual(partitionFiles([], 10), []);
});

test('partitionFiles coerces NaN sizes to 0 for balancing', () => {
  const files: RepoFile[] = [
    { path: 'nan.ts', size: NaN, content: 'x' },
    ...Array.from({ length: 9 }, (_, i) => fakeFile(`f${i}.ts`, 1000)),
  ];
  const chunks = partitionFiles(files, 10);
  assert.equal(chunks.length, 1);
  assert.equal(chunks[0]!.length, 10);
});

test('scanRepo skips node_modules, lockfiles, and hidden dirs', async () => {
  const root = await mkdtemp(join(tmpdir(), 'task-composer-scan-'));
  await writeFile(join(root, 'index.ts'), 'export const x = 1;\n');
  await writeFile(join(root, 'pnpm-lock.yaml'), 'lockfile-version: 6\n');
  await mkdir(join(root, 'node_modules', 'lodash'), { recursive: true });
  await writeFile(join(root, 'node_modules', 'lodash', 'index.js'), 'module.exports = {};\n');
  await mkdir(join(root, '.git'));
  await writeFile(join(root, '.git', 'HEAD'), 'ref: refs/heads/main\n');
  await mkdir(join(root, 'src'));
  await writeFile(join(root, 'src', 'a.py'), 'def f(): return 1\n');

  const { files, meta } = await scanRepo(root);
  const paths = files.map((f) => f.path).sort();
  assert.deepEqual(paths, ['index.ts', join('src', 'a.py')]);
  assert.equal(meta.fileCount, 2);
  assert.ok(meta.languages.includes('typescript'));
  assert.ok(meta.languages.includes('python'));
});

test('scanRepo allows specific dotfiles (.eslintrc.json, .gitignore)', async () => {
  const root = await mkdtemp(join(tmpdir(), 'task-composer-scan-'));
  await writeFile(join(root, '.eslintrc.json'), '{"root":true}\n');
  await writeFile(join(root, '.gitignore'), 'node_modules\n');
  await writeFile(join(root, '.secret'), 'password=1234\n');
  await writeFile(join(root, 'index.ts'), 'export {};\n');

  const { files } = await scanRepo(root);
  const paths = files.map((f) => f.path).sort();
  assert.ok(paths.includes('.eslintrc.json'));
  assert.ok(!paths.includes('.secret'), 'unknown dotfiles must be skipped');
  assert.ok(paths.includes('index.ts'));
});

test('scanRepo does not follow symlinks (security)', async () => {
  const root = await mkdtemp(join(tmpdir(), 'task-composer-scan-'));
  await writeFile(join(root, 'real.ts'), 'export const r = 1;\n');
  try {
    await symlink('/etc/passwd', join(root, 'evil.ts'));
  } catch {
    return; // sandboxes that forbid symlink creation
  }
  const { files } = await scanRepo(root);
  const paths = files.map((f) => f.path);
  assert.ok(paths.includes('real.ts'));
  assert.ok(!paths.includes('evil.ts'), 'symlink must not be scanned');
});

test('scanRepo treats null-byte files as binary and skips them', async () => {
  const root = await mkdtemp(join(tmpdir(), 'task-composer-scan-'));
  const binary = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0, 0, 0, 0, 0, 0, 0]);
  await writeFile(join(root, 'image.ts'), binary);
  await writeFile(join(root, 'real.ts'), 'export {};\n');
  const { files } = await scanRepo(root);
  const paths = files.map((f) => f.path);
  assert.ok(!paths.includes('image.ts'), 'binary file must be skipped');
  assert.ok(paths.includes('real.ts'));
});

test('scanRepo masks tempdir basenames unless repoName is provided', async () => {
  const root = await mkdtemp(join(tmpdir(), 'merged-compose-'));
  await writeFile(join(root, 'a.ts'), 'export {};\n');

  const implicit = await scanRepo(root);
  assert.equal(implicit.meta.name, 'repo', 'tempdir basename must be masked');

  const explicit = await scanRepo(root, { repoName: 'acme/backend' });
  assert.equal(explicit.meta.name, 'acme/backend');
});

test('scanRepo truncates long files without splitting UTF-8 sequences', async () => {
  const root = await mkdtemp(join(tmpdir(), 'task-composer-scan-'));
  const long = 'Привіт'.repeat(2000); // 12_000 codepoints
  await writeFile(join(root, 'big.ts'), long);
  const { files } = await scanRepo(root);
  const f = files.find((x) => x.path === 'big.ts');
  assert.ok(f, 'big.ts must be included');
  assert.equal(f!.content.includes('\uFFFD'), false);
  assert.ok(f!.content.includes('[truncated'));
});
