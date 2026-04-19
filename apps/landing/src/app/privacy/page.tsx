import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Приватність',
  description:
    'merged збирає мінімум даних, необхідних для скринінгу. Сервер у ЄС (AWS eu-central-1). Запит на видалення даних — request@merged.com.ua.',
  alternates: { canonical: '/privacy' },
};

export default function Privacy() {
  return (
    <article className="mx-auto max-w-3xl px-6 py-24 prose prose-neutral">
      <h1>Політика приватності</h1>
      <p>
        merged збирає мінімум даних, необхідних для роботи сервісу: email, імʼя,
        компанія, а під час проходження задачі — метадані PR-а кандидата. Ми не
        передаємо персональні дані третім сторонам. Сервер знаходиться в ЄС
        (Франкфурт, AWS eu-central-1).
      </p>
      <p>
        Запит на видалення даних — <a href="mailto:request@merged.com.ua">request@merged.com.ua</a>.
      </p>
    </article>
  );
}
