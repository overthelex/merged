import { test } from 'node:test';
import assert from 'node:assert/strict';
import { runComposer } from '../composer';
import { installFakeBedrock, validComposerResponse, validYaml } from './bedrockMock';
import type { RepoMeta, Surface } from '../types';

const REGION = 'eu-central-1';

const META: RepoMeta = {
  name: 'acme/api',
  languages: ['typescript'],
  fileCount: 42,
  totalSize: 100_000,
};

const SURFACES: Surface[] = [
  {
    kind: 'missing_tests',
    path: 'src/router.ts',
    title: 'Add /healthz endpoint',
    summary:
      'The router has no healthcheck endpoint. A /healthz would be a small, testable change.',
    estimated_effort_min: 60,
    fit_levels: ['middle'],
    score: 85,
  },
  {
    kind: 'bug',
    path: 'src/queue.ts',
    title: 'Backoff resets too early',
    summary: 'Retry loop resets backoff inside inner catch — infinite retry storm on 500s.',
    estimated_effort_min: 90,
    fit_levels: ['middle', 'senior'],
    score: 80,
  },
];

test('composer parses yaml/markdown/notes from Bedrock response (happy path)', async () => {
  const fake = installFakeBedrock({
    region: REGION,
    responder: () => validComposerResponse(),
  });
  try {
    const draft = await runComposer({ surfaces: SURFACES, level: 'middle', meta: META });
    assert.match(draft.task_yaml, /version:\s*1/);
    assert.match(draft.task_yaml, /rubric:/);
    assert.match(draft.assignment_md, /Завдання/);
    assert.ok(draft.design_notes, 'design_notes should be present when `notes` fence was emitted');
    assert.equal(fake.calls.length, 1);
    assert.equal(fake.calls[0]!.temperature, 0.3, 'first draft uses exploratory temperature 0.3');
  } finally {
    fake.uninstall();
  }
});

test('composer drops temperature to 0.1 and injects revision notes on retry', async () => {
  const fake = installFakeBedrock({
    region: REGION,
    responder: () => validComposerResponse(),
  });
  try {
    await runComposer({
      surfaces: SURFACES,
      level: 'middle',
      meta: META,
      revisionNotes: [
        'time_limit_min is too low for the scope',
        'rubric weights do not reward rationale enough',
      ],
    });
    const call = fake.calls[0]!;
    assert.equal(call.temperature, 0.1, 'revision runs must use temperature 0.1');
    assert.match(call.prompt, /Revision required/);
    assert.match(call.prompt, /time_limit_min is too low/);
    assert.match(call.prompt, /rubric weights do not reward rationale/);
  } finally {
    fake.uninstall();
  }
});

test('composer adds the architect calibration block only when hint is architect', async () => {
  const fake = installFakeBedrock({
    region: REGION,
    responder: () => validComposerResponse(validYaml('senior')),
  });
  try {
    await runComposer({
      surfaces: SURFACES,
      level: 'senior',
      meta: META,
      calibrationHint: 'architect',
    });
    assert.match(fake.calls[0]!.prompt, /architect-level/);
    assert.match(fake.calls[0]!.prompt, /180[–\-]480/);
  } finally {
    fake.uninstall();
  }
});

test('composer throws when Bedrock response is missing required version/rubric in yaml', async () => {
  const fake = installFakeBedrock({
    region: REGION,
    responder: () =>
      [
        '```yaml',
        'id: broken-task',
        'title: Not a real spec',
        '```',
        '```markdown',
        '# Hi',
        '```',
      ].join('\n'),
  });
  try {
    await assert.rejects(
      () => runComposer({ surfaces: SURFACES, level: 'middle', meta: META }),
      /missing version\/rubric/,
    );
  } finally {
    fake.uninstall();
  }
});

test('composer throws on missing markdown fence', async () => {
  const fake = installFakeBedrock({
    region: REGION,
    responder: () =>
      [
        '```yaml',
        validYaml(),
        '```',
        'No markdown fence here, composer must fail the sanity check.',
      ].join('\n'),
  });
  try {
    await assert.rejects(
      () => runComposer({ surfaces: SURFACES, level: 'middle', meta: META }),
      /no ```markdown block/,
    );
  } finally {
    fake.uninstall();
  }
});

test('composer tolerates missing optional `notes` fence', async () => {
  const fake = installFakeBedrock({
    region: REGION,
    responder: () =>
      [
        '```yaml',
        validYaml(),
        '```',
        '```markdown',
        [
          '# Завдання',
          '',
          'Відгалузіть гілку від `main`, реалізуйте фічу, відкрийте PR з обґрунтуванням,',
          'і переконайтеся, що CI зелений. AI інструменти дозволено, але PR опис важливий.',
        ].join('\n'),
        '```',
      ].join('\n'),
  });
  try {
    const draft = await runComposer({ surfaces: SURFACES, level: 'middle', meta: META });
    assert.equal(draft.design_notes, undefined);
  } finally {
    fake.uninstall();
  }
});
