import { AuditLog } from "@/models/AuditLog";

type AdminActor = { id: string; email: string };

export async function recordAdminAudit(
  actor: AdminActor,
  request: Request,
  action: string,
  targetResource: string,
  targetId: string,
  metadata: Record<string, unknown> = {}
) {
  await AuditLog.create({
    actorId: actor.id,
    actorEmail: actor.email,
    action,
    targetResource,
    targetId,
    metadata,
    ipAddress: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "",
    userAgent: request.headers.get("user-agent") ?? "",
  });
}
