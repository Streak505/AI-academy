"use client";

import { useRouter, useParams } from "next/navigation";
import { useState, useEffect } from "react";

interface News {
  _id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  author: string;
  isFeatured: boolean;
  isPublished: boolean;
}

export default function EditNewsPage() {
  const router = useRouter();
  const params = useParams();
  const newsId = params.id as string;

  const [form, setForm] = useState<News | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadNews() {
      try {
        const response = await fetch(`/api/news?id=${newsId}`);
        const data = await response.json();
        if (data.success && data.data?.length > 0) {
          setForm(data.data[0]);
        }
      } catch (_err) {
        setError("Failed to load article");
      } finally {
        setIsLoading(false);
      }
    }

    loadNews();
  }, [newsId]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form) return;

    setIsSaving(true);
    setError("");

    try {
      const response = await fetch("/api/news", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to update article");
      }

      router.push("/admin/news");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to update article");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    if (!form || !confirm("Are you sure you want to delete this article?")) return;

    setIsDeleting(true);
    setError("");

    try {
      const response = await fetch(`/api/news?id=${form._id}`, {
        method: "DELETE",
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to delete article");
      }

      router.push("/admin/news");
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Unable to delete article");
      setIsDeleting(false);
    }
  }

  if (isLoading) {
    return <main className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm text-center py-12">Loading...</main>;
  }

  if (!form) {
    return <main className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm text-center py-12">Article not found</main>;
  }

  return (
    <main className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-6">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-violet-600">News</p>
        <h1 className="mt-2 text-3xl font-bold text-slate-900">Edit article</h1>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-5">
        <div className="grid gap-5 md:grid-cols-2">
          <input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="Article title" className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3" required />
          <input value={form.slug} onChange={(event) => setForm({ ...form, slug: event.target.value })} placeholder="Slug" className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3" />
        </div>

        <input value={form.author} onChange={(event) => setForm({ ...form, author: event.target.value })} placeholder="Author" className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3" />

        <textarea value={form.excerpt} onChange={(event) => setForm({ ...form, excerpt: event.target.value })} placeholder="Short excerpt" className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3" rows={2} />

        <textarea value={form.content} onChange={(event) => setForm({ ...form, content: event.target.value })} placeholder="Full article content" className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3" rows={8} required />

        <div className="grid gap-5 md:grid-cols-2">
          <label className="flex items-center gap-3 text-sm font-medium text-slate-700">
            <input type="checkbox" checked={form.isFeatured} onChange={(event) => setForm({ ...form, isFeatured: event.target.checked })} />
            Featured
          </label>
          <label className="flex items-center gap-3 text-sm font-medium text-slate-700">
            <input type="checkbox" checked={form.isPublished} onChange={(event) => setForm({ ...form, isPublished: event.target.checked })} />
            Published
          </label>
        </div>

        {error ? <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p> : null}

        <div className="flex gap-3">
          <button type="submit" disabled={isSaving} className="rounded-full bg-violet-600 px-5 py-3 text-sm font-semibold text-white">
            {isSaving ? "Saving..." : "Save changes"}
          </button>
          <button type="button" onClick={handleDelete} disabled={isDeleting} className="rounded-full bg-rose-600 px-5 py-3 text-sm font-semibold text-white">
            {isDeleting ? "Deleting..." : "Delete article"}
          </button>
          <button type="button" onClick={() => router.back()} className="rounded-full border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700">
            Cancel
          </button>
        </div>
      </form>
    </main>
  );
}
