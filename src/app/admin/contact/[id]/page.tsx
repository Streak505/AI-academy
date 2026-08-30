"use client";

import { useRouter, useParams } from "next/navigation";
import { useState, useEffect } from "react";

interface Message {
  _id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: string;
  createdAt: string;
}

export default function EditContactPage() {
  const router = useRouter();
  const params = useParams();
  const msgId = params.id as string;

  const [form, setForm] = useState<Message | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadMessage() {
      try {
        const response = await fetch(`/api/contact?id=${msgId}`);
        const data = await response.json();
        if (data.success && data.data?.length > 0) {
          setForm(data.data[0]);
        }
      } catch (err) {
        setError("Failed to load message");
      } finally {
        setIsLoading(false);
      }
    }

    loadMessage();
  }, [msgId]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form) return;

    setIsSaving(true);
    setError("");

    try {
      const response = await fetch("/api/contact", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to update message");
      }

      router.push("/admin/contact");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to update message");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    if (!form || !confirm("Are you sure you want to delete this message?")) return;

    setIsDeleting(true);
    setError("");

    try {
      const response = await fetch(`/api/contact?id=${form._id}`, {
        method: "DELETE",
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to delete message");
      }

      router.push("/admin/contact");
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Unable to delete message");
      setIsDeleting(false);
    }
  }

  if (isLoading) {
    return <main className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm text-center py-12">Loading...</main>;
  }

  if (!form) {
    return <main className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm text-center py-12">Message not found</main>;
  }

  return (
    <main className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-6">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-violet-600">Contact</p>
        <h1 className="mt-2 text-3xl font-bold text-slate-900">View message</h1>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-5">
        <div className="grid gap-5 md:grid-cols-2">
          <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Name" className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3" required />
          <input value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} placeholder="Email" type="email" className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3" required />
        </div>

        <input value={form.subject} onChange={(event) => setForm({ ...form, subject: event.target.value })} placeholder="Subject" className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3" required />

        <textarea value={form.message} onChange={(event) => setForm({ ...form, message: event.target.value })} placeholder="Message" className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3" rows={6} required />

        <select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
          <option>Unread</option>
          <option>Read</option>
        </select>

        {error ? <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p> : null}

        <div className="flex gap-3">
          <button type="submit" disabled={isSaving} className="rounded-full bg-violet-600 px-5 py-3 text-sm font-semibold text-white">
            {isSaving ? "Saving..." : "Save changes"}
          </button>
          <button type="button" onClick={handleDelete} disabled={isDeleting} className="rounded-full bg-rose-600 px-5 py-3 text-sm font-semibold text-white">
            {isDeleting ? "Deleting..." : "Delete message"}
          </button>
          <button type="button" onClick={() => router.back()} className="rounded-full border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700">
            Cancel
          </button>
        </div>
      </form>
    </main>
  );
}
