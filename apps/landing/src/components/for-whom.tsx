type Metric = { value: string; label: string };

const RECRUITER_METRICS: Metric[] = [
  { value: '0', label: 'дзвінків до першого сигналу' },
  { value: '~2 хв', label: 'на отримання звіту' },
];

const MANAGER_METRICS: Metric[] = [
  { value: '40+ год', label: 'повертається команді щомісяця' },
  { value: '1', label: 'зустріч замість 4–6 раундів' },
];

export function ForWhom() {
  return (
    <section className="border-b border-ink/8">
      <div className="section-inner py-24 sm:py-32">
        <p className="label-mono text-ink/50">Для кого</p>
        <h2 className="mt-5 font-display text-4xl sm:text-5xl font-semibold leading-[1.08] tracking-tight max-w-2xl">
          Рекрутер — користувач. Hiring&nbsp;manager — платник.
        </h2>
        <p className="mt-5 max-w-xl text-[1.0625rem] text-ink/60 leading-[1.75]">
          Кожна роль отримує своє: рекрутер — незалежність від сеньйорів,
          менеджер — час команди і якісніший фінальний відбір.
        </p>

        <div className="mt-14 grid gap-5 md:grid-cols-2">
          <PersonaCard
            role="IT-рекрутери"
            metrics={RECRUITER_METRICS}
            lines={[
              'Перестаєш просити сеньйорів «подивитися тестове» за келих кави.',
              'Маєш обʼєктивний звіт для hiring manager-а ще до першого дзвінка.',
              'Відсіюєш кандидатів, які не вміють читати документацію і писати тести.',
            ]}
          />
          <PersonaCard
            role="Інженерні керівники"
            metrics={MANAGER_METRICS}
            lines={[
              'Команда не витрачає 40 годин на місяць на скринінг-дзвінки.',
              'Рішення на фінальній зустрічі — про людину, а не про технічні базові знання.',
              'Видно, як кандидат думає і обґрунтовує рішення, а не тільки що написав.',
            ]}
            dark
          />
        </div>
      </div>
    </section>
  );
}

function PersonaCard({
  role,
  metrics,
  lines,
  dark,
}: {
  role: string;
  metrics: Metric[];
  lines: string[];
  dark?: boolean;
}) {
  return (
    <article
      className={
        dark
          ? 'rounded-2xl border border-ink bg-ink text-paper shadow-card-lg flex flex-col overflow-hidden'
          : 'rounded-2xl border border-ink/8 bg-surface text-ink shadow-card flex flex-col overflow-hidden'
      }
    >
      {/* Role header */}
      <div className={`px-5 pt-6 pb-5 sm:px-8 sm:pt-8 sm:pb-6 border-b ${dark ? 'border-white/8' : 'border-ink/6'}`}>
        <h3
          className={`font-display text-2xl font-semibold ${
            dark ? 'text-accent' : 'text-ink'
          }`}
        >
          {role}
        </h3>

        {/* Metrics row */}
        <div className="mt-5 grid grid-cols-2 gap-4">
          {metrics.map((m) => (
            <div key={m.label}>
              <div
                className={`tabular font-display text-2xl font-semibold leading-none ${
                  dark ? 'text-paper' : 'text-ink'
                }`}
              >
                {m.value}
              </div>
              <div
                className={`mt-1.5 label-mono ${dark ? 'text-paper/45' : 'text-ink/45'}`}
              >
                {m.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Benefits list */}
      <ul className="px-5 py-5 sm:px-8 sm:py-6 space-y-4 flex-1">
        {lines.map((l) => (
          <li key={l} className="flex items-start gap-3">
            <span
              className={`mt-[0.35rem] h-1.5 w-1.5 rounded-full shrink-0 ${
                dark ? 'bg-accent' : 'bg-ink/30'
              }`}
              aria-hidden
            />
            <span
              className={`text-[0.9375rem] leading-relaxed ${
                dark ? 'text-paper/75' : 'text-ink/70'
              }`}
            >
              {l}
            </span>
          </li>
        ))}
      </ul>
    </article>
  );
}
