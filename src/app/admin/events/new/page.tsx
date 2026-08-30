"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function NewEventPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    title: "",
    description: "",
    date: "",
    startTime: "",
    endTime: "",
    location: "",
    capacity: "",
    registrationUrl: "",
    isPublished: true,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setError("");

    try {
      const response = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, capacity: form.capacity ? Number(form.capacity) : undefined }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to create event");
      }

      router.push("/admin/events");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to create event");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <main className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-6">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-violet-600">Events</p>
        <h1 className="mt-2 text-3xl font-bold text-slate-900">Create a new event</h1>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-5">
        <input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="Event title" className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3" required />

        <textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="Event description" className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3" rows={4} required />

        <div className="grid gap-5 md:grid-cols-3">
          <input value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} placeholder="Date" type="date" className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3" required />
          <input value={form.startTime} onChange={(event) => setForm({ ...form, startTime: event.target.value })} placeholder="Start time" type="time" className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3" />
          <input value={form.endTime} onChange={(event) => setForm({ ...form, endTime: event.target.value })} placeholder="End time" type="time" className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3" />
          <input value={form.location} onChange={(event) => setForm({ ...form, location: event.target.value })} placeholder="Location" className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3" />
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <input value={form.capacity} onChange={(event) => setForm({ ...form, capacity: event.target.value })} placeholder="Capacity" type="number" className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3" />
          <input value={form.registrationUrl} onChange={(event) => setForm({ ...form, registrationUrl: event.target.value })} placeholder="Registration URL" type="url" className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3" />
        </div>

        <label className="flex items-center gap-3 text-sm font-medium text-slate-700">
          <input type="checkbox" checked={form.isPublished} onChange={(event) => setForm({ ...form, isPublished: event.target.checked })} />
          Published
        </label>

        {error ? <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p> : null}

        <div className="flex gap-3">
          <button type="submit" disabled={isSaving} className="rounded-full bg-violet-600 px-5 py-3 text-sm font-semibold text-white">
            {isSaving ? "Saving..." : "Create event"}
          </button>
          <button type="button" onClick={() => router.back()} className="rounded-full border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700">
            Cancel
          </button>
        </div>
      </form>
    </main>
  );
}
