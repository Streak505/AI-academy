import { Schema, model, models } from "mongoose";

export const USER_ROLES = ["ADMIN", "INSTRUCTOR", "STUDENT", "PARENT", "MODERATOR"] as const;
export const USER_STATUSES = ["PENDING_VERIFICATION", "ACTIVE", "SUSPENDED", "DISABLED"] as const;
export const AUTH_PROVIDERS = ["local", "google"] as const;

const UserSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, trim: true, lowercase: true, index: true },
    passwordHash: { type: String, default: "", select: false },
    profileImage: { type: String, default: "" },
    avatar: { type: String, default: "" },
    phone: { type: String, default: "" },
    role: { type: String, enum: USER_ROLES, default: "STUDENT" },
    status: { type: String, enum: USER_STATUSES, default: "PENDING_VERIFICATION" },
    emailVerified: { type: Boolean, default: false },
    forcePasswordChange: { type: Boolean, default: false },
    authProvider: { type: String, enum: AUTH_PROVIDERS, default: "local" },
    providerAccountId: { type: String, default: "" },
    isActive: { type: Boolean, default: true },
    instructorProfile: { type: Schema.Types.ObjectId, ref: "Instructor" },
    assignedPrograms: [{ type: Schema.Types.ObjectId, ref: "Program" }],
    verificationTokenHash: { type: String, default: "", select: false },
    verificationTokenExpiresAt: { type: Date, default: null },
    resetTokenHash: { type: String, default: "", select: false },
    resetTokenExpiresAt: { type: Date, default: null },
    lastLoginAt: { type: Date, default: null },
    lastPasswordChangeAt: { type: Date, default: null },
    lastSeenAt: { type: Date, default: null },
  },
  { timestamps: true }
);

UserSchema.index({ role: 1, status: 1, emailVerified: 1 });
UserSchema.index({ isActive: 1, createdAt: -1 });
UserSchema.index({ verificationTokenHash: 1 });
UserSchema.index({ resetTokenHash: 1 });
UserSchema.index({ authProvider: 1, providerAccountId: 1 });

export const User = models.User || model("User", UserSchema);
