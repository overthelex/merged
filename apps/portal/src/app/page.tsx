import { auth, signOut } from '@/auth';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const session = await auth();
  const user = session?.user;

  return (
    <main
      style={{
        minHeight: '100vh',
        padding: '3rem 1.5rem',
        maxWidth: '48rem',
        margin: '0 auto',
        color: '#0b0f17',
      }}
    >
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2.5rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 600, margin: 0, letterSpacing: '-0.01em' }}>
          merged · портал
        </h1>
        {user && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {user.image && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.image}
                alt=""
                width={32}
                height={32}
                style={{ borderRadius: '50%', border: '1px solid rgba(11,15,23,0.08)' }}
              />
            )}
            <div style={{ fontSize: '0.875rem', lineHeight: 1.2 }}>
              <div style={{ fontWeight: 500 }}>{user.name ?? user.email}</div>
              {user.name && user.email && (
                <div style={{ color: '#6b7280', fontSize: '0.75rem' }}>{user.email}</div>
              )}
            </div>
            <form
              action={async () => {
                'use server';
                await signOut({ redirectTo: '/login' });
              }}
            >
              <button
                type="submit"
                style={{
                  height: '2rem',
                  padding: '0 0.75rem',
                  border: '1px solid rgba(11,15,23,0.12)',
                  borderRadius: '0.375rem',
                  background: '#ffffff',
                  color: '#0b0f17',
                  fontSize: '0.8125rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                Вийти
              </button>
            </form>
          </div>
        )}
      </header>

      <section
        style={{
          background: '#ffffff',
          border: '1px solid rgba(11,15,23,0.08)',
          borderRadius: '0.75rem',
          padding: '1.5rem 1.75rem',
        }}
      >
        <p style={{ color: '#4a5262', lineHeight: 1.6, margin: 0 }}>
          Закрита бета. Далі з&apos;явиться стрічка кандидатів, призначені задачі та панель
          рецензента.
        </p>
      </section>

      <p style={{ marginTop: '2rem', fontFamily: 'ui-monospace, monospace', fontSize: '0.75rem', color: '#8b92a0' }}>
        v0 · {new Date().toISOString().slice(0, 10)}
      </p>
    </main>
  );
}
