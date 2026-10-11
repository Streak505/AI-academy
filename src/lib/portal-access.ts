import type { Role } from "@/lib/auth";

export function resolvePortalStudentId(role: Role, requestedId: string | null, accessibleIds: string[]) {
  if (!requestedId) return { id: accessibleIds[0] ?? null, status: 200 as const };
  if (role === "ADMIN" || accessibleIds.includes(requestedId)) return { id: requestedId, status: 200 as const };
  return { id: null, status: role === "STUDENT" ? 403 as const : 404 as const };
}
