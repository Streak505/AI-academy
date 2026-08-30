"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function NewCoursePage() {
  const router = useRouter();
  const [form, setForm] = useState({
    title: "",
    slug: "",
    shortDescription: "",
    description: "",
    category: "",
    instructor: "",
    duration: "",
    level: "Beginner",
    mode: "Hybrid",
    price: "",
    discountPrice: "",
    isPublished: true,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setError("");

    try {
      const response = await fetch("/api/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, price: Number(form.price), discountPrice: Number(form.discountPrice || 0) }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to create course");
      }

      router.push("/admin/courses");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to create course");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <main className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-6">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-violet-600">Courses</p>
        <h1 className="mt-2 text-3xl font-bold text-slate-900">Create a new course</h1>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-5">
        <div className="grid gap-5 md:grid-cols-2">
          <input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="Course title" className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3" required />
          <input value={form.slug} onChange={(event) => setForm({ ...form, slug: event.target.value })} placeholder="Slug" className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3" required />
        </div>

        <textarea value={form.shortDescription} onChange={(event) => setForm({ ...form, shortDescription: event.target.value })} placeholder="Short description" className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3" rows={3} required />
        <textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="Description" className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3" rows={5} required />

        <div className="grid gap-5 md:grid-cols-2">
          <input value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} placeholder="Category ObjectId" className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3" required />
          <input value={form.instructor} onChange={(event) => setForm({ ...form, instructor: event.target.value })} placeholder="Instructor ObjectId" className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3" required />
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <input value={form.duration} onChange={(event) => setForm({ ...form, duration: event.target.value })} placeholder="Duration" className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3" required />
          <select value={form.level} onChange={(event) => setForm({ ...form, level: event.target.value })} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <option>Beginner</option>
            <option>Intermediate</option>
            <option>Advanced</option>
          </select>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          <select value={form.mode} onChange={(event) => setForm({ ...form, mode: event.target.value })} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <option>Online</option>
            <option>Onsite</option>
            <option>Hybrid</option>
          </select>
          <input value={form.price} onChange={(event) => setForm({ ...form, price: event.target.value })} placeholder="Price" className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3" type="number" required />
          <input value={form.discountPrice} onChange={(event) => setForm({ ...form, discountPrice: event.target.value })} placeholder="Discount price" className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3" type="number" />
        </div>

        <label className="flex items-center gap-3 text-sm font-medium text-slate-700">
          <input type="checkbox" checked={form.isPublished} onChange={(event) => setForm({ ...form, isPublished: event.target.checked })} />
          Published
        </label>

        {error ? <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p> : null}

        <div className="flex gap-3">
          <button type="submit" disabled={isSaving} className="rounded-full bg-violet-600 px-5 py-3 text-sm font-semibold text-white">
            {isSaving ? "Saving..." : "Save course"}
          </button>
          <button type="button" onClick={() => router.back()} className="rounded-full border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700">
            Cancel
          </button>
        </div>
      </form>
    </main>
  );
}
