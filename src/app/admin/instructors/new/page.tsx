"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function NewInstructorPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    email: "",
    bio: "",
    specialization: "",
    qualification: "",
    experience: "",
    image: "/images/mentor/teacher1.png",
    isActive: true,
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setError("");

    try {
      let image = form.image;
      if (imageFile) {
        const uploadData = new FormData();
        uploadData.set("file", imageFile);
        const uploadResponse = await fetch("/api/admin/gallery/upload", { method: "POST", body: uploadData });
        const uploadResult = await uploadResponse.json();
        if (!uploadResponse.ok || !uploadResult.success) {
          throw new Error(uploadResult.message || "Unable to upload instructor image.");
        }
        image = String(uploadResult.data.url);
      }
      const response = await fetch("/api/instructors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, image }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to create instructor");
      }

      router.push("/admin/instructors");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to create instructor");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <main className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-6">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-violet-600">Instructors</p>
        <h1 className="mt-2 text-3xl font-bold text-slate-900">Add a mentor</h1>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-5">
        <div className="grid gap-5 md:grid-cols-2">
          <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Name" className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3" required />
          <input value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} placeholder="Email" type="email" className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3" required />
        </div>

        <textarea value={form.bio} onChange={(event) => setForm({ ...form, bio: event.target.value })} placeholder="Bio" rows={4} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3" required />

        <div className="grid gap-5 md:grid-cols-2">
          <input value={form.specialization} onChange={(event) => setForm({ ...form, specialization: event.target.value })} placeholder="Specialization" className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3" required />
          <input value={form.qualification} onChange={(event) => setForm({ ...form, qualification: event.target.value })} placeholder="Qualification" className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3" />
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <input value={form.experience} onChange={(event) => setForm({ ...form, experience: event.target.value })} placeholder="Experience" className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3" />
          <input value={form.image} onChange={(event) => setForm({ ...form, image: event.target.value })} placeholder="Image path" className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3" />
          <label className="text-sm font-medium text-slate-700">Upload instructor image
            <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => setImageFile(event.target.files?.[0] ?? null)} className="mt-1 block w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3" />
          </label>
        </div>

        <label className="flex items-center gap-3 text-sm font-medium text-slate-700">
          <input type="checkbox" checked={form.isActive} onChange={(event) => setForm({ ...form, isActive: event.target.checked })} />
          Active
        </label>

        {error ? <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p> : null}

        <div className="flex gap-3">
          <button type="submit" disabled={isSaving} className="rounded-full bg-violet-600 px-5 py-3 text-sm font-semibold text-white">
            {isSaving ? "Saving..." : "Save instructor"}
          </button>
          <button type="button" onClick={() => router.back()} className="rounded-full border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700">
            Cancel
          </button>
        </div>
      </form>
    </main>
  );
}
