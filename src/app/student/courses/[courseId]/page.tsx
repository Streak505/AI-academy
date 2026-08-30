import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { connectToDatabase } from "@/lib/db";
import { getCurrentUser } from "@/lib/user-auth";
import { Enrollment } from "@/models/Enrollment";
import { Lesson } from "@/models/Lesson";
import { Course } from "@/models/Course";
import { Quiz } from "@/models/Quiz";
import { computeCourseProgress } from "@/lib/course-progress";

function formatDate(dateValue?: Date | string | null) {
  if (!dateValue) return "Never";
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return "Never";
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(date);
}

async function getLearningData(courseId: string, studentId: string) {
  await connectToDatabase();

  const enrollment = await Enrollment.findOne({ student: studentId, course: courseId })
    .populate("course")
    .populate("lastLesson")
    .lean();

  if (!enrollment || !enrollment.course || typeof enrollment.course !== "object") {
    return null;
  }

  const course = await Course.findById(courseId).populate("category").populate("instructor").lean();
  if (!course) return null;

  const lessons = await Lesson.find({ course: courseId, isPublished: true }).sort({ order: 1 }).lean();
  const quizzes = await Quiz.find({ course: courseId, isPublished: true }).sort({ createdAt: -1 }).lean();
  const progressInfo = computeCourseProgress(enrollment.completedLessons ?? [], lessons);
  const currentLesson = lessons.find((lesson) => String(lesson._id) === String(enrollment.lastLesson ?? "")) || lessons[0];

  return {
    course,
    lessons,
    quizzes,
    enrollment,
    progressInfo,
    currentLesson,
  };
}

export default async function StudentCourseLearningPage({ params }: { params: Promise<{ courseId: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/signin");
  if (user.role !== "STUDENT") redirect(user.role === "ADMIN" ? "/admin/dashboard" : "/instructor/dashboard");

  const { courseId } = await params;
  const data = await getLearningData(courseId, user.id);

  if (!data) {
    notFound();
  }

  const { course, lessons, quizzes, progressInfo, currentLesson } = data;
  const nextLesson = lessons.find((lesson: any) => !data.enrollment.completedLessons?.some((completed: any) => String(completed) === String(lesson._id))) || null;

  return (
    <main className="min-h-screen bg-slate-50 px-4 pb-20 pt-30">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-teal-600">Learning path</p>
            <h1 className="mt-2 text-3xl font-bold text-slate-900">{course.title}</h1>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/student/dashboard" className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 no-underline hover:border-slate-500">Back to dashboard</Link>
            <Link href={`/courses/${course.slug}`} className="rounded-full bg-violet-600 px-4 py-2 text-sm font-semibold text-white no-underline hover:bg-violet-700">Course overview</Link>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[280px_minmax(0,1fr)_290px]">
          <aside className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Course chapters</h2>
            <div className="mt-5 space-y-3">
              {lessons.map((lesson: any, index: number) => {
                const isCompleted = data.enrollment.completedLessons?.some((completed: any) => String(completed) === String(lesson._id));
                const isCurrent = currentLesson && String(lesson._id) === String(currentLesson._id);
                return (
                  <div key={String(lesson._id)} className={`rounded-2xl border p-3 ${isCurrent ? "border-teal-500 bg-teal-50" : isCompleted ? "border-emerald-200 bg-emerald-50" : "border-slate-200 bg-slate-50"}`}>
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Lesson {index + 1}</p>
                        <p className="mt-1 text-sm font-semibold text-slate-800">{lesson.title}</p>
                      </div>
                      <span className="text-lg">{isCompleted ? "✓" : isCurrent ? "▶" : "○"}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </aside>

          <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-600">Current lesson</p>
                <h2 className="mt-2 text-2xl font-bold text-slate-900">{currentLesson?.title || "Lesson"}</h2>
              </div>
              <div className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700">{currentLesson?.duration || "-"}</div>
            </div>

            <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-5">
              {currentLesson?.videoUrl ? (
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-900">
                  <video controls className="h-64 w-full object-cover" src={currentLesson.videoUrl} />
                </div>
              ) : (
                <div className="flex min-h-[220px] items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white text-center text-slate-500">
                  <div>
                    <p className="text-base font-semibold text-slate-700">Lesson content coming soon</p>
                    <p className="mt-1 text-sm">This course is ready for the next content upload.</p>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6">
              <h3 className="text-xl font-semibold text-slate-900">Lesson overview</h3>
              <p className="mt-3 text-slate-700">{currentLesson?.description || "This lesson has no additional description yet."}</p>
              {currentLesson?.content ? <div className="mt-5 prose max-w-none text-slate-700" dangerouslySetInnerHTML={{ __html: currentLesson.content }} /> : null}
            </div>

            {currentLesson?.resources?.length ? (
              <div className="mt-8">
                <h3 className="text-xl font-semibold text-slate-900">Resources</h3>
                <ul className="mt-4 space-y-2">
                  {currentLesson.resources.map((resource: string, index: number) => (
                    <li key={`${resource}-${index}`} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-700">
                      {resource}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-5">
              <Link href={lessons.length > 0 ? `/student/courses/${courseId}` : "#"} className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 no-underline hover:border-slate-500">Previous lesson</Link>
              <form action={async () => {
                "use server";
                await connectToDatabase();
                const currentUser = await getCurrentUser();
                if (!currentUser || currentUser.role !== "STUDENT") return;
                const nextCompletion = currentLesson ? String(currentLesson._id) : "";
                if (!nextCompletion) return;
                const enrollment = await Enrollment.findOne({ student: currentUser.id, course: courseId });
                if (!enrollment) return;
                const completedLessons = new Set((enrollment.completedLessons || []).map((item: any) => String(item)));
                completedLessons.add(nextCompletion);
                const nextLessons = Array.from(completedLessons);
                const nextProgress = Math.min(100, Math.round((nextLessons.length / Math.max(1, lessons.length)) * 100));
                await Enrollment.findByIdAndUpdate(enrollment._id, {
                  completedLessons: nextLessons,
                  progress: nextProgress,
                  lastLesson: nextCompletion,
                  lastAccessedAt: new Date(),
                  status: nextProgress >= 100 ? "Completed" : "Active",
                  completionDate: nextProgress >= 100 ? new Date() : undefined,
                });
              }}>
                <button type="submit" className="rounded-full bg-teal-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-teal-800">
                  Mark lesson complete
                </button>
              </form>
            </div>
          </section>

          <aside className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Course progress</h2>
            <div className="mt-6">
              <div className="flex items-center justify-between text-sm text-slate-600">
                <span>Progress</span>
                <span>{progressInfo.progress}%</span>
              </div>
              <div className="mt-2 h-3 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-teal-600" style={{ width: `${progressInfo.progress}%` }} />
              </div>
            </div>

            <div className="mt-6 rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">
              <p className="font-semibold text-slate-900">Learning summary</p>
              <ul className="mt-3 space-y-2">
                <li>Completed: {progressInfo.completedCount}/{progressInfo.totalLessons}</li>
                <li>Last accessed: {formatDate(data.enrollment.lastAccessedAt)}</li>
                <li>Last lesson: {data.enrollment.lastLesson ? (data.enrollment.lastLesson as any).title : "Not started"}</li>
              </ul>
            </div>

            {progressInfo.isComplete ? (
              <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                <p className="text-lg font-bold">🎉 Course completed</p>
                <p className="mt-2">Final progress: 100%</p>
                <p className="mt-1">Completed on {formatDate(data.enrollment.completionDate)}</p>
                {data.enrollment.certificateIssued ? (
                  <Link href={`/student/courses/${courseId}/certificate`} className="mt-3 inline-flex rounded-full bg-emerald-700 px-4 py-2 text-sm font-semibold text-white no-underline hover:bg-emerald-800">
                    View certificate
                  </Link>
                ) : null}
              </div>
            ) : null}

            {quizzes.length > 0 ? (
              <div className="mt-6 rounded-2xl border border-violet-200 bg-violet-50 p-4">
                <p className="text-sm font-semibold uppercase tracking-[0.15em] text-violet-700">Assessment</p>
                <div className="mt-3 space-y-3">
                  {quizzes.map((quiz: any) => (
                    <Link key={String(quiz._id)} href={`/student/courses/${courseId}/quiz/${String(quiz._id)}`} className="block rounded-xl border border-violet-200 bg-white p-3 text-sm font-medium text-violet-700 no-underline hover:border-violet-400">
                      {quiz.title}
                    </Link>
                  ))}
                </div>
              </div>
            ) : null}
          </aside>
        </div>
      </div>
    </main>
  );
}
