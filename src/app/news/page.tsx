import Image from "next/image";
import { connectToDatabase, logMongoError } from "@/lib/db";
import { News } from "@/models/News";
import { getImagePrefix, formatAcademyDate } from "@/utils/util";
import { EmptyState, ErrorState } from "@/components/Common/DataState";

export const dynamic = "force-dynamic";
// DEPRECATED: not part of Shahzaib Royal Academy scope
export const metadata = { title: "News | Shahzaib Royal Academy" };

export default async function NewsPage() {
  let items: Array<{ _id: string; title: string; excerpt?: string; image?: string; publishedAt?: Date }> = [];
  let hasError = false;
  try {
    await connectToDatabase();
    items = (await News.find({ isPublished: true }).sort({ publishedAt: -1 }).lean()).map((item) => ({ ...item, _id: String(item._id) }));
  } catch (error) {
    hasError = true;
    logMongoError("News page", error);
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 pb-20 pt-32">
      <div className="mx-auto max-w-6xl">
        <p className="landing-pill">Academy news</p>
        <h1 className="mt-4 text-4xl font-bold text-slate-950 sm:text-5xl">What is happening at Shahzaib Royal Academy.</h1>
        <p className="mt-4 max-w-2xl text-slate-600">Follow new programs, learning opportunities, and academy updates.</p>
        <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {hasError ? <div className="md:col-span-2 lg:col-span-3"><ErrorState message="Unable to load academy news right now." /></div> : null}
          {!hasError && items.length === 0 ? <div className="md:col-span-2 lg:col-span-3"><EmptyState title="No news published" message="Academy news will appear here when it is published." /></div> : null}
          {items.map((item) => (
            <article key={item._id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <Image src={`${getImagePrefix()}${item.image || "/images/banner/Hero.png"}`} alt={item.title} width={640} height={400} className="h-52 w-full object-cover" />
              <div className="p-6"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-700">{item.publishedAt ? formatAcademyDate(item.publishedAt) : "Recent"}</p><h2 className="mt-3 text-xl font-semibold text-slate-950">{item.title}</h2><p className="mt-3 text-sm leading-6 text-slate-600">{item.excerpt}</p></div>
            </article>
          ))}
        </div>
      </div>
    </main>
  );
}
