"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { academy } from "@/config/academy";
import { ErrorState, LoadingState } from "@/components/Common/DataState";
import { formatAcademyDate } from "@/utils/util";

type AdmissionDocument = { kind: string; filename: string; size: number; mimeType: string };
type Application = {
  _id: string;
  applicationRef?: string;
  applicant: { studentName: string; fatherName: string; dob?: string; gender: string; classApplyingFor: string; program?: { title?: string }; };
  guardian: { name: string; cnic: string; phone: string; whatsapp: string; email: string; occupation: string };
  address: string;
  previousSchool: string;
  concessionRequest: { type: string; note: string };
  documents: AdmissionDocument[];
  status: string;
  adminNotes: string;
  submittedAt: string;
  consentAt?: string;
  student?: {
    regNo?: string;
    fullName?: string;
    user?: { _id: string; email: string; role: string } | null;
    guardian?: { _id: string; email: string; role: string } | null;
    concession?: { type?: string; percent?: number; note?: string };
  } | null;
};
type AuditEntry = { action: string; actorEmail: string; metadata?: Record<string, unknown>; createdAt: string };
type RevealedCredential = { name: string; email: string; password?: string };

const concessionNames: Record<string, string> = { none: "None", orphan: "Orphan", widow_child: "Child of a widow", merit: "Merit scholarship", other: "Other" };
const documentNames: Record<string, string> = { student_identity: "Student B-Form / CNIC", guardian_identity: "Father / Guardian CNIC", previous_result: "Previous result card", passport_photo: "Passport photo", death_certificate: "Death certificate", other: "Other" };
const concessionDefaults: Record<string, number> = {
  orphan: academy.concessions.orphan.defaultPercent,
  widow_child: academy.concessions.widow_child.defaultPercent,
  merit: academy.concessions.merit.defaultPercent,
};

export default function ApplicationDetail({ id }: { id: string }) {
  const [application, setApplication] = useState<Application | null>(null);
  const [auditTrail, setAuditTrail] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [concessionPercent, setConcessionPercent] = useState<number | null>(null);
  const [credentials, setCredentials] = useState<RevealedCredential[]>([]);
  const [credentialsAcknowledged, setCredentialsAcknowledged] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/admissions/${id}`, { cache: "no-store" });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.message || "Unable to load this application.");
      setApplication(result.data.application);
      setNotes(result.data.application.adminNotes || "");
      setAuditTrail(result.data.auditTrail || []);
      setConcessionPercent((current) => current ?? concessionDefaults[result.data.application.concessionRequest.type] ?? 0);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load this application.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { void load(); }, [load]);

  async function update(body: Record<string, unknown>) {
    if (!application) return;
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch(`/api/admissions/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.message || "Unable to update this application.");
      setMessage("Application updated.");
      await load();
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "Unable to update this application.");
    } finally {
      setSaving(false);
    }
  }

  async function enroll() {
    if (!application || !window.confirm(`Enroll ${application.applicant.studentName}? This creates student and parent accounts.`)) return;
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch(`/api/admissions/${id}/enroll`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ concessionPercent: concessionPercent ?? concessionDefaults[application.concessionRequest.type] ?? 0 }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.message || "Unable to enroll this application.");
      if (result.data.credentials) {
        const newCredentials: RevealedCredential[] = [
          {
            name: "Parent",
            email: result.data.credentials.parent.email,
            password: result.data.credentials.parent.temporaryPassword,
          },
          {
            name: "Student",
            email: result.data.credentials.student.email,
            password: result.data.credentials.student.temporaryPassword,
          },
        ];
        setCredentials(newCredentials);
        setCredentialsAcknowledged(false);
      }
      setMessage(`Enrolled with registration number ${result.data.regNo}. Login details were emailed to the guardian.`);
      await load();
    } catch (enrollError) {
      setError(enrollError instanceof Error ? enrollError.message : "Unable to enroll this application.");
    } finally {
      setSaving(false);
    }
  }

  async function resetPassword(userId: string, name: string) {
    if (!window.confirm(`Generate a new temporary password for ${name}? Their current password will stop working immediately.`)) return;
    setSaving(true);
    setError("");
    setMessage("");
    setCredentials([]);
    setCredentialsAcknowledged(false);
    try {
      const response = await fetch(`/api/admin/users/${userId}/reset-password`, { method: "POST" });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.message || "Unable to reset this account password.");
      setCredentials([{ name: result.data.name, email: result.data.email, password: result.data.temporaryPassword }]);
    } catch (resetError) {
      setError(resetError instanceof Error ? resetError.message : "Unable to reset this account password.");
    } finally {
      setSaving(false);
    }
  }

  async function copyCredentials(credential: RevealedCredential) {
    try {
      await navigator.clipboard.writeText(credential.password
        ? `Email: ${credential.email}\nTemporary password: ${credential.password}`
        : `Existing account email: ${credential.email}`);
      setMessage(`${credential.name} account details copied.`);
    } catch {
      setError("Could not copy login details. Select and copy them manually.");
    }
  }

  function acknowledgeCredentials() {
    setCredentials([]);
    setCredentialsAcknowledged(true);
  }

  if (loading) return <main className="p-4 sm:p-8"><LoadingState label="Loading application" /></main>;
  if (error && !application) return <main className="p-4 sm:p-8"><ErrorState message={error} onRetry={load} /></main>;
  if (!application) return <main className="p-4 sm:p-8"><ErrorState message="Application not found." onRetry={load} /></main>;

  const student = application.applicant;
  const guardian = application.guardian;
  return (
    <main className="p-4 sm:p-8">
      <Link href="/admin/applications" className="text-sm font-semibold text-teal-800 underline">← All applications</Link>
      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div><p className="text-sm font-semibold uppercase tracking-widest text-violet-700">{application.applicationRef || "Application"}</p><h1 className="mt-2 text-3xl font-bold text-slate-950">{student.studentName}</h1><p className="mt-1 text-slate-600">Submitted {formatAcademyDate(application.submittedAt)}</p></div>
        <span className="rounded-full bg-slate-200 px-3 py-1.5 text-sm font-semibold">{application.status === "UnderReview" ? "Under review" : application.status}</span>
      </div>
      {error ? <div className="mt-5"><ErrorState message={error} onRetry={load} /></div> : null}
      {message ? <p className="mt-5 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800" role="status">{message}</p> : null}
      {credentials.length > 0 ? <section className="mt-5 rounded-2xl border border-amber-300 bg-amber-50 p-5" aria-live="polite"><h2 className="text-lg font-bold text-amber-950">Login details — shown once</h2><p className="mt-2 text-sm text-amber-900">Save or copy these details now. Generated passwords are not stored in plain text and cannot be shown again.</p><div className="mt-4 grid gap-3 sm:grid-cols-2">{credentials.map((credential) => <div key={credential.email} className="rounded-xl border border-amber-200 bg-white p-4"><p className="font-semibold">{credential.name} account</p><p className="mt-2 break-all text-sm"><strong>Email:</strong> {credential.email}</p>{credential.password ? <p className="mt-1 break-all font-mono text-sm"><strong>Temporary password:</strong> {credential.password}</p> : <p className="mt-1 text-sm text-slate-600">An existing parent account was linked; no new password was generated.</p>}<button type="button" onClick={() => copyCredentials(credential)} className="mt-3 rounded-lg bg-amber-800 px-3 py-2 text-sm font-semibold text-white">Copy {credential.password ? "credentials" : "email"}</button></div>)}</div><button type="button" onClick={acknowledgeCredentials} className="mt-4 rounded-lg border border-amber-800 px-4 py-2 text-sm font-semibold text-amber-950">I have saved these details</button></section> : credentialsAcknowledged ? <p className="mt-4 text-sm text-slate-600">Login details were dismissed and will not be shown again.</p> : null}

      <div className="mt-6 grid gap-5 xl:grid-cols-[1.25fr_0.75fr]">
        <div className="space-y-5">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-xl font-bold">Student details</h2>
            <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
              <div><dt className="text-slate-500">Full name</dt><dd className="font-semibold">{student.studentName}</dd></div>
              <div><dt className="text-slate-500">Father&apos;s name</dt><dd className="font-semibold">{student.fatherName}</dd></div>
              <div><dt className="text-slate-500">Date of birth</dt><dd className="font-semibold">{student.dob ? formatAcademyDate(student.dob) : "—"}</dd></div>
              <div><dt className="text-slate-500">Gender</dt><dd className="font-semibold">{student.gender}</dd></div>
              <div><dt className="text-slate-500">Program</dt><dd className="font-semibold">{student.program?.title || student.classApplyingFor}</dd></div>
              <div><dt className="text-slate-500">Previous school</dt><dd className="font-semibold">{application.previousSchool || "—"}</dd></div>
              <div className="sm:col-span-2"><dt className="text-slate-500">Address</dt><dd className="font-semibold">{application.address || "—"}</dd></div>
            </dl>
          </section>
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-xl font-bold">Guardian details</h2>
            <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
              <div><dt className="text-slate-500">Name</dt><dd className="font-semibold">{guardian.name}</dd></div>
              <div><dt className="text-slate-500">CNIC</dt><dd className="font-semibold">{guardian.cnic}</dd></div>
              <div><dt className="text-slate-500">Phone</dt><dd className="font-semibold">{guardian.phone}</dd></div>
              <div><dt className="text-slate-500">WhatsApp</dt><dd className="font-semibold">{guardian.whatsapp || "—"}</dd></div>
              <div><dt className="text-slate-500">Email</dt><dd className="font-semibold">{guardian.email}</dd></div>
              <div><dt className="text-slate-500">Occupation</dt><dd className="font-semibold">{guardian.occupation || "—"}</dd></div>
            </dl>
          </section>
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-xl font-bold">Concession request</h2>
            <p className="mt-3 font-semibold">{concessionNames[application.concessionRequest.type] || application.concessionRequest.type}</p>
            <p className="mt-1 whitespace-pre-wrap text-sm text-slate-600">{application.concessionRequest.note || "No additional details."}</p>
            {application.student ? <p className="mt-3 rounded-lg bg-emerald-50 p-3 text-sm font-semibold text-emerald-900">Applied concession: {application.student.concession?.percent ?? 0}%</p> : null}
          </section>
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-xl font-bold">Documents ({application.documents.length})</h2>
            {application.documents.length ? <ul className="mt-4 grid gap-3 sm:grid-cols-2">{application.documents.map((document, index) => <li key={`${document.filename}-${index}`} className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 p-3"><div className="min-w-0"><p className="font-semibold">{documentNames[document.kind] || document.kind}</p><p className="truncate text-sm text-slate-600">{document.filename} · {(document.size / 1024 / 1024).toFixed(2)} MB</p></div><a href={`/api/admissions/${id}/documents/${index}`} target="_blank" rel="noreferrer" className="shrink-0 rounded-lg bg-teal-800 px-3 py-2 text-sm font-semibold text-white">Open / download</a></li>)}</ul> : <p className="mt-3 text-sm text-slate-600">No documents attached.</p>}
          </section>
        </div>

        <aside className="space-y-5">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-xl font-bold">Review workflow</h2>
            <p className="mt-2 text-sm text-slate-600">Current status: {application.status}</p>
            {application.status === "Approved" ? <div className="mt-4"><label htmlFor="concession-percent" className="text-sm font-semibold">Concession percentage (0–100)</label><input id="concession-percent" type="number" min="0" max="100" step="1" inputMode="numeric" value={application.concessionRequest.type === "none" ? 0 : concessionPercent ?? 0} disabled={application.concessionRequest.type === "none"} onChange={(event) => setConcessionPercent(event.target.value === "" ? null : Number(event.target.value))} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 disabled:bg-slate-100" /><p className="mt-1 text-xs text-slate-500">Prefilled from the academy policy; confirm or adjust before enrollment. Configure policy defaults in src/config/academy.ts.</p></div> : null}
            <div className="mt-4 flex flex-wrap gap-2">
              {application.status === "Submitted" ? <button disabled={saving} onClick={() => update({ status: "UnderReview" })} className="rounded-lg bg-amber-700 px-4 py-2 font-semibold text-white disabled:opacity-50">Move to Under Review</button> : null}
              {application.status === "UnderReview" ? <><button disabled={saving} onClick={() => update({ status: "Approved" })} className="rounded-lg bg-emerald-700 px-4 py-2 font-semibold text-white disabled:opacity-50">Approve</button><button disabled={saving} onClick={() => update({ status: "Rejected" })} className="rounded-lg bg-rose-700 px-4 py-2 font-semibold text-white disabled:opacity-50">Reject</button></> : null}
              {["Approved", "Rejected"].includes(application.status) ? <button disabled={saving} onClick={() => update({ status: "UnderReview" })} className="rounded-lg border border-slate-300 px-4 py-2 font-semibold text-slate-700 disabled:opacity-50">Reopen review</button> : null}
              {application.status === "Approved" ? <button disabled={saving} onClick={enroll} className="rounded-lg bg-violet-700 px-4 py-2 font-semibold text-white disabled:opacity-50">{saving ? "Enrolling…" : "Enroll student"}</button> : null}
            </div>
            {application.student?.regNo ? <p className="mt-4 rounded-lg bg-emerald-50 p-3 text-sm font-semibold text-emerald-900">Registered: {application.student.regNo}</p> : null}
            {application.student?.user?._id ? <div className="mt-4 rounded-xl border border-slate-200 p-3"><p className="font-semibold">Student account · {application.student.user.email}</p><button type="button" disabled={saving} onClick={() => resetPassword(application.student!.user!._id, "student")} className="mt-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-800 disabled:opacity-50">Reset password</button></div> : null}
            {application.student?.guardian?._id ? <div className="mt-3 rounded-xl border border-slate-200 p-3"><p className="font-semibold">Parent account · {application.student.guardian.email}</p><button type="button" disabled={saving} onClick={() => resetPassword(application.student!.guardian!._id, "parent")} className="mt-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-800 disabled:opacity-50">Reset password</button></div> : null}
          </section>
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-xl font-bold">Admin notes</h2>
            <label className="mt-4 block text-sm font-medium">Internal notes<textarea className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2" rows={6} maxLength={4000} value={notes} onChange={(event) => setNotes(event.target.value)} /></label>
            <button type="button" disabled={saving} onClick={() => update({ adminNotes: notes })} className="mt-3 rounded-lg bg-slate-900 px-4 py-2 font-semibold text-white disabled:opacity-50">Save notes</button>
          </section>
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-xl font-bold">Audit trail</h2>
            {!auditTrail.length ? <p className="mt-3 text-sm text-slate-600">No review actions recorded yet.</p> : <ol className="mt-4 space-y-4">{auditTrail.map((entry, index) => <li key={`${entry.createdAt}-${index}`} className="border-l-2 border-slate-200 pl-3"><p className="font-semibold">{entry.action.replaceAll("_", " ").toLowerCase()}</p><p className="text-sm text-slate-600">{entry.actorEmail || "Admin"} · {formatAcademyDate(entry.createdAt)}</p></li>)}</ol>}
          </section>
        </aside>
      </div>
    </main>
  );
}
