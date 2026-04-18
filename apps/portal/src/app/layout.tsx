import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'merged · портал',
  description: 'Портал рекрутерів і кандидатів',
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="uk">
      <body style={{ fontFamily: 'system-ui, sans-serif', margin: 0 }}>{children}</body>
    </html>
  );
}
