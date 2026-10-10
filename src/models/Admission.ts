import { Schema, model, models } from "mongoose";

const AdmissionSchema = new Schema(
  {
    applicantName: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, required: true },
    course: { type: String, required: true },
    qualification: { type: String, default: "" },
    city: { type: String, default: "" },
    message: { type: String, default: "" },
    status: { type: String, enum: ["Pending", "Contacted", "Approved", "Rejected"], default: "Pending" },
    submittedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const Admission = models.Admission || model("Admission", AdmissionSchema);
