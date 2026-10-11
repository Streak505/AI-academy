import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import StudentManagement from "@/components/Admin/StudentManagement";

export const dynamic = "force-dynamic";

export default async function AdminStudentsPage() {
  if (!await isAdminAuthenticated()) redirect("/admin/login");
  return <StudentManagement />;
}
