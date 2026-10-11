import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import PortalPage, { PortalFeesPage } from "@/components/Portal/PortalPage";

export default async function PortalRoute({ role, view }: { role: "STUDENT" | "PARENT"; view: string }) {
  const user = await getCurrentUser();
  if (!user) redirect("/signin");
  if (user.role !== role && user.role !== "ADMIN") {
    redirect(user.role === "PARENT" ? "/parent/dashboard" : user.role === "STUDENT" ? "/student/dashboard" : user.role === "INSTRUCTOR" ? "/instructor/dashboard" : "/");
  }
  if (view === "fees") return <PortalFeesPage role={role} />;
  return <PortalPage role={role} view={view} />;
}
