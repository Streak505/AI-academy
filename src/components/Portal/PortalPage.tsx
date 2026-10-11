"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import FeesPortal from "@/components/Fees/FeesPortal";
import CounselingBookingForm from "@/components/Academy/CounselingBookingForm";
import { EmptyState, ErrorState, LoadingState } from "@/components/Common/DataState";
import { academy } from "@/config/academy";

type PortalRole = "STUDENT" | "PARENT";
type PortalStudent = { id: string; fullName: string; regNo: string; classLevel: string; program?: { id: string; title: string } | null };
type PortalData = {
  students: PortalStudent[];
  selectedStudentId: string | null;
  dashboard?: { timing: { days: string; from: string; to: string }; month: string; attendancePercent: number; attendanceCount: number; nextChallan: { challanNo: string; total: number; paidAmount: number; dueDate: string; status: string } | null; latestResult: { examName: string; percentage: number; grade: string } | null; upcomingAssignments: { _id: string; title: string; dueDate: string }[]; notices: { id: string; title: string; unread: boolean; pinned: boolean }[] };
  month?: string;
  records?: { id: string; date: string; status: string }[];
  percentage?: number;
  results?: { id: string; examName: string; term?: string; subjects?: { name: string; totalMarks: number; obtainedMarks: number }[]; percentage: number; grade: string; remarks?: string; publishedAt?: string }[];
  attendance?: { date: string; status: string }[];
  assignments?: { id: string; title: string; description: string; dueDate: string; fileUrl: string; submission: { fileUrl: string; submittedAt: string } | null }[];
  notices?: { id: string; title: string; body: string; publishedAt: string; pinned: boolean; unread: boolean }[];
  bookings?: { _id: string; type: string; preferredDate: string; preferredSlot: string; status: string }[];
};

const paths = (role: PortalRole) => role === "PARENT"
  ? [["dashboard", "Dashboard"], ["progress", "Progress"], ["attendance", "Attendance"], ["fees", "Fees"], ["counseling", "Counseling"], ["notices", "Notices"]]
  : [["dashboard", "Dashboard"], ["attendance", "Attendance"], ["fees", "Fees"], ["results", "Results"], ["assignments", "Assignments"], ["notices", "Notices"]];
const pkr = (value: number) => `PKR ${new Intl.NumberFormat("en-PK").format(value || 0)}`;
const dateLabel = (value: string | Date) => new Intl.DateTimeFormat("en-PK", { timeZone: "Asia/Karachi", dateStyle: "medium" }).format(new Date(value));

async function readPortal(response: Response) {
  const result = await response.json() as { success?: boolean; data?: PortalData; message?: string };
  if (!response.ok || !result.success || !result.data) throw new Error(result.message || "Unable to load portal information.");
  return result.data;
}

export function PortalFeesPage({ role }: { role: PortalRole }) {
  const [students, setStudents] = useState<PortalStudent[]>([]);
  const [studentId, setStudentId] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await readPortal(await fetch("/api/portal?view=dashboard", { cache: "no-store" }));
      setStudents(data.students);
      setStudentId((current) => current && data.students.some((student) => student.id === current) ? current : data.selectedStudentId || "");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to load linked students.");
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => { void load(); }, [load]);
  return <div className="min-h-screen bg-slate-50 px-4 pb-20 pt-8 sm:px-6 sm:pt-28"><div className="mx-auto max-w-7xl">
    <h1 className="text-3xl font-bold">{role === "PARENT" ? "Parent fee portal" : "My fees"}</h1>
    <nav aria-label="Portal navigation" className="mt-4 -mx-1 flex gap-2 overflow-x-auto px-1 pb-2">{paths(role).map(([href, label]) => <Link key={href} href={`/${role.toLowerCase()}/${href}`} className={`shrink-0 rounded-full border px-4 py-2 text-sm font-semibold no-underline ${href === "fees" ? "border-teal-700 bg-teal-700 text-white" : "border-slate-300 bg-white text-slate-700 hover:border-teal-700"}`}>{label}</Link>)}</nav>
    {role === "PARENT" && !loading && !error && students.length > 1 ? <label className="mb-4 grid max-w-sm gap-1 text-sm font-semibold text-slate-700">Child<select value={studentId} onChange={(event) => setStudentId(event.target.value)} className="rounded-lg border border-slate-300 bg-white px-3 py-2.5">{students.map((student) => <option key={student.id} value={student.id}>{student.fullName} · {student.regNo}</option>)}</select></label> : null}
    {loading ? <LoadingState label="Loading linked students" /> : error ? <ErrorState message={error} onRetry={() => void load()} /> : students.length === 0 ? <EmptyState title="No linked student records" message="The academy has not linked a student record to this account yet." /> : <FeesPortal role={role} selectedStudentId={studentId} />}
  </div></div>;
}

export default function PortalPage({ role, view }: { role: PortalRole; view: string }) {
  const [data, setData] = useState<PortalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [studentId, setStudentId] = useState("");
  const [month, setMonth] = useState(() => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Karachi", year: "numeric", month: "2-digit" }).format(new Date()));
  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ view, month });
      if (studentId) params.set("studentId", studentId);
      const next = await readPortal(await fetch(`/api/portal?${params}`, { cache: "no-store" }));
      setData(next);
      if (!studentId && next.selectedStudentId) setStudentId(next.selectedStudentId);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to load portal information.");
    } finally {
      setLoading(false);
    }
  }, [month, studentId, view]);
  useEffect(() => { void load(); }, [load]);

  const selected = data?.students.find((student) => student.id === (data.selectedStudentId || studentId));
  const titles: Record<string, string> = { dashboard: "Dashboard", progress: "Student progress", attendance: "Attendance", results: "Results", assignments: "Assignments", notices: "Notices", counseling: "Counseling" };
  const title = titles[view] || "Portal";

  async function markRead(noticeId: string) {
    try {
      const response = await fetch("/api/portal", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "mark-notice-read", noticeId }) });
      const result = await response.json() as { success?: boolean; message?: string };
      if (!response.ok || !result.success) throw new Error(result.message || "Unable to update notice.");
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to update notice.");
    }
  }

  const attendanceDays = useMemo(() => {
    const map = new Map<string, string>();
    for (const record of data?.records ?? []) map.set(new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Karachi" }).format(new Date(record.date)), record.status);
    return map;
  }, [data?.records]);

  return <main className="min-h-screen bg-slate-50 px-4 pb-20 pt-8 text-slate-900 sm:px-6 sm:pt-28">
    <div className="mx-auto max-w-6xl">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div><p className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-700">{role === "PARENT" ? "Parent portal" : "Student portal"}</p><h1 className="mt-2 text-3xl font-bold">{title}</h1>{selected ? <p className="mt-2 text-slate-600">{role === "PARENT" ? `${selected.fullName} · ${selected.regNo} · ${selected.program?.title || selected.classLevel}` : "Your academic information"}</p> : null}</div>
        {role === "PARENT" && data && data.students.length > 1 ? <label className="grid gap-1 text-sm font-semibold">Child<select value={data.selectedStudentId || studentId} onChange={(event) => setStudentId(event.target.value)} className="min-h-11 max-w-full rounded-lg border border-slate-300 bg-white px-3 sm:min-w-64">{data.students.map((student) => <option key={student.id} value={student.id}>{student.fullName} · {student.regNo}</option>)}</select></label> : null}
      </header>
      <nav aria-label="Portal navigation" className="mt-5 -mx-1 flex gap-2 overflow-x-auto px-1 pb-2">{paths(role).map(([href, label]) => <Link key={href} href={`/${role.toLowerCase()}/${href}`} className={`shrink-0 rounded-full border px-4 py-2 text-sm font-semibold no-underline ${href === view ? "border-teal-700 bg-teal-700 text-white" : "border-slate-300 bg-white text-slate-700 hover:border-teal-700"}`}>{label}</Link>)}</nav>
      {role === "PARENT" && data?.students.length === 0 && !loading && !error ? <div className="mt-6"><EmptyState title="No linked student records" message="The academy has not linked a student record to this account yet." /></div> : null}
      {role === "STUDENT" && data?.students.length === 0 && !loading && !error ? <div className="mt-6"><EmptyState title="Student record not connected" message="Contact the academy to link your account with your student record." /></div> : null}
      {error ? <div className="mt-6"><ErrorState message={error} onRetry={() => void load()} /></div> : loading ? <div className="mt-6"><LoadingState label={`Loading ${title.toLowerCase()}`} /></div> : data && data.students.length > 0 ? <div className="mt-6">
        {view === "dashboard" ? <Dashboard role={role} data={data} selected={selected} /> : null}
        {view === "attendance" ? <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6">
          <div className="flex flex-wrap items-end justify-between gap-3"><div><h2 className="text-xl font-bold">Attendance calendar</h2><p className="mt-1 text-sm text-slate-600">Attendance this month: {data.percentage ?? data.dashboard?.attendancePercent ?? 0}%</p></div><label className="grid gap-1 text-sm font-semibold">Month<input type="month" value={month} onChange={(event) => setMonth(event.target.value)} className="min-h-11 rounded-lg border border-slate-300 px-3" /></label></div>
          <Calendar month={month} days={attendanceDays} />
          {data.records?.length === 0 ? <p className="mt-4 text-sm text-slate-600">No attendance has been recorded for this month.</p> : null}
          <p className="mt-4 text-xs text-slate-600">Present and late count as attended. Approved leave is excluded from the percentage. Parent alert threshold: {academy.attendanceAlertThreshold ?? 75}%.</p>
          {(data.percentage ?? 0) < (academy.attendanceAlertThreshold ?? 75) && (data.records?.length ?? 0) > 0 ? <p className="mt-3 rounded-lg bg-rose-50 p-3 text-sm font-semibold text-rose-800" role="status">Attendance is below the academy threshold. Please contact the academy.</p> : null}
        </section> : null}
        {view === "results" ? <Results results={data.results || []} /> : null}
        {view === "progress" ? <Progress data={data} student={selected} /> : null}
        {view === "assignments" ? <Assignments role={role} selectedStudentId={data.selectedStudentId} assignments={data.assignments || []} onComplete={() => void load()} /> : null}
        {view === "notices" ? <Notices notices={data.notices || []} onRead={markRead} /> : null}
        {view === "counseling" ? <div className="grid gap-6 lg:grid-cols-2"><CounselingBookingForm initialValues={{ name: selected?.fullName || "", email: "", phone: "" }} /><section><h2 className="text-xl font-bold">Your sessions</h2>{(data.bookings || []).length === 0 ? <div className="mt-4"><EmptyState title="No counseling sessions" message="Requested, upcoming, and past sessions will appear here." /></div> : <ul className="mt-4 space-y-3">{data.bookings?.map((booking) => <li key={booking._id} className="rounded-xl border border-slate-200 bg-white p-4"><p className="font-semibold">{booking.type}</p><p className="mt-1 text-sm text-slate-600">{dateLabel(booking.preferredDate)} · {booking.preferredSlot} · {booking.status}</p></li>)}</ul>}</section></div> : null}
      </div> : null}
    </div>
  </main>;
}

function Dashboard({ role, data, selected }: { role: PortalRole; data: PortalData; selected?: PortalStudent }) {
  if (!data.dashboard) return <EmptyState title="No student selected" message="No linked student record is available." />;
  const dashboard = data.dashboard;
  const cards = [
    ["Attendance this month", `${dashboard.attendancePercent}%`, `${dashboard.attendanceCount} recorded days`],
    ["Fees due", dashboard.nextChallan ? pkr(Math.max(0, dashboard.nextChallan.total - (dashboard.nextChallan.paidAmount || 0))) : "No dues", dashboard.nextChallan ? `Due ${dateLabel(dashboard.nextChallan.dueDate)} · ${dashboard.nextChallan.status}` : "Up to date"],
    ["Latest result", dashboard.latestResult ? `${dashboard.latestResult.percentage}%` : "No result yet", dashboard.latestResult?.examName || "Published results appear here"],
    ["New notices", String(dashboard.notices.filter((notice) => notice.unread).length), "Unread notices"],
  ];
  return <><section className="rounded-2xl border border-teal-200 bg-teal-50 p-5 sm:p-6"><h2 className="font-semibold text-teal-950">{dashboard.timing.days} · {dashboard.timing.from}–{dashboard.timing.to}</h2><p className="mt-1 text-sm text-teal-900">Today’s academy timing · Pakistan time</p>{role === "PARENT" ? <p className="mt-2 text-sm text-teal-900">Summary for {selected?.fullName} ({selected?.regNo}).</p> : null}</section>
    <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{cards.map(([label, value, detail]) => <article key={label} className="rounded-2xl border border-slate-200 bg-white p-5"><p className="text-sm text-slate-600">{label}</p><p className="mt-2 text-2xl font-bold">{value}</p><p className="mt-1 text-sm text-slate-500">{detail}</p></article>)}</div>
    <div className="mt-5 grid gap-4 lg:grid-cols-2"><section className="rounded-2xl border border-slate-200 bg-white p-5"><h2 className="text-lg font-bold">Upcoming assignments</h2>{dashboard.upcomingAssignments.length ? <ul className="mt-3 space-y-2">{dashboard.upcomingAssignments.map((assignment) => <li key={assignment._id} className="flex flex-wrap justify-between gap-2 text-sm"><span>{assignment.title}</span><time className="text-slate-500">{dateLabel(assignment.dueDate)}</time></li>)}</ul> : <p className="mt-3 text-sm text-slate-600">No upcoming deadlines.</p>}<Link href={`/${role.toLowerCase()}/assignments`} className="mt-4 inline-block text-sm font-semibold text-teal-700">View assignments</Link></section>
      <section className="rounded-2xl border border-slate-200 bg-white p-5"><h2 className="text-lg font-bold">Pinned notices</h2>{dashboard.notices.filter((notice) => notice.pinned).length ? <ul className="mt-3 space-y-2">{dashboard.notices.filter((notice) => notice.pinned).map((notice) => <li key={notice.id} className="text-sm">{notice.title}{notice.unread ? <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-900">New</span> : null}</li>)}</ul> : <p className="mt-3 text-sm text-slate-600">No pinned notices.</p>}<Link href={`/${role.toLowerCase()}/notices`} className="mt-4 inline-block text-sm font-semibold text-teal-700">View notices</Link></section></div>
  </>;
}

function Calendar({ month, days }: { month: string; days: Map<string, string> }) {
  const [year, monthNumber] = month.split("-").map(Number);
  const count = new Date(Date.UTC(year, monthNumber, 0)).getUTCDate();
  const firstDay = new Date(Date.UTC(year, monthNumber - 1, 1)).getUTCDay();
  const offset = (firstDay + 6) % 7;
  return <div className="mt-5 grid grid-cols-7 gap-1 sm:gap-2">{["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => <div key={day} className="p-1 text-center text-xs font-semibold text-slate-500">{day}</div>)}{Array.from({ length: offset }, (_, index) => <div key={`blank-${index}`} />)}{Array.from({ length: count }, (_, index) => {
    const day = index + 1;
    const key = `${month}-${String(day).padStart(2, "0")}`;
    const status = days.get(key);
    const tone = status === "Present" ? "bg-emerald-100 text-emerald-900" : status === "Absent" ? "bg-rose-100 text-rose-900" : status === "Late" ? "bg-amber-100 text-amber-900" : status === "Leave" ? "bg-sky-100 text-sky-900" : "bg-slate-50 text-slate-500";
    return <div key={key} aria-label={`${key}${status ? `: ${status}` : ""}`} className={`min-h-12 rounded-lg p-1 text-center text-xs sm:min-h-16 sm:p-2 ${tone}`}><span className="font-semibold">{day}</span>{status ? <span className="mt-1 block hidden sm:block">{status}</span> : null}</div>;
  })}</div>;
}

function Results({ results }: { results: NonNullable<PortalData["results"]> }) {
  if (!results.length) return <EmptyState title="No published results" message="Your exam results will appear here after they are published." />;
  const points = results.map((result, index) => `${results.length === 1 ? 50 : 10 + (index * 80) / (results.length - 1)},${90 - Math.max(0, Math.min(100, result.percentage)) * 0.75}`).join(" ");
  return <><section className="rounded-2xl border border-slate-200 bg-white p-5"><h2 className="font-bold">Results over time</h2><svg viewBox="0 0 100 100" role="img" aria-label="Exam percentage trend chart" className="mt-3 h-48 w-full"><line x1="8" y1="90" x2="92" y2="90" stroke="#cbd5e1" /><line x1="8" y1="15" x2="8" y2="90" stroke="#cbd5e1" /><polyline points={points} fill="none" stroke="#0f766e" strokeWidth="2" />{results.map((result, index) => <circle key={result.id} cx={results.length === 1 ? 50 : 10 + (index * 80) / (results.length - 1)} cy={90 - Math.max(0, Math.min(100, result.percentage)) * 0.75} r="2.5" fill="#0f766e" />)}</svg><div className="flex justify-between text-xs text-slate-500"><span>0%</span><span>100%</span></div></section>
    <div className="mt-4 space-y-4">{results.map((result) => <article key={result.id} className="rounded-2xl border border-slate-200 bg-white p-5"><div className="flex flex-wrap justify-between gap-2"><div><h3 className="font-bold">{result.examName}</h3><p className="text-sm text-slate-600">{result.term}{result.publishedAt ? ` · ${dateLabel(result.publishedAt)}` : ""}</p></div><p className="text-lg font-bold text-teal-800">{result.percentage}% · {result.grade}</p></div>{result.subjects?.length ? <div className="mt-4 overflow-x-auto"><table className="w-full min-w-64 text-left text-sm"><thead><tr className="border-b text-slate-500"><th className="py-2">Subject</th><th>Marks</th></tr></thead><tbody>{result.subjects.map((subject) => <tr key={subject.name} className="border-b last:border-0"><td className="py-2">{subject.name}</td><td>{subject.obtainedMarks} / {subject.totalMarks}</td></tr>)}</tbody></table></div> : null}{result.remarks ? <p className="mt-3 rounded-lg bg-slate-50 p-3 text-sm">{result.remarks}</p> : null}</article>)}</div>
  </>;
}

function Progress({ data, student }: { data: PortalData; student?: PortalStudent }) {
  const attendance = data.attendance || [];
  const results = data.results || [];
  const bars = attendance.slice(-12);
  return <><div className="flex flex-wrap justify-end"><a href={`/api/portal/report-card?studentId=${encodeURIComponent(student?.id || "")}`} className="rounded-lg bg-teal-700 px-4 py-3 text-center text-sm font-semibold text-white no-underline hover:bg-teal-800">Download report card PDF</a></div>
    <section className="mt-4 rounded-2xl border border-slate-200 bg-white p-5"><h2 className="font-bold">Results over time</h2>{results.length ? <svg viewBox="0 0 100 100" role="img" aria-label="Student result trend chart" className="mt-3 h-40 w-full"><polyline points={results.map((result, index) => `${results.length === 1 ? 50 : 8 + index * 84 / (results.length - 1)},${90 - Math.max(0, Math.min(100, result.percentage)) * .75}`).join(" ")} fill="none" stroke="#0f766e" strokeWidth="2" /></svg> : <p className="mt-3 text-sm text-slate-600">No published results yet.</p>}</section>
    <section className="mt-4 rounded-2xl border border-slate-200 bg-white p-5"><h2 className="font-bold">Recent attendance trend</h2>{bars.length ? <div className="mt-4 flex h-32 items-end gap-2 overflow-x-auto">{bars.map((entry, index) => <div key={`${entry.date}-${index}`} title={`${dateLabel(entry.date)} · ${entry.status}`} className={`min-w-5 flex-1 rounded-t ${entry.status === "Present" || entry.status === "Late" ? "bg-emerald-500" : entry.status === "Leave" ? "bg-sky-400" : "bg-rose-500"}`} style={{ height: `${entry.status === "Present" ? 100 : entry.status === "Late" ? 75 : entry.status === "Leave" ? 40 : 20}%` }} />)}</div> : <p className="mt-3 text-sm text-slate-600">No attendance records yet.</p>}</section>
    <section className="mt-4 rounded-2xl border border-slate-200 bg-white p-5"><h2 className="font-bold">Teacher remarks</h2>{results.filter((result) => result.remarks).length ? <ul className="mt-3 space-y-3">{results.filter((result) => result.remarks).map((result) => <li key={result.id} className="border-l-2 border-teal-600 pl-3"><p className="text-sm font-semibold">{result.examName}</p><p className="mt-1 text-sm text-slate-700">{result.remarks}</p></li>)}</ul> : <p className="mt-3 text-sm text-slate-600">No teacher remarks have been published yet.</p>}</section></>;
}

function Assignments({ role, selectedStudentId, assignments, onComplete }: { role: PortalRole; selectedStudentId: string | null; assignments: NonNullable<PortalData["assignments"]>; onComplete: () => void }) {
  const [uploading, setUploading] = useState("");
  const [message, setMessage] = useState("");
  if (!assignments.length) return <EmptyState title="No assignments" message="New assignments for your program will appear here." />;
  async function upload(assignmentId: string, file?: File) {
    if (!file) return;
    setUploading(assignmentId); setMessage("");
    try {
      const form = new FormData(); form.set("file", file);
      const response = await fetch(`/api/portal/assignments/${assignmentId}/submission`, { method: "POST", body: form });
      const result = await response.json() as { success?: boolean; message?: string };
      if (!response.ok || !result.success) throw new Error(result.message || "Unable to submit assignment.");
      setMessage("Assignment submitted successfully.");
      onComplete();
    } catch (cause) {
      setMessage(cause instanceof Error ? cause.message : "Unable to submit assignment.");
    } finally { setUploading(""); }
  }
  return <div className="space-y-3">{message ? <p role="status" className="rounded-lg bg-teal-50 p-3 text-sm text-teal-900">{message}</p> : null}{assignments.map((assignment) => <article key={assignment.id} className="rounded-2xl border border-slate-200 bg-white p-5"><div className="flex flex-wrap justify-between gap-2"><h2 className="font-bold">{assignment.title}</h2><p className="text-sm text-slate-600">Due {dateLabel(assignment.dueDate)}</p></div><p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">{assignment.description}</p><p className="mt-3 text-sm font-semibold">{assignment.submission ? "Submitted" : new Date(assignment.dueDate) < new Date() ? "Past due" : "Not submitted"}</p>{assignment.fileUrl ? <a href={assignment.fileUrl} target="_blank" rel="noreferrer" className="mt-2 inline-block text-sm font-semibold text-teal-700">Download assignment</a> : null}{assignment.submission ? <a href={`/api/portal/assignments/${assignment.id}/submission${selectedStudentId && role === "PARENT" ? `?studentId=${encodeURIComponent(selectedStudentId)}` : ""}`} className="ml-4 inline-block text-sm font-semibold text-teal-700">Download submitted file</a> : null}{role === "STUDENT" ? <label className="mt-4 block text-sm font-medium">Submit work (PDF, JPG or PNG; max 4 MB)<input type="file" accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png" disabled={Boolean(uploading)} onChange={(event) => void upload(assignment.id, event.currentTarget.files?.[0])} className="mt-2 block w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-teal-50 file:px-3 file:py-2 file:font-semibold file:text-teal-800" />{uploading === assignment.id ? <span role="status">Uploading...</span> : null}</label> : null}</article>)}</div>;
}

function Notices({ notices, onRead }: { notices: NonNullable<PortalData["notices"]>; onRead: (id: string) => void }) {
  if (!notices.length) return <EmptyState title="No notices" message="Notices for your account and program will appear here." />;
  return <div className="space-y-3">{notices.map((notice) => <article key={notice.id} className="rounded-2xl border border-slate-200 bg-white p-5"><div className="flex flex-wrap items-center justify-between gap-2"><h2 className="font-bold">{notice.title}{notice.pinned ? <span className="ml-2 rounded-full bg-teal-100 px-2 py-1 text-xs text-teal-900">Pinned</span> : null}</h2>{notice.unread ? <button type="button" onClick={() => onRead(notice.id)} className="min-h-10 rounded-lg border border-teal-700 px-3 text-sm font-semibold text-teal-800">Mark as read · New</button> : <span className="text-xs text-slate-500">Read</span>}</div><p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-700">{notice.body}</p><time className="mt-3 block text-xs text-slate-500">{dateLabel(notice.publishedAt)}</time></article>)}</div>;
}
