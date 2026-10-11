import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import AcademicManager from "@/components/Portal/AcademicManager";

export default async function AcademicRoute() {
  const user = await getCurrentUser();
  if (!user) redirect("/signin");
  if (user.role !== "ADMIN" && user.role !== "INSTRUCTOR") redirect("/");
  return <AcademicManager role={user.role} />;
}
