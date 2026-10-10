"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { EmptyState, ErrorState, LoadingState } from "@/components/Common/DataState";
const PROGRAM_GROUPS = ["academic", "career", "entrepreneurship", "international", "professional"] as const;

type ProgramItem = {
  _id: string;
  title: string;
  group: (typeof PROGRAM_GROUPS)[number];
  level?: string;
  description: string;
  features: string[];
  duration: string;
  monthlyFee: number;
};

type Initiative = { _id: string; title: string; description: string; icon?: string };
type GalleryItem = { _id: string; title: string; caption?: string; imageUrl: string; category: string };

const groupNames: Record<(typeof PROGRAM_GROUPS)[number], string> = {
  academic: "Academic Coaching",
  career: "Career Counseling",
  entrepreneurship: "Entrepreneurship",
  international: "IELTS & International",
  professional: "Professional Courses",
};

function useCollection<T>(url: string) {
  const [items, setItems] = useState<T[]>([]);
  const [status, setStatus] = useState<"loading" | "loaded" | "error">("loading");
  const load = useCallback(async () => {
    setStatus("loading");
    try {
      const response = await fetch(url, { cache: "no-store" });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.message || "Unable to load this information.");
      setItems(Array.isArray(result.data) ? result.data : result.data.items || []);
      setStatus("loaded");
    } catch (error) {
      console.error(`Unable to load ${url}:`, error);
      setStatus("error");
    }
  }, [url]);

  useEffect(() => {
    void load();
  }, [load]);

  return { items, status, load };
}

export function ProgramDirectory({ group }: { group?: (typeof PROGRAM_GROUPS)[number] }) {
  const { items, status, load } = useCollection<ProgramItem>(`/api/programs${group ? `?group=${group}` : ""}`);
  const title = group ? groupNames[group] : "Our Programs";

  return (
    <main className="min-h-screen bg-slate-50 px-4 pb-20 pt-32 text-slate-900">
      <div className="mx-auto max-w-7xl">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gold">Evening learning</p>
        <h1 className="mt-3 text-4xl font-bold sm:text-5xl">{title}</h1>
        <p className="mt-4 max-w-3xl text-slate-600">Explore coaching and development programs at Shahzaib Royal Academy. Classes run Monday–Saturday, 5:00 PM–8:00 PM.</p>
        <div className="mt-9">
          {status === "loading" ? <LoadingState label="Loading programs" /> : status === "error" ? <ErrorState message="Unable to load programs right now." onRetry={() => void load()} /> : items.length === 0 ? <EmptyState title="No programs available" message="Programs will appear here when published." /> : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((item) => (
                <article key={item._id} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-wider text-gold">{groupNames[item.group]}{item.level ? ` · ${item.level}` : ""}</p>
                  <h2 className="mt-3 text-xl font-semibold">{item.title}</h2>
                  <p className="mt-3 text-sm leading-6 text-slate-600">{item.description}</p>
                  {item.features.length ? <ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-slate-700">{item.features.map((feature) => <li key={feature}>{feature}</li>)}</ul> : null}
                  <p className="mt-5 text-sm font-medium text-slate-600">{item.duration || "Duration to be confirmed"}</p>
                  <Link href={`/admissions?program=${encodeURIComponent(item.title)}`} className="mt-5 inline-flex rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-royal-navy">Apply for this program</Link>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

export function CsrDirectory() {
  const { items, status, load } = useCollection<Initiative>("/api/csr");
  return (
    <main className="min-h-screen bg-slate-50 px-4 pb-20 pt-32 text-slate-900">
      <div className="mx-auto max-w-6xl">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gold">Community support</p>
        <h1 className="mt-3 text-4xl font-bold sm:text-5xl">CSR & Scholarships</h1>
        <p className="mt-4 max-w-3xl text-slate-600">We work to make educational guidance and learning more accessible in our community.</p>
        <div className="mt-9">
          {status === "loading" ? <LoadingState label="Loading initiatives" /> : status === "error" ? <ErrorState message="Unable to load community initiatives right now." onRetry={() => void load()} /> : items.length === 0 ? <EmptyState title="No initiatives published" message="Community initiatives will appear here when available." /> : (
            <div className="grid gap-5 sm:grid-cols-2">
              {items.map((item) => <article key={item._id} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><h2 className="text-xl font-semibold">{item.title}</h2><p className="mt-3 text-slate-600">{item.description}</p></article>)}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

export function GalleryDirectory() {
  const { items, status, load } = useCollection<GalleryItem>("/api/gallery");
  return (
    <main className="min-h-screen bg-slate-50 px-4 pb-20 pt-32 text-slate-900">
      <div className="mx-auto max-w-7xl">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gold">Life at SRA</p>
        <h1 className="mt-3 text-4xl font-bold sm:text-5xl">Gallery</h1>
        <div className="mt-9">
          {status === "loading" ? <LoadingState label="Loading gallery" /> : status === "error" ? <ErrorState message="Unable to load gallery items right now." onRetry={() => void load()} /> : items.length === 0 ? <EmptyState title="No gallery images yet" message="Published academy photos will appear here." /> : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((item) => <article key={item._id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><Image src={item.imageUrl} alt={item.caption || item.title} width={640} height={420} unoptimized className="h-56 w-full object-cover" /><div className="p-5"><p className="text-xs font-semibold uppercase text-gold">{item.category}</p><h2 className="mt-2 text-lg font-semibold">{item.title}</h2>{item.caption ? <p className="mt-2 text-sm text-slate-600">{item.caption}</p> : null}</div></article>)}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
