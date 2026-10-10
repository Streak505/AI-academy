"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import type { PublicGalleryItem } from "@/lib/public-data";

const filters = [
  { value: "all", label: "All" },
  { value: "events", label: "Events" },
  { value: "workshops", label: "Workshops" },
  { value: "achievements", label: "Student Achievements" },
  { value: "csr", label: "CSR Activities" },
] as const;

export default function GalleryExplorer({ items }: { items: PublicGalleryItem[] }) {
  const [filter, setFilter] = useState<(typeof filters)[number]["value"]>("all");
  const [selected, setSelected] = useState<PublicGalleryItem | null>(null);
  const visible = useMemo(() => filter === "all" ? items : items.filter((item) => item.category === filter), [filter, items]);
  return <>
    <div className="mb-7 flex flex-wrap gap-2" role="group" aria-label="Filter gallery">
      {filters.map((item) => <button key={item.value} type="button" aria-pressed={filter === item.value} onClick={() => setFilter(item.value)} className={`rounded-full border px-4 py-2 text-sm font-semibold ${filter === item.value ? "border-primary bg-primary text-white" : "border-slate-300 bg-white text-slate-700 hover:border-primary"}`}>{item.label}</button>)}
    </div>
    <div className="columns-1 gap-5 sm:columns-2 lg:columns-3">
      {visible.map((item) => <button key={item.id} type="button" onClick={() => setSelected(item)} className="mb-5 block w-full break-inside-avoid overflow-hidden rounded-2xl border border-slate-200 bg-white text-left shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"><Image src={item.imageUrl} alt={item.caption || item.title} width={900} height={650} sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" loading="lazy" unoptimized className="h-auto w-full object-cover" /><span className="block p-4"><span className="text-xs font-semibold uppercase text-gold">{item.category}</span><span className="mt-1 block font-semibold text-slate-900">{item.title}</span>{item.caption ? <span className="mt-2 block text-sm text-slate-600">{item.caption}</span> : null}</span></button>)}
    </div>
    {visible.length === 0 ? <p className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-slate-600">No photos in this category yet.</p> : null}
    {selected ? <div role="dialog" aria-modal="true" aria-label={selected.title} className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 p-4" onClick={() => setSelected(null)} onKeyDown={(event) => { if (event.key === "Escape") setSelected(null); }}><button type="button" onClick={() => setSelected(null)} aria-label="Close image" className="absolute right-5 top-5 rounded-lg bg-white px-4 py-2 font-semibold text-slate-900">Close</button><div className="max-h-[90vh] max-w-5xl" onClick={(event) => event.stopPropagation()}><Image src={selected.imageUrl} alt={selected.caption || selected.title} width={1400} height={1000} sizes="90vw" unoptimized className="max-h-[80vh] w-auto rounded-xl object-contain" /><p className="mt-3 text-center text-white">{selected.title}{selected.caption ? ` — ${selected.caption}` : ""}</p></div></div> : null}
  </>;
}
