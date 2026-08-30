import Image from "next/image";
import { connectToDatabase } from "@/lib/db";
import { Event } from "@/models/Event";
import { getImagePrefix, formatAcademyDate } from "@/utils/util";

export const dynamic = "force-dynamic";
export const metadata = { title: "Events | AI Academy" };

export default async function EventsPage() {
  let items: Array<{ _id: string; title: string; description: string; image?: string; date: Date; location: string; type?: string }> = [];
  let hasError = false;
  try {
    await connectToDatabase();
    items = (await Event.find({ isPublished: true, date: { $gte: new Date() } }).sort({ date: 1 }).lean()).map((item) => ({ ...item, _id: String(item._id) }));
  } catch (error) {
    hasError = true;
    console.error("Unable to load events page:", error);
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 pb-20 pt-32">
      <div className="mx-auto max-w-6xl">
        <p className="landing-pill">Learning together</p>
        <h1 className="mt-4 text-4xl font-bold text-slate-950 sm:text-5xl">Events for curious builders.</h1>
        <p className="mt-4 max-w-2xl text-slate-600">Workshops, talks, and career sessions from the AI Academy community.</p>
        <div className="mt-10 grid gap-6 md:grid-cols-2">
          {hasError ? <p className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-rose-800 md:col-span-2">Unable to load events right now.</p> : null}
          {!hasError && items.length === 0 ? <p className="rounded-2xl border border-slate-200 bg-white p-6 text-slate-600 md:col-span-2">No upcoming events have been published yet.</p> : null}
          {items.map((item) => (
            <article key={item._id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm sm:flex">
              <Image src={`${getImagePrefix()}${item.image || "/images/banner/Hero.png"}`} alt={item.title} width={360} height={280} className="h-48 w-full object-cover sm:h-auto sm:w-2/5" />
              <div className="p-6"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">{item.type || "Academy event"}</p><h2 className="mt-3 text-xl font-semibold text-slate-950">{item.title}</h2><p className="mt-3 text-sm leading-6 text-slate-600">{item.description}</p><p className="mt-4 text-sm font-semibold text-slate-800">{formatAcademyDate(item.date)}</p><p className="mt-1 text-sm text-slate-500">{item.location}</p></div>
            </article>
          ))}
        </div>
      </div>
    </main>
  );
}
