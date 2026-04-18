export function ForWhom() {
  return (
    <section className="border-b border-ink/10 bg-paper">
      <div className="mx-auto max-w-6xl px-6 py-24 sm:py-32">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-ink/60">Для кого</p>
        <h2 className="mt-4 font-display text-4xl sm:text-5xl font-semibold leading-tight max-w-3xl">
          Рекрутер — користувач. Hiring&nbsp;manager — платник.
        </h2>

        <div className="mt-14 grid gap-6 md:grid-cols-2">
          <Card
            role="IT-рекрутери"
            lines={[
              'Перестаєш просити сеньйорів «подивитися тестове» за келих кави.',
              'Маєш обʼєктивний звіт для hiring manager-а до зустрічі з кандидатом.',
              'Відсіюєш неадекватних ще до першого дзвінка.',
            ]}
          />
          <Card
            role="Інженерні керівники"
            emphasized
            lines={[
              'Команда не витрачає 40 годин на місяць на скринінг-дзвінки.',
              'Рішення на фінальній зустрічі — про людину, а не про її технічні базові знання.',
              'Видно, як кандидат думає, а не тільки що він написав.',
            ]}
          />
        </div>
      </div>
    </section>
  );
}

function Card({
  role,
  lines,
  emphasized,
}: {
  role: string;
  lines: string[];
  emphasized?: boolean;
}) {
  return (
    <article
      className={
        emphasized
          ? 'rounded-2xl border border-ink bg-ink text-paper p-10 shadow-xl'
          : 'rounded-2xl border border-ink/10 bg-white p-10'
      }
    >
      <h3
        className={`font-display text-3xl font-semibold ${
          emphasized ? 'text-accent' : 'text-ink'
        }`}
      >
        {role}
      </h3>
      <ul className="mt-8 space-y-5">
        {lines.map((l) => (
          <li key={l} className="flex gap-3 text-lg leading-relaxed">
            <span
              className={
                emphasized ? 'mt-2 h-1.5 w-1.5 rounded-full bg-accent shrink-0' : 'mt-2 h-1.5 w-1.5 rounded-full bg-ink shrink-0'
              }
            />
            <span className={emphasized ? 'text-paper/85' : 'text-ink/80'}>{l}</span>
          </li>
        ))}
      </ul>
    </article>
  );
}
