"use client";

import { useCallback, useEffect, useState } from "react";
import { EmptyState, ErrorState, LoadingState } from "@/components/Common/DataState";
import { ClientPagination } from "@/components/Admin/ClientPagination";

type Booking = {
  _id: string;
  name: string;
  phone: string;
  email: string;
  type: string;
  preferredDate: string;
  preferredSlot: string;
  message: string;
  status: string;
  adminNotes: string;
};

const slotTimes = Array.from({ length: 6 }, (_, index) => {
  const minutes = 17 * 60 + index * 30;
  return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
});
const bookingTypes = ["Career Assessment", "Degree Selection", "University Selection", "Parent Counseling", "Scholarship Guidance", "Study Abroad"];
const statuses = ["Requested", "Confirmed", "Completed", "Cancelled"];

function dateKey(value: string) {
  return new Date(value).toISOString().slice(0, 10);
}

function mondayOfWeek(value: Date) {
  const date = new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate(), 12));
  const weekday = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() - weekday + 1);
  return date;
}

function formatDay(value: string, options: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat("en-PK", { ...options, timeZone: "Asia/Karachi" }).format(new Date(`${value}T12:00:00.000Z`));
}

export default function CounselingManagement() {
  const [weekStart, setWeekStart] = useState(() => mondayOfWeek(new Date()).toISOString().slice(0, 10));
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [capacity, setCapacity] = useState(1);
  const [capacityDraft, setCapacityDraft] = useState("1");
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [rescheduleId, setRescheduleId] = useState("");
  const [newDate, setNewDate] = useState("");
  const [newTime, setNewTime] = useState("");
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [bookingPage, setBookingPage] = useState(1);
  const bookingPageSize = 10;

  const weekEnd = (() => {
    const end = new Date(`${weekStart}T12:00:00.000Z`);
    end.setUTCDate(end.getUTCDate() + 5);
    return end.toISOString().slice(0, 10);
  })();

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    const query = new URLSearchParams({ startDate: weekStart, endDate: weekEnd });
    try {
      const response = await fetch(`/api/admin/counseling?${query}`, { cache: "no-store" });
      const payload = await response.json();
      if (!response.ok || !payload.success) throw new Error(payload.message || "Unable to load bookings.");
      setBookings(payload.data.bookings);
      setCapacity(payload.data.capacityPerSlot);
      setCapacityDraft(String(payload.data.capacityPerSlot));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load bookings.");
    } finally {
      setLoading(false);
    }
  }, [weekStart, weekEnd]);

  useEffect(() => { void load(); }, [load]);

  async function updateBooking(booking: Booking, patch: Record<string, unknown>) {
    setMessage("");
    const response = await fetch("/api/admin/counseling", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: booking._id, adminNotes: notes[booking._id] ?? booking.adminNotes, ...patch }),
    });
    const payload = await response.json();
    if (!response.ok || !payload.success) {
      setMessage(payload.message || "Unable to update booking.");
      return;
    }
    setMessage("Counseling booking updated.");
    setRescheduleId("");
    await load();
  }

  async function saveCapacity(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    const response = await fetch("/api/admin/counseling", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ capacityPerSlot: Number(capacityDraft) }),
    });
    const payload = await response.json();
    if (!response.ok || !payload.success) {
      setMessage(payload.message || "Unable to save capacity.");
      return;
    }
    setCapacity(payload.data.capacityPerSlot);
    setMessage("Slot capacity updated.");
  }

  function changeWeek(amount: number) {
    const date = new Date(`${weekStart}T12:00:00.000Z`);
    date.setUTCDate(date.getUTCDate() + amount * 7);
    setWeekStart(date.toISOString().slice(0, 10));
  }

  const weekDays = Array.from({ length: 6 }, (_, index) => {
    const date = new Date(`${weekStart}T12:00:00.000Z`);
    date.setUTCDate(date.getUTCDate() + index);
    return date.toISOString().slice(0, 10);
  });
  const visibleBookings = bookings.filter((booking) =>
    (!typeFilter || booking.type === typeFilter) && (!statusFilter || booking.status === statusFilter)
  );
  const bookingPages = Math.max(1, Math.ceil(visibleBookings.length / bookingPageSize));
  const currentBookingPage = Math.min(bookingPage, bookingPages);
  const pagedBookings = visibleBookings.slice((currentBookingPage - 1) * bookingPageSize, currentBookingPage * bookingPageSize);

  return (
    <main className="p-4 sm:p-6">
      <div className="mx-auto max-w-7xl">
        <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div><p className="text-sm font-semibold uppercase tracking-[0.2em] text-teal-700">Counseling management</p><h1 className="mt-1 text-3xl font-bold text-slate-950">Bookings calendar</h1><p className="mt-1 text-sm text-slate-600">Monday–Saturday · 5:00 PM–8:00 PM · Asia/Karachi</p></div>
          <form onSubmit={saveCapacity} className="flex items-end gap-2 rounded-xl border border-slate-200 bg-white p-3">
            <label className="text-xs font-semibold text-slate-700">Capacity per slot<input type="number" min="1" max="20" value={capacityDraft} onChange={(event) => setCapacityDraft(event.target.value)} className="mt-1 block w-24 rounded-lg border px-3 py-2 text-sm" /></label>
            <button className="rounded-lg bg-teal-700 px-3 py-2 text-sm font-semibold text-white">Save</button>
          </form>
        </header>
        {message ? <p className="mb-4 rounded-lg bg-teal-50 p-3 text-sm text-teal-900" role="status">{message}</p> : null}
        <section className="mb-5 flex flex-wrap items-end justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4">
          <div className="flex flex-wrap gap-3">
            <label className="text-sm">Type<select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)} className="mt-1 block rounded-lg border px-3 py-2"><option value="">All types</option>{bookingTypes.map((type) => <option key={type}>{type}</option>)}</select></label>
            <label className="text-sm">Status<select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="mt-1 block rounded-lg border px-3 py-2"><option value="">All statuses</option>{statuses.map((status) => <option key={status}>{status}</option>)}</select></label>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => changeWeek(-1)} className="rounded-lg border px-3 py-2 text-sm">Previous week</button>
            <p className="text-sm font-semibold">{formatDay(weekStart, { dateStyle: "medium" })} — {formatDay(weekEnd, { dateStyle: "medium" })}</p>
            <button type="button" onClick={() => changeWeek(1)} className="rounded-lg border px-3 py-2 text-sm">Next week</button>
          </div>
        </section>

        {loading ? <LoadingState label="Loading counseling bookings" /> : error ? <ErrorState message={error} onRetry={() => void load()} /> : (
          <>
            <section className="mb-6 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {weekDays.map((day) => <div key={day} className="rounded-2xl border border-slate-200 bg-white p-3">
                <h2 className="mb-3 font-bold text-slate-900">{formatDay(day, { weekday: "long", month: "short", day: "numeric" })}</h2>
                <div className="space-y-2">{slotTimes.map((time) => {
                  const slotBookings = bookings.filter((booking) => dateKey(booking.preferredDate) === day && booking.preferredSlot === time && booking.status !== "Cancelled");
                  return <div key={time} className="flex gap-2 rounded-lg bg-slate-50 p-2 text-xs">
                    <span className="w-12 shrink-0 font-semibold">{time}</span>
                    <div className="min-w-0 flex-1">{slotBookings.length ? slotBookings.map((booking) => <p key={booking._id} className="truncate text-slate-700">{booking.name} · {booking.status}</p>) : <span className="text-slate-400">Available</span>}</div>
                    <span className="shrink-0 text-slate-500">{slotBookings.length}/{capacity}</span>
                  </div>;
                })}</div>
              </div>)}
            </section>
            {visibleBookings.length === 0 ? <EmptyState title="No matching bookings" message="Try changing the filters or check another week." /> : <section className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
              <table className="min-w-[900px] w-full text-left text-sm">
                <thead className="bg-slate-50"><tr>{["Requester", "Type", "Date & time", "Status", "Message / notes", "Actions"].map((head) => <th key={head} className="px-4 py-3 font-semibold">{head}</th>)}</tr></thead>
                <tbody className="divide-y divide-slate-100">{pagedBookings.map((booking) => <tr key={booking._id} className="align-top">
                  <td className="px-4 py-4"><p className="font-semibold">{booking.name}</p><a className="text-teal-800 underline" href={`mailto:${booking.email}`}>{booking.email}</a><p className="text-slate-500">{booking.phone}</p></td>
                  <td className="px-4 py-4">{booking.type}</td>
                  <td className="px-4 py-4">{formatDay(dateKey(booking.preferredDate), { dateStyle: "medium" })}<p>{booking.preferredSlot} PKT</p></td>
                  <td className="px-4 py-4">{booking.status}</td>
                  <td className="max-w-xs px-4 py-4"><p className="text-slate-600">{booking.message || "No message"}</p><textarea aria-label={`Admin notes for ${booking.name}`} value={notes[booking._id] ?? booking.adminNotes} onChange={(event) => setNotes({ ...notes, [booking._id]: event.target.value })} maxLength={3000} rows={2} className="mt-2 w-full rounded-lg border px-2 py-1" placeholder="Admin notes" /><button type="button" onClick={() => void updateBooking(booking, {})} className="mt-1 text-xs font-semibold text-teal-800 underline">Save notes</button></td>
                  <td className="px-4 py-4"><div className="flex min-w-36 flex-col items-start gap-2">
                    {booking.status === "Requested" && <button type="button" onClick={() => void updateBooking(booking, { status: "Confirmed" })} className="font-semibold text-teal-800 underline">Confirm</button>}
                    {booking.status !== "Completed" && booking.status !== "Cancelled" && <button type="button" onClick={() => setRescheduleId(rescheduleId === booking._id ? "" : booking._id)} className="font-semibold text-slate-700 underline">Reschedule</button>}
                    {booking.status !== "Completed" && booking.status !== "Cancelled" && <button type="button" onClick={() => void updateBooking(booking, { status: "Cancelled" })} className="font-semibold text-rose-700 underline">Cancel</button>}
                    {booking.status === "Confirmed" && <button type="button" onClick={() => void updateBooking(booking, { status: "Completed" })} className="font-semibold text-indigo-700 underline">Complete</button>}
                    {rescheduleId === booking._id && <div className="grid gap-2"><label className="text-xs">New date<input type="date" value={newDate} onChange={(event) => setNewDate(event.target.value)} className="mt-1 w-full rounded border px-2 py-1" /></label><label className="text-xs">New time<select value={newTime} onChange={(event) => setNewTime(event.target.value)} className="mt-1 w-full rounded border px-2 py-1"><option value="">Select time</option>{slotTimes.map((time) => <option key={time}>{time}</option>)}</select></label><button type="button" disabled={!newDate || !newTime} onClick={() => void updateBooking(booking, { preferredDate: newDate, preferredSlot: newTime })} className="rounded bg-teal-700 px-2 py-1 text-xs font-semibold text-white disabled:opacity-50">Save time</button></div>}
                  </div></td>
                </tr>)}</tbody>
              </table>
            </section>}
            <ClientPagination page={currentBookingPage} pages={bookingPages} onPageChange={setBookingPage} />
          </>
        )}
      </div>
    </main>
  );
}
