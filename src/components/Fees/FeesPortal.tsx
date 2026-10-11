"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { EmptyState, ErrorState, LoadingState } from "@/components/Common/DataState";
import { academy } from "@/config/academy";

type Program = { id?: string; _id?: string; title: string; level?: string };
type StudentOption = { id: string; fullName: string; regNo: string; classLevel: string; program?: { id: string; title: string } | null };
type Payment = {
  _id: string;
  method: string;
  amount: number;
  transactionId: string;
  senderNumber: string;
  proofUrl: string;
  proofFilename: string;
  status: string;
  note: string;
  createdAt: string;
};
type Challan = {
  _id: string;
  challanNo: string;
  periodMonth: string;
  items: { label: string; amount: number }[];
  subtotal: number;
  discount: number;
  lateFee: number;
  total: number;
  paidAmount: number;
  dueDate: string;
  status: string;
  student: { fullName: string; regNo: string; fatherName: string; classLevel: string; program?: { title: string } | null };
  payments: Payment[];
};
type Structure = {
  _id: string;
  program: Program | string;
  monthlyFee: number;
  admissionFee: number;
  annualCharges: number;
  effectiveFrom: string;
};
type Summary = { collected: number; outstanding: number; overdue: number };
type Props = { role: "ADMIN" | "STUDENT" | "PARENT"; selectedStudentId?: string };
type FeeStructureForm = { program: string; monthlyFee: string; admissionFee: string; annualCharges: string; effectiveFrom: string };

const emptyStructure: FeeStructureForm = { program: "", monthlyFee: "", admissionFee: "0", annualCharges: "0", effectiveFrom: new Date().toISOString().slice(0, 10) };
const pkr = (value: number) => `PKR ${new Intl.NumberFormat("en-PK").format(value || 0)}`;
const monthNow = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Karachi", year: "numeric", month: "2-digit" }).format(new Date());

async function readApi<T>(response: Response): Promise<T> {
  const body = await response.json() as { success?: boolean; data?: T; message?: string };
  if (!response.ok || !body.success || body.data === undefined) throw new Error(body.message || "The request could not be completed.");
  return body.data;
}

export default function FeesPortal({ role, selectedStudentId = "" }: Props) {
  const isAdmin = role === "ADMIN";
  const [month, setMonth] = useState(monthNow);
  const [statusFilter, setStatusFilter] = useState("");
  const [programFilter, setProgramFilter] = useState("");
  const [challans, setChallans] = useState<Challan[]>([]);
  const [summary, setSummary] = useState<Summary>({ collected: 0, outstanding: 0, overdue: 0 });
  const [programs, setPrograms] = useState<Program[]>([]);
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [structures, setStructures] = useState<Structure[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [modalChallan, setModalChallan] = useState<Challan | null>(null);
  const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({});
  const [scope, setScope] = useState("all");
  const [studentId, setStudentId] = useState("");
  const [programId, setProgramId] = useState("");
  const [structureId, setStructureId] = useState("");
  const [structureForm, setStructureForm] = useState<FeeStructureForm>(emptyStructure);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ month });
      if (selectedStudentId) params.set("studentId", selectedStudentId);
      if (statusFilter) params.set("status", statusFilter);
      if (programFilter) params.set("program", programFilter);
      const challanData = await readApi<{ challans: Challan[]; summary: Summary }>(await fetch(`/api/fees/challans?${params}`, { cache: "no-store" }));
      setChallans(challanData.challans);
      setSummary(challanData.summary);
      if (isAdmin) {
        const [structureData, optionData] = await Promise.all([
          readApi<Structure[]>(await fetch("/api/fees/structures", { cache: "no-store" })),
          readApi<{ programs: Program[]; students: StudentOption[] }>(await fetch("/api/fees/options", { cache: "no-store" })),
        ]);
        setStructures(structureData);
        setPrograms(optionData.programs);
        setStudents(optionData.students);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load fee information.");
    } finally {
      setLoading(false);
    }
  }, [isAdmin, month, programFilter, statusFilter, selectedStudentId]);

  useEffect(() => { void load(); }, [load]);

  const pendingPayments = useMemo(
    () => challans.flatMap((challan) => challan.payments.filter((payment) => payment.status === "Pending").map((payment) => ({ challan, payment }))),
    [challans],
  );

  async function generateChallans(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/fees/challans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scope, periodMonth: month, ...(scope === "student" ? { studentId } : {}), ...(scope === "program" ? { programId } : {}) }),
      });
      const result = await readApi<{ created: number; existing: number; skipped: number }>(response);
      setMessage(`Created ${result.created} challan(s); ${result.existing} already existed; ${result.skipped} skipped (no active student or fee structure).`);
      await load();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Unable to generate challans.");
    } finally {
      setBusy(false);
    }
  }

  async function saveStructure(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    const payload = {
      program: structureForm.program,
      monthlyFee: Number(structureForm.monthlyFee),
      admissionFee: Number(structureForm.admissionFee),
      annualCharges: Number(structureForm.annualCharges),
      effectiveFrom: structureForm.effectiveFrom,
    };
    try {
      const response = await fetch(structureId ? `/api/fees/structures/${structureId}` : "/api/fees/structures", {
        method: structureId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      await readApi(response);
      setStructureForm(emptyStructure);
      setStructureId("");
      setMessage("Fee structure saved.");
      await load();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Unable to save the fee structure.");
    } finally {
      setBusy(false);
    }
  }

  async function deleteStructure(id: string) {
    if (!window.confirm("Delete this fee structure? Existing challans will not change.")) return;
    setBusy(true);
    setMessage("");
    try {
      await readApi(await fetch(`/api/fees/structures/${id}`, { method: "DELETE" }));
      setMessage("Fee structure deleted.");
      await load();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Unable to delete the fee structure.");
    } finally {
      setBusy(false);
    }
  }

  async function reviewPayment(payment: Payment, decision: "Verified" | "Rejected") {
    setBusy(true);
    setMessage("");
    try {
      await readApi(await fetch(`/api/fees/payments/${payment._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision, note: reviewNotes[payment._id] || "" }),
      }));
      setMessage(decision === "Verified" ? "Payment verified." : "Payment rejected.");
      await load();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Unable to review payment.");
    } finally {
      setBusy(false);
    }
  }

  async function submitPayment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!modalChallan) return;
    setBusy(true);
    setMessage("");
    const form = new FormData(event.currentTarget);
    form.set("challanId", modalChallan._id);
    try {
      await readApi(await fetch("/api/fees/payments", { method: "POST", body: form }));
      setModalChallan(null);
      setMessage("Payment submitted. The challan is pending verification.");
      await load();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Unable to submit this payment.");
    } finally {
      setBusy(false);
    }
  }

  function exportCsv() {
    const fields = ["challanNo", "periodMonth", "student.fullName", "student.regNo", "student.classLevel", "total", "paidAmount", "balance", "status"];
    const rows = challans.map((challan) => [
      challan.challanNo, challan.periodMonth, challan.student.fullName, challan.student.regNo,
      challan.student.classLevel, challan.total, challan.paidAmount || 0, Math.max(0, challan.total - (challan.paidAmount || 0)), challan.status,
    ]);
    const escape = (value: string | number) => `"${String(value).replace(/"/g, '""')}"`;
    const csv = [fields.map(escape).join(","), ...rows.map((row) => row.map(escape).join(","))].join("\r\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `fee-challans-${month}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  function editStructure(structure: Structure) {
    const program = typeof structure.program === "string" ? structure.program : structure.program?.id || structure.program?._id || "";
    setStructureId(structure._id);
    setStructureForm({
      program,
      monthlyFee: String(structure.monthlyFee),
      admissionFee: String(structure.admissionFee),
      annualCharges: String(structure.annualCharges),
      effectiveFrom: new Date(structure.effectiveFrom).toISOString().slice(0, 10),
    });
  }

  return (
    <main className={`min-h-screen px-4 pb-20 pt-8 sm:px-6 ${isAdmin ? "bg-slate-100 text-slate-800" : "bg-slate-50 text-slate-900 sm:pt-28"}`}>
      <div className="mx-auto max-w-7xl">
        <header className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-teal-700">{isAdmin ? "Administration" : `${role === "PARENT" ? "Parent" : "Student"} portal`}</p>
            <h1 className="mt-2 text-3xl font-bold">{isAdmin ? "Fee Management" : "My Fees"}</h1>
            <p className="mt-2 text-sm text-slate-600">{isAdmin ? "Manage fee structures, challans, payments, and collections." : "View challans, submit payment details, and track verification."}</p>
          </div>
          {isAdmin ? <div className="flex flex-wrap gap-2">
            <button type="button" onClick={exportCsv} className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold">Export CSV</button>
            <a href={`/api/fees/challans/bulk/pdf?month=${encodeURIComponent(month)}${programFilter ? `&program=${encodeURIComponent(programFilter)}` : ""}`} className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-semibold text-white">Bulk PDF</a>
          </div> : null}
        </header>

        <section className="mb-5 grid gap-3 sm:grid-cols-3">
          {[
            [`Collected · ${month}`, summary.collected, "text-emerald-800"],
            [`Outstanding · ${month}`, summary.outstanding, "text-amber-800"],
            [`Overdue · ${month}`, summary.overdue, "text-rose-800"],
          ].map(([label, value, tone]) => (
            <article key={String(label)} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm text-slate-600">{label}</p>
              <p className={`mt-2 text-2xl font-bold ${tone}`}>{pkr(Number(value))}</p>
            </article>
          ))}
        </section>

        <section className="mb-5 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-end">
          <label className="grid gap-1 text-sm font-semibold">Month
            <input type="month" value={month} onChange={(event) => setMonth(event.target.value)} className="rounded-lg border border-slate-300 px-3 py-2" />
          </label>
          {isAdmin ? <>
            <label className="grid gap-1 text-sm font-semibold">Status
              <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="rounded-lg border border-slate-300 px-3 py-2">
                <option value="">All statuses</option>
                {["Unpaid", "Pending Verification", "Paid", "Overdue"].map((status) => <option key={status}>{status}</option>)}
              </select>
            </label>
            <label className="grid gap-1 text-sm font-semibold">Class / program
              <select value={programFilter} onChange={(event) => setProgramFilter(event.target.value)} className="rounded-lg border border-slate-300 px-3 py-2">
                <option value="">All classes</option>
                {programs.map((program) => <option key={program.id} value={program.id}>{program.title}</option>)}
              </select>
            </label>
          </> : null}
        </section>

        {message ? <p className="mb-4 rounded-xl border border-teal-200 bg-teal-50 p-3 text-sm text-teal-950" role="status">{message}</p> : null}
        {error ? <ErrorState message={error} onRetry={() => void load()} /> : loading ? <LoadingState label="Loading fee records" /> : <>
          {isAdmin ? <>
            <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-xl font-bold">Generate challans</h2>
              <form onSubmit={generateChallans} className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <label className="grid gap-1 text-sm font-medium">Students
                  <select value={scope} onChange={(event) => setScope(event.target.value)} className="rounded-lg border border-slate-300 px-3 py-2">
                    <option value="all">All active students</option><option value="program">One class / program</option><option value="student">One student</option>
                  </select>
                </label>
                {scope === "program" ? <label className="grid gap-1 text-sm font-medium">Class
                  <select required value={programId} onChange={(event) => setProgramId(event.target.value)} className="rounded-lg border border-slate-300 px-3 py-2"><option value="">Choose a class</option>{programs.map((program) => <option key={program.id} value={program.id}>{program.title}</option>)}</select>
                </label> : null}
                {scope === "student" ? <label className="grid gap-1 text-sm font-medium">Student
                  <select required value={studentId} onChange={(event) => setStudentId(event.target.value)} className="rounded-lg border border-slate-300 px-3 py-2"><option value="">Choose a student</option>{students.map((student) => <option key={student.id} value={student.id}>{student.regNo} · {student.fullName}</option>)}</select>
                </label> : null}
                <label className="grid gap-1 text-sm font-medium">Period month
                  <input required type="month" value={month} onChange={(event) => setMonth(event.target.value)} className="rounded-lg border border-slate-300 px-3 py-2" />
                </label>
                <button disabled={busy} className="self-end rounded-lg bg-teal-700 px-4 py-2.5 font-semibold text-white disabled:opacity-60">{busy ? "Working..." : "Generate challans"}</button>
              </form>
            </section>

            <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-xl font-bold">{structureId ? "Edit fee structure" : "Add fee structure"}</h2>
              <form onSubmit={saveStructure} className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
                <label className="grid gap-1 text-sm font-medium lg:col-span-2">Program
                  <select required value={structureForm.program} onChange={(event) => setStructureForm({ ...structureForm, program: event.target.value })} className="rounded-lg border border-slate-300 px-3 py-2"><option value="">Choose a program</option>{programs.map((program) => <option key={program.id} value={program.id}>{program.title}</option>)}</select>
                </label>
                {([
                  ["Monthly fee (PKR)", "monthlyFee"],
                  ["Admission fee (PKR)", "admissionFee"],
                  ["Annual charges (PKR)", "annualCharges"],
                ] as const).map(([label, key]) => <label key={key} className="grid gap-1 text-sm font-medium">{label}
                  <input required type="number" min="0" step="1" value={structureForm[key]} onChange={(event) => setStructureForm({ ...structureForm, [key]: event.target.value })} className="rounded-lg border border-slate-300 px-3 py-2" />
                </label>)}
                <label className="grid gap-1 text-sm font-medium">Effective from
                  <input required type="date" value={structureForm.effectiveFrom} onChange={(event) => setStructureForm({ ...structureForm, effectiveFrom: event.target.value })} className="rounded-lg border border-slate-300 px-3 py-2" />
                </label>
                <div className="flex items-end gap-2">
                  <button disabled={busy} className="rounded-lg bg-slate-900 px-4 py-2.5 font-semibold text-white">{structureId ? "Save changes" : "Add structure"}</button>
                  {structureId ? <button type="button" onClick={() => { setStructureId(""); setStructureForm(emptyStructure); }} className="rounded-lg border border-slate-300 px-3 py-2.5">Cancel</button> : null}
                </div>
              </form>
              {structures.length > 0 ? <div className="mt-5 divide-y divide-slate-100">
                {structures.map((structure) => {
                  const program = typeof structure.program === "string" ? programs.find((item) => item.id === structure.program || item._id === structure.program)?.title : structure.program?.title;
                  return <div key={structure._id} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm">
                    <p><span className="font-semibold">{program || "Program"}</span> · {pkr(structure.monthlyFee)}/month · effective {new Date(structure.effectiveFrom).toLocaleDateString("en-PK", { timeZone: "Asia/Karachi" })}</p>
                    <div className="flex gap-3"><button type="button" onClick={() => editStructure(structure)} className="font-semibold text-teal-800 underline">Edit</button><button type="button" onClick={() => void deleteStructure(structure._id)} className="font-semibold text-rose-700 underline">Delete</button></div>
                  </div>;
                })}
              </div> : <p className="mt-4 text-sm text-slate-600">No fee structures yet. Add one before generating challans.</p>}
            </section>

            <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-xl font-bold">Payment verification queue</h2>
              {pendingPayments.length === 0 ? <p className="mt-3 text-sm text-slate-600">No pending payments in this month’s challans.</p> : <div className="mt-4 grid gap-4 lg:grid-cols-2">
                {pendingPayments.map(({ challan, payment }) => <article key={payment._id} className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                  <p className="font-bold">{challan.student.fullName} · {challan.challanNo}</p>
                  <p className="mt-1 text-sm">{payment.method} · {pkr(payment.amount)} · Ref: {payment.transactionId}</p>
                  {payment.senderNumber ? <p className="text-sm">Sender: {payment.senderNumber}</p> : null}
                  {payment.proofUrl ? <a href={`/api/admin/fees/payments/${payment._id}/proof`} target="_blank" rel="noreferrer" className="mt-2 inline-block font-semibold text-teal-800 underline">View payment proof ({payment.proofFilename || "screenshot"})</a> : <p className="mt-2 text-sm text-slate-600">No screenshot attached.</p>}
                  <label className="mt-3 grid gap-1 text-sm font-medium">Review note
                    <input value={reviewNotes[payment._id] || ""} onChange={(event) => setReviewNotes({ ...reviewNotes, [payment._id]: event.target.value })} maxLength={500} className="rounded-lg border border-slate-300 bg-white px-3 py-2" placeholder="Required if rejecting" />
                  </label>
                  <div className="mt-3 flex gap-2"><button disabled={busy} onClick={() => void reviewPayment(payment, "Verified")} className="rounded-lg bg-emerald-700 px-3 py-2 text-sm font-semibold text-white">Verify</button><button disabled={busy || !reviewNotes[payment._id]?.trim()} onClick={() => void reviewPayment(payment, "Rejected")} className="rounded-lg bg-rose-700 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50">Reject</button></div>
                </article>)}
              </div>}
            </section>
          </> : null}

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-xl font-bold">{isAdmin ? "Challans" : "Your challans"}</h2>
            {challans.length === 0 ? <div className="mt-4"><EmptyState title="No challans for this month" message={isAdmin ? "No fee records match the selected month and filters." : "Your challans will appear here once generated by the academy."} /></div> : <div className="mt-4 grid gap-4 lg:grid-cols-2">
              {challans.map((challan) => <article key={challan._id} className="rounded-xl border border-slate-200 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div><p className="font-bold">{challan.student.fullName}</p><p className="text-sm text-slate-600">{challan.student.regNo} · {challan.student.classLevel || challan.student.program?.title} · {challan.periodMonth}</p><p className="mt-1 text-xs text-slate-500">{challan.challanNo} · Due {new Date(challan.dueDate).toLocaleDateString("en-PK", { timeZone: "Asia/Karachi" })}</p></div>
                  <span className={`rounded-full px-3 py-1 text-xs font-bold ${challan.status === "Paid" ? "bg-emerald-100 text-emerald-800" : challan.status === "Overdue" ? "bg-rose-100 text-rose-800" : challan.status === "Pending Verification" ? "bg-amber-100 text-amber-900" : "bg-slate-100 text-slate-700"}`}>{challan.status}</span>
                </div>
                <div className="mt-4 space-y-1 border-t border-slate-100 pt-3 text-sm">
                  {challan.items.map((item) => <p key={item.label} className="flex justify-between gap-3"><span>{item.label}</span><span>{pkr(item.amount)}</span></p>)}
                  {challan.discount > 0 ? <p className="flex justify-between gap-3 text-emerald-800"><span>Concession</span><span>- {pkr(challan.discount)}</span></p> : null}
                  {challan.lateFee > 0 ? <p className="flex justify-between gap-3 text-rose-700"><span>Late fee</span><span>{pkr(challan.lateFee)}</span></p> : null}
                  <p className="flex justify-between gap-3 font-bold"><span>Total</span><span>{pkr(challan.total)}</span></p>
                  <p className="flex justify-between gap-3 text-slate-600"><span>Paid / balance</span><span>{pkr(challan.paidAmount || 0)} / {pkr(Math.max(0, challan.total - (challan.paidAmount || 0)))}</span></p>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <a href={`/api/challans/${challan._id}/pdf`} className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold">Download PDF</a>
                  {!isAdmin && !["Paid", "Cancelled"].includes(challan.status) ? <button onClick={() => setModalChallan(challan)} className="rounded-lg bg-teal-700 px-3 py-2 text-sm font-semibold text-white">Submit payment</button> : null}
                </div>
                {challan.payments.length > 0 ? <details className="mt-4 border-t border-slate-100 pt-3">
                  <summary className="cursor-pointer text-sm font-semibold">Payment history ({challan.payments.length})</summary>
                  <ul className="mt-2 space-y-2">{challan.payments.map((payment) => <li key={payment._id} className="rounded-lg bg-slate-50 p-3 text-sm">
                    <p className="font-semibold">{payment.method} · {pkr(payment.amount)} · {payment.status}</p>
                    <p className="text-slate-600">Ref: {payment.transactionId} · {new Date(payment.createdAt).toLocaleDateString("en-PK", { timeZone: "Asia/Karachi" })}</p>
                    {payment.note ? <p className="mt-1 text-rose-800">Review note: {payment.note}</p> : null}
                  </li>)}</ul>
                </details> : null}
              </article>)}
            </div>}
          </section>
        </>}
      </div>

      {modalChallan ? <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/60 p-0 sm:items-center sm:p-4" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !busy) setModalChallan(null); }}>
        <section role="dialog" aria-modal="true" aria-labelledby="payment-dialog-title" className="max-h-[95vh] w-full max-w-xl overflow-y-auto rounded-t-2xl bg-white p-5 shadow-2xl sm:rounded-2xl">
          <div className="flex items-start justify-between gap-3"><div><h2 id="payment-dialog-title" className="text-xl font-bold">Submit payment</h2><p className="text-sm text-slate-600">{modalChallan.challanNo} · Remaining {pkr(Math.max(0, modalChallan.total - (modalChallan.paidAmount || 0)))}</p></div><button type="button" onClick={() => setModalChallan(null)} aria-label="Close payment form" className="rounded-lg border px-3 py-1">Close</button></div>
          <div className="mt-4 space-y-2 rounded-xl bg-slate-50 p-4 text-sm">
            <p className="font-semibold">Pay outside this site, then submit your transaction details:</p>
            <p>EasyPaisa · {academy.payments.easyPaisa.accountTitle} · {academy.payments.easyPaisa.accountNumber}</p>
            <p>JazzCash · {academy.payments.jazzCash.accountTitle} · {academy.payments.jazzCash.accountNumber}</p>
            <p>Bank Transfer · {academy.payments.bankTransfer.bankName} · {academy.payments.bankTransfer.accountTitle} · {academy.payments.bankTransfer.iban}</p>
          </div>
          <form onSubmit={submitPayment} className="mt-4 grid gap-3">
            <label className="grid gap-1 text-sm font-medium">Payment method<select name="method" required className="rounded-lg border border-slate-300 px-3 py-2"><option value="">Choose a method</option><option>EasyPaisa</option><option>JazzCash</option><option value="BankTransfer">Bank Transfer</option></select></label>
            <label className="grid gap-1 text-sm font-medium">Amount paid (PKR)<input name="amount" required type="number" min="1" max={Math.max(0, modalChallan.total - (modalChallan.paidAmount || 0))} step="1" className="rounded-lg border border-slate-300 px-3 py-2" /></label>
            <label className="grid gap-1 text-sm font-medium">Transaction ID<input name="transactionId" required maxLength={120} className="rounded-lg border border-slate-300 px-3 py-2" /></label>
            <label className="grid gap-1 text-sm font-medium">Sender number (optional)<input name="senderNumber" maxLength={30} inputMode="tel" className="rounded-lg border border-slate-300 px-3 py-2" /></label>
            <label className="grid gap-1 text-sm font-medium">Payment screenshot (optional, JPG/PNG up to 4 MB)<input name="proof" type="file" accept="image/jpeg,image/png" className="rounded-lg border border-slate-300 p-2" /></label>
            <p className="text-xs text-slate-600">Payment remains pending until academy staff verifies it. Never share your PIN or password.</p>
            <button disabled={busy} className="rounded-lg bg-teal-700 px-4 py-3 font-semibold text-white disabled:opacity-60">{busy ? "Submitting..." : "Submit for verification"}</button>
          </form>
        </section>
      </div> : null}
    </main>
  );
}
