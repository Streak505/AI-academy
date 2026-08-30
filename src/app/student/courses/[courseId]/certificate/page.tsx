import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { connectToDatabase } from "@/lib/db";
import { getCurrentUser } from "@/lib/user-auth";
import { Course } from "@/models/Course";
import { Enrollment } from "@/models/Enrollment";

function formatDate(dateValue?: Date | string | null) {
  if (!dateValue) return "—";
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(date);
}

export default async function StudentCertificatePage({ params }: { params: Promise<{ courseId: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/signin");
  if (user.role !== "STUDENT") redirect(user.role === "ADMIN" ? "/admin/dashboard" : "/instructor/dashboard");

  const { courseId } = await params;
  await connectToDatabase();

  const course = await Course.findById(courseId).lean();
  if (!course) notFound();

  const enrollment = await Enrollment.findOne({ student: user.id, course: courseId, status: "Completed" }).lean();
  if (!enrollment || !enrollment.certificateIssued) notFound();

  const certificateCode = enrollment.certificateCode || `AI-${String(courseId).slice(-6).toUpperCase()}-${new Date().getFullYear()}`;

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-24">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex items-center justify-between gap-3">
          <Link href={`/student/courses/${courseId}`} className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 no-underline hover:border-slate-500">Back to course</Link>
          <Link href="/student/dashboard" className="rounded-full bg-violet-600 px-4 py-2 text-sm font-semibold text-white no-underline hover:bg-violet-700">Dashboard</Link>
        </div>

        <div className="rounded-[2.5rem] border border-amber-200 bg-gradient-to-br from-amber-50 via-white to-emerald-50 p-8 shadow-sm md:p-12">
          <div className="border-2 border-amber-300 rounded-[2rem] bg-white/70 p-8 md:p-12">
            <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.35em] text-violet-700">Academy certificate</p>
                <h1 className="mt-3 text-4xl font-black text-slate-900 md:text-5xl">Certificate of Completion</h1>
              </div>
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
                #{certificateCode}
              </div>
            </div>

            <div className="mt-10 border-t border-slate-200 pt-8">
              <p className="text-sm uppercase tracking-[0.25em] text-slate-500">This certifies that</p>
              <h2 className="mt-4 text-3xl font-semibold text-slate-900">{user.name}</h2>
              <p className="mt-3 text-lg text-slate-700">has successfully completed the course</p>
              <h3 className="mt-6 text-3xl font-bold text-violet-700">{course.title}</h3>
            </div>

            <div className="mt-10 grid gap-6 md:grid-cols-3">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Issued</p>
                <p className="mt-2 text-lg font-semibold text-slate-900">{formatDate(enrollment.completionDate || enrollment.updatedAt)}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Status</p>
                <p className="mt-2 text-lg font-semibold text-emerald-700">Completed</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Program</p>
                <p className="mt-2 text-lg font-semibold text-slate-900">AI Academy</p>
              </div>
            </div>

            <div className="mt-12 flex flex-col gap-6 border-t border-slate-200 pt-8 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Authorized by</p>
                <p className="mt-3 text-xl font-semibold text-slate-900">Academic Leadership</p>
              </div>
              <div className="text-right">
                <div className="inline-block border-b-2 border-slate-400 px-6 pb-2 text-2xl font-semibold text-slate-900">AI Academy</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
