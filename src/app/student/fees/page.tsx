import { redirect } from "next/navigation";
import FeesPortal from "@/components/Fees/FeesPortal";
import { getCurrentUser } from "@/lib/auth";

export default async function StudentFeesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/signin");
  if (user.role !== "STUDENT") redirect(user.role === "ADMIN" ? "/admin/fees" : user.role === "PARENT" ? "/parent/fees" : "/");
  return <FeesPortal role="STUDENT" />;
}
