"use client";

import { useState } from "react";
import toast from "react-hot-toast";

export function ReviewActions({ id, isPublished, isFeatured }: { id: string; isPublished: boolean; isFeatured: boolean }) {
  const [saving, setSaving] = useState(false);
  async function update(values: Record<string, boolean>) {
    setSaving(true);
    try {
      const response = await fetch("/api/reviews", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, ...values }) });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.message || "Unable to update review");
      toast.success("Review updated");
      window.location.reload();
    } catch (error) { toast.error(error instanceof Error ? error.message : "Unable to update review"); } finally { setSaving(false); }
  }
  async function remove() {
    if (!window.confirm("Delete this review permanently?")) return;
    setSaving(true);
    try {
      const response = await fetch(`/api/reviews?id=${id}`, { method: "DELETE" });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.message || "Unable to delete review");
      toast.success("Review deleted");
      window.location.reload();
    } catch (error) { toast.error(error instanceof Error ? error.message : "Unable to delete review"); } finally { setSaving(false); }
  }
  return <div className="flex flex-wrap gap-2"><button disabled={saving} onClick={() => update({ isPublished: !isPublished })} className="rounded-lg bg-teal-700 px-3 py-2 text-xs font-semibold text-white disabled:opacity-60">{isPublished ? "Unpublish" : "Publish"}</button><button disabled={saving || !isPublished} onClick={() => update({ isFeatured: !isFeatured })} className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 disabled:opacity-60">{isFeatured ? "Unfeature" : "Feature"}</button><button disabled={saving} onClick={remove} className="rounded-lg border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-700 disabled:opacity-60">Delete</button></div>;
}
