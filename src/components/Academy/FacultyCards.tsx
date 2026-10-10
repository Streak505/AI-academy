import Image from "next/image";
import Link from "next/link";
import type { PublicInstructor } from "@/lib/public-data";
import { DataReadError } from "@/components/Academy/PublicCollections";

export function FacultyCards({ result, preview = false }: { result: { success: true; data: PublicInstructor[] } | { success: false }; preview?: boolean }) {
  if (!result.success) return <DataReadError label="faculty profiles" />;
  const items = preview ? result.data.slice(0, 3) : result.data;
  if (!items.length) return <p className="rounded-xl border border-dashed border-slate-300 p-6 text-slate-600">Faculty profiles will appear here when published.</p>;
  return <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{items.map((item) => <article key={item.id} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><Image src={item.image || "/images/mentor/teacher1.png"} alt={item.name} width={320} height={320} sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" className="mx-auto aspect-square w-40 rounded-full object-cover" /><h3 className="mt-4 text-center text-xl font-semibold">{item.name}</h3><p className="mt-1 text-center text-sm font-medium text-primary">{item.specialization}</p><p className="mt-3 line-clamp-4 text-sm leading-6 text-slate-600">{item.bio}</p></article>)}</div>;
}

export function FacultyPreviewLink() {
  return <div className="mt-6"><Link href="/faculty" className="font-semibold text-primary underline">Meet all faculty</Link></div>;
}
