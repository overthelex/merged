import { setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { BlogTeaser } from '@/components/blog-teaser';
import { Hero } from '@/components/hero';
import { Problem } from '@/components/problem';
import { HowItWorks } from '@/components/how-it-works';
import { Levels } from '@/components/levels';
import { Signals } from '@/components/signals';
import { ForWhom } from '@/components/for-whom';
import { Objections } from '@/components/objections';
import { LeadForm } from '@/components/lead-form';
import { Footer } from '@/components/footer';
import { isLocale } from '@/i18n/routing';

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function Page({ params }: PageProps) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);

  return (
    <main className="flex flex-col">
      <Hero />
      <Problem />
      <HowItWorks />
      <Levels />
      <Signals />
      <ForWhom />
      <Objections />
      <BlogTeaser />
      <LeadForm />
      <Footer />
    </main>
  );
}
