export default function Home() {
  return (
    <main style={{ padding: '3rem', maxWidth: '40rem', margin: '0 auto' }}>
      <h1 style={{ fontSize: '2rem', fontWeight: 600, marginBottom: '1rem' }}>merged · портал</h1>
      <p style={{ color: '#555', lineHeight: 1.6 }}>
        Закрита бета. Логін за інвайтом. Якщо ви потрапили сюди через посилання з
        листа — скоро буде можливість увійти.
      </p>
      <p style={{ marginTop: '2rem', fontFamily: 'monospace', fontSize: '0.875rem', color: '#888' }}>
        v0 · {new Date().toISOString().slice(0, 10)}
      </p>
    </main>
  );
}
