"use client";

import { useRouter, useParams } from "next/navigation";
import { useState, useEffect } from "react";

interface Application {
  _id: string;
  applicantName: string;
  email: string;
  phone: string;
  course: string;
  qualifications: string;
  status: string;
  submittedAt: string;
}

export default function EditApplicationPage() {
  const router = useRouter();
  const params = useParams();
  const appId = params.id as string;

  const [form, setForm] = useState<Application | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadApplication() {
      try {
        const response = await fetch(`/api/applications?id=${appId}`);
        const data = await response.json();
        if (data.success && data.data?.length > 0) {
          setForm(data.data[0]);
        }
      } catch (_err) {
        setError("Failed to load application");
      } finally {
        setIsLoading(false);
      }
    }

    loadApplication();
  }, [appId]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form) return;

    setIsSaving(true);
    setError("");

    try {
      const response = await fetch("/api/applications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to update application");
      }

      router.push("/admin/applications");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to update application");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    if (!form || !confirm("Are you sure you want to delete this application?")) return;

    setIsDeleting(true);
    setError("");

    try {
      const response = await fetch(`/api/applications?id=${form._id}`, {
        method: "DELETE",
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to delete application");
      }

      router.push("/admin/applications");
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Unable to delete application");
      setIsDeleting(false);
    }
  }

  if (isLoading) {
    return <main className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm text-center py-12">Loading...</main>;
  }

  if (!form) {
    return <main className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm text-center py-12">Application not found</main>;
  }

  return (
    <main className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-6">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-violet-600">Applications</p>
        <h1 className="mt-2 text-3xl font-bold text-slate-900">Review application</h1>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-5">
        <div className="grid gap-5 md:grid-cols-2">
          <input value={form.applicantName} onChange={(event) => setForm({ ...form, applicantName: event.target.value })} placeholder="Applicant name" className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3" required />
          <input value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} placeholder="Email" type="email" className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3" required />
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <input value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} placeholder="Phone" className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3" required />
          <input value={form.course} onChange={(event) => setForm({ ...form, course: event.target.value })} placeholder="Course" className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3" required />
        </div>

        <textarea value={form.qualifications} onChange={(event) => setForm({ ...form, qualifications: event.target.value })} placeholder="Qualifications" className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3" rows={4} />

        <select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
          <option>Pending</option>
          <option>Approved</option>
          <option>Rejected</option>
        </select>

        {error ? <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p> : null}

        <div className="flex gap-3">
          <button type="submit" disabled={isSaving} className="rounded-full bg-violet-600 px-5 py-3 text-sm font-semibold text-white">
            {isSaving ? "Saving..." : "Save changes"}
          </button>
          <button type="button" onClick={handleDelete} disabled={isDeleting} className="rounded-full bg-rose-600 px-5 py-3 text-sm font-semibold text-white">
            {isDeleting ? "Deleting..." : "Delete application"}
          </button>
          <button type="button" onClick={() => router.back()} className="rounded-full border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700">
            Cancel
          </button>
        </div>
      </form>
    </main>
  );
}
