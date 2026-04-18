import type { Seniority } from '@merged/db';

const LEVEL_LABEL: Record<Seniority, string> = {
  junior: 'Junior',
  middle: 'Middle',
  senior: 'Senior',
  architect: 'Architect',
};

const LEVEL_FOCUS: Record<Seniority, string> = {
  junior: 'Читабельність коду, базові тести, зрозумілий PR.',
  middle: 'Декомпозиція задачі, покриття тестами, обробка edge cases.',
  senior: 'Архітектурні рішення, trade-offs, відповідь на ревʼю.',
  architect: 'Межі системи, міграції, сумісність, доказ у коментарях до PR.',
};

export function renderAssignmentMarkdown(opts: {
  seniority: Seniority;
  shortId: string;
  portalUrl: string;
}): string {
  const level = LEVEL_LABEL[opts.seniority];
  const focus = LEVEL_FOCUS[opts.seniority];
  return `# Merged assessment · ${level}

**Assignment ID:** \`${opts.shortId}\`

## Що потрібно зробити

Це калібрована задача на цьому репозиторії. Ваша мета — відкрити pull request проти гілки \`main\` форку. Весь подальший прогрес (тести, оцінка) відбувається автоматично у нашому бекенді після відкриття PR.

### Рівень: ${level}
${focus}

## Правила

1. Працюйте в окремій гілці — прямі коміти в \`main\` заблоковані branch protection.
2. Інструменти — на ваш вибір: IDE, Cursor, Claude Code, Codex, cli. AI дозволений. Задача спроєктована так, що AI необхідний, але недостатній.
3. PR має бути відкритий проти \`main\` у цьому репозиторії (форк під \`imerged\`).
4. У description PR коротко поясніть ключові рішення. Рецензент/автооцінювач читає це першим.

## Локальна самоперевірка

У репозиторії є \`.merged/runner.sh\` — тонкий runner для локальних перевірок. Він запускає підмножину перевірок, які ви матимете у CI при відкритті PR. Повні тести залишаються у нашому бекенді.

\`\`\`bash
bash .merged/runner.sh
\`\`\`

## Оцінка

Після відкриття PR ви отримаєте автоматичний коментар з оцінкою по рубриці (тести, якість diff, гігієна комітів, відповідь на ревʼю). Фінальний вердикт — у порталі рекрутера.

Питання: ${opts.portalUrl}/assignments/${opts.shortId}
`;
}

export function renderRunnerScript(): string {
  return `#!/usr/bin/env bash
# Merged local runner — thin self-check. Full scoring happens server-side
# on PR open. This script exposes a safe subset only.

set -euo pipefail

echo "merged · local runner"
echo

if [ -f package.json ]; then
  echo "→ detected package.json"
  if command -v pnpm >/dev/null 2>&1 && [ -f pnpm-lock.yaml ]; then
    pnpm install --frozen-lockfile
    pnpm -s test || true
  elif command -v npm >/dev/null 2>&1; then
    npm ci
    npm test --silent || true
  fi
elif [ -f pyproject.toml ] || [ -f requirements.txt ]; then
  echo "→ detected python project"
  python -m pip install -r requirements.txt 2>/dev/null || true
  python -m pytest -q || true
elif [ -f go.mod ]; then
  echo "→ detected go module"
  go test ./... || true
else
  echo "→ no known project layout; skipping self-test"
fi

echo
echo "done. open a PR against main when ready — full checks run server-side."
`;
}
