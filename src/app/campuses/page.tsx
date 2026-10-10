import Image from "next/image";
import { connectToDatabase, logMongoError } from "@/lib/db";
import { Campus } from "@/models/Campus";
import { getImagePrefix } from "@/utils/util";
import { EmptyState, ErrorState } from "@/components/Common/DataState";

export const dynamic = "force-dynamic";
export const metadata = { title: "Campuses" };

export default async function CampusesPage() {
  let campuses: Array<{ _id: string; name: string; city: string; address?: string; image?: string; facilities?: string[] }> = [];
  let hasError = false;
  try { await connectToDatabase(); campuses = (await Campus.find({ isActive: true }).sort({ city: 1 }).lean()).map((campus) => ({ ...campus, _id: String(campus._id) })); } catch (error) { hasError = true; logMongoError("Campuses page", error); }
  return <main className="min-h-screen bg-slate-50 px-4 pb-20 pt-32"><div className="mx-auto max-w-6xl"><p className="landing-pill">Learn with us</p><h1 className="mt-4 text-4xl font-bold text-slate-950 sm:text-5xl">Our campuses.</h1><p className="mt-4 max-w-2xl text-slate-600">Find an AI Academy learning space and connect with your local community.</p><div className="mt-10 grid gap-6 md:grid-cols-2">{hasError ? <div className="md:col-span-2"><ErrorState message="Unable to load campuses right now." /></div> : null}{!hasError && campuses.length === 0 ? <div className="md:col-span-2"><EmptyState title="No campuses listed" message="Campus information will be published here soon." /></div> : null}{campuses.map((campus) => <article key={campus._id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">{campus.image ? <Image src={`${getImagePrefix()}${campus.image}`} alt={`${campus.name}, ${campus.city}`} width={640} height={320} className="h-48 w-full object-cover" /> : null}<div className="p-6"><p className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-700">{campus.city}</p><h2 className="mt-2 text-2xl font-semibold text-slate-950">{campus.name}</h2><p className="mt-3 text-slate-600">{campus.address || "Contact admissions for campus details."}</p>{campus.facilities?.length ? <p className="mt-4 text-sm text-slate-500">{campus.facilities.join(" • ")}</p> : null}</div></article>)}</div></div></main>;
}
