import Link from "next/link";
import { redirect } from "next/navigation";
import { connectToDatabase } from "@/lib/db";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { Category } from "@/models/Category";
import { Course } from "@/models/Course";

// DEPRECATED: not part of Shahzaib Royal Academy scope
import { Instructor } from "@/models/Instructor";
import { EmptyState } from "@/components/Common/DataState";
import { AdminPagination } from "@/components/Admin/AdminPagination";

const pageSize = 20;

export default async function AdminCoursesPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const isAuthenticated = await isAdminAuthenticated();

  if (!isAuthenticated) {
    redirect("/admin/login");
  }

  await connectToDatabase();

  const params = await searchParams;
  const page = Math.max(1, Number.parseInt(params.page || "1", 10) || 1);
  const [courses, total, categories, instructors] = await Promise.all([
    Course.find().sort({ createdAt: -1 }).skip((page - 1) * pageSize).limit(pageSize).lean(),
    Course.countDocuments(),
    Category.find().lean(),
    Instructor.find().lean(),
  ]);
  const pages = Math.max(1, Math.ceil(total / pageSize));

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

      {courses.length === 0 ? <EmptyState title="No courses found" message="Create a course to get started." /> : <div className="overflow-x-auto rounded-2xl border border-slate-200">
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
            {courses.map((course: any) => (
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
      </div>}
      <AdminPagination page={page} pages={pages} href="/admin/courses" />
    </main>
  );
}
