import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/user-auth";
import { connectToDatabase } from "@/lib/db";
import { User } from "@/models/User";
import { Instructor } from "@/models/Instructor";
import { getAdminEmail } from "@/lib/admin-auth";
import PasswordForm from "@/components/Account/PasswordForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "Profile" };

export default async function ProfilePage() {
  const session = await getCurrentUser();
  const adminEmail = session ? null : await getAdminEmail();
  if (!session && !adminEmail) redirect("/signin");
  await connectToDatabase();
  const user = await User.findOne(session ? { _id: session.id } : { email: adminEmail }).select("name email phone avatar role instructorProfile").lean();
  if (!user) redirect("/signin");
  const instructor = user.role === "INSTRUCTOR" && user.instructorProfile ? await Instructor.findById(user.instructorProfile).select("specialization qualification experience bio").lean() : null;
  return <main className="min-h-screen bg-slate-50 px-4 pb-20 pt-32"><div className="mx-auto max-w-3xl"><p className="text-sm font-semibold uppercase tracking-[0.2em] text-teal-700">Account</p><h1 className="mt-3 text-4xl font-bold text-slate-950">Your profile</h1><div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><dl className="grid gap-5 sm:grid-cols-2"><div><dt className="text-sm text-slate-500">Name</dt><dd className="mt-1 font-semibold text-slate-900">{user.name}</dd></div><div><dt className="text-sm text-slate-500">Email</dt><dd className="mt-1 font-semibold text-slate-900">{user.email}</dd></div><div><dt className="text-sm text-slate-500">Phone</dt><dd className="mt-1 font-semibold text-slate-900">{user.phone || "Not provided"}</dd></div><div><dt className="text-sm text-slate-500">Role</dt><dd className="mt-1 font-semibold text-slate-900">{user.role}</dd></div></dl>{session?.forcePasswordChange ? <div className="mt-8 border-t border-slate-200 pt-6"><h2 className="text-xl font-semibold text-slate-950">Change your temporary password</h2><p className="mt-2 text-sm text-slate-600">Set a new password to continue using your account.</p><PasswordForm /></div> : null}{instructor ? <div className="mt-8 border-t border-slate-200 pt-6"><h2 className="text-xl font-semibold text-slate-950">Instructor profile</h2><p className="mt-3 text-slate-600">{instructor.specialization}</p><p className="mt-2 text-sm text-slate-600">{instructor.qualification || "Qualification not provided"} {instructor.experience ? `• ${instructor.experience}` : ""}</p><p className="mt-3 text-sm leading-6 text-slate-600">{instructor.bio}</p></div> : null}{!session?.forcePasswordChange ? <div className="mt-8 border-t border-slate-200 pt-6"><h2 className="text-xl font-semibold text-slate-950">Update password</h2><PasswordForm /></div> : null}</div></div></main>;
}
