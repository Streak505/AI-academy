import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import WebsiteContentManager from "@/components/Admin/WebsiteContentManager";
export const dynamic = "force-dynamic";
export default async function AdminGalleryPage() {
  if (!await isAdminAuthenticated()) redirect("/admin/login");
  return <WebsiteContentManager kind="gallery" />;
}
