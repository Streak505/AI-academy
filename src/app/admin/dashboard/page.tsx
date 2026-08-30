import { redirect } from "next/navigation";
import { connectToDatabase } from "@/lib/db";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { Course } from "@/models/Course";
import { User } from "@/models/User";
import { Enrollment } from "@/models/Enrollment";
import { Admission } from "@/models/Admission";
import { ContactMessage } from "@/models/ContactMessage";
import { Review } from "@/models/Review";
import { Icon } from "@iconify/react";

async function getDashboardData() {
  await connectToDatabase();

  const [totalStudents, totalCourses, activeCourses, totalInstructors, totalEnrollments, pendingApplications, unreadMessages, publishedReviews] = await Promise.all([
    User.countDocuments({ role: "STUDENT" }),
    Course.countDocuments({}),
    Course.countDocuments({ isPublished: true }),
    User.countDocuments({ role: "INSTRUCTOR" }),
    Enrollment.countDocuments({}),
    Admission.countDocuments({ status: "Pending" }),
    ContactMessage.countDocuments({ status: "Unread" }),
    Review.countDocuments({ isPublished: true }),
  ]);

  const recentApplications = await Admission.find().sort({ submittedAt: -1 }).limit(5).lean();
  const recentReviews = await Review.find({ isPublished: true }).sort({ createdAt: -1 }).limit(5).lean();

  return {
    totalStudents,
    totalCourses,
    activeCourses,
    totalInstructors,
    totalEnrollments,
    pendingApplications,
    unreadMessages,
    publishedReviews,
    recentApplications,
    recentReviews,
  };
}

export default async function AdminDashboardPage() {
  const isAuthenticated = await isAdminAuthenticated();

  if (!isAuthenticated) {
    redirect("/admin/login");
  }

  const data = await getDashboardData();

  const cards = [
    { label: "Total Students", value: data.totalStudents, icon: "solar:users-group-rounded-linear", tone: "text-teal-700 bg-teal-50" },
    { label: "Total Courses", value: data.totalCourses, icon: "solar:notebook-linear", tone: "text-blue-700 bg-blue-50" },
    { label: "Active Courses", value: data.activeCourses, icon: "solar:check-circle-linear", tone: "text-emerald-700 bg-emerald-50" },
    { label: "Total Instructors", value: data.totalInstructors, icon: "solar:user-id-linear", tone: "text-amber-700 bg-amber-50" },
    { label: "Total Enrollments", value: data.totalEnrollments, icon: "solar:bookmark-opened-linear", tone: "text-indigo-700 bg-indigo-50" },
    { label: "Pending Applications", value: data.pendingApplications, icon: "solar:hourglass-linear", tone: "text-orange-700 bg-orange-50" },
    { label: "Unread Messages", value: data.unreadMessages, icon: "solar:letter-unread-linear", tone: "text-rose-700 bg-rose-50" },
    { label: "Published Reviews", value: data.publishedReviews, icon: "solar:star-linear", tone: "text-yellow-700 bg-yellow-50" },
  ];

  return (
    <main className="min-h-screen bg-slate-100 p-4 text-slate-800 sm:p-6">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-violet-600">Admin</p>
            <h1 className="mt-2 text-3xl font-bold text-slate-900">Dashboard Overview</h1>
          </div>

          <form action="/logout" method="POST">
            <button type="submit" className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-violet-500 hover:text-violet-700">
              Log out
            </button>
          </form>
        </header>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {cards.map((card) => (
            <div key={card.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm text-slate-500">{card.label}</p>
                <span className={`rounded-xl p-2 ${card.tone}`}><Icon icon={card.icon} className="text-xl" aria-hidden="true" /></span>
              </div>
              <p className="mt-5 text-3xl font-bold text-slate-900">{card.value}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 grid gap-6 xl:grid-cols-2">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-xl font-semibold text-slate-900">Recent Applications</h2>
            <div className="space-y-3">
              {data.recentApplications.length === 0 ? <p className="py-6 text-sm text-slate-500">No applications have been submitted.</p> : data.recentApplications.map((item: any) => (
                <div key={String(item._id)} className="flex items-center justify-between border-b border-slate-100 pb-3 last:border-b-0">
                  <div>
                    <p className="font-medium text-slate-900">{item.applicantName}</p>
                    <p className="text-sm text-slate-500">{item.course}</p>
                  </div>
                  <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700">{item.status}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-xl font-semibold text-slate-900">Recent Reviews</h2>
            <div className="space-y-3">
              {data.recentReviews.length === 0 ? <p className="py-6 text-sm text-slate-500">No published reviews yet.</p> : data.recentReviews.map((item: any) => (
                <div key={String(item._id)} className="border-b border-slate-100 pb-3 last:border-b-0">
                  <p className="font-medium text-slate-900">{item.name}</p>
                  <p className="text-sm text-slate-500">{item.review}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
