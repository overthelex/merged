export function Footer() {
  return (
    <footer className="bg-paper">
      <div className="mx-auto max-w-6xl px-6 py-12 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between font-mono text-sm text-ink/60">
        <div className="flex items-center gap-3">
          <span className="font-semibold text-ink">merged</span>
          <span>· технічний скринінг без співбесід</span>
        </div>
        <div className="flex flex-wrap gap-6">
          <a href="mailto:hello@merged.legal.org.ua" className="hover:text-ink">
            hello@merged.legal.org.ua
          </a>
          <a href="/privacy/" className="hover:text-ink">
            Приватність
          </a>
          <a href="/terms/" className="hover:text-ink">
            Умови
          </a>
        </div>
        <div>© 2026 merged</div>
      </div>
    </footer>
  );
}
