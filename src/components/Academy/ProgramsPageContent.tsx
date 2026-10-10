import Link from "next/link";
import { academy } from "@/config/academy";
import { DataReadError, ProgramCards } from "@/components/Academy/PublicCollections";
import type { PublicProgram } from "@/lib/public-data";

const groups: { key: PublicProgram["group"]; label: string }[] = [
  { key: "academic", label: "Academic Coaching" },
  { key: "career", label: "Career Counseling" },
  { key: "entrepreneurship", label: "Entrepreneurship" },
  { key: "international", label: "IELTS & International" },
  { key: "professional", label: "Professional Courses" },
];

export function ProgramsPageContent({ result }: { result: { success: true; data: PublicProgram[] } | { success: false } }) {
  return <main className="min-h-screen bg-slate-50 px-4 pb-20 pt-32 text-slate-900"><div className="mx-auto max-w-7xl">
    <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gold">Evening learning</p><h1 className="mt-3 text-4xl font-bold sm:text-5xl">Programs at {academy.name}</h1><p className="mt-4 max-w-3xl text-slate-600">Explore programs for every stage of learning. Classes are held {academy.timing.days}, {academy.timing.from}–{academy.timing.to}.</p>
    <div className="mt-10 space-y-12">{!result.success ? <DataReadError label="programs" /> : groups.map((group) => <section key={group.key} id={group.key}><ProgramCards title={group.label} programs={result.data.filter((item) => item.group === group.key)} /></section>)}</div>
    <p className="mt-10 text-sm text-slate-600">Have questions? <Link href="/contact" className="font-semibold text-primary underline">Contact the academy</Link>.</p>
  </div></main>;
}

export function ProgramGroupContent({ result, title, intro }: { result: { success: true; data: PublicProgram[] } | { success: false }; title: string; intro: string }) {
  return <main className="min-h-screen bg-slate-50 px-4 pb-20 pt-32 text-slate-900"><div className="mx-auto max-w-7xl"><p className="text-sm font-semibold uppercase tracking-[0.2em] text-gold">Shahzaib Royal Academy</p><h1 className="mt-3 text-4xl font-bold sm:text-5xl">{title}</h1><p className="mt-4 max-w-3xl text-slate-600">{intro}</p><div className="mt-9">{result.success ? <ProgramCards programs={result.data} /> : <DataReadError label={title.toLowerCase()} />}</div></div></main>;
}
