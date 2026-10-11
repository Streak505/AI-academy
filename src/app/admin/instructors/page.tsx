import Link from "next/link";
import { redirect } from "next/navigation";
import { connectToDatabase } from "@/lib/db";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { Instructor } from "@/models/Instructor";
import { EmptyState } from "@/components/Common/DataState";
import { AdminPagination } from "@/components/Admin/AdminPagination";

const pageSize = 12;

export default async function AdminInstructorsPage({ searchParams }: { searchParams: Promise<{ page?: string; search?: string }> }) {
  const isAuthenticated = await isAdminAuthenticated();
  if (!isAuthenticated) redirect("/admin/login");
  const params = await searchParams;
  const page = Math.max(1, Number.parseInt(params.page || "1", 10) || 1);
  const search = (params.search || "").trim().slice(0, 100);
  const filter = search
    ? { $or: ["name", "email", "specialization"].map((field) => ({ [field]: new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i") })) }
    : {};
  await connectToDatabase();
  const [instructors, total] = await Promise.all([
    Instructor.find(filter).sort({ createdAt: -1 }).skip((page - 1) * pageSize).limit(pageSize).lean(),
    Instructor.countDocuments(filter),
  ]);
  const pages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <main className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-violet-600">Instructors</p>
          <h1 className="mt-2 text-3xl font-bold text-slate-900">Mentor management</h1>
        </div>
        <Link href="/admin/instructors/new" className="rounded-full bg-violet-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-violet-700">
          + New instructor
        </Link>
      </div>

      <form action="/admin/instructors" className="mb-5 flex flex-wrap gap-3">
        <label className="sr-only" htmlFor="instructor-search">Search instructors</label>
        <input id="instructor-search" name="search" defaultValue={search} placeholder="Search name, email, or subject" className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2" />
        <button className="rounded-lg bg-slate-900 px-4 py-2 font-semibold text-white">Search</button>
      </form>

      {instructors.length === 0 ? <EmptyState title="No instructors found" message={search ? "Try a different search or add an instructor." : "Add an instructor to get started."} /> : <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
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
      </div>}
      <AdminPagination page={page} pages={pages} href="/admin/instructors" query={search ? { search } : {}} />
    </main>
  );
}
