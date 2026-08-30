"use client";

import { useRouter, useParams } from "next/navigation";
import { useState, useEffect } from "react";

interface Course {
  _id: string;
  title: string;
  slug: string;
  shortDescription: string;
  description: string;
  category: string;
  instructor: string;
  duration: string;
  level: string;
  mode: string;
  price: number;
  discountPrice: number;
  isPublished: boolean;
}

export default function EditCoursePage() {
  const router = useRouter();
  const params = useParams();
  const courseId = params.id as string;

  const [form, setForm] = useState<Course | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadCourse() {
      try {
        const response = await fetch(`/api/courses?id=${courseId}`);
        const data = await response.json();
        if (data.success && data.data?.length > 0) {
          setForm(data.data[0]);
        }
      } catch (err) {
        setError("Failed to load course");
      } finally {
        setIsLoading(false);
      }
    }

    loadCourse();
  }, [courseId]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form) return;

    setIsSaving(true);
    setError("");

    try {
      const response = await fetch("/api/courses", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, price: Number(form.price), discountPrice: Number(form.discountPrice || 0) }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to update course");
      }

      router.push("/admin/courses");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to update course");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    if (!form || !confirm("Are you sure you want to delete this course?")) return;

    setIsDeleting(true);
    setError("");

    try {
      const response = await fetch(`/api/courses?id=${form._id}`, {
        method: "DELETE",
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to delete course");
      }

      router.push("/admin/courses");
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Unable to delete course");
      setIsDeleting(false);
    }
  }

  if (isLoading) {
    return <main className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm text-center py-12">Loading...</main>;
  }

  if (!form) {
    return <main className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm text-center py-12">Course not found</main>;
  }

  return (
    <main className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-6">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-violet-600">Courses</p>
        <h1 className="mt-2 text-3xl font-bold text-slate-900">Edit course</h1>
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
          <input value={form.price} onChange={(event) => setForm({ ...form, price: Number(event.target.value) })} placeholder="Price" className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3" type="number" required />
          <input value={form.discountPrice} onChange={(event) => setForm({ ...form, discountPrice: Number(event.target.value) })} placeholder="Discount price" className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3" type="number" />
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
            {isDeleting ? "Deleting..." : "Delete course"}
          </button>
          <button type="button" onClick={() => router.back()} className="rounded-full border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700">
            Cancel
          </button>
        </div>
      </form>
    </main>
  );
}
