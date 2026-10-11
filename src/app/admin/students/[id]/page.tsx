import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import StudentProfile from "@/components/Admin/StudentProfile";

export const dynamic = "force-dynamic";

export default async function AdminStudentProfilePage({ params }: { params: Promise<{ id: string }> }) {
  if (!await isAdminAuthenticated()) redirect("/admin/login");
  const { id } = await params;
  return <StudentProfile id={id} />;
}
