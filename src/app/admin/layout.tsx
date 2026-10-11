import { getCurrentUser } from "@/lib/auth";
import AdminShell from "@/components/Admin/AdminShell";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  return <AdminShell identity={user?.role === "ADMIN" ? user.email : ""} isAdmin={user?.role === "ADMIN"}>{children}</AdminShell>;
}
