import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import ContactInbox from "@/components/Admin/ContactInbox";

export const dynamic = "force-dynamic";

export default async function AdminContactPage() {
  if (!await isAdminAuthenticated()) redirect("/admin/login");
  return <ContactInbox />;
}
