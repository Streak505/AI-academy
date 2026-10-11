import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import CounselingManagement from "@/components/Admin/CounselingManagement";

export const dynamic = "force-dynamic";

export default async function AdminCounselingPage() {
  if (!await isAdminAuthenticated()) redirect("/admin/login");
  return <CounselingManagement />;
}
