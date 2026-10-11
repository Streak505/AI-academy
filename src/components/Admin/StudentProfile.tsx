"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { EmptyState, ErrorState, LoadingState } from "@/components/Common/DataState";

type ProfileData = {
  student: {
    _id: string;
    regNo: string;
    fullName: string;
    fatherName: string;
    phone: string;
    classLevel: string;
    status: string;
    program: { title: string } | string;
    guardian?: { _id: string; name: string; email: string; phone: string } | string | null;
    user?: string | null;
    concession: { type: string; percent: number; note: string };
  };
  attendance: Array<{ _id: string; date: string; status: string }>;
  fees: Array<{ _id: string; challanNo: string; periodMonth: string; total: number; paidAmount: number; pendingAmount: number; status: string; dueDate: string }>;
  results: Array<{ _id: string; examName: string; term: string; percentage: number; grade: string; publishedAt?: string | null }>;
};

export default function StudentProfile({ id }: { id: string }) {
  const [data, setData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [resetMessage, setResetMessage] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/admin/students/${id}`, { cache: "no-store" });
      const payload = await response.json();
      if (!response.ok || !payload.success) throw new Error(payload.message || "Unable to load the student profile.");
      setData(payload.data);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load the student profile.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { void load(); }, [load]);

  async function resetPassword(userId: string, label: string) {
    setResetMessage("");
    try {
      const response = await fetch(`/api/admin/users/${userId}/reset-password`, { method: "POST" });
      const payload = await response.json();
      if (!response.ok || !payload.success) throw new Error(payload.message || "Unable to reset password.");
      setResetMessage(`${label} temporary password: ${payload.data.temporaryPassword}`);
    } catch (resetError) {
      setResetMessage(resetError instanceof Error ? resetError.message : "Unable to reset password.");
    }
  }

  if (loading) return <main className="p-4 sm:p-6"><LoadingState label="Loading student profile" /></main>;
  if (error) return <main className="p-4 sm:p-6"><ErrorState message={error} onRetry={() => void load()} /></main>;
  if (!data) return <main className="p-4 sm:p-6"><EmptyState title="Student not found" message="This student record may have been removed." /></main>;

  const { student } = data;
  const guardian = typeof student.guardian === "object" && student.guardian ? student.guardian : null;
  const program = typeof student.program === "object" ? student.program.title : "—";
  const formatDate = (value: string) => new Intl.DateTimeFormat("en-PK", { dateStyle: "medium", timeZone: "Asia/Karachi" }).format(new Date(value));
  const formatMoney = (value: number) => `PKR ${new Intl.NumberFormat("en-PK").format(value)}`;

  return (
    <main className="p-4 sm:p-6">
      <div className="mx-auto max-w-7xl">
        <Link href="/admin/students" className="text-sm font-semibold text-teal-800 underline">Back to students</Link>
        <header className="mt-4 flex flex-wrap items-start justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-teal-700">Student profile</p>
            <h1 className="mt-1 text-3xl font-bold text-slate-950">{student.fullName}</h1>
            <p className="mt-1 text-sm text-slate-600">{student.regNo} · {program} · {student.classLevel} · <span className="capitalize">{student.status}</span></p>
          </div>
          <Link href={`/admin/fees?student=${student._id}`} className="rounded-xl bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white">Open fee management</Link>
        </header>

        <section className="mt-5 grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <h2 className="text-lg font-bold">Student & guardian</h2>
            <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
              <div><dt className="text-slate-500">Father</dt><dd className="font-medium">{student.fatherName}</dd></div>
              <div><dt className="text-slate-500">Phone</dt><dd className="font-medium">{student.phone}</dd></div>
              <div><dt className="text-slate-500">Concession</dt><dd className="font-medium">{student.concession?.type ?? "none"} ({student.concession?.percent ?? 0}%)</dd></div>
              <div><dt className="text-slate-500">Concession note</dt><dd className="font-medium">{student.concession?.note || "—"}</dd></div>
              <div className="col-span-2"><dt className="text-slate-500">Guardian</dt><dd className="font-medium">{guardian ? `${guardian.name} · ${guardian.email} · ${guardian.phone}` : "No guardian linked"}</dd></div>
            </dl>
            {resetMessage ? <p className="mt-3 break-all rounded-lg bg-amber-50 p-3 text-sm text-amber-900" role="status">{resetMessage}</p> : null}
            <div className="mt-4 flex flex-wrap gap-2">
              {student.user ? <button type="button" onClick={() => void resetPassword(String(student.user), "Student")} className="rounded-lg border px-3 py-2 text-sm font-semibold">Reset student password</button> : null}
              {guardian ? <button type="button" onClick={() => void resetPassword(guardian._id, "Parent")} className="rounded-lg border px-3 py-2 text-sm font-semibold">Reset parent password</button> : null}
            </div>
          </div>

          <DataTable title="Attendance" emptyText="No attendance records yet." headers={["Date", "Status"]} rows={data.attendance.map((item) => [formatDate(item.date), item.status])} />
          <DataTable title="Fees" emptyText="No fee challans yet." headers={["Period", "Amount", "Paid", "Pending", "Status", "Due date"]} rows={data.fees.map((item) => [item.periodMonth, formatMoney(item.total), formatMoney(item.paidAmount), formatMoney(item.pendingAmount), item.status, formatDate(item.dueDate)])} />
          <DataTable title="Results" emptyText="No published results yet." headers={["Exam", "Term", "Percentage", "Grade", "Published"]} rows={data.results.map((item) => [item.examName, item.term, `${item.percentage}%`, item.grade || "—", item.publishedAt ? formatDate(item.publishedAt) : "Not published"])} />
        </section>
      </div>
    </main>
  );
}

function DataTable({ title, emptyText, headers, rows }: { title: string; emptyText: string; headers: string[]; rows: string[][] }) {
  return (
    <section className="min-w-0 rounded-2xl border border-slate-200 bg-white p-5">
      <h2 className="text-lg font-bold">{title}</h2>
      {rows.length === 0 ? <p className="mt-3 text-sm text-slate-500">{emptyText}</p> : <div className="mt-3 overflow-x-auto"><table className="min-w-full text-left text-sm"><thead><tr>{headers.map((header) => <th key={header} className="border-b px-3 py-2 font-semibold text-slate-600">{header}</th>)}</tr></thead><tbody>{rows.map((row, index) => <tr key={index}>{row.map((cell, cellIndex) => <td key={cellIndex} className="border-b border-slate-100 px-3 py-2">{cell}</td>)}</tr>)}</tbody></table></div>}
    </section>
  );
}
