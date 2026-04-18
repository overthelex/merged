export function Footer() {
  return (
    <footer className="bg-paper-dim border-t border-ink/6">
      <div className="section-inner py-10 sm:py-12">
        <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
          {/* Brand */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2.5">
              <LogoMark />
              <span className="font-display text-base font-semibold text-ink tracking-tight">
                merged
              </span>
            </div>
            <p className="font-mono text-xs text-ink/40 max-w-[18rem] leading-relaxed">
              Технічний скринінг без співбесід — work-sample assessment для AI-ери.
            </p>
          </div>

          {/* Links */}
          <div className="flex flex-col gap-2">
            <p className="label-mono text-ink/35 mb-1">Звʼязок</p>
            <a
              href="mailto:hello@merged.legal.org.ua"
              className="font-mono text-sm text-ink/55 hover:text-ink transition-colors duration-150 focus-visible:underline"
            >
              hello@merged.legal.org.ua
            </a>
          </div>

          {/* Legal */}
          <div className="flex flex-col gap-2">
            <p className="label-mono text-ink/35 mb-1">Документи</p>
            <div className="flex flex-col gap-1.5">
              <a
                href="/privacy/"
                className="font-mono text-sm text-ink/55 hover:text-ink transition-colors duration-150 focus-visible:underline"
              >
                Приватність
              </a>
              <a
                href="/terms/"
                className="font-mono text-sm text-ink/55 hover:text-ink transition-colors duration-150 focus-visible:underline"
              >
                Умови використання
              </a>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 pt-6 border-t border-ink/6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-mono text-xs text-ink/35">
            © 2026 merged · Україна
          </p>
          <p className="font-mono text-xs text-ink/30">
            Закрита бета · TID 2026
          </p>
        </div>
      </div>
    </footer>
  );
}

function LogoMark() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 28 28"
      fill="none"
      aria-hidden
      className="shrink-0"
    >
      <rect width="28" height="28" rx="7" fill="#0b0f17" />
      <path
        d="M7.5 19V9m0 10c2.5 0 4-2 4-4.5S10 10 8 10M20.5 9v10m0-10c-2.5 0-4 2-4 4.5S18 18 20 18"
        stroke="#00d488"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <circle cx="14" cy="14" r="1.6" fill="#00d488" />
    </svg>
  );
}
