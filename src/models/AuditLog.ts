import { Schema, model, models } from "mongoose";

const AuditLogSchema = new Schema(
  {
    actorId: { type: Schema.Types.ObjectId, ref: "User", default: null },
    actorEmail: { type: String, default: "" },
    action: { type: String, required: true, trim: true },
    targetResource: { type: String, default: "" },
    targetId: { type: Schema.Types.ObjectId, default: null },
    metadata: { type: Schema.Types.Mixed, default: {} },
    ipAddress: { type: String, default: "" },
    userAgent: { type: String, default: "" },
  },
  { timestamps: true }
);

AuditLogSchema.index({ actorId: 1, createdAt: -1 });
AuditLogSchema.index({ action: 1, createdAt: -1 });

export const AuditLog = models.AuditLog || model("AuditLog", AuditLogSchema);
