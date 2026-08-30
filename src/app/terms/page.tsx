import Link from "next/link";

export const metadata = { title: "Terms and Conditions" };

export default function TermsPage() {
  return <main className="min-h-screen bg-slate-50 px-4 pb-20 pt-32"><article className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-8 shadow-sm"><p className="text-sm font-semibold uppercase tracking-[0.2em] text-teal-700">AI Academy</p><h1 className="mt-3 text-4xl font-bold text-slate-950">Terms and conditions</h1><p className="mt-5 leading-7 text-slate-600">Use of AI Academy courses and services is subject to respectful participation, accurate application information, and compliance with applicable laws and academy policies.</p><h2 className="mt-8 text-xl font-semibold text-slate-950">Need clarification?</h2><p className="mt-2 text-slate-600">Our admissions team can answer questions about programs and enrollment.</p><Link href="/admissions" className="mt-6 inline-block font-semibold text-teal-700 no-underline">View admissions</Link></article></main>;
}
