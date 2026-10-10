import Image from "next/image";
import Link from "next/link";
import { EmptyState, ErrorState } from "@/components/Common/DataState";
import type { PublicGalleryItem, PublicInitiative, PublicProgram } from "@/lib/public-data";

const groupNames: Record<PublicProgram["group"], string> = {
  academic: "Academic Coaching",
  career: "Career Counseling",
  entrepreneurship: "Entrepreneurship",
  international: "IELTS & International",
  professional: "Professional Courses",
};

export function ProgramCards({ programs, title }: { programs: PublicProgram[]; title?: string }) {
  if (programs.length === 0) {
    return <EmptyState title="Programs coming soon" message="Please contact the academy for current program availability." />;
  }
  return (
    <div>
      {title ? <h2 className="mb-5 text-2xl font-bold text-slate-900">{title}</h2> : null}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {programs.map((program) => (
          <article key={program.id} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-gold">{program.level || groupNames[program.group]}</p>
            <h3 className="mt-3 text-xl font-semibold text-slate-900">{program.title}</h3>
            <p className="mt-3 text-sm leading-6 text-slate-600">{program.description}</p>
            {program.features.length ? <ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-slate-700">{program.features.map((feature) => <li key={feature}>{feature}</li>)}</ul> : null}
            <p className="mt-4 text-sm text-slate-600">{program.duration || "Duration to be confirmed"} · {program.mode}</p>
            <Link href={`/programs/${program.slug}`} className="mt-5 inline-flex font-semibold text-primary underline">Program details</Link>
            <Link href={`/admissions?program=${encodeURIComponent(program.title)}`} className="ml-4 inline-flex rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-royal-navy">Apply</Link>
          </article>
        ))}
      </div>
    </div>
  );
}

export function InitiativeCards({ items }: { items: PublicInitiative[] }) {
  if (items.length === 0) return <EmptyState title="Initiatives coming soon" message="Contact us to learn about current community support." />;
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => <article key={item.id} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><h3 className="text-lg font-semibold text-slate-900">{item.title}</h3><p className="mt-3 text-sm leading-6 text-slate-600">{item.description}</p></article>)}
    </div>
  );
}

export function GalleryCards({ items, limit }: { items: PublicGalleryItem[]; limit?: number }) {
  const visibleItems = limit ? items.slice(0, limit) : items;
  if (visibleItems.length === 0) return <EmptyState title="Gallery coming soon" message="Academy photos will appear here when published." />;
  return (
    <div className="columns-1 gap-5 sm:columns-2 lg:columns-3">
      {visibleItems.map((item) => (
        <article key={item.id} className="mb-5 break-inside-avoid overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <Image src={item.imageUrl} alt={item.caption || item.title} width={800} height={600} sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" loading="lazy" unoptimized className="h-auto w-full object-cover" />
          <div className="p-4"><p className="text-xs font-semibold uppercase text-gold">{item.category}</p><h3 className="mt-1 font-semibold text-slate-900">{item.title}</h3>{item.caption ? <p className="mt-2 text-sm text-slate-600">{item.caption}</p> : null}</div>
        </article>
      ))}
    </div>
  );
}

export function DataReadError({ label = "information" }: { label?: string }) {
  return <ErrorState message={`Unable to load ${label} right now. Please try again later or contact the academy directly.`} />;
}
