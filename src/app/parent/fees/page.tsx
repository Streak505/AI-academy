import { redirect } from "next/navigation";
import FeesPortal from "@/components/Fees/FeesPortal";
import { getCurrentUser } from "@/lib/auth";

export default async function ParentFeesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/signin");
  if (user.role !== "PARENT") redirect(user.role === "ADMIN" ? "/admin/fees" : user.role === "STUDENT" ? "/student/fees" : "/");
  return <FeesPortal role="PARENT" />;
}
