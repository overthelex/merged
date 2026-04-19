# Changesets

This directory holds **changesets** — one Markdown file per change that needs a
version bump in one or more workspace packages under `packages/*`.

## Who uses this

Only the reusable libraries are versioned per-package:

- `@merged/task-composer`
- `@merged/task-spec`
- `@merged/judge`
- `@merged/github-app`
- `@merged/db`
- `@merged/email`

Apps (`@merged/portal`, `@merged/landing`) are deployed as Docker images and
version via the root `package.json` bump driven by `.github/workflows/release.yml`.
They are declared in `.changeset/config.json → ignore`, so changesets do not
touch them.

## Adding a changeset

After you make a change in one or more library packages:

```bash
pnpm changeset
```

Pick the packages that changed, pick the bump type (`patch` / `minor` /
`major`), write one sentence summarising the change. This creates
`.changeset/<random>.md`. Commit it alongside your code.

Changes that only touch `apps/*` don't need a changeset.

## What happens on merge

When your PR lands on `main`, the `release-packages` workflow collects all
pending `.changeset/*.md` files and opens a single **"chore: release
packages"** PR that bumps versions in the affected `packages/*/package.json`,
updates internal `workspace:*` dependents, and regenerates per-package
`CHANGELOG.md` entries.

Merging that release PR creates one git tag per bumped package
(e.g. `@merged/task-composer@0.2.0`) and a GitHub Release per tag.

## Bump type guide

- **patch** — bug fix, dependency bump, internal refactor with no API change
- **minor** — new feature, new public export, backwards-compatible change
- **major** — breaking change to a public export or behaviour

When in doubt for internal-only workspaces, `patch` is fine — we're not
publishing to npm.
