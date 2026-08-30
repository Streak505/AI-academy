import Link from "next/link";
import { redirect } from "next/navigation";
import { connectToDatabase } from "@/lib/db";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { Instructor } from "@/models/Instructor";

export default async function AdminInstructorsPage() {
  const isAuthenticated = await isAdminAuthenticated();

  if (!isAuthenticated) {
    redirect("/admin/login");
  }

  await connectToDatabase();
  const instructors = await Instructor.find().sort({ createdAt: -1 }).lean();

  return (
    <main className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-violet-600">Instructors</p>
          <h1 className="mt-2 text-3xl font-bold text-slate-900">Mentor management</h1>
        </div>
        <Link href="/admin/instructors/new" className="rounded-full bg-violet-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-violet-700">
          + New instructor
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {instructors.map((instructor: any) => (
          <Link key={String(instructor._id)} href={`/admin/instructors/${instructor._id}`}>
            <article className="rounded-2xl border border-slate-200 bg-slate-50 p-5 hover:bg-slate-100 hover:border-violet-300 transition cursor-pointer">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-900">{instructor.name}</h2>
                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${instructor.isActive ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-700"}`}>
                  {instructor.isActive ? "Active" : "Inactive"}
                </span>
              </div>
              <p className="text-sm text-slate-600">{instructor.specialization || "—"}</p>
              <p className="mt-3 text-sm text-slate-500">{instructor.email}</p>
            </article>
          </Link>
        ))}
      </div>
    </main>
  );
}
