import Link from "next/link";
import { redirect } from "next/navigation";
import { connectToDatabase } from "@/lib/db";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { Category } from "@/models/Category";

export default async function AdminCategoriesPage() {
  const isAuthenticated = await isAdminAuthenticated();

  if (!isAuthenticated) {
    redirect("/admin/login");
  }

  await connectToDatabase();
  const categories = await Category.find().sort({ name: 1 }).lean();

  return (
    <main className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-violet-600">Categories</p>
          <h1 className="mt-2 text-3xl font-bold text-slate-900">Category management</h1>
        </div>
        <Link href="/admin/categories/new" className="rounded-full bg-violet-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-violet-700">
          + New category
        </Link>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-200">
        <table className="min-w-full divide-y divide-slate-200 text-left">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-sm font-semibold text-slate-700">Name</th>
              <th className="px-4 py-3 text-sm font-semibold text-slate-700">Slug</th>
              <th className="px-4 py-3 text-sm font-semibold text-slate-700">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white">
            {categories.map((category: any) => (
              <tr key={String(category._id)} className="hover:bg-slate-50 cursor-pointer">
                <td className="px-4 py-4 font-medium text-slate-900">
                  <Link href={`/admin/categories/${category._id}`} className="hover:text-violet-600 transition">
                    {category.name}
                  </Link>
                </td>
                <td className="px-4 py-4 text-slate-600">{category.slug}</td>
                <td className="px-4 py-4">
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${category.isActive ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-700"}`}>
                    {category.isActive ? "Active" : "Inactive"}
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
