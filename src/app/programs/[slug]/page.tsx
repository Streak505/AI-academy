import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DataReadError } from "@/components/Academy/PublicCollections";
import { academy } from "@/config/academy";
import { getPublicProgram, getPublicPrograms } from "@/lib/public-data";
import { absoluteUrl } from "@/lib/seo";

export const revalidate = 300;

export async function generateStaticParams() {
  const result = await getPublicPrograms();
  return result.success ? result.data.map(({ slug }) => ({ slug })) : [];
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const result = await getPublicProgram(slug);
  if (!result.success || !result.data) return { title: "Program details" };
  return {
    title: result.data.title,
    description: result.data.description,
    alternates: { canonical: absoluteUrl(`/programs/${result.data.slug}`) },
    openGraph: { title: `${result.data.title} | ${academy.name}`, description: result.data.description, url: absoluteUrl(`/programs/${result.data.slug}`) },
  };
}

export default async function ProgramDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const result = await getPublicProgram(slug);
  if (!result.success) return <main className="min-h-screen bg-slate-50 px-4 pb-20 pt-32"><div className="mx-auto max-w-4xl"><DataReadError label="program details" /></div></main>;
  if (!result.data) notFound();
  const program = result.data;
  return <main className="min-h-screen bg-slate-50 px-4 pb-20 pt-32 text-slate-900"><article className="mx-auto max-w-4xl rounded-3xl border border-slate-200 bg-white p-7 shadow-sm sm:p-10">
    <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gold">{program.group} {program.level ? `· ${program.level}` : ""}</p><h1 className="mt-3 text-4xl font-bold sm:text-5xl">{program.title}</h1><p className="mt-6 text-lg leading-8 text-slate-700">{program.description}</p>
    {program.features.length ? <><h2 className="mt-8 text-xl font-semibold">What you will learn</h2><ul className="mt-3 list-disc space-y-2 pl-5 text-slate-700">{program.features.map((feature) => <li key={feature}>{feature}</li>)}</ul></> : null}
    <dl className="mt-8 grid gap-4 rounded-2xl bg-slate-50 p-5 sm:grid-cols-2"><div><dt className="text-sm text-slate-500">Duration</dt><dd className="mt-1 font-semibold">{program.duration || "To be confirmed"}</dd></div><div><dt className="text-sm text-slate-500">Class mode</dt><dd className="mt-1 font-semibold">{program.mode}</dd></div><div><dt className="text-sm text-slate-500">Monthly fee</dt><dd className="mt-1 font-semibold">PKR {program.monthlyFee.toLocaleString("en-PK")}</dd></div><div><dt className="text-sm text-slate-500">Admission fee</dt><dd className="mt-1 font-semibold">PKR {program.admissionFee.toLocaleString("en-PK")}</dd></div></dl>
    <Link href={`/admissions?program=${encodeURIComponent(program.title)}`} className="mt-8 inline-flex rounded-lg bg-primary px-6 py-3 font-semibold text-white hover:bg-royal-navy">Apply for this program</Link>
  </article></main>;
}
