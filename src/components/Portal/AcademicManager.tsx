"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { EmptyState, ErrorState, LoadingState } from "@/components/Common/DataState";

type ProgramOption = { id: string; title: string; level: string };
type StudentOption = { id: string; fullName: string; regNo: string; classLevel: string; programId: string };
type InstructorOption = { id: string; name: string; email: string; assignedPrograms: string[] };
type AcademicOptions = { programs: ProgramOption[]; students: StudentOption[]; instructors: InstructorOption[] };
type Subject = { name: string; totalMarks: string };
type ResultMarks = Record<string, Record<number, string>>;

async function requestApi<T>(url: string, init?: RequestInit) {
  const response = await fetch(url, init);
  const result = await response.json() as { success?: boolean; data?: T; message?: string };
  if (!response.ok || !result.success) throw new Error(result.message || "The request could not be completed.");
  return result.data as T;
}

function todayInKarachi() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Karachi", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
}

export default function AcademicManager({ role }: { role: "ADMIN" | "INSTRUCTOR" }) {
  const [options, setOptions] = useState<AcademicOptions | null>(null);
  const [programId, setProgramId] = useState("");
  const [classLevel, setClassLevel] = useState("all");
  const [date, setDate] = useState(todayInKarachi);
  const [attendance, setAttendance] = useState<Record<string, string>>({});
  const [examName, setExamName] = useState("");
  const [term, setTerm] = useState("");
  const [grade, setGrade] = useState("");
  const [remarks, setRemarks] = useState("");
  const [subjects, setSubjects] = useState<Subject[]>([{ name: "", totalMarks: "" }]);
  const [selectedResults, setSelectedResults] = useState<Record<string, boolean>>({});
  const [marks, setMarks] = useState<ResultMarks>({});
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [noticeAudience, setNoticeAudience] = useState("all");
  const [instructorId, setInstructorId] = useState("");
  const [programAssignments, setProgramAssignments] = useState<string[]>([]);

  const load = useCallback(async () => {
    setError("");
    try {
      const data = await requestApi<AcademicOptions>("/api/portal/academic", { cache: "no-store" });
      setOptions(data);
      setProgramId((current) => current || data.programs[0]?.id || "");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to load academic options.");
    }
  }, []);
  useEffect(() => { void load(); }, [load]);

  const programStudents = useMemo(() => options?.students.filter((student) => student.programId === programId) ?? [], [options, programId]);
  const classLevels = useMemo(() => [...new Set(programStudents.map((student) => student.classLevel))].sort(), [programStudents]);
  const students = useMemo(() => programStudents.filter((student) => classLevel === "all" || student.classLevel === classLevel), [classLevel, programStudents]);
  useEffect(() => { if (classLevel !== "all" && !classLevels.includes(classLevel)) setClassLevel("all"); }, [classLevel, classLevels]);
  useEffect(() => {
    setAttendance(Object.fromEntries(students.map((student) => [student.id, "Present"])));
    setSelectedResults({});
    setMarks({});
  }, [students]);
  useEffect(() => {
    const instructor = options?.instructors.find((entry) => entry.id === instructorId);
    setProgramAssignments(instructor?.assignedPrograms || []);
  }, [instructorId, options]);

  async function sendAction(payload: Record<string, unknown>) {
    return requestApi("/api/portal/academic", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
  }

  async function submitAttendance(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const day = new Date(`${date}T12:00:00.000Z`);
    if (!["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].includes(new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Karachi", weekday: "short" }).format(day))) {
      setMessage("Attendance can only be marked Monday through Saturday.");
      return;
    }
    setBusy(true); setMessage("");
    try {
      const result = await sendAction({ action: "attendance", date, records: students.map((student) => ({ studentId: student.id, status: attendance[student.id] || "Present" })) }) as { saved: number };
      setMessage(`Attendance saved for ${result.saved} students.`);
    } catch (cause) {
      setMessage(cause instanceof Error ? cause.message : "Unable to save attendance.");
    } finally { setBusy(false); }
  }

  async function submitResults(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const selected = students.filter((student) => selectedResults[student.id]);
    if (!selected.length || subjects.some((subject) => !subject.name.trim() || !Number.isInteger(Number(subject.totalMarks)) || Number(subject.totalMarks) < 1)) {
      setMessage("Select students and enter valid subject names and maximum marks.");
      return;
    }
    const records = selected.map((student) => ({
      studentId: student.id,
      subjects: subjects.map((subject, index) => ({ name: subject.name, totalMarks: Number(subject.totalMarks), obtainedMarks: Number(marks[student.id]?.[index] ?? "") })),
    }));
    if (selected.some((student) => subjects.some((_, index) => marks[student.id]?.[index] === undefined || marks[student.id]?.[index] === ""))) {
      setMessage("Enter marks for each subject for every selected student.");
      return;
    }
    setBusy(true); setMessage("");
    try {
      const result = await sendAction({ action: "results", examName, term, grade, remarks, records }) as { saved: number };
      setMessage(`Published results for ${result.saved} students.`);
      setSelectedResults({});
      setMarks({});
    } catch (cause) {
      setMessage(cause instanceof Error ? cause.message : "Unable to publish results.");
    } finally { setBusy(false); }
  }

  async function submitForm(event: FormEvent<HTMLFormElement>, action: "assignment" | "notice") {
    event.preventDefault();
    const formElement = event.currentTarget;
    const values = Object.fromEntries(new FormData(formElement).entries());
    setBusy(true); setMessage("");
    try {
      await sendAction({ ...values, action, ...(action === "assignment" ? { programId } : { audience: noticeAudience, programId: noticeAudience === "program" ? programId : undefined, pinned: values.pinned === "on" }) });
      setMessage(action === "assignment" ? "Assignment posted." : "Notice published.");
      formElement.reset();
    } catch (cause) {
      setMessage(cause instanceof Error ? cause.message : "Unable to publish this item.");
    } finally { setBusy(false); }
  }

  async function saveInstructorPrograms(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setMessage("");
    try {
      await sendAction({ action: "assign-programs", instructorId, programIds: programAssignments });
      setMessage("Instructor program access saved.");
      await load();
    } catch (cause) { setMessage(cause instanceof Error ? cause.message : "Unable to save access."); }
    finally { setBusy(false); }
  }

  if (error) return <main className="min-h-screen bg-slate-50 p-4 pt-10 sm:p-8"><div className="mx-auto max-w-5xl"><ErrorState message={error} onRetry={() => void load()} /></div></main>;
  if (!options) return <main className="min-h-screen bg-slate-50 p-4 pt-10 sm:p-8"><div className="mx-auto max-w-5xl"><LoadingState label="Loading academic options" /></div></main>;

  return <main className="min-h-screen bg-slate-50 p-4 pt-8 text-slate-900 sm:p-8"><div className="mx-auto max-w-6xl">
    <p className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-700">{role === "ADMIN" ? "Administration" : "Instructor portal"}</p>
    <h1 className="mt-2 text-3xl font-bold">Academic data entry</h1>
    <p className="mt-2 text-sm text-slate-600">Attendance and results are restricted to your permitted programs. Academy hours are Monday–Saturday, 5–8 PM Pakistan time.</p>
    {message ? <p className="mt-4 rounded-lg border border-teal-200 bg-teal-50 p-3 text-sm text-teal-950" role="status">{message}</p> : null}
    {options.programs.length === 0 ? <div className="mt-6"><EmptyState title="No programs assigned" message="Ask an administrator to assign programs to your instructor account." /></div> : <>
      <label className="mt-5 grid max-w-xl gap-1 text-sm font-semibold">Class / program<select value={programId} onChange={(event) => setProgramId(event.target.value)} className="min-h-11 rounded-lg border border-slate-300 bg-white px-3">{options.programs.map((program) => <option key={program.id} value={program.id}>{program.title} {program.level ? `· ${program.level}` : ""}</option>)}</select></label>
      {classLevels.length > 1 ? <label className="mt-3 grid max-w-xl gap-1 text-sm font-semibold">Class level<select value={classLevel} onChange={(event) => setClassLevel(event.target.value)} className="min-h-11 rounded-lg border border-slate-300 bg-white px-3"><option value="all">All class levels</option>{classLevels.map((level) => <option key={level} value={level}>{level}</option>)}</select></label> : null}
      {role === "ADMIN" ? <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5"><h2 className="text-lg font-bold">Instructor program access</h2>{options.instructors.length ? <form onSubmit={saveInstructorPrograms} className="mt-3"><label className="grid max-w-lg gap-1 text-sm font-semibold">Instructor<select required value={instructorId} onChange={(event) => setInstructorId(event.target.value)} className="min-h-11 rounded-lg border border-slate-300 px-3"><option value="">Select instructor</option>{options.instructors.map((instructor) => <option key={instructor.id} value={instructor.id}>{instructor.name} · {instructor.email}</option>)}</select></label><fieldset className="mt-3 flex flex-wrap gap-3">{options.programs.map((program) => <label key={program.id} className="flex items-center gap-2 rounded-lg bg-slate-50 p-2 text-sm"><input type="checkbox" checked={programAssignments.includes(program.id)} onChange={(event) => setProgramAssignments((values) => event.target.checked ? [...values, program.id] : values.filter((id) => id !== program.id))} />{program.title}</label>)}</fieldset><button disabled={busy || !instructorId} className="mt-4 min-h-11 rounded-lg bg-slate-900 px-4 font-semibold text-white disabled:opacity-50">Save program access</button></form> : <p className="mt-2 text-sm text-slate-600">No instructor accounts to assign.</p>}</section> : null}
      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5"><div className="flex flex-wrap items-end justify-between gap-3"><div><h2 className="text-xl font-bold">Mark attendance</h2><p className="mt-1 text-sm text-slate-600">All students start as Present; change exceptions before saving.</p></div><button type="button" onClick={() => setAttendance(Object.fromEntries(students.map((student) => [student.id, "Present"])))} className="min-h-10 rounded-lg border border-teal-700 px-3 text-sm font-semibold text-teal-800">Mark all present</button></div>
        <form onSubmit={submitAttendance} className="mt-4"><label className="grid max-w-xs gap-1 text-sm font-semibold">Class date<input type="date" required value={date} onChange={(event) => setDate(event.target.value)} className="min-h-11 rounded-lg border border-slate-300 px-3" /></label><div className="mt-4 divide-y divide-slate-100">{students.map((student) => <div key={student.id} className="flex flex-wrap items-center justify-between gap-2 py-3"><span className="text-sm font-medium">{student.regNo} · {student.fullName}</span><select aria-label={`Attendance status for ${student.fullName}`} value={attendance[student.id] || "Present"} onChange={(event) => setAttendance((current) => ({ ...current, [student.id]: event.target.value }))} className="min-h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm">{["Present", "Absent", "Late", "Leave"].map((status) => <option key={status}>{status}</option>)}</select></div>)}</div><button disabled={busy || students.length === 0} className="mt-4 min-h-11 rounded-lg bg-teal-700 px-5 font-semibold text-white disabled:opacity-50">{busy ? "Saving..." : "Save attendance"}</button></form>
      </section>
      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5"><h2 className="text-xl font-bold">Enter exam results</h2><form onSubmit={submitResults} className="mt-4"><div className="grid gap-3 sm:grid-cols-2"><label className="grid gap-1 text-sm font-medium">Exam<input required minLength={2} maxLength={120} value={examName} onChange={(event) => setExamName(event.target.value)} className="min-h-11 rounded-lg border border-slate-300 px-3" /></label><label className="grid gap-1 text-sm font-medium">Term<input required maxLength={80} value={term} onChange={(event) => setTerm(event.target.value)} className="min-h-11 rounded-lg border border-slate-300 px-3" /></label><label className="grid gap-1 text-sm font-medium">Grade label (optional)<input maxLength={20} value={grade} onChange={(event) => setGrade(event.target.value)} className="min-h-11 rounded-lg border border-slate-300 px-3" /></label><label className="grid gap-1 text-sm font-medium">Teacher remarks (optional)<input maxLength={1000} value={remarks} onChange={(event) => setRemarks(event.target.value)} className="min-h-11 rounded-lg border border-slate-300 px-3" /></label></div>
        <div className="mt-4 space-y-2">{subjects.map((subject, index) => <div key={index} className="grid grid-cols-[1fr_7rem_auto] gap-2"><label className="sr-only" htmlFor={`subject-name-${index}`}>Subject name</label><input id={`subject-name-${index}`} required placeholder="Subject" value={subject.name} onChange={(event) => setSubjects((all) => all.map((item, i) => i === index ? { ...item, name: event.target.value } : item))} className="min-h-11 min-w-0 rounded-lg border border-slate-300 px-3" /><label className="sr-only" htmlFor={`subject-total-${index}`}>Maximum marks</label><input id={`subject-total-${index}`} required type="number" min="1" step="1" placeholder="Total" value={subject.totalMarks} onChange={(event) => setSubjects((all) => all.map((item, i) => i === index ? { ...item, totalMarks: event.target.value } : item))} className="min-h-11 min-w-0 rounded-lg border border-slate-300 px-3" /><button type="button" aria-label="Remove subject" disabled={subjects.length === 1} onClick={() => setSubjects((all) => all.filter((_, i) => i !== index))} className="min-h-11 rounded-lg border px-3 disabled:opacity-40">×</button></div>)}</div><button type="button" onClick={() => setSubjects((all) => [...all, { name: "", totalMarks: "" }])} className="mt-2 text-sm font-semibold text-teal-800">+ Add subject</button>
        <div className="mt-4 overflow-x-auto rounded-lg border border-slate-200"><table className="w-full min-w-[40rem] text-left text-sm"><thead className="bg-slate-50"><tr><th className="p-3">Include</th><th className="p-3">Student</th>{subjects.map((subject, index) => <th key={index} className="p-3">{subject.name || `Subject ${index + 1}`} / {subject.totalMarks || "total"}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">{students.map((student) => <tr key={student.id}><td className="p-3"><input aria-label={`Include ${student.fullName} result`} type="checkbox" checked={Boolean(selectedResults[student.id])} onChange={(event) => setSelectedResults((current) => ({ ...current, [student.id]: event.target.checked }))} /></td><td className="p-3">{student.regNo} · {student.fullName}</td>{subjects.map((subject, index) => <td key={index} className="p-3"><input aria-label={`${subject.name || "Subject"} marks for ${student.fullName}`} type="number" min="0" max={subject.totalMarks || undefined} step="1" value={marks[student.id]?.[index] ?? ""} onChange={(event) => setMarks((current) => ({ ...current, [student.id]: { ...current[student.id], [index]: event.target.value } }))} className="min-h-10 w-24 rounded-lg border border-slate-300 px-2" /></td>)}</tr>)}</tbody></table></div><button disabled={busy || students.length === 0} className="mt-4 min-h-11 rounded-lg bg-teal-700 px-5 font-semibold text-white disabled:opacity-50">{busy ? "Publishing..." : "Publish selected results"}</button></form></section>
      <section className="mt-6 grid gap-4 lg:grid-cols-2"><form onSubmit={(event) => void submitForm(event, "assignment")} className="rounded-2xl border border-slate-200 bg-white p-5"><h2 className="text-lg font-bold">Post assignment</h2><label className="mt-3 grid gap-1 text-sm font-medium">Title<input required name="title" minLength={2} maxLength={160} className="min-h-11 rounded-lg border border-slate-300 px-3" /></label><label className="mt-3 grid gap-1 text-sm font-medium">Instructions<textarea required name="description" maxLength={4000} rows={4} className="rounded-lg border border-slate-300 p-3" /></label><label className="mt-3 grid gap-1 text-sm font-medium">Due date and time (Pakistan time)<input required type="datetime-local" name="dueDate" className="min-h-11 rounded-lg border border-slate-300 px-3" /></label>{classLevels.length > 1 ? <label className="mt-3 grid gap-1 text-sm font-medium">Target class level<select name="classLevel" defaultValue={classLevel === "all" ? "" : classLevel} className="min-h-11 rounded-lg border border-slate-300 bg-white px-3"><option value="">All class levels</option>{classLevels.map((level) => <option key={level} value={level}>{level}</option>)}</select></label> : null}<label className="mt-3 grid gap-1 text-sm font-medium">Download URL (optional)<input type="url" name="fileUrl" className="min-h-11 rounded-lg border border-slate-300 px-3" /></label><button disabled={busy} className="mt-4 min-h-11 rounded-lg bg-teal-700 px-4 font-semibold text-white">Post assignment</button></form>
        <form onSubmit={(event) => void submitForm(event, "notice")} className="rounded-2xl border border-slate-200 bg-white p-5"><h2 className="text-lg font-bold">Publish notice</h2><label className="mt-3 grid gap-1 text-sm font-medium">Title<input required name="title" minLength={2} maxLength={160} className="min-h-11 rounded-lg border border-slate-300 px-3" /></label><label className="mt-3 grid gap-1 text-sm font-medium">Message<textarea required name="body" minLength={2} maxLength={4000} rows={5} className="rounded-lg border border-slate-300 p-3" /></label><label className="mt-3 grid gap-1 text-sm font-medium">Audience<select value={noticeAudience} onChange={(event) => setNoticeAudience(event.target.value)} className="min-h-11 rounded-lg border border-slate-300 bg-white px-3"><option value="all">Everyone</option><option value="students">Students</option><option value="parents">Parents</option><option value="program">Selected program</option></select></label><label className="mt-3 flex items-center gap-2 text-sm"><input type="checkbox" name="pinned" />Pin this notice</label><button disabled={busy} className="mt-4 min-h-11 rounded-lg bg-teal-700 px-4 font-semibold text-white">Publish notice</button></form></section>
    </>}
  </div></main>;
}
