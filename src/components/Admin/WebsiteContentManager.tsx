"use client";

import { useCallback, useEffect, useState } from "react";
import { EmptyState, ErrorState, LoadingState } from "@/components/Common/DataState";

type ContentKind = "programs" | "csr" | "gallery" | "notices";
type ContentRow = Record<string, unknown> & { _id: string };
type Field = { key: string; label: string; type?: "textarea" | "number" | "select" | "checkbox" | "date"; options?: string[] };

const config: Record<ContentKind, { title: string; endpoint: string; fields: Field[] }> = {
  programs: {
    title: "Programs",
    endpoint: "/api/admin/programs",
    fields: [
      { key: "title", label: "Title" }, { key: "slug", label: "Slug" },
      { key: "group", label: "Group", type: "select", options: ["academic", "career", "entrepreneurship", "international", "professional"] },
      { key: "level", label: "Level" }, { key: "description", label: "Description", type: "textarea" }, { key: "imageUrl", label: "Image URL" },
      { key: "duration", label: "Duration" }, { key: "monthlyFee", label: "Monthly fee (PKR)", type: "number" },
      { key: "admissionFee", label: "Admission fee (PKR)", type: "number" },
      { key: "mode", label: "Mode", type: "select", options: ["Physical", "Online", "Hybrid"] },
      { key: "order", label: "Display order", type: "number" }, { key: "isPublished", label: "Published", type: "checkbox" },
    ],
  },
  csr: {
    title: "CSR initiatives",
    endpoint: "/api/admin/csr",
    fields: [
      { key: "title", label: "Title" }, { key: "description", label: "Description", type: "textarea" },
      { key: "icon", label: "Icon name" }, { key: "imageUrl", label: "Image URL" },
      { key: "order", label: "Display order", type: "number" }, { key: "isPublished", label: "Published", type: "checkbox" },
    ],
  },
  gallery: {
    title: "Gallery",
    endpoint: "/api/admin/gallery",
    fields: [
      { key: "title", label: "Title" }, { key: "caption", label: "Caption", type: "textarea" },
      { key: "category", label: "Category", type: "select", options: ["events", "workshops", "achievements", "csr"] },
      { key: "imageUrl", label: "Image URL" }, { key: "order", label: "Display order", type: "number" },
      { key: "isPublished", label: "Published", type: "checkbox" },
    ],
  },
  notices: {
    title: "Notices",
    endpoint: "/api/admin/notices",
    fields: [
      { key: "title", label: "Title" }, { key: "body", label: "Notice", type: "textarea" },
      { key: "audience", label: "Audience", type: "select", options: ["all", "students", "parents", "program"] },
      { key: "program", label: "Program ID" }, { key: "publishedAt", label: "Publish date", type: "date" },
      { key: "expiresAt", label: "Expiry date", type: "date" }, { key: "pinned", label: "Pinned", type: "checkbox" },
    ],
  },
};

export default function WebsiteContentManager({ kind }: { kind: ContentKind }) {
  const settings = config[kind];
  const [items, setItems] = useState<ContentRow[]>([]);
  const [form, setForm] = useState<Record<string, string | boolean>>({});
  const [editingId, setEditingId] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`${settings.endpoint}?page=${page}&limit=20`, { cache: "no-store" });
      const payload = await response.json();
      if (!response.ok || !payload.success) throw new Error(payload.message || `Unable to load ${settings.title.toLowerCase()}.`);
      setItems(payload.data.items);
      setPages(payload.data.pagination.pages);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load content.");
    } finally {
      setLoading(false);
    }
  }, [settings.endpoint, settings.title, page]);

  useEffect(() => { void load(); }, [load]);

  function emptyForm() {
    return Object.fromEntries(settings.fields.map((field) => [
      field.key,
      field.type === "checkbox" ? field.key !== "pinned" : field.type === "number" ? "0" : "",
    ]));
  }

  function startCreate() {
    setEditingId("");
    setForm(emptyForm());
    if (kind === "programs") setForm((current) => ({ ...current, mode: "Physical", group: "academic" }));
    if (kind === "gallery") setForm((current) => ({ ...current, category: "events" }));
    setFiles([]);
    setMessage("");
    setFormOpen(true);
  }

  function startEdit(item: ContentRow) {
    setEditingId(item._id);
    setForm(Object.fromEntries(settings.fields.map((field) => {
      const value = item[field.key];
      return [field.key, field.type === "checkbox" ? Boolean(value) : field.type === "date" ? String(value ?? "").slice(0, 10) : String(value ?? "")];
    })));
    setFiles([]);
    setMessage("");
    setFormOpen(true);
  }

  async function upload(file: File) {
    const body = new FormData();
    body.set("file", file);
    const response = await fetch("/api/admin/gallery/upload", { method: "POST", body });
    const payload = await response.json();
    if (!response.ok || !payload.success) throw new Error(payload.message || `Unable to upload ${file.name}.`);
    return String(payload.data.url);
  }

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      const createContent = async (values: Record<string, unknown>) => {
        const response = await fetch(settings.endpoint, {
          method: editingId ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(editingId ? { ...values, id: editingId } : values),
        });
        const payload = await response.json();
        if (!response.ok || !payload.success) throw new Error(payload.message || "Unable to save content.");
      };

      const values: Record<string, unknown> = { ...form };
      for (const field of settings.fields) if (field.type === "number") values[field.key] = Number(values[field.key]);
      if (kind === "programs" && typeof values.features === "string") {
        values.features = (values.features as string).split("\n").map((value) => value.trim()).filter(Boolean);
      }

      if (kind === "gallery" && files.length > 1 && !editingId) {
        for (let index = 0; index < files.length; index += 1) {
          const file = files[index];
          await createContent({
            title: file.name.replace(/\.[^.]+$/, ""),
            caption: values.caption ?? "",
            category: values.category,
            imageUrl: await upload(file),
            order: Number(values.order ?? 0) + index,
            isPublished: values.isPublished,
          });
        }
      } else {
        if (files.length > 1) throw new Error("Select one image when editing an item.");
        if (files[0]) values.imageUrl = await upload(files[0]);
        await createContent(values);
      }
      setMessage(editingId ? "Content updated." : "Content saved.");
      setFormOpen(false);
      setFiles([]);
      await load();
    } catch (saveError) {
      setMessage(saveError instanceof Error ? saveError.message : "Unable to save content.");
    } finally {
      setSaving(false);
    }
  }

  async function remove(item: ContentRow) {
    if (!window.confirm(`Delete "${String(item.title ?? "this item")}"?`)) return;
    const response = await fetch(`${settings.endpoint}?id=${encodeURIComponent(item._id)}`, { method: "DELETE" });
    const payload = await response.json();
    if (!response.ok || !payload.success) {
      setError(payload.message || "Unable to delete content.");
      return;
    }
    await load();
  }

  return (
    <main className="p-4 sm:p-6"><div className="mx-auto max-w-7xl">
      <header className="mb-6 flex flex-wrap items-start justify-between gap-4"><div><p className="text-sm font-semibold uppercase tracking-[0.2em] text-teal-700">Website content</p><h1 className="mt-1 text-3xl font-bold text-slate-950">{settings.title}</h1><p className="mt-1 text-sm text-slate-600">Changes are stored in the database and reflected on the public site.</p></div><button type="button" onClick={startCreate} className="rounded-xl bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white">Add {kind === "csr" ? "initiative" : kind === "gallery" ? "gallery item" : kind === "notices" ? "notice" : "program"}</button></header>
      {message && !formOpen ? <p role="status" className="mb-4 rounded-lg bg-teal-50 p-3 text-sm text-teal-900">{message}</p> : null}
      {loading ? <LoadingState label={`Loading ${settings.title.toLowerCase()}`} /> : error ? <ErrorState message={error} onRetry={() => void load()} /> : items.length === 0 ? <EmptyState title={`No ${settings.title.toLowerCase()} yet`} message={`Create the first ${kind === "csr" ? "initiative" : kind === "gallery" ? "gallery item" : kind === "notices" ? "notice" : "program"}.`} /> : (
        <>
          <section className="overflow-x-auto rounded-2xl border border-slate-200 bg-white"><table className="min-w-[700px] w-full text-left text-sm"><thead className="bg-slate-50"><tr>{["Title", "Details", "Order", "Visibility", "Actions"].map((header) => <th key={header} className="px-4 py-3 font-semibold">{header}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">{items.map((item) => <tr key={item._id}><td className="px-4 py-3 font-semibold">{String(item.title ?? "")}</td><td className="max-w-sm truncate px-4 py-3 text-slate-600">{kind === "programs" ? `${String(item.group)} · PKR ${item.monthlyFee}/month` : kind === "gallery" ? `${String(item.category)} · ${String(item.imageUrl ?? "")}` : String(item.description ?? item.body ?? item.audience ?? "")}</td><td className="px-4 py-3">{String(item.order ?? 0)}</td><td className="px-4 py-3">{kind === "notices" ? (item.pinned ? "Pinned" : "Standard") : item.isPublished ? "Published" : "Hidden"}</td><td className="px-4 py-3"><div className="flex gap-3"><button type="button" onClick={() => startEdit(item)} className="font-semibold text-teal-800 underline">Edit</button><button type="button" onClick={() => void remove(item)} className="font-semibold text-rose-700 underline">Delete</button></div></td></tr>)}</tbody></table></section>
          <div className="mt-4 flex items-center justify-between text-sm"><span>Page {page} of {pages}</span><div className="flex gap-2"><button disabled={page <= 1} onClick={() => setPage((current) => current - 1)} className="rounded-lg border bg-white px-3 py-2 disabled:opacity-40">Previous</button><button disabled={page >= pages} onClick={() => setPage((current) => current + 1)} className="rounded-lg border bg-white px-3 py-2 disabled:opacity-40">Next</button></div></div>
        </>
      )}
      {formOpen && <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/50 p-4" role="dialog" aria-modal="true" aria-labelledby="content-form-title"><form onSubmit={save} className="mx-auto my-8 grid max-w-3xl gap-4 rounded-2xl bg-white p-5 sm:grid-cols-2"><h2 id="content-form-title" className="text-xl font-bold sm:col-span-2">{editingId ? "Edit" : "Add"} {kind === "csr" ? "initiative" : kind === "gallery" ? "gallery item" : kind === "notices" ? "notice" : "program"}</h2>
        {settings.fields.map((field) => <label key={field.key} className={`text-sm font-medium text-slate-700 ${field.type === "textarea" || field.key === "description" || field.key === "body" ? "sm:col-span-2" : ""}`}>{field.label}{field.type === "checkbox" ? <input type="checkbox" checked={Boolean(form[field.key])} onChange={(event) => setForm({ ...form, [field.key]: event.target.checked })} className="ml-2 h-4 w-4" /> : field.type === "select" ? <select required value={String(form[field.key] ?? "")} onChange={(event) => setForm({ ...form, [field.key]: event.target.value })} className="mt-1 block w-full rounded-lg border px-3 py-2">{field.options?.map((option) => <option key={option}>{option}</option>)}</select> : field.type === "textarea" ? <textarea required={field.key === "description" || field.key === "body"} value={String(form[field.key] ?? "")} onChange={(event) => setForm({ ...form, [field.key]: event.target.value })} rows={4} className="mt-1 block w-full rounded-lg border px-3 py-2" /> : <input required={["title", "slug", "monthlyFee", "admissionFee"].includes(field.key)} type={field.type === "number" ? "number" : field.type === "date" ? "date" : "text"} min={field.type === "number" ? 0 : undefined} value={String(form[field.key] ?? "")} onChange={(event) => setForm({ ...form, [field.key]: event.target.value })} className="mt-1 block w-full rounded-lg border px-3 py-2" />}</label>)}
        {(kind === "gallery" || kind === "csr" || kind === "programs") && <label className="text-sm font-medium text-slate-700 sm:col-span-2">Upload image{kind === "gallery" && !editingId ? " (select multiple files for bulk upload)" : ""}<input type="file" accept="image/jpeg,image/png,image/webp" multiple={kind === "gallery" && !editingId} onChange={(event) => setFiles(Array.from(event.target.files ?? []))} className="mt-1 block w-full rounded-lg border px-3 py-2" /></label>}
        {message && formOpen ? <p role="alert" className="rounded-lg bg-rose-50 p-3 text-sm text-rose-800 sm:col-span-2">{message}</p> : null}
        <div className="flex justify-end gap-2 sm:col-span-2"><button type="button" onClick={() => setFormOpen(false)} className="rounded-lg border px-4 py-2">Cancel</button><button disabled={saving} className="rounded-lg bg-teal-700 px-4 py-2 font-semibold text-white disabled:opacity-50">{saving ? "Saving..." : "Save"}</button></div>
      </form></div>}
    </div></main>
  );
}
