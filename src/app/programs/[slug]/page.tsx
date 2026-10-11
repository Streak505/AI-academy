import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DataReadError } from "@/components/Academy/PublicCollections";
import { getAcademySettings } from "@/lib/academy-settings";
import { getPublicProgram, getPublicPrograms } from "@/lib/public-data";
import { absoluteUrl, breadcrumbSchema, publicMetadata } from "@/lib/seo";
import { StructuredData } from "@/components/Seo/StructuredData";

export const revalidate = 300;

export async function generateStaticParams() {
  const result = await getPublicPrograms();
  return result.success ? result.data.map(({ slug }) => ({ slug })) : [];
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const result = await getPublicProgram(slug);
  if (!result.success || !result.data) return { title: "Program details" };
  return publicMetadata(result.data.title, result.data.description, `/programs/${result.data.slug}`);
}

export default async function ProgramDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const result = await getPublicProgram(slug);
  if (!result.success) return <main className="min-h-screen bg-slate-50 px-4 pb-20 pt-32"><div className="mx-auto max-w-4xl"><DataReadError label="program details" /></div></main>;
  if (!result.data) notFound();
  const program = result.data;
  const academy = await getAcademySettings();
  const programSchema = {
    "@context": "https://schema.org",
    "@type": "Course",
    name: program.title,
    description: program.description,
    provider: { "@type": "EducationalOrganization", name: academy.name, url: absoluteUrl("/") },
    courseMode: program.mode,
    ...(program.duration ? { timeRequired: program.duration } : {}),
    offers: { "@type": "Offer", price: program.monthlyFee, priceCurrency: "PKR", category: "Monthly tuition" },
  };
  return <main className="min-h-screen bg-slate-50 px-4 pb-20 pt-32 text-slate-900"><StructuredData data={programSchema} /><StructuredData data={breadcrumbSchema([{ name: "Home", path: "/" }, { name: "Programs", path: "/programs" }, { name: program.title, path: `/programs/${program.slug}` }])} /><article className="mx-auto max-w-4xl rounded-3xl border border-slate-200 bg-white p-7 shadow-sm sm:p-10">
    <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gold">{program.group} {program.level ? `· ${program.level}` : ""}</p><h1 className="mt-3 text-4xl font-bold sm:text-5xl">{program.title}</h1><p className="mt-6 text-lg leading-8 text-slate-700">{program.description}</p>
    {program.features.length ? <><h2 className="mt-8 text-xl font-semibold">What you will learn</h2><ul className="mt-3 list-disc space-y-2 pl-5 text-slate-700">{program.features.map((feature) => <li key={feature}>{feature}</li>)}</ul></> : null}
    <dl className="mt-8 grid gap-4 rounded-2xl bg-slate-50 p-5 sm:grid-cols-2"><div><dt className="text-sm text-slate-500">Duration</dt><dd className="mt-1 font-semibold">{program.duration || "To be confirmed"}</dd></div><div><dt className="text-sm text-slate-500">Class mode</dt><dd className="mt-1 font-semibold">{program.mode}</dd></div><div><dt className="text-sm text-slate-500">Monthly fee</dt><dd className="mt-1 font-semibold">PKR {program.monthlyFee.toLocaleString("en-PK")}</dd></div><div><dt className="text-sm text-slate-500">Admission fee</dt><dd className="mt-1 font-semibold">PKR {program.admissionFee.toLocaleString("en-PK")}</dd></div></dl>
    <div className="mt-8 flex flex-wrap gap-3"><Link href={`/admissions?program=${encodeURIComponent(program.slug)}`} className="inline-flex rounded-lg bg-primary px-6 py-3 font-semibold text-white hover:bg-royal-navy">Apply for this program</Link>{/^\d{7,15}$/.test(academy.whatsappNumber.replace(/\D/g, "")) ? <a href={`https://wa.me/${academy.whatsappNumber.replace(/\D/g, "")}?text=${encodeURIComponent(`Hello ${academy.name}, I would like to know more about ${program.title}.`)}`} target="_blank" rel="noreferrer" className="inline-flex rounded-lg border border-teal-700 px-6 py-3 font-semibold text-teal-800 hover:bg-teal-50">Chat about this program</a> : null}</div>
  </article></main>;
}
