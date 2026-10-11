import { jsonLd } from "@/lib/seo";

export function StructuredData({ data }: { data: Record<string, unknown> }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(data)} />;
}

export function FaqSection({
  title = "Frequently asked questions",
  items,
}: {
  title?: string;
  items: Array<{ question: string; answer: string }>;
}) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map(({ question, answer }) => ({
      "@type": "Question",
      name: question,
      acceptedAnswer: { "@type": "Answer", text: answer },
    })),
  };

  return (
    <section aria-labelledby="faq-title" className="bg-slate-50 px-4 py-14">
      <div className="mx-auto max-w-4xl">
        <StructuredData data={schema} />
        <h2 id="faq-title" className="text-3xl font-bold text-slate-950">{title}</h2>
        <div className="mt-6 space-y-3">
          {items.map(({ question, answer }) => (
            <details key={question} className="rounded-xl border border-slate-200 bg-white p-5">
              <summary className="cursor-pointer font-semibold text-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700">{question}</summary>
              <p className="mt-3 leading-7 text-slate-600">{answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
