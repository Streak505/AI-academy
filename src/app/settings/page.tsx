import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/user-auth";
import PasswordForm from "@/components/Account/PasswordForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/signin");
  return <main className="min-h-screen bg-slate-50 px-4 pb-20 pt-32"><div className="mx-auto max-w-2xl"><p className="text-sm font-semibold uppercase tracking-[0.2em] text-teal-700">Account</p><h1 className="mt-3 text-4xl font-bold text-slate-950">Settings</h1><section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><h2 className="text-xl font-semibold text-slate-950">Change password</h2><p className="mt-2 text-sm text-slate-600">Use a strong password you do not reuse elsewhere.</p><PasswordForm /></section></div></main>;
}
