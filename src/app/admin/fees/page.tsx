import { redirect } from "next/navigation";
import FeesPortal from "@/components/Fees/FeesPortal";
import { getCurrentUser } from "@/lib/auth";

export default async function AdminFeesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/admin/login");
  if (user.role !== "ADMIN") redirect("/");
  return <FeesPortal role="ADMIN" />;
}
