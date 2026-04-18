import Image from 'next/image';
import { signIn, auth } from '@/auth';
import { redirect } from 'next/navigation';

export const metadata = {
  title: 'Вхід · merged',
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string }>;
}) {
  const session = await auth();
  const { from } = await searchParams;
  if (session?.user) {
    redirect(from && from.startsWith('/') ? from : '/app');
  }

  const redirectTo = from && from.startsWith('/') ? from : '/app';

  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        padding: '3rem 1.5rem',
        background: '#f7f6f1',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '24rem',
          background: '#ffffff',
          border: '1px solid rgba(11,15,23,0.08)',
          borderRadius: '0.75rem',
          padding: '2rem 1.75rem',
          boxShadow: '0 1px 2px rgba(11,15,23,0.04), 0 8px 24px rgba(11,15,23,0.06)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
          <LogoMark />
          <span style={{ fontWeight: 600, letterSpacing: '-0.01em' }}>merged</span>
        </div>

        <h1 style={{ fontSize: '1.5rem', fontWeight: 600, margin: 0, lineHeight: 1.2 }}>
          Вхід до порталу
        </h1>
        <p style={{ margin: '0.5rem 0 1.75rem', color: '#4a5262', fontSize: '0.9375rem', lineHeight: 1.5 }}>
          Закрита бета. Вхід за корпоративним Google-акаунтом.
        </p>

        <form
          action={async () => {
            'use server';
            await signIn('google', { redirectTo });
          }}
        >
          <button
            type="submit"
            style={{
              width: '100%',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.625rem',
              height: '2.75rem',
              padding: '0 1rem',
              border: '1px solid rgba(11,15,23,0.12)',
              borderRadius: '0.5rem',
              background: '#ffffff',
              color: '#0b0f17',
              fontSize: '0.9375rem',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'background 120ms ease, border-color 120ms ease',
            }}
          >
            <GoogleMark />
            Увійти через Google
          </button>
        </form>

        <p
          style={{
            margin: '1.5rem 0 0',
            fontSize: '0.75rem',
            color: '#6b7280',
            lineHeight: 1.5,
          }}
        >
          Продовжуючи, ви погоджуєтесь з{' '}
          <a href="https://merged.legal.org.ua/terms" style={{ color: '#0b0f17', textDecoration: 'underline' }}>
            умовами використання
          </a>{' '}
          та{' '}
          <a href="https://merged.legal.org.ua/privacy" style={{ color: '#0b0f17', textDecoration: 'underline' }}>
            політикою приватності
          </a>
          .
        </p>
      </div>
    </main>
  );
}

function LogoMark() {
  return (
    <Image src="/brand/logo-ink-128.png" alt="merged" width={24} height={24} priority />
  );
}

function GoogleMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden>
      <path
        d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"
        fill="#4285F4"
      />
      <path
        d="M9 18c2.43 0 4.467-.806 5.956-2.185l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z"
        fill="#34A853"
      />
      <path
        d="M3.964 10.706A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.038l3.007-2.332z"
        fill="#FBBC05"
      />
      <path
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.962L3.964 7.294C4.672 5.167 6.656 3.58 9 3.58z"
        fill="#EA4335"
      />
    </svg>
  );
}
