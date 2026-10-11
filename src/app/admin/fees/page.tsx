import { redirect } from "next/navigation";
import FeesPortal from "@/components/Fees/FeesPortal";
import { getCurrentUser } from "@/lib/auth";
import { isValidObjectId } from "@/lib/validations";

export default async function AdminFeesPage({ searchParams }: { searchParams: Promise<{ student?: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/admin/login");
  if (user.role !== "ADMIN") redirect("/");
  const params = await searchParams;
  const studentId = params.student && isValidObjectId(params.student) ? params.student : "";
  return <FeesPortal role="ADMIN" selectedStudentId={studentId} />;
}
