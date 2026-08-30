"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function NewNewsPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    title: "",
    slug: "",
    content: "",
    excerpt: "",
    author: "",
    isFeatured: false,
    isPublished: true,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setError("");

    try {
      const response = await fetch("/api/news", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to create news article");
      }

      router.push("/admin/news");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to create news article");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <main className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-6">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-violet-600">News</p>
        <h1 className="mt-2 text-3xl font-bold text-slate-900">Write a new article</h1>
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
            {isSaving ? "Saving..." : "Publish article"}
          </button>
          <button type="button" onClick={() => router.back()} className="rounded-full border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700">
            Cancel
          </button>
        </div>
      </form>
    </main>
  );
}
