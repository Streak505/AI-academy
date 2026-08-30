import { redirect } from "next/navigation";
import Link from "next/link";
import { connectToDatabase } from "@/lib/db";
import { getCurrentUser } from "@/lib/user-auth";
import { Enrollment } from "@/models/Enrollment";

type EnrollmentItem = {
  _id: string;
  status: string;
  progress: number;
  lastAccessedAt?: Date | string | null;
  lastLesson?: { title?: string } | null;
  completionDate?: Date | string | null;
  certificateIssued?: boolean;
  certificateCode?: string;
  course?: { _id?: string; title?: string; shortDescription?: string; slug?: string };
};

async function getEnrollments(studentId: string) {
  await connectToDatabase();
  const enrollments = await Enrollment.find({ student: studentId, status: { $ne: "Cancelled" } })
    .populate("course")
    .populate("lastLesson", "title")
    .sort({ lastAccessedAt: -1, createdAt: -1 })
    .lean();

  return enrollments.map((enrollment) => ({
    _id: String(enrollment._id),
    status: enrollment.status,
    progress: Math.min(100, Math.max(0, Number(enrollment.progress || 0))),
    lastAccessedAt: enrollment.lastAccessedAt ?? null,
    lastLesson: enrollment.lastLesson && typeof enrollment.lastLesson === "object" ? { title: enrollment.lastLesson.title } : null,
    completionDate: enrollment.completionDate ?? null,
    certificateIssued: Boolean(enrollment.certificateIssued),
    certificateCode: enrollment.certificateCode || "",
    course: enrollment.course && typeof enrollment.course === "object" && "slug" in enrollment.course
      ? { _id: String(enrollment.course._id), title: enrollment.course.title, shortDescription: enrollment.course.shortDescription, slug: enrollment.course.slug }
      : undefined,
  })) as EnrollmentItem[];
}

export default async function StudentDashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/signin");
  if (user.role !== "STUDENT") redirect(user.role === "ADMIN" ? "/admin/dashboard" : "/instructor/dashboard");

  let enrollments: EnrollmentItem[] = [];
  let hasError = false;
  try {
    enrollments = await getEnrollments(user.id);
  } catch (error) {
    hasError = true;
    console.error("Unable to load student enrollments:", error);
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 pb-20 pt-32">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-violet-600">Student portal</p>
            <h1 className="mt-2 text-4xl font-bold text-slate-900">Welcome, {user.name}</h1>
            <p className="mt-2 text-slate-600">Continue learning and track your course progress.</p>
          </div>
          <Link href="/programs" className="no-underline rounded-full bg-violet-600 px-5 py-3 text-center font-semibold text-white hover:bg-violet-700">Browse courses</Link>
        </div>

        <section className="mt-10">
          <h2 className="text-2xl font-semibold text-slate-900">My courses</h2>
          {hasError ? (
            <div className="mt-5 rounded-3xl border border-rose-200 bg-rose-50 p-10 text-center">
              <p className="text-lg font-semibold text-rose-900">Unable to load your courses right now.</p>
              <p className="mt-2 text-rose-800">Please refresh the page or try again later.</p>
            </div>
          ) : enrollments.length === 0 ? (
            <div className="mt-5 rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center">
              <p className="text-lg font-semibold text-slate-900">No courses yet</p>
              <p className="mt-2 text-slate-600">Choose a course and start building your AI skills.</p>
              <Link href="/programs" className="mt-5 inline-flex rounded-full bg-violet-600 px-5 py-3 font-semibold text-white no-underline">Explore programs</Link>
            </div>
          ) : (
            <div className="mt-5 grid gap-5 md:grid-cols-2">
              {enrollments.map((enrollment) => {
                const course = enrollment.course;
                return (
                  <article key={String(enrollment._id)} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-600">{enrollment.status}</p>
                    <h3 className="mt-3 text-xl font-semibold text-slate-900">{course?.title || "Course"}</h3>
                    <p className="mt-2 text-sm text-slate-600">{course?.shortDescription}</p>
                    <div className="mt-6 flex items-center justify-between text-sm text-slate-600"><span>Progress</span><span>{enrollment.progress}%</span></div>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-violet-600" style={{ width: `${enrollment.progress}%` }} /></div>
                    <div className="mt-5 flex flex-wrap items-center gap-3">
                      {course?.slug ? <Link href={`/courses/${course.slug}`} className="inline-block font-semibold text-violet-600 no-underline hover:text-violet-800">Open course</Link> : null}
                      {enrollment.status === "Completed" && enrollment.certificateIssued && course?._id ? (
                        <Link href={`/student/courses/${course._id}/certificate`} className="inline-block font-semibold text-emerald-700 no-underline hover:text-emerald-900">View certificate</Link>
                      ) : null}
                    </div>
                    {enrollment.status === "Completed" && enrollment.certificateIssued ? (
                      <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">
                        <p className="font-semibold">Achievement unlocked</p>
                        <p className="mt-1">Certificate code: {enrollment.certificateCode || "AI-CERT"}</p>
                      </div>
                    ) : null}
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
