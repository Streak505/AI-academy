import Link from "next/link";
import { redirect } from "next/navigation";
import { connectToDatabase } from "@/lib/db";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { Category } from "@/models/Category";
import { Course } from "@/models/Course";

// DEPRECATED: not part of Shahzaib Royal Academy scope
import { Instructor } from "@/models/Instructor";

export default async function AdminCoursesPage() {
  const isAuthenticated = await isAdminAuthenticated();

  if (!isAuthenticated) {
    redirect("/admin/login");
  }

  await connectToDatabase();

  const [courses, categories, instructors] = await Promise.all([
    Course.find().sort({ createdAt: -1 }).lean(),
    Category.find().lean(),
    Instructor.find().lean(),
  ]);

  const categoryMap = new Map(categories.map((category: any) => [String(category._id), category.name]));
  const instructorMap = new Map(instructors.map((instructor: any) => [String(instructor._id), instructor.name]));

  return (
    <main className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-violet-600">Courses</p>
          <h1 className="mt-2 text-3xl font-bold text-slate-900">Program management</h1>
        </div>
        <Link href="/admin/courses/new" className="rounded-full bg-violet-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-violet-700">
          + New course
        </Link>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-200">
        <table className="min-w-full divide-y divide-slate-200 text-left">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-sm font-semibold text-slate-700">Title</th>
              <th className="px-4 py-3 text-sm font-semibold text-slate-700">Category</th>
              <th className="px-4 py-3 text-sm font-semibold text-slate-700">Instructor</th>
              <th className="px-4 py-3 text-sm font-semibold text-slate-700">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white">
            {courses.length === 0 ? (
              <tr><td colSpan={4} className="px-4 py-12 text-center text-slate-600">No courses have been created yet.</td></tr>
            ) : courses.map((course: any) => (
              <tr key={String(course._id)} className="hover:bg-slate-50 cursor-pointer">
                <td className="px-4 py-4 font-medium text-slate-900">
                  <Link href={`/admin/courses/${course._id}`} className="hover:text-violet-600 transition">
                    {course.title}
                  </Link>
                </td>
                <td className="px-4 py-4 text-slate-600">{categoryMap.get(String(course.category)) || "—"}</td>
                <td className="px-4 py-4 text-slate-600">{instructorMap.get(String(course.instructor)) || "—"}</td>
                <td className="px-4 py-4">
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${course.isPublished ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-700"}`}>
                    {course.isPublished ? "Published" : "Draft"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
