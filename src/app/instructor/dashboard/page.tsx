import Link from "next/link";
import { redirect } from "next/navigation";
import { connectToDatabase } from "@/lib/db";
import { getCurrentUser } from "@/lib/user-auth";
import { User } from "@/models/User";
import { Instructor } from "@/models/Instructor";
import { Course } from "@/models/Course";
import { Enrollment } from "@/models/Enrollment";
import { Review } from "@/models/Review";

export const dynamic = "force-dynamic";
export const metadata = { title: "Instructor Dashboard" };

export default async function InstructorDashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/signin");
  if (user.role !== "INSTRUCTOR") redirect(user.role === "ADMIN" ? "/admin/dashboard" : "/student/dashboard");

  await connectToDatabase();
  const account = await User.findById(user.id).select("instructorProfile").lean();
  const instructor = account?.instructorProfile
    ? await Instructor.findById(account.instructorProfile).lean()
    : await Instructor.findOne({ email: user.email }).lean();

  if (!instructor) {
    return <main className="min-h-screen bg-slate-50 px-4 pb-20 pt-32"><div className="mx-auto max-w-5xl rounded-2xl border border-amber-200 bg-amber-50 p-8 text-center"><h1 className="text-2xl font-bold text-amber-950">Instructor profile pending</h1><p className="mt-2 text-amber-900">Your account is active, but an administrator still needs to connect your instructor profile.</p></div></main>;
  }

  const courses = await Course.find({ instructor: instructor._id }).select("title slug isPublished shortDescription").sort({ createdAt: -1 }).lean();
  const courseIds = courses.map((course) => course._id);
  const [students, reviews] = await Promise.all([
    Enrollment.find({ course: { $in: courseIds }, status: { $ne: "Cancelled" } }).populate("student", "name email").populate("course", "title").sort({ createdAt: -1 }).limit(12).lean(),
    Review.find({ course: { $in: courseIds } }).populate("course", "title").sort({ createdAt: -1 }).limit(8).lean(),
  ]);

  return (
    <main className="min-h-screen bg-slate-50 px-4 pb-20 pt-32">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><p className="text-sm font-semibold uppercase tracking-[0.2em] text-teal-700">Instructor portal</p><h1 className="mt-3 text-4xl font-bold text-slate-950">Welcome, {user.name}</h1><p className="mt-2 text-slate-600">Manage your assigned courses and stay close to your learners.</p></div><form action="/logout" method="POST"><button className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700">Log out</button></form></div>
        <div className="mt-8 grid gap-4 sm:grid-cols-3"><div className="rounded-2xl border border-slate-200 bg-white p-5"><p className="text-sm text-slate-500">My courses</p><p className="mt-2 text-3xl font-bold text-slate-950">{courses.length}</p></div><div className="rounded-2xl border border-slate-200 bg-white p-5"><p className="text-sm text-slate-500">Published</p><p className="mt-2 text-3xl font-bold text-slate-950">{courses.filter((course) => course.isPublished).length}</p></div><div className="rounded-2xl border border-slate-200 bg-white p-5"><p className="text-sm text-slate-500">Learners</p><p className="mt-2 text-3xl font-bold text-slate-950">{students.length}</p></div></div>
        <section id="courses" className="mt-10"><div className="flex items-center justify-between"><h2 className="text-2xl font-semibold text-slate-950">My courses</h2><Link href="/profile" className="text-sm font-semibold text-teal-700 no-underline">View profile</Link></div><div className="mt-4 grid gap-4 md:grid-cols-2">{courses.length === 0 ? <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-slate-600">No courses are assigned to your profile yet.</p> : courses.map((course) => <article key={String(course._id)} className="rounded-2xl border border-slate-200 bg-white p-5"><div className="flex items-start justify-between gap-3"><h3 className="font-semibold text-slate-950">{course.title}</h3><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${course.isPublished ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>{course.isPublished ? "Published" : "Draft"}</span></div><p className="mt-2 text-sm leading-6 text-slate-600">{course.shortDescription}</p><div className="mt-4 flex flex-wrap gap-3"><Link href={`/courses/${course.slug}`} className="inline-block text-sm font-semibold text-teal-700 no-underline">View course</Link><Link href={`/instructor/courses/${String(course._id)}/quizzes`} className="inline-block text-sm font-semibold text-violet-700 no-underline">Manage quizzes</Link></div></article>)}</div></section>
        <section id="students" className="mt-10"><h2 className="text-2xl font-semibold text-slate-950">Recent learners</h2><div className="mt-4 overflow-x-auto rounded-2xl border border-slate-200 bg-white">{students.length === 0 ? <p className="p-8 text-slate-600">No active learners are connected to your courses yet.</p> : <table className="min-w-full text-left text-sm"><thead className="bg-slate-50"><tr><th className="px-4 py-3 font-semibold">Student</th><th className="px-4 py-3 font-semibold">Course</th><th className="px-4 py-3 font-semibold">Progress</th></tr></thead><tbody className="divide-y divide-slate-200">{students.map((enrollment) => <tr key={String(enrollment._id)}><td className="px-4 py-3">{typeof enrollment.student === "object" && enrollment.student ? enrollment.student.name : "Student"}</td><td className="px-4 py-3 text-slate-600">{typeof enrollment.course === "object" && enrollment.course ? enrollment.course.title : "Course"}</td><td className="px-4 py-3 text-slate-600">{enrollment.progress}%</td></tr>)}</tbody></table>}</div></section>
        <section id="reviews" className="mt-10"><h2 className="text-2xl font-semibold text-slate-950">Course reviews</h2><div className="mt-4 grid gap-4 md:grid-cols-2">{reviews.length === 0 ? <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-slate-600">No reviews are available for your courses yet.</p> : reviews.map((review) => <article key={String(review._id)} className="rounded-2xl border border-slate-200 bg-white p-5"><p className="font-semibold text-slate-950">{review.name} <span className="ml-2 text-amber-500">{review.rating}/5</span></p><p className="mt-2 text-sm leading-6 text-slate-600">{review.review}</p></article>)}</div></section>
      </div>
    </main>
  );
}
