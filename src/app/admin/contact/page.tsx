import Link from "next/link";
import { redirect } from "next/navigation";
import { formatAcademyDate } from "@/utils/util";
import { connectToDatabase } from "@/lib/db";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { ContactMessage } from "@/models/ContactMessage";

export default async function AdminContactPage() {
  const isAuthenticated = await isAdminAuthenticated();

  if (!isAuthenticated) {
    redirect("/admin/login");
  }

  await connectToDatabase();
  const messages = await ContactMessage.find().sort({ createdAt: -1 }).lean();

  return (
    <main className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-6">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-violet-600">Contact</p>
        <h1 className="mt-2 text-3xl font-bold text-slate-900">Contact messages</h1>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-200">
        <table className="min-w-full divide-y divide-slate-200 text-left">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-sm font-semibold text-slate-700">Name</th>
              <th className="px-4 py-3 text-sm font-semibold text-slate-700">Email</th>
              <th className="px-4 py-3 text-sm font-semibold text-slate-700">Subject</th>
              <th className="px-4 py-3 text-sm font-semibold text-slate-700">Status</th>
              <th className="px-4 py-3 text-sm font-semibold text-slate-700">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white">
            {messages.map((msg: any) => (
              <tr key={String(msg._id)}>
                <td className="px-4 py-4 font-medium text-slate-900">{msg.name}</td>
                <td className="px-4 py-4 text-slate-600">{msg.email}</td>
                <td className="px-4 py-4 text-slate-600 max-w-xs truncate">{msg.subject}</td>
                <td className="px-4 py-4">
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                    msg.status === "Read" ? "bg-slate-100 text-slate-700" :
                    "bg-blue-100 text-blue-700"
                  }`}>
                    {msg.status}
                  </span>
                </td>
                <td className="px-4 py-4 text-slate-600">{formatAcademyDate(msg.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
