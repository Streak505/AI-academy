import Link from "next/link";
import { redirect } from "next/navigation";
import { formatAcademyDate } from "@/utils/util";
import { connectToDatabase } from "@/lib/db";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { Event } from "@/models/Event";

export default async function AdminEventsPage() {
  const isAuthenticated = await isAdminAuthenticated();

  if (!isAuthenticated) {
    redirect("/admin/login");
  }

  await connectToDatabase();
  const events = await Event.find().sort({ date: 1 }).lean();

  return (
    <main className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-violet-600">Events</p>
          <h1 className="mt-2 text-3xl font-bold text-slate-900">Event management</h1>
        </div>
        <Link href="/admin/events/new" className="rounded-full bg-violet-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-violet-700">
          + New event
        </Link>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-200">
        <table className="min-w-full divide-y divide-slate-200 text-left">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-sm font-semibold text-slate-700">Title</th>
              <th className="px-4 py-3 text-sm font-semibold text-slate-700">Date</th>
              <th className="px-4 py-3 text-sm font-semibold text-slate-700">Location</th>
              <th className="px-4 py-3 text-sm font-semibold text-slate-700">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white">
            {events.map((event: any) => (
              <tr key={String(event._id)} className="hover:bg-slate-50 cursor-pointer">
                <td className="px-4 py-4 font-medium text-slate-900">
                  <Link href={`/admin/events/${event._id}`} className="hover:text-violet-600 transition">
                    {event.title}
                  </Link>
                </td>
                <td className="px-4 py-4 text-slate-600">{formatAcademyDate(event.date)}</td>
                <td className="px-4 py-4 text-slate-600">{event.location || "—"}</td>
                <td className="px-4 py-4">
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${event.isPublished ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-700"}`}>
                    {event.isPublished ? "Published" : "Draft"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
