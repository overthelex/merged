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

export default function Page() {
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
