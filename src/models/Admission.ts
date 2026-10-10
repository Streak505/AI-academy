import { Schema, model, models } from "mongoose";

const documentSchema = new Schema(
  {
    kind: { type: String, required: true, trim: true },
    url: { type: String, required: true, trim: true },
    filename: { type: String, required: true, trim: true },
    size: { type: Number, required: true, min: 0, validate: Number.isInteger },
    mimeType: { type: String, required: true, trim: true },
  },
  { _id: false }
);

const AdmissionSchema = new Schema(
  {
    applicant: {
      type: new Schema(
        {
          studentName: { type: String, required: true, trim: true },
          fatherName: { type: String, default: "", trim: true },
          dob: { type: Date, default: null },
          gender: { type: String, enum: ["Male", "Female", "Other"], default: "Other" },
          classApplyingFor: { type: String, default: "", trim: true },
          program: { type: Schema.Types.ObjectId, ref: "Program", default: null },
        },
        { _id: false }
      ),
      required: true,
    },
    guardian: {
      type: new Schema(
        {
          name: { type: String, default: "", trim: true },
          cnic: { type: String, default: "", trim: true },
          phone: { type: String, required: true, trim: true },
          whatsapp: { type: String, default: "", trim: true },
          email: { type: String, default: "", trim: true, lowercase: true },
          occupation: { type: String, default: "", trim: true },
        },
        { _id: false }
      ),
      required: true,
    },
    address: { type: String, default: "" },
    previousSchool: { type: String, default: "" },
    concessionRequest: {
      type: new Schema(
        {
          type: { type: String, enum: ["none", "orphan", "widow_child", "merit", "other"], default: "none" },
          note: { type: String, default: "" },
        },
        { _id: false }
      ),
      default: () => ({}),
    },
    documents: { type: [documentSchema], default: [] },
    status: { type: String, enum: ["Submitted", "UnderReview", "Approved", "Rejected", "Enrolled"], default: "Submitted", index: true },
    adminNotes: { type: String, default: "" },
    student: { type: Schema.Types.ObjectId, ref: "Student", default: null },
    submittedAt: { type: Date, default: Date.now, index: true },
    reviewedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
    applicantName: { type: String, default: "" },
    email: { type: String, default: "", lowercase: true },
    phone: { type: String, default: "" },
    course: { type: String, default: "" },
    qualification: { type: String, default: "" },
    city: { type: String, default: "" },
    message: { type: String, default: "" },
  },
  { timestamps: true }
);

AdmissionSchema.index({ status: 1, submittedAt: -1 });

export const Admission = models.Admission || model("Admission", AdmissionSchema);
