import Link from "next/link";
import { academy } from "@/config/academy";

export const metadata = { title: "Privacy Policy" };

export default function PrivacyPage() {
  return <main className="min-h-screen bg-slate-50 px-4 pb-20 pt-32"><article className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-8 shadow-sm"><p className="text-sm font-semibold uppercase tracking-[0.2em] text-gold">{academy.name}</p><h1 className="mt-3 text-4xl font-bold text-slate-950">Privacy policy</h1><p className="mt-5 leading-7 text-slate-600">{academy.name} uses the information you submit to respond to admissions, contact, enrollment, and learning requests. We do not sell personal information.</p><h2 className="mt-8 text-xl font-semibold text-slate-950">Questions</h2><p className="mt-2 text-slate-600">Contact our team for questions about your information or account.</p><Link href="/contact" className="mt-6 inline-block font-semibold text-primary no-underline">Contact {academy.name}</Link></article></main>;
}
