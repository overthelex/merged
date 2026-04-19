import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Умови',
  description:
    'Умови використання merged. Закрита бета, сервіс «як є», оплата не стягується. Замовник відповідає за згоду кандидата на обробку даних.',
  alternates: { canonical: '/terms' },
};

export default function Terms() {
  return (
    <article className="mx-auto w-full max-w-3xl px-6 py-16 sm:py-24 prose prose-neutral break-words">
      <h1>Умови використання</h1>
      <p>
        Закрита бета. Сервіс надається «як є». Під час бета-періоду оплата не
        стягується. Замовник відповідає за юридичну коректність процесу найму на
        своєму боці (наявність згоди кандидата на обробку даних, відсутність
        дискримінації тощо).
      </p>
    </article>
  );
}
