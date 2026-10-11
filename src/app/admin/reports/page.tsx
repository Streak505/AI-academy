import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import ReportsDashboard from "@/components/Admin/ReportsDashboard";

export const dynamic = "force-dynamic";

export default async function AdminReportsPage() {
  if (!await isAdminAuthenticated()) redirect("/admin/login");
  return <ReportsDashboard />;
}
