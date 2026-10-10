import { redirect } from "next/navigation";
import { formatAcademyDate } from "@/utils/util";
import { connectToDatabase } from "@/lib/db";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { Admission } from "@/models/Admission";

export default async function AdminApplicationsPage() {
  const isAuthenticated = await isAdminAuthenticated();

  if (!isAuthenticated) {
    redirect("/admin/login");
  }

  await connectToDatabase();
  const applications = await Admission.find().sort({ submittedAt: -1 }).lean();

  return (
    <main className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-6">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-violet-600">Applications</p>
        <h1 className="mt-2 text-3xl font-bold text-slate-900">Admission applications</h1>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-200">
        <table className="min-w-full divide-y divide-slate-200 text-left">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-sm font-semibold text-slate-700">Applicant</th>
              <th className="px-4 py-3 text-sm font-semibold text-slate-700">Email</th>
              <th className="px-4 py-3 text-sm font-semibold text-slate-700">Program</th>
              <th className="px-4 py-3 text-sm font-semibold text-slate-700">Status</th>
              <th className="px-4 py-3 text-sm font-semibold text-slate-700">Submitted</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white">
            {applications.map((app: any) => (
              <tr key={String(app._id)}>
                <td className="px-4 py-4 font-medium text-slate-900">{app.applicant?.studentName || app.applicantName}</td>
                <td className="px-4 py-4 text-slate-600">{app.email}</td>
                <td className="px-4 py-4 text-slate-600">{app.applicant?.classApplyingFor || app.course}</td>
                <td className="px-4 py-4">
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                    ["Approved", "Enrolled"].includes(app.status) ? "bg-emerald-100 text-emerald-700" :
                    app.status === "Rejected" ? "bg-rose-100 text-rose-700" :
                    "bg-amber-100 text-amber-700"
                  }`}>
                    {app.status}
                  </span>
                </td>
                <td className="px-4 py-4 text-slate-600">{formatAcademyDate(app.submittedAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
