import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";

export default async function ParentDashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/signin");
  if (user.role !== "PARENT" && user.role !== "ADMIN") redirect("/");

  return (
    <main className="min-h-screen bg-slate-50 px-4 pb-20 pt-32">
      <section className="mx-auto max-w-4xl rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gold">Parent portal</p>
        <h1 className="mt-3 text-3xl font-bold text-slate-900">Welcome, {user.name}</h1>
        <p className="mt-3 text-slate-600">Parent tools for linked student records will be available here.</p>
        <Link href="/contact" className="mt-6 inline-flex rounded-lg bg-primary px-5 py-3 font-semibold text-white">Contact the academy</Link>
      </section>
    </main>
  );
}
