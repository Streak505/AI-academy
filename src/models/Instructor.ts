import { Schema, model, models } from "mongoose";

const InstructorSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    bio: { type: String, required: true },
    specialization: { type: String, required: true },
    qualification: { type: String, default: "" },
    experience: { type: String, default: "" },
    image: { type: String, default: "" },
    socialLinks: {
      linkedin: { type: String, default: "" },
      facebook: { type: String, default: "" },
      twitter: { type: String, default: "" },
      instagram: { type: String, default: "" },
    },
    isActive: { type: Boolean, default: true },
    user: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

InstructorSchema.index({ isActive: 1, createdAt: -1 });
InstructorSchema.index({ user: 1 }, { unique: true, sparse: true });

export const Instructor = models.Instructor || model("Instructor", InstructorSchema);
