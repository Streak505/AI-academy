"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { EmptyState, ErrorState, LoadingState } from "@/components/Common/DataState";

type StudentRow = {
  _id: string;
  regNo: string;
  fullName: string;
  fatherName: string;
  phone: string;
  classLevel: string;
  status: string;
  program: { _id: string; title: string } | string;
  guardian?: { _id: string; name: string; email: string } | string | null;
  concession: { type: string; percent: number; note: string };
};
type SelectOption = { id: string; title?: string; name?: string; email?: string };
type StudentForm = {
  regNo: string;
  fullName: string;
  fatherName: string;
  phone: string;
  classLevel: string;
  program: string;
  guardian: string;
  status: string;
  concessionType: string;
  concessionPercent: string;
  concessionNote: string;
};

const blankForm: StudentForm = {
  regNo: "", fullName: "", fatherName: "", phone: "", classLevel: "",
  program: "", guardian: "", status: "active", concessionType: "none", concessionPercent: "0", concessionNote: "",
};

function getId(value: StudentRow["program"] | StudentRow["guardian"]) {
  if (typeof value === "string" || !value) return value ?? "";
  return value._id;
}

export default function StudentManagement() {
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [programs, setPrograms] = useState<SelectOption[]>([]);
  const [guardians, setGuardians] = useState<SelectOption[]>([]);
  const [search, setSearch] = useState("");
  const [program, setProgram] = useState("");
  const [status, setStatus] = useState("");
  const [concession, setConcession] = useState("");
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState<StudentForm>(blankForm);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [promotionFrom, setPromotionFrom] = useState("");
  const [promotionTo, setPromotionTo] = useState("");
  const [promotionPreview, setPromotionPreview] = useState<Array<{ id: string; regNo: string; fullName: string }> | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    const query = new URLSearchParams({ page: String(page), limit: "20" });
    if (search.trim()) query.set("search", search.trim());
    if (program) query.set("program", program);
    if (status) query.set("status", status);
    if (concession) query.set("concession", concession);
    try {
      const response = await fetch(`/api/admin/students?${query}`, { cache: "no-store" });
      const payload = await response.json();
      if (!response.ok || !payload.success) throw new Error(payload.message || "Unable to load students.");
      setStudents(payload.data.students);
      setPrograms(payload.data.programs);
      setGuardians(payload.data.guardians);
      setPages(payload.data.pagination.pages);
      setTotal(payload.data.pagination.total);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load students.");
    } finally {
      setLoading(false);
    }
  }, [page, search, program, status, concession]);

  useEffect(() => { void load(); }, [load]);

  function startEdit(student: StudentRow) {
    setFormOpen(true);
    setEditingId(student._id);
    setForm({
      regNo: student.regNo,
      fullName: student.fullName,
      fatherName: student.fatherName,
      phone: student.phone,
      classLevel: student.classLevel,
      program: getId(student.program),
      guardian: getId(student.guardian),
      status: student.status,
      concessionType: student.concession?.type ?? "none",
      concessionPercent: String(student.concession?.percent ?? 0),
      concessionNote: student.concession?.note ?? "",
    });
  }

  function newStudent() {
    setEditingId("");
    setForm(blankForm);
    setFormOpen(true);
  }

  async function submitStudent(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    const body = {
      regNo: form.regNo,
      fullName: form.fullName,
      fatherName: form.fatherName,
      phone: form.phone,
      classLevel: form.classLevel,
      program: form.program,
      guardian: form.guardian || null,
      status: form.status,
      concession: { type: form.concessionType, percent: Number(form.concessionPercent), note: form.concessionNote },
    };
    try {
      const response = await fetch(editingId ? `/api/admin/students/${editingId}` : "/api/admin/students", {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingId ? { ...body, regNo: undefined } : body),
      });
      const payload = await response.json();
      if (!response.ok || !payload.success) throw new Error(payload.message || "Unable to save student.");
      setForm(blankForm);
      setEditingId("");
      setFormOpen(false);
      setMessage(editingId ? "Student updated." : "Student created.");
      await load();
    } catch (saveError) {
      setMessage(saveError instanceof Error ? saveError.message : "Unable to save student.");
    } finally {
      setSaving(false);
    }
  }

  async function setStudentStatus(student: StudentRow) {
    const nextStatus = student.status === "active" ? "inactive" : "active";
    const response = await fetch(`/api/admin/students/${student._id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: nextStatus }),
    });
    const payload = await response.json();
    if (!response.ok || !payload.success) {
      setError(payload.message || "Unable to change student status.");
      return;
    }
    await load();
  }

  async function previewPromotion() {
    setMessage("");
    setPromotionPreview(null);
    const response = await fetch("/api/admin/students/bulk-promote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fromClass: promotionFrom, toClass: promotionTo }),
    });
    const payload = await response.json();
    if (!response.ok || !payload.success) {
      setMessage(payload.message || "Unable to preview promotion.");
      return;
    }
    setPromotionPreview(payload.data.preview);
  }

  async function confirmPromotion() {
    const response = await fetch("/api/admin/students/bulk-promote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fromClass: promotionFrom, toClass: promotionTo, confirmed: true, studentIds: promotionPreview?.map((student) => student.id) ?? [] }),
    });
    const payload = await response.json();
    if (!response.ok || !payload.success) {
      setMessage(payload.message || "Unable to promote this class.");
      return;
    }
    setMessage(`${payload.data.promoted} students promoted.`);
    setPromotionPreview(null);
    await load();
  }

  const csvQuery = new URLSearchParams({ format: "csv" });
  if (search.trim()) csvQuery.set("search", search.trim());
  if (program) csvQuery.set("program", program);
  if (status) csvQuery.set("status", status);
  if (concession) csvQuery.set("concession", concession);

  return (
    <main className="p-4 sm:p-6">
      <div className="mx-auto max-w-7xl">
        <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div><p className="text-sm font-semibold uppercase tracking-[0.2em] text-teal-700">Student management</p><h1 className="mt-1 text-3xl font-bold text-slate-950">Students</h1><p className="mt-1 text-sm text-slate-600">{total} records</p></div>
          <div className="flex flex-wrap gap-2">
            <a href={`/api/admin/students?${csvQuery}`} className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700">Export CSV</a>
            <button type="button" onClick={newStudent} className="rounded-xl bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white">Add student</button>
          </div>
        </header>

        {message ? <p className="mb-4 rounded-xl bg-teal-50 p-3 text-sm text-teal-900" role="status">{message}</p> : null}

        <section className="mb-5 rounded-2xl border border-slate-200 bg-white p-4">
          <h2 className="font-semibold text-slate-900">Bulk promote class</h2>
          <div className="mt-3 flex flex-wrap items-end gap-3">
            <label className="text-sm">From class<input value={promotionFrom} onChange={(event) => setPromotionFrom(event.target.value)} className="mt-1 block w-40 rounded-lg border border-slate-300 px-3 py-2" placeholder="Class 8" /></label>
            <label className="text-sm">To class<input value={promotionTo} onChange={(event) => setPromotionTo(event.target.value)} className="mt-1 block w-40 rounded-lg border border-slate-300 px-3 py-2" placeholder="Class 9" /></label>
            <button type="button" onClick={previewPromotion} className="rounded-lg border border-teal-700 px-4 py-2 text-sm font-semibold text-teal-800">Preview</button>
          </div>
          {promotionPreview ? <div className="mt-4 rounded-xl bg-amber-50 p-4">
            <p className="font-semibold text-amber-900">Promote {promotionPreview.length} active students from {promotionFrom} to {promotionTo}?</p>
            <ul className="mt-2 max-h-32 overflow-y-auto text-sm text-slate-700">{promotionPreview.map((student) => <li key={student.id}>{student.regNo} — {student.fullName}</li>)}</ul>
            <div className="mt-3 flex gap-2"><button type="button" onClick={confirmPromotion} className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-semibold text-white">Confirm promotion</button><button type="button" onClick={() => setPromotionPreview(null)} className="rounded-lg border px-4 py-2 text-sm">Cancel</button></div>
          </div> : null}
        </section>

        <section className="mb-5 grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-4">
          <label className="text-sm font-medium text-slate-700">Search<input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Name, registration no., phone" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" /></label>
          <label className="text-sm font-medium text-slate-700">Program<select value={program} onChange={(event) => { setProgram(event.target.value); setPage(1); }} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"><option value="">All programs</option>{programs.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select></label>
          <label className="text-sm font-medium text-slate-700">Status<select value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"><option value="">All statuses</option><option value="active">Active</option><option value="inactive">Inactive</option><option value="alumni">Alumni</option></select></label>
          <label className="text-sm font-medium text-slate-700">Concession<select value={concession} onChange={(event) => { setConcession(event.target.value); setPage(1); }} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"><option value="">All concession types</option><option value="orphan">Orphan</option><option value="widow_child">Widow's child</option><option value="merit">Merit</option><option value="other">Other</option><option value="none">None</option></select></label>
        </section>

        {loading ? <LoadingState label="Loading students" /> : error ? <ErrorState message={error} onRetry={() => void load()} /> : students.length === 0 ? <EmptyState title="No students found" message="Try changing the filters or add a student record." /> : (
          <>
            <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
              <table className="min-w-[850px] w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-600"><tr>{["Student", "Reg. no.", "Program / class", "Phone", "Concession", "Status", "Actions"].map((heading) => <th key={heading} className="px-4 py-3 font-semibold">{heading}</th>)}</tr></thead>
                <tbody className="divide-y divide-slate-100">{students.map((student) => (
                  <tr key={student._id}>
                    <td className="px-4 py-3"><p className="font-semibold text-slate-900">{student.fullName}</p><p className="text-xs text-slate-500">Guardian: {typeof student.guardian === "object" && student.guardian ? student.guardian.name : "Not linked"}</p></td>
                    <td className="px-4 py-3">{student.regNo}</td>
                    <td className="px-4 py-3">{typeof student.program === "object" ? student.program?.title : "—"}<p className="text-xs text-slate-500">{student.classLevel}</p></td>
                    <td className="px-4 py-3">{student.phone}</td>
                    <td className="px-4 py-3">{student.concession?.type ?? "none"} ({student.concession?.percent ?? 0}%)</td>
                    <td className="px-4 py-3 capitalize">{student.status}</td>
                    <td className="px-4 py-3"><div className="flex gap-3"><Link href={`/admin/students/${student._id}`} className="font-semibold text-teal-800 underline">Profile</Link><button type="button" onClick={() => startEdit(student)} className="font-semibold text-slate-700 underline">Edit</button><button type="button" onClick={() => void setStudentStatus(student)} className="font-semibold text-rose-700 underline">{student.status === "active" ? "Deactivate" : "Reactivate"}</button></div></td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
            <div className="mt-4 flex items-center justify-between text-sm"><span>Page {page} of {pages}</span><div className="flex gap-2"><button disabled={page <= 1} onClick={() => setPage((current) => current - 1)} className="rounded-lg border bg-white px-3 py-2 disabled:opacity-40">Previous</button><button disabled={page >= pages} onClick={() => setPage((current) => current + 1)} className="rounded-lg border bg-white px-3 py-2 disabled:opacity-40">Next</button></div></div>
          </>
        )}

        {formOpen && <section className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/50 p-4" role="dialog" aria-modal="true" aria-labelledby="student-form-title">
          <form onSubmit={submitStudent} className="mx-auto my-8 grid max-w-2xl gap-4 rounded-2xl bg-white p-5 shadow-xl sm:grid-cols-2">
            <div className="sm:col-span-2"><h2 id="student-form-title" className="text-xl font-bold">{editingId ? "Edit student" : "Create student"}</h2></div>
            {!editingId && <label className="text-sm">Registration number<input required value={form.regNo} onChange={(event) => setForm({ ...form, regNo: event.target.value })} className="mt-1 w-full rounded-lg border px-3 py-2" /></label>}
            <label className="text-sm">Student name<input required value={form.fullName} onChange={(event) => setForm({ ...form, fullName: event.target.value })} className="mt-1 w-full rounded-lg border px-3 py-2" /></label>
            <label className="text-sm">Father name<input required value={form.fatherName} onChange={(event) => setForm({ ...form, fatherName: event.target.value })} className="mt-1 w-full rounded-lg border px-3 py-2" /></label>
            <label className="text-sm">Phone<input required value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} className="mt-1 w-full rounded-lg border px-3 py-2" /></label>
            <label className="text-sm">Class<input required value={form.classLevel} onChange={(event) => setForm({ ...form, classLevel: event.target.value })} className="mt-1 w-full rounded-lg border px-3 py-2" /></label>
            <label className="text-sm">Program<select required value={form.program} onChange={(event) => setForm({ ...form, program: event.target.value })} className="mt-1 w-full rounded-lg border px-3 py-2"><option value="">Select program</option>{programs.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select></label>
            <label className="text-sm">Guardian / parent<select value={form.guardian} onChange={(event) => setForm({ ...form, guardian: event.target.value })} className="mt-1 w-full rounded-lg border px-3 py-2"><option value="">No guardian linked</option>{guardians.map((item) => <option key={item.id} value={item.id}>{item.name} ({item.email})</option>)}</select></label>
            {editingId && <label className="text-sm">Status<select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })} className="mt-1 w-full rounded-lg border px-3 py-2"><option value="active">Active</option><option value="inactive">Inactive</option><option value="alumni">Alumni</option></select></label>}
            <label className="text-sm">Concession type<select value={form.concessionType} onChange={(event) => setForm({ ...form, concessionType: event.target.value })} className="mt-1 w-full rounded-lg border px-3 py-2"><option value="none">None</option><option value="orphan">Orphan</option><option value="widow_child">Widow's child</option><option value="merit">Merit</option><option value="other">Other</option></select></label>
            <label className="text-sm">Discount percent<input type="number" min="0" max="100" step="1" value={form.concessionPercent} onChange={(event) => setForm({ ...form, concessionPercent: event.target.value })} className="mt-1 w-full rounded-lg border px-3 py-2" /></label>
            <label className="text-sm sm:col-span-2">Concession note<textarea value={form.concessionNote} onChange={(event) => setForm({ ...form, concessionNote: event.target.value })} className="mt-1 w-full rounded-lg border px-3 py-2" maxLength={1000} rows={2} /></label>
            <div className="flex justify-end gap-2 sm:col-span-2"><button type="button" onClick={() => setFormOpen(false)} className="rounded-lg border px-4 py-2">Cancel</button><button disabled={saving} className="rounded-lg bg-teal-700 px-4 py-2 font-semibold text-white disabled:opacity-50">{saving ? "Saving..." : "Save student"}</button></div>
          </form>
        </section>}
      </div>
    </main>
  );
}
