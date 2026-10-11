import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import UserManagement from "@/components/Admin/UserManagement";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  if (!await isAdminAuthenticated()) redirect("/admin/login");
  return <UserManagement />;
}
