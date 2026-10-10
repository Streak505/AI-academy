import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { getPublicPrograms } from "@/lib/public-data";
import ApplicationsTable from "@/components/Admin/ApplicationsTable";

export const dynamic = "force-dynamic";

export default async function AdminApplicationsPage() {
  if (!await isAdminAuthenticated()) redirect("/admin/login");
  const programs = await getPublicPrograms();
  return <ApplicationsTable programs={programs.success ? programs.data : []} />;
}
