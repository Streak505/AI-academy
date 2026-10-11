import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import AcademySettingsForm from "@/components/Admin/AcademySettingsForm";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  if (!await isAdminAuthenticated()) redirect("/admin/login");
  return <AcademySettingsForm />;
}
