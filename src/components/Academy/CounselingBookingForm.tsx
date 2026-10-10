"use client";

import { useState } from "react";

const types = ["Career Assessment", "Degree Selection", "University Selection", "Parent Counseling", "Scholarship Guidance", "Study Abroad"] as const;
const slots = Array.from({ length: 6 }, (_, index) => {
  const minutes = 17 * 60 + index * 30;
  return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
});

export default function CounselingBookingForm({ initialValues = { name: "", email: "", phone: "" } }: { initialValues?: { name: string; email: string; phone: string } }) {
  const [status, setStatus] = useState<{ kind: "idle" | "success" | "error"; message: string }>({ kind: "idle", message: "" });
  const [busy, setBusy] = useState(false);
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Karachi", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    setBusy(true);
    setStatus({ kind: "idle", message: "" });
    const form = new FormData(formElement);
    const payload = Object.fromEntries(form.entries());
    try {
      const response = await fetch("/api/counseling", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.message || "Unable to request a session.");
      setStatus({ kind: "success", message: "Your counseling request has been received. We will contact you to confirm it." });
      formElement.reset();
    } catch (error) {
      setStatus({ kind: "error", message: error instanceof Error ? error.message : "Unable to send your request. Please try again." });
    } finally {
      setBusy(false);
    }
  }

  return <form id="booking" onSubmit={submit} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
    <h2 className="text-2xl font-bold text-slate-900">Book a counseling session</h2>
    <p className="mt-2 text-sm text-slate-600">Choose a Monday–Saturday time between 5:00 PM and 8:00 PM (Pakistan time).</p>
    <div className="mt-6 grid gap-4 sm:grid-cols-2">
      <label className="text-sm font-medium text-slate-700">Name<input name="name" required minLength={2} maxLength={120} defaultValue={initialValues.name} autoComplete="name" className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2.5" /></label>
      <label className="text-sm font-medium text-slate-700">Phone<input name="phone" required minLength={7} maxLength={30} defaultValue={initialValues.phone} autoComplete="tel" className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2.5" /></label>
      <label className="text-sm font-medium text-slate-700">Email<input name="email" type="email" required maxLength={254} defaultValue={initialValues.email} autoComplete="email" className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2.5" /></label>
      <label className="text-sm font-medium text-slate-700">Counseling type<select name="type" required className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5">{types.map((type) => <option key={type}>{type}</option>)}</select></label>
      <label className="text-sm font-medium text-slate-700">Preferred date<input name="preferredDate" type="date" required min={today} className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2.5" /></label>
      <label className="text-sm font-medium text-slate-700">Preferred time<select name="preferredSlot" required className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5">{slots.map((slot) => <option key={slot} value={slot}>{slot}</option>)}</select></label>
    </div>
    <label className="mt-4 block text-sm font-medium text-slate-700">Message (optional)<textarea name="message" maxLength={2000} rows={4} className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2.5" /></label>
    <div className="hidden" aria-hidden="true"><label>Leave this field empty<input name="website" tabIndex={-1} autoComplete="off" /></label></div>
    {status.kind !== "idle" ? <p role={status.kind === "error" ? "alert" : "status"} className={`mt-4 text-sm ${status.kind === "error" ? "text-rose-700" : "text-green-700"}`}>{status.message}</p> : null}
    <button disabled={busy} className="mt-5 rounded-lg bg-primary px-5 py-3 font-semibold text-white disabled:opacity-60">{busy ? "Sending..." : "Request a session"}</button>
  </form>;
}
