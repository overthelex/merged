import { NewAssignmentForm } from './NewAssignmentForm';

export const dynamic = 'force-dynamic';

export default function NewAssignmentPage() {
  return (
    <div>
      <h1 className="font-display text-2xl font-semibold tracking-tight text-ink mb-2">
        Нова задача
      </h1>
      <p className="text-ink-muted text-sm mb-8 max-w-xl">
        Вкажіть репозиторій компанії, яку ви представляєте, і рівень позиції. Ми створимо форк під organization{' '}
        <span className="font-mono">imerged</span> (приватний, якщо вихідне репо приватне) і видамо посилання для кандидата.
      </p>
      <div className="max-w-2xl">
        <NewAssignmentForm />
      </div>
    </div>
  );
}
