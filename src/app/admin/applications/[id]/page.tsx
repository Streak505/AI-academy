import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import ApplicationDetail from "@/components/Admin/ApplicationDetail";

export const dynamic = "force-dynamic";

export default async function AdminApplicationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  if (!await isAdminAuthenticated()) redirect("/admin/login");
  const { id } = await params;
  return <ApplicationDetail id={id} />;
}
