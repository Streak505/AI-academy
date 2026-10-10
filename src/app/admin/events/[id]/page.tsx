"use client";

import { useRouter, useParams } from "next/navigation";
import { useState, useEffect } from "react";

interface Event {
  _id: string;
  title: string;
  description: string;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  capacity: number;
  registrationUrl: string;
  isPublished: boolean;
}

export default function EditEventPage() {
  const router = useRouter();
  const params = useParams();
  const eventId = params.id as string;

  const [form, setForm] = useState<Event | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadEvent() {
      try {
        const response = await fetch(`/api/events?id=${eventId}`);
        const data = await response.json();
        if (data.success && data.data?.length > 0) {
          setForm(data.data[0]);
        }
      } catch (_err) {
        setError("Failed to load event");
      } finally {
        setIsLoading(false);
      }
    }

    loadEvent();
  }, [eventId]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form) return;

    setIsSaving(true);
    setError("");

    try {
      const response = await fetch("/api/events", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, capacity: form.capacity ? Number(form.capacity) : undefined }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to update event");
      }

      router.push("/admin/events");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to update event");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    if (!form || !confirm("Are you sure you want to delete this event?")) return;

    setIsDeleting(true);
    setError("");

    try {
      const response = await fetch(`/api/events?id=${form._id}`, {
        method: "DELETE",
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to delete event");
      }

      router.push("/admin/events");
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Unable to delete event");
      setIsDeleting(false);
    }
  }

  if (isLoading) {
    return <main className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm text-center py-12">Loading...</main>;
  }

  if (!form) {
    return <main className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm text-center py-12">Event not found</main>;
  }

  return (
    <main className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-6">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-violet-600">Events</p>
        <h1 className="mt-2 text-3xl font-bold text-slate-900">Edit event</h1>
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
          <input value={form.capacity} onChange={(event) => setForm({ ...form, capacity: Number(event.target.value) })} placeholder="Capacity" type="number" className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3" />
          <input value={form.registrationUrl} onChange={(event) => setForm({ ...form, registrationUrl: event.target.value })} placeholder="Registration URL" type="url" className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3" />
        </div>

        <label className="flex items-center gap-3 text-sm font-medium text-slate-700">
          <input type="checkbox" checked={form.isPublished} onChange={(event) => setForm({ ...form, isPublished: event.target.checked })} />
          Published
        </label>

        {error ? <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p> : null}

        <div className="flex gap-3">
          <button type="submit" disabled={isSaving} className="rounded-full bg-violet-600 px-5 py-3 text-sm font-semibold text-white">
            {isSaving ? "Saving..." : "Save changes"}
          </button>
          <button type="button" onClick={handleDelete} disabled={isDeleting} className="rounded-full bg-rose-600 px-5 py-3 text-sm font-semibold text-white">
            {isDeleting ? "Deleting..." : "Delete event"}
          </button>
          <button type="button" onClick={() => router.back()} className="rounded-full border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700">
            Cancel
          </button>
        </div>
      </form>
    </main>
  );
}
