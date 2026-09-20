import mongoose, { Schema, model, models } from "mongoose";

const UserSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ["ADMIN", "INSTRUCTOR", "STUDENT"], default: "STUDENT" },
    avatar: { type: String, default: "" },
    phone: { type: String, default: "" },
    isActive: { type: Boolean, default: true },
    status: { type: String, enum: ["ACTIVE", "SUSPENDED", "PENDING"], default: "ACTIVE" },
    instructorProfile: { type: Schema.Types.ObjectId, ref: "Instructor" },
  },
  { timestamps: true }
);

export const User = models.User || model("User", UserSchema);
