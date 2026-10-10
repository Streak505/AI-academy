"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { EmptyState, ErrorState, LoadingState } from "@/components/Common/DataState";
import { formatAcademyDate } from "@/utils/util";

type Program = { id: string; title: string; slug: string };
type Application = {
  _id: string;
  applicationRef?: string;
  applicant?: { studentName?: string; classApplyingFor?: string; program?: { title?: string } };
  guardian?: { name?: string; email?: string; phone?: string };
  status: string;
  submittedAt: string;
};
type ListResponse = { items: Application[]; pagination: { page: number; pages: number; total: number } };

const statuses = ["Submitted", "UnderReview", "Approved", "Rejected", "Enrolled"];
const statusClass: Record<string, string> = {
  Submitted: "bg-sky-100 text-sky-800",
  UnderReview: "bg-amber-100 text-amber-900",
  Approved: "bg-emerald-100 text-emerald-800",
  Rejected: "bg-rose-100 text-rose-800",
  Enrolled: "bg-violet-100 text-violet-800",
};

export default function ApplicationsTable({ programs }: { programs: Program[] }) {
  const [filters, setFilters] = useState({ status: "", program: "", concession: "", from: "", to: "", search: "" });
  const [page, setPage] = useState(1);
  const [data, setData] = useState<ListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [bulkStatus, setBulkStatus] = useState("UnderReview");
  const [updating, setUpdating] = useState(false);
  const query = useMemo(() => {
    const params = new URLSearchParams({ page: String(page), limit: "20" });
    Object.entries(filters).forEach(([key, value]) => { if (value) params.set(key, value); });
    return params.toString();
  }, [filters, page]);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/admissions?${query}`, { cache: "no-store" });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.message || "Unable to load applications.");
      setData(result.data);
      setSelected([]);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load applications.");
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => { void load(); }, [load]);
  function updateFilter(name: keyof typeof filters, value: string) {
    setPage(1);
    setFilters((current) => ({ ...current, [name]: value }));
  }

  async function updateSelected() {
    if (selected.length === 0) return;
    setUpdating(true);
    setError("");
    try {
      const results = await Promise.all(selected.map(async (id) => {
        const response = await fetch(`/api/admissions/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: bulkStatus }),
        });
        const result = await response.json();
        return response.ok && result.success ? null : result.message || "A selected application could not be updated.";
      }));
      const failures = results.filter(Boolean);
      if (failures.length) throw new Error(failures.join(" "));
      await load();
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "Unable to update selected applications.");
      await load();
    } finally {
      setUpdating(false);
    }
  }

  const exportUrl = `/api/admissions?${new URLSearchParams({ ...filters, export: "csv" }).toString()}`;

  return (
    <main className="p-4 sm:p-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div><p className="text-sm font-semibold uppercase tracking-[0.22em] text-violet-700">Applications</p><h1 className="mt-2 text-3xl font-bold text-slate-950">Admission applications</h1></div>
        <a href={exportUrl} className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">Export CSV</a>
      </div>

      <section className="mb-5 grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-4" aria-label="Application filters">
        <label className="text-sm font-medium">Search<input className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" value={filters.search} onChange={(event) => updateFilter("search", event.target.value)} placeholder="Name, reference, phone, email" /></label>
        <label className="text-sm font-medium">Status<select className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" value={filters.status} onChange={(event) => updateFilter("status", event.target.value)}><option value="">All statuses</option>{statuses.map((status) => <option key={status} value={status}>{status === "UnderReview" ? "Under review" : status}</option>)}</select></label>
        <label className="text-sm font-medium">Program<select className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" value={filters.program} onChange={(event) => updateFilter("program", event.target.value)}><option value="">All programs</option>{programs.map((program) => <option key={program.id} value={program.slug}>{program.title}</option>)}</select></label>
        <label className="text-sm font-medium">Concession<select className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" value={filters.concession} onChange={(event) => updateFilter("concession", event.target.value)}><option value="">All requests</option><option value="none">None</option><option value="orphan">Orphan</option><option value="widow_child">Child of widow</option><option value="merit">Merit scholarship</option><option value="other">Other</option></select></label>
        <label className="text-sm font-medium">From<input className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" type="date" value={filters.from} onChange={(event) => updateFilter("from", event.target.value)} /></label>
        <label className="text-sm font-medium">To<input className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" type="date" value={filters.to} onChange={(event) => updateFilter("to", event.target.value)} /></label>
      </section>

      {selected.length > 0 ? <div className="mb-4 flex flex-wrap items-center gap-3 rounded-xl bg-teal-50 p-3"><span className="text-sm font-semibold">{selected.length} selected</span><select aria-label="Bulk status" className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm" value={bulkStatus} onChange={(event) => setBulkStatus(event.target.value)}><option value="UnderReview">Under review</option><option value="Approved">Approved</option><option value="Rejected">Rejected</option></select><button type="button" onClick={updateSelected} disabled={updating} className="rounded-lg bg-teal-800 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{updating ? "Updating…" : "Apply status to selected"}</button></div> : null}
      {error ? <div className="mb-4"><ErrorState message={error} onRetry={load} /></div> : null}
      {loading ? <LoadingState label="Loading applications" /> : error ? null : !data?.items.length ? <EmptyState title="No applications found" message="Try changing the filters or check back when a new application is submitted." /> : (
        <>
          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
            <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
              <thead className="bg-slate-50"><tr><th className="px-4 py-3"><input aria-label="Select all on this page" type="checkbox" checked={data.items.length > 0 && selected.length === data.items.length} onChange={(event) => setSelected(event.target.checked ? data.items.map((application) => application._id) : [])} /></th><th className="px-4 py-3 font-semibold">Student / reference</th><th className="px-4 py-3 font-semibold">Guardian</th><th className="px-4 py-3 font-semibold">Program</th><th className="px-4 py-3 font-semibold">Status</th><th className="px-4 py-3 font-semibold">Submitted</th><th className="px-4 py-3 font-semibold">Details</th></tr></thead>
              <tbody className="divide-y divide-slate-100">
                {data.items.map((application) => (
                  <tr key={application._id}>
                    <td className="px-4 py-3"><input aria-label={`Select ${application.applicant?.studentName || "application"}`} type="checkbox" checked={selected.includes(application._id)} onChange={(event) => setSelected((current) => event.target.checked ? [...current, application._id] : current.filter((id) => id !== application._id))} /></td>
                    <td className="px-4 py-3"><p className="font-semibold text-slate-900">{application.applicant?.studentName || "Unknown student"}</p><p className="mt-1 text-xs text-slate-500">{application.applicationRef || application._id}</p></td>
                    <td className="px-4 py-3"><p>{application.guardian?.name || "—"}</p><p className="text-xs text-slate-500">{application.guardian?.phone || application.guardian?.email || "—"}</p></td>
                    <td className="px-4 py-3">{application.applicant?.program?.title || application.applicant?.classApplyingFor || "—"}</td>
                    <td className="px-4 py-3"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass[application.status] || "bg-slate-100 text-slate-800"}`}>{application.status === "UnderReview" ? "Under review" : application.status}</span></td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-600">{formatAcademyDate(application.submittedAt)}</td>
                    <td className="px-4 py-3"><Link href={`/admin/applications/${application._id}`} className="font-semibold text-teal-800 underline">Review</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 flex items-center justify-between text-sm"><p className="text-slate-600">{data.pagination.total} applications</p><div className="flex gap-2"><button type="button" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={page <= 1} className="rounded-lg border border-slate-300 px-3 py-2 disabled:opacity-50">Previous</button><span className="px-2 py-2">Page {data.pagination.page} of {Math.max(1, data.pagination.pages)}</span><button type="button" onClick={() => setPage((current) => Math.min(data.pagination.pages, current + 1))} disabled={page >= data.pagination.pages} className="rounded-lg border border-slate-300 px-3 py-2 disabled:opacity-50">Next</button></div></div>
        </>
      )}
    </main>
  );
}
