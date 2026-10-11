"use client";

import { useCallback, useEffect, useState } from "react";
import { EmptyState, ErrorState, LoadingState } from "@/components/Common/DataState";
import { ClientPagination } from "@/components/Admin/ClientPagination";

type ReportData = {
  generatedAt: string;
  dateRange: { from: string; to: string };
  kpis: { activeStudents: number; newAdmissionsThisMonth: number; collectionRateMonth: number; collectionRateYtd: number };
  fees: {
    month: { collected: number; outstanding: number; overdue: number };
    ytd: { collected: number; outstanding: number; overdue: number };
    monthly: Array<{ month: string; collected: number; outstanding: number; overdue: number }>;
  };
  admissionFunnel: Array<{ status: string; count: number }>;
  attendanceByClass: Array<{ classLevel: string; total: number; attended: number; rate: number }>;
  counselingByType: Array<{ type: string; count: number }>;
  concessions: Array<{ type: string; count: number; monthlyDiscountedPkr: number }>;
  defaulters: Array<{ studentId: string; regNo: string; name: string; phone: string; email: string; challanNo: string; pendingAmount: number; dueDate: string }>;
};

function karachiDay(offset = 0) {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Karachi", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date());
  const day = new Date(`${parts.find((part) => part.type === "year")?.value}-${parts.find((part) => part.type === "month")?.value}-${parts.find((part) => part.type === "day")?.value}T12:00:00.000Z`);
  day.setUTCDate(day.getUTCDate() + offset);
  return day.toISOString().slice(0, 10);
}

const money = (value: number) => `PKR ${new Intl.NumberFormat("en-PK").format(value)}`;

export default function ReportsDashboard() {
  const [from, setFrom] = useState(() => `${karachiDay().slice(0, 4)}-01-01`);
  const [to, setTo] = useState(() => karachiDay());
  const [defaulterDays, setDefaulterDays] = useState(30);
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [sending, setSending] = useState("");
  const [defaultersPage, setDefaultersPage] = useState(1);
  const defaultersPageSize = 10;

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const query = new URLSearchParams({ from, to, defaulterDays: String(defaulterDays) });
      const response = await fetch(`/api/admin/reports?${query}`, { cache: "no-store" });
      const payload = await response.json();
      if (!response.ok || !payload.success) throw new Error(payload.message || "Unable to load reports.");
      setData(payload.data);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load reports.");
    } finally {
      setLoading(false);
    }
  }, [from, to, defaulterDays]);

  useEffect(() => { void load(); }, [load]);

  async function sendReminder(studentId: string, studentName: string) {
    setSending(studentId);
    setNotice("");
    try {
      const response = await fetch("/api/admin/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId }),
      });
      const payload = await response.json();
      if (!response.ok || !payload.success) throw new Error(payload.message || "Unable to send reminder.");
      setNotice(`Reminder sent for ${studentName}.`);
    } catch (reminderError) {
      setNotice(reminderError instanceof Error ? reminderError.message : "Unable to send reminder.");
    } finally {
      setSending("");
    }
  }

  function download(report: string) {
    const query = new URLSearchParams({ from, to, defaulterDays: String(defaulterDays), report });
    window.location.href = `/api/admin/reports?${query}`;
  }

  const tiles = data ? [
    { label: "Active students", value: data.kpis.activeStudents },
    { label: "New admissions this month", value: data.kpis.newAdmissionsThisMonth },
    { label: "Collection rate · month", value: `${data.kpis.collectionRateMonth}%` },
    { label: "Collection rate · YTD", value: `${data.kpis.collectionRateYtd}%` },
  ] : [];
  const defaulterPages = Math.max(1, Math.ceil((data?.defaulters.length ?? 0) / defaultersPageSize));
  const currentDefaultersPage = Math.min(defaultersPage, defaulterPages);
  const visibleDefaulters = data?.defaulters.slice((currentDefaultersPage - 1) * defaultersPageSize, currentDefaultersPage * defaultersPageSize) ?? [];

  return (
    <main className="p-4 sm:p-6 print:bg-white print:p-0">
      <div className="mx-auto max-w-7xl">
        <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div><p className="text-sm font-semibold uppercase tracking-[0.2em] text-teal-700">Reporting</p><h1 className="mt-1 text-3xl font-bold text-slate-950">Reports & analytics</h1><p className="mt-1 text-sm text-slate-600">All financial values are PKR. Dates are shown in Asia/Karachi.</p></div>
          <button type="button" onClick={() => window.print()} className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold print:hidden">Print / Save PDF</button>
        </header>
        <section className="mb-5 flex flex-wrap items-end gap-3 rounded-2xl border border-slate-200 bg-white p-4 print:hidden">
          <label className="text-sm font-medium">From<input type="date" value={from} onChange={(event) => setFrom(event.target.value)} className="mt-1 block rounded-lg border px-3 py-2" /></label>
          <label className="text-sm font-medium">To<input type="date" value={to} onChange={(event) => setTo(event.target.value)} className="mt-1 block rounded-lg border px-3 py-2" /></label>
          <label className="text-sm font-medium">Defaulter days<input type="number" min="1" max="365" value={defaulterDays} onChange={(event) => setDefaulterDays(Number(event.target.value))} className="mt-1 block w-32 rounded-lg border px-3 py-2" /></label>
          <button type="button" onClick={() => void load()} className="rounded-lg bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white">Apply range</button>
        </section>
        {notice ? <p className="mb-4 rounded-lg bg-teal-50 p-3 text-sm text-teal-900" role="status">{notice}</p> : null}
        {loading ? <LoadingState label="Loading reports" /> : error ? <ErrorState message={error} onRetry={() => void load()} /> : !data ? <EmptyState title="No report data" message="No reporting data is available." /> : (
          <>
            <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{tiles.map((tile) => <div key={tile.label} className="rounded-2xl border border-slate-200 bg-white p-5"><p className="text-sm text-slate-500">{tile.label}</p><p className="mt-2 text-3xl font-bold text-slate-950">{tile.value}</p></div>)}</div>
            <section className="mb-5 grid gap-4 md:grid-cols-2">
              <FeeSummary title="Current month" values={data.fees.month} />
              <FeeSummary title="Year to date" values={data.fees.ytd} />
            </section>
            <div className="mb-3 flex flex-wrap gap-2 print:hidden">{["kpis", "fees", "admissions", "attendance", "counseling", "concessions", "defaulters"].map((report) => <button key={report} type="button" onClick={() => download(report)} className="rounded-lg border bg-white px-3 py-2 text-xs font-semibold capitalize">Download {report} CSV</button>)}</div>
            <section className="mb-5 rounded-2xl border border-slate-200 bg-white p-5">
              <div className="flex flex-wrap items-start justify-between gap-2"><div><h2 className="text-lg font-bold">Fee collection by month</h2><p className="text-sm text-slate-500">For invoice months within the selected date range.</p></div><button type="button" onClick={() => download("fees")} className="text-sm font-semibold text-teal-800 underline print:hidden">CSV</button></div>
              {data.fees.monthly.length === 0 ? <p className="mt-4 text-sm text-slate-500">No monthly fee records for this range.</p> : <div className="mt-5 space-y-3">{data.fees.monthly.map((row) => {
                const maximum = Math.max(1, ...data.fees.monthly.map((item) => item.collected + item.outstanding));
                const width = `${Math.max(2, (row.collected / maximum) * 100)}%`;
                return <div key={row.month} className="grid grid-cols-[5rem_1fr_auto] items-center gap-3 text-sm"><span className="font-medium">{row.month}</span><div className="h-5 overflow-hidden rounded bg-slate-100"><div className="h-full rounded bg-teal-600" style={{ width }} title={`${money(row.collected)} collected`} /></div><span className="text-right text-slate-600">{money(row.collected)} / {money(row.outstanding)} due</span></div>;
              })}</div>}
            </section>
            <section className="mb-5 grid gap-4 xl:grid-cols-2">
              <ReportTable title="Admission funnel" onExport={() => download("admissions")} headers={["Stage", "Applications"]} rows={data.admissionFunnel.map((row) => [row.status, String(row.count)])} />
              <ReportTable title="Attendance by class" onExport={() => download("attendance")} headers={["Class", "Attendance", "Rate"]} rows={data.attendanceByClass.map((row) => [row.classLevel, `${row.attended}/${row.total}`, `${row.rate}%`])} />
              <ReportTable title="Counseling by type" onExport={() => download("counseling")} headers={["Type", "Bookings"]} rows={data.counselingByType.map((row) => [row.type, String(row.count)])} />
              <ReportTable title="Concessions" onExport={() => download("concessions")} headers={["Type", "Students", "Monthly discount"]} rows={data.concessions.map((row) => [row.type, String(row.count), money(row.monthlyDiscountedPkr)])} />
            </section>
            <section className="overflow-x-auto rounded-2xl border border-slate-200 bg-white p-5">
              <div className="mb-4 flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-lg font-bold">Fee defaulters</h2><p className="text-sm text-slate-600">Overdue for more than {defaulterDays} days.</p></div><button type="button" onClick={() => download("defaulters")} className="text-sm font-semibold text-teal-800 underline print:hidden">Download CSV</button></div>
              {data.defaulters.length === 0 ? <p className="text-sm text-slate-500">No defaulters match this threshold.</p> : <><div className="overflow-x-auto"><table className="min-w-[750px] w-full text-left text-sm"><thead className="bg-slate-50"><tr>{["Student", "Registration", "Challan", "Pending", "Due date", "Reminder"].map((header) => <th key={header} className="px-3 py-2 font-semibold">{header}</th>)}</tr></thead><tbody>{visibleDefaulters.map((row) => <tr key={row.challanNo} className="border-t"><td className="px-3 py-3">{row.name}<p className="text-xs text-slate-500">{row.phone}</p></td><td className="px-3 py-3">{row.regNo}</td><td className="px-3 py-3">{row.challanNo}</td><td className="px-3 py-3">{money(row.pendingAmount)}</td><td className="px-3 py-3">{new Intl.DateTimeFormat("en-PK", { dateStyle: "medium", timeZone: "Asia/Karachi" }).format(new Date(row.dueDate))}</td><td className="px-3 py-3"><button type="button" disabled={!row.email || sending === row.studentId} onClick={() => void sendReminder(row.studentId, row.name)} className="rounded-lg bg-teal-700 px-3 py-2 text-xs font-semibold text-white disabled:opacity-40">{sending === row.studentId ? "Sending..." : row.email ? "Send reminder" : "No email"}</button></td></tr>)}</tbody></table></div><ClientPagination page={currentDefaultersPage} pages={defaulterPages} onPageChange={setDefaultersPage} /></>}
            </section>
          </>
        )}
      </div>
    </main>
  );
}

function FeeSummary({ title, values }: { title: string; values: { collected: number; outstanding: number; overdue: number } }) {
  return <section className="rounded-2xl border border-slate-200 bg-white p-5"><h2 className="font-bold">{title} fee totals</h2><dl className="mt-3 grid grid-cols-3 gap-2 text-sm"><div><dt className="text-slate-500">Collected</dt><dd className="mt-1 font-bold text-emerald-700">{money(values.collected)}</dd></div><div><dt className="text-slate-500">Outstanding</dt><dd className="mt-1 font-bold">{money(values.outstanding)}</dd></div><div><dt className="text-slate-500">Overdue</dt><dd className="mt-1 font-bold text-rose-700">{money(values.overdue)}</dd></div></dl></section>;
}

function ReportTable({ title, headers, rows, onExport }: { title: string; headers: string[]; rows: string[][]; onExport: () => void }) {
  return <section className="overflow-x-auto rounded-2xl border border-slate-200 bg-white p-5"><div className="flex items-center justify-between gap-2"><h2 className="text-lg font-bold">{title}</h2><button type="button" onClick={onExport} className="text-sm font-semibold text-teal-800 underline print:hidden">CSV</button></div>{rows.length === 0 ? <p className="mt-3 text-sm text-slate-500">No records for this range.</p> : <table className="mt-3 min-w-full text-left text-sm"><thead><tr>{headers.map((header) => <th key={header} className="border-b px-2 py-2 text-slate-500">{header}</th>)}</tr></thead><tbody>{rows.map((row, index) => <tr key={index}>{row.map((cell, cellIndex) => <td key={cellIndex} className="border-b border-slate-100 px-2 py-2">{cell}</td>)}</tr>)}</tbody></table>}</section>;
}
