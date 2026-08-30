"use client";

import { useRouter, useParams } from "next/navigation";
import { useState, useEffect } from "react";

interface Category {
  _id: string;
  name: string;
  slug: string;
  description: string;
  image: string;
  isActive: boolean;
}

export default function EditCategoryPage() {
  const router = useRouter();
  const params = useParams();
  const categoryId = params.id as string;

  const [form, setForm] = useState<Category | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadCategory() {
      try {
        const response = await fetch(`/api/categories?id=${categoryId}`);
        const data = await response.json();
        if (data.success && data.data?.length > 0) {
          setForm(data.data[0]);
        }
      } catch (err) {
        setError("Failed to load category");
      } finally {
        setIsLoading(false);
      }
    }

    loadCategory();
  }, [categoryId]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form) return;

    setIsSaving(true);
    setError("");

    try {
      const response = await fetch("/api/categories", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to update category");
      }

      router.push("/admin/categories");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to update category");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    if (!form || !confirm("Are you sure you want to delete this category?")) return;

    setIsDeleting(true);
    setError("");

    try {
      const response = await fetch(`/api/categories?id=${form._id}`, {
        method: "DELETE",
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to delete category");
      }

      router.push("/admin/categories");
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Unable to delete category");
      setIsDeleting(false);
    }
  }

  if (isLoading) {
    return <main className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm text-center py-12">Loading...</main>;
  }

  if (!form) {
    return <main className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm text-center py-12">Category not found</main>;
  }

  return (
    <main className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-6">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-violet-600">Categories</p>
        <h1 className="mt-2 text-3xl font-bold text-slate-900">Edit category</h1>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-5">
        <div className="grid gap-5 md:grid-cols-2">
          <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Category name" className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3" required />
          <input value={form.slug} onChange={(event) => setForm({ ...form, slug: event.target.value })} placeholder="Slug" className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3" required />
        </div>

        <textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="Description" className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3" rows={3} />

        <input value={form.image} onChange={(event) => setForm({ ...form, image: event.target.value })} placeholder="Image path" className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3" />

        <label className="flex items-center gap-3 text-sm font-medium text-slate-700">
          <input type="checkbox" checked={form.isActive} onChange={(event) => setForm({ ...form, isActive: event.target.checked })} />
          Active
        </label>

        {error ? <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p> : null}

        <div className="flex gap-3">
          <button type="submit" disabled={isSaving} className="rounded-full bg-violet-600 px-5 py-3 text-sm font-semibold text-white">
            {isSaving ? "Saving..." : "Save changes"}
          </button>
          <button type="button" onClick={handleDelete} disabled={isDeleting} className="rounded-full bg-rose-600 px-5 py-3 text-sm font-semibold text-white">
            {isDeleting ? "Deleting..." : "Delete category"}
          </button>
          <button type="button" onClick={() => router.back()} className="rounded-full border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700">
            Cancel
          </button>
        </div>
      </form>
    </main>
  );
}
