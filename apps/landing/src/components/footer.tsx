import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';

export function Footer() {
  const t = useTranslations('footer');
  return (
    <footer className="bg-paper-dim border-t border-ink/6">
      <div className="section-inner py-10 sm:py-12">
        <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
          {/* Brand */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2.5">
              <LogoMark alt={t('logoAlt')} />
              <span className="font-display text-base font-semibold text-ink tracking-tight">
                merged
              </span>
            </div>
            <p className="font-mono text-xs text-ink/40 max-w-[18rem] leading-relaxed">
              {t('tagline')}
            </p>
          </div>

          {/* Links */}
          <div className="flex flex-col gap-2">
            <p className="label-mono text-ink/35 mb-1">{t('contactHeading')}</p>
            <a
              href={`mailto:${t('contactEmail')}`}
              className="font-mono text-sm text-ink/55 hover:text-ink transition-colors duration-150 focus-visible:underline"
            >
              {t('contactEmail')}
            </a>
            <Link
              href="/blog"
              className="font-mono text-sm text-ink/55 hover:text-ink transition-colors duration-150 focus-visible:underline"
            >
              {t('blogLink')}
            </Link>
          </div>

          {/* Legal */}
          <div className="flex flex-col gap-2">
            <p className="label-mono text-ink/35 mb-1">{t('documentsHeading')}</p>
            <div className="flex flex-col gap-1.5">
              <Link
                href="/privacy"
                className="font-mono text-sm text-ink/55 hover:text-ink transition-colors duration-150 focus-visible:underline"
              >
                {t('privacyLink')}
              </Link>
              <Link
                href="/terms"
                className="font-mono text-sm text-ink/55 hover:text-ink transition-colors duration-150 focus-visible:underline"
              >
                {t('termsLink')}
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 pt-6 border-t border-ink/6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-mono text-xs text-ink/35">{t('copyright')}</p>
          <p className="font-mono text-xs text-ink/30">{t('betaNote')}</p>
        </div>
      </div>
    </footer>
  );
}

function LogoMark({ alt }: { alt: string }) {
  return (
    <Image
      src="/brand/logo-ink-128.png"
      alt={alt}
      width={22}
      height={22}
      className="shrink-0"
    />
  );
}
