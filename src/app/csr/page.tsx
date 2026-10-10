import Link from "next/link";
import { DataReadError, InitiativeCards } from "@/components/Academy/PublicCollections";
import { getPublicInitiatives } from "@/lib/public-data";
import { publicMetadata } from "@/lib/seo";

export const revalidate = 300;
export const metadata = publicMetadata("CSR & Scholarships", "Explore community education initiatives, discounts, and scholarships.", "/csr");
export default async function CsrPage() {
  const result = await getPublicInitiatives();
  return <main className="min-h-screen bg-slate-50 px-4 pb-20 pt-32 text-slate-900"><div className="mx-auto max-w-7xl"><p className="text-sm font-semibold uppercase tracking-[0.2em] text-gold">Community support</p><h1 className="mt-3 text-4xl font-bold sm:text-5xl">CSR & Scholarships</h1><p className="mt-4 max-w-3xl text-slate-600">We work to widen access to learning through support for deserving students and families.</p><div className="mt-9">{result.success ? <InitiativeCards items={result.data} /> : <DataReadError label="community initiatives" />}</div><section className="mt-12 rounded-2xl bg-white p-7 shadow-sm"><h2 className="text-2xl font-bold">How to apply for a concession</h2><p className="mt-3 leading-7 text-slate-600">Select the relevant concession request in the admissions form and include a short note. Our admissions team will review eligibility and contact your family.</p><Link href="/admissions#concession" className="mt-5 inline-flex rounded-lg bg-primary px-5 py-3 font-semibold text-white">Start an admission application</Link><h2 className="mt-8 text-xl font-bold">Merit scholarship criteria</h2><p className="mt-3 leading-7 text-slate-600">Placeholder: eligibility is assessed based on recent academic results, demonstrated commitment, and available scholarship funding. Contact the academy for the current criteria and application dates.</p></section></div></main>;
}
