import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { composeTask } from '../pipeline';
import { installFakeBedrock, validComposerResponse, validYaml } from './bedrockMock';

const REGION = 'eu-central-1';

async function makeTinyRepo(): Promise<string> {
  const root = await mkdtemp(join(tmpdir(), 'pipeline-test-'));
  await mkdir(join(root, 'src'));
  await writeFile(
    join(root, 'src', 'router.ts'),
    'export function route(req: unknown) { return req; }\n',
  );
  await writeFile(
    join(root, 'src', 'queue.ts'),
    'export async function enqueue(item: unknown) { return item; }\n',
  );
  await writeFile(
    join(root, 'package.json'),
    JSON.stringify({ name: 'acme', version: '1.0.0' }, null, 2) + '\n',
  );
  return root;
}

function scoutResponse(paths: string[]): string {
  return JSON.stringify({
    surfaces: paths.map((p, i) => ({
      kind: 'feature_gap',
      path: p,
      title: `Add X in ${p}`,
      summary: 'A small, testable improvement that a middle-level dev can finish in one sitting.',
      estimated_effort_min: 60,
      fit_levels: ['middle'],
      score: 90 - i,
    })),
    notes: 'one-worker slice',
  });
}

function coherenceOk(): string {
  return '```json\n{"ok": true, "coherence_notes": []}\n```';
}

function coherenceReject(notes: string[]): string {
  return JSON.stringify({ ok: false, coherence_notes: notes });
}

function verifierOk(): string {
  return '```json\n{"ok": true, "issues": []}\n```';
}

function verifierReject(issues: string[]): string {
  return JSON.stringify({ ok: false, issues });
}

test('pipeline: scout → compose → calibrate → verify happy path (single iteration)', async () => {
  const repo = await makeTinyRepo();
  const fake = installFakeBedrock({
    region: REGION,
    responder: (req, idx) => {
      // 0: scout worker, 1: composer, 2: calibrator, 3: verifier
      if (idx === 0) return scoutResponse(['src/router.ts', 'src/queue.ts']);
      if (idx === 1) return validComposerResponse();
      if (idx === 2) return coherenceOk();
      if (idx === 3) return verifierOk();
      throw new Error(`unexpected call ${idx}: ${req.prompt.slice(0, 40)}`);
    },
  });
  try {
    const result = await composeTask({
      repoPath: repo,
      level: 'middle',
      scan: { repoName: 'acme/api' },
    });
    assert.equal(result.verdicts.length, 1);
    assert.equal(result.verdicts[0]!.ok, true);
    assert.equal(result.verifications.length, 1);
    assert.equal(result.verifications[0]!.ok, true);
    assert.equal(result.spec.level, 'middle');
    assert.equal(result.spec.id, 'sample-task');
    assert.equal(fake.calls.length, 4, 'scout + composer + calibrator + verifier');
  } finally {
    fake.uninstall();
  }
});

test('pipeline: calibrator rejects first draft → composer revises → accept on round 2', async () => {
  const repo = await makeTinyRepo();
  const rejectionNotes = [
    'time_limit_min=60 does not match scope',
    'seeds are cosmetic renames',
  ];
  const fake = installFakeBedrock({
    region: REGION,
    responder: (_req, idx) => {
      if (idx === 0) return scoutResponse(['src/router.ts', 'src/queue.ts']);
      if (idx === 1) return validComposerResponse(); // draft 1
      if (idx === 2) return coherenceReject(rejectionNotes); // calibrator reject
      if (idx === 3) return validComposerResponse(); // draft 2 (revised)
      if (idx === 4) return coherenceOk(); // calibrator accept
      if (idx === 5) return verifierOk(); // verifier accept
      throw new Error(`unexpected call ${idx}`);
    },
  });
  try {
    const result = await composeTask({
      repoPath: repo,
      level: 'middle',
      scan: { repoName: 'acme/api' },
    });
    assert.equal(result.verdicts.length, 2, 'two calibrator rounds recorded');
    assert.equal(result.verdicts[0]!.ok, false);
    assert.equal(result.verdicts[1]!.ok, true);
    assert.equal(result.verifications.length, 1, 'verifier only ran after calibrator approved');
    assert.equal(result.verifications[0]!.ok, true);

    // Revision notes must have been fed into the second composer call.
    const secondComposerCall = fake.calls[3]!;
    assert.match(secondComposerCall.prompt, /Revision required/);
    assert.match(secondComposerCall.prompt, /time_limit_min=60 does not match scope/);
    assert.equal(
      secondComposerCall.temperature,
      0.1,
      'revision composer run must use temperature 0.1',
    );
  } finally {
    fake.uninstall();
  }
});

test('pipeline: verifier rejects → composer revises from verifier issues → accept', async () => {
  const repo = await makeTinyRepo();
  const fake = installFakeBedrock({
    region: REGION,
    responder: (_req, idx) => {
      if (idx === 0) return scoutResponse(['src/router.ts', 'src/queue.ts']);
      if (idx === 1) return validComposerResponse(); // draft 1
      if (idx === 2) return coherenceOk(); // calibrator ok
      if (idx === 3)
        return verifierReject([
          'ASSIGNMENT.md never explains how to run the test suite',
          'seeds in task.yaml do not match the three approaches in description_md',
        ]); // verifier reject
      if (idx === 4) return validComposerResponse(); // draft 2
      if (idx === 5) return coherenceOk(); // calibrator ok
      if (idx === 6) return verifierOk(); // verifier ok
      throw new Error(`unexpected call ${idx}`);
    },
  });
  try {
    const result = await composeTask({
      repoPath: repo,
      level: 'middle',
      scan: { repoName: 'acme/api' },
    });
    assert.equal(result.verdicts.length, 2);
    assert.equal(result.verifications.length, 2);
    assert.equal(result.verifications[0]!.ok, false);
    assert.equal(result.verifications[1]!.ok, true);

    // Revision prompt on round 2 must include verifier issues (not calibrator notes).
    const secondComposerCall = fake.calls[4]!;
    assert.match(secondComposerCall.prompt, /ASSIGNMENT\.md never explains/);
    assert.match(secondComposerCall.prompt, /seeds in task\.yaml/);
  } finally {
    fake.uninstall();
  }
});

test('pipeline: gives up after maxIterations and throws with latest notes in the error', async () => {
  const repo = await makeTinyRepo();
  const fake = installFakeBedrock({
    region: REGION,
    responder: (_req, idx) => {
      if (idx === 0) return scoutResponse(['src/router.ts', 'src/queue.ts']);
      // All composer drafts accepted by schema; all calibrator rounds reject.
      if (idx % 2 === 1) return validComposerResponse();
      return coherenceReject([`round ${idx} rejection`]);
    },
  });
  try {
    await assert.rejects(
      () =>
        composeTask({
          repoPath: repo,
          level: 'middle',
          scan: { repoName: 'acme/api' },
          maxIterations: 2,
        }),
      /pipeline failed after 2 iterations.*rejection/s,
    );
  } finally {
    fake.uninstall();
  }
});

test('pipeline: maxRevisions alias maps to maxIterations = maxRevisions + 1', async () => {
  const repo = await makeTinyRepo();
  const fake = installFakeBedrock({
    region: REGION,
    responder: (_req, idx) => {
      if (idx === 0) return scoutResponse(['src/router.ts', 'src/queue.ts']);
      if (idx % 2 === 1) return validComposerResponse();
      return coherenceReject([`round ${idx} rejection`]);
    },
  });
  try {
    await assert.rejects(
      () =>
        composeTask({
          repoPath: repo,
          level: 'middle',
          scan: { repoName: 'acme/api' },
          maxRevisions: 1, // ⇒ maxIterations = 2
        }),
      /pipeline failed after 2 iterations/,
    );
  } finally {
    fake.uninstall();
  }
});

test('pipeline: scout-level mismatch leaves composer picking from unfiltered surfaces', async () => {
  const repo = await makeTinyRepo();
  const fake = installFakeBedrock({
    region: REGION,
    responder: (_req, idx) => {
      if (idx === 0)
        // Scout reports only 'junior' fits — no 'middle' — but runScout's
        // fallback lets surfaces through if level-filtered set is empty.
        return JSON.stringify({
          surfaces: [
            {
              kind: 'docs',
              path: 'src/router.ts',
              title: 'Document route()',
              summary: 'Add JSDoc to the route() helper so new hires can onboard faster.',
              estimated_effort_min: 30,
              fit_levels: ['junior'],
              score: 60,
            },
          ],
          notes: 'only junior surfaces found',
        });
      if (idx === 1) return validComposerResponse();
      if (idx === 2) return coherenceOk();
      if (idx === 3) return verifierOk();
      throw new Error(`unexpected call ${idx}`);
    },
  });
  try {
    const result = await composeTask({
      repoPath: repo,
      level: 'middle',
      scan: { repoName: 'acme/api' },
    });
    assert.equal(result.surfaces.length, 1);
    assert.equal(result.spec.id, 'sample-task');
  } finally {
    fake.uninstall();
  }
});

test('pipeline: yaml with wrong level causes schema-stage rejection, composer revises with hint', async () => {
  const repo = await makeTinyRepo();
  const fake = installFakeBedrock({
    region: REGION,
    responder: (_req, idx) => {
      if (idx === 0) return scoutResponse(['src/router.ts']);
      // First draft emits level=junior even though target is middle. The
      // calibrator's schema stage rejects this WITHOUT calling Bedrock — so
      // the next Bedrock call we see is the revision composer run.
      if (idx === 1) return validComposerResponse(validYaml('junior'));
      if (idx === 2) return validComposerResponse(validYaml('middle'));
      if (idx === 3) return coherenceOk();
      if (idx === 4) return verifierOk();
      throw new Error(`unexpected call ${idx}`);
    },
  });
  try {
    const result = await composeTask({
      repoPath: repo,
      level: 'middle',
      scan: { repoName: 'acme/api' },
    });
    assert.equal(result.verdicts.length, 2);
    assert.equal(result.verdicts[0]!.ok, false, 'schema rejected first draft');
    assert.ok(
      result.verdicts[0]!.schema_errors.some((e) => /level/.test(e)),
      'schema error should mention level mismatch',
    );
    assert.equal(result.verdicts[1]!.ok, true);
    assert.equal(result.spec.level, 'middle');
  } finally {
    fake.uninstall();
  }
});
