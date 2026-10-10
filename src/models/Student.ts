import { Schema, model, models } from "mongoose";

const StudentSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", default: null, index: true },
    regNo: { type: String, required: true, unique: true, trim: true },
    fullName: { type: String, required: true, trim: true },
    fatherName: { type: String, required: true, trim: true },
    guardian: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
      validate: {
        validator: async function (this: { $session?: () => import("mongoose").ClientSession | null }, value: unknown) {
          if (!value) return true;
          const UserModel = models.User;
          if (!UserModel) return false;
          const query = UserModel.findOne({ _id: value, role: "PARENT" }).select("_id");
          const session = this.$session?.();
          if (session) query.session(session);
          return Boolean(await query.lean());
        },
        message: "Student guardian must be a user with the PARENT role.",
      },
    },
    program: { type: Schema.Types.ObjectId, ref: "Program", required: true, index: true },
    classLevel: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    dob: { type: Date, default: null },
    gender: { type: String, enum: ["Male", "Female", "Other"], default: "Other" },
    address: { type: String, default: "" },
    concession: {
      type: new Schema(
        {
          type: { type: String, enum: ["none", "orphan", "widow_child", "merit", "other"], default: "none" },
          percent: { type: Number, min: 0, max: 100, default: 0, validate: Number.isInteger },
          note: { type: String, default: "" },
        },
        { _id: false }
      ),
      default: () => ({}),
    },
    status: { type: String, enum: ["active", "inactive", "alumni"], default: "active", index: true },
    admissionDate: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

StudentSchema.index({ status: 1, program: 1 });
StudentSchema.index({ guardian: 1, status: 1 });

export const Student = models.Student || model("Student", StudentSchema);
