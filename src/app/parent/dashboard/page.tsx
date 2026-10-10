import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { CounselingBooking } from "@/models/CounselingBooking";
import { ErrorState } from "@/components/Common/DataState";

export default async function ParentDashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/signin");
  if (user.role !== "PARENT" && user.role !== "ADMIN") redirect("/");

  let bookings: { id: string; type: string; preferredDate: Date; preferredSlot: string; status: string }[] = [];
  let bookingError = false;
  try {
    await connectDB();
    const records = await CounselingBooking.find({ requestedBy: user.id }).sort({ preferredDate: -1 }).lean();
    bookings = records.map((booking) => ({
      id: String(booking._id),
      type: booking.type,
      preferredDate: booking.preferredDate,
      preferredSlot: booking.preferredSlot,
      status: booking.status,
    }));
  } catch (error) {
    bookingError = true;
    console.error("Unable to load parent counseling bookings:", error);
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 pb-20 pt-32">
      <section className="mx-auto max-w-4xl rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gold">Parent portal</p>
        <h1 className="mt-3 text-3xl font-bold text-slate-900">Welcome, {user.name}</h1>
        <p className="mt-3 text-slate-600">Parent tools for linked student records will be available here.</p>
        <Link href="/contact" className="mt-6 inline-flex rounded-lg bg-primary px-5 py-3 font-semibold text-white">Contact the academy</Link>
        <section className="mt-10 border-t border-slate-200 pt-8">
          <h2 className="text-2xl font-bold text-slate-900">Counseling bookings</h2>
          {bookingError ? <div className="mt-4"><ErrorState message="Unable to load your counseling bookings." /></div> : bookings.length === 0 ? <p className="mt-4 text-slate-600">You have no counseling bookings yet.</p> : <ul className="mt-4 space-y-3">{bookings.map((booking) => <li key={booking.id} className="rounded-xl border border-slate-200 p-4"><p className="font-semibold text-slate-900">{booking.type}</p><p className="mt-1 text-sm text-slate-600">{new Intl.DateTimeFormat("en-PK", { timeZone: "Asia/Karachi", dateStyle: "long" }).format(booking.preferredDate)} · {booking.preferredSlot} · {booking.status}</p></li>)}</ul>}
        </section>
      </section>
    </main>
  );
}
