import { describe, expect, it } from "vitest";
import { admissionSubmissionSchema } from "../src/lib/validations";

const validSubmission = {
  student: {
    fullName: "Ayesha Khan",
    fatherName: "Imran Khan",
    dob: "2010-02-14",
    gender: "Female",
    program: "evening-coaching",
    previousSchool: "",
    address: "Main Road, Lahore",
  },
  guardian: {
    name: "Imran Khan",
    cnic: "12345-1234567-1",
    phone: "03001234567",
    whatsapp: "",
    email: "parent@example.com",
    occupation: "",
  },
  concessionRequest: { type: "none", note: "" },
  documents: [{
    kind: "student_identity",
    uploadId: "admissions/550e8400-e29b-41d4-a716-446655440000/identity.pdf",
    filename: "identity.pdf",
    size: 1024,
    mimeType: "application/pdf",
  }],
  consent: true,
};

describe("admission validation", () => {
  it("accepts a complete valid application", () => {
    expect(admissionSubmissionSchema.safeParse(validSubmission).success).toBe(true);
  });

  it("rejects invalid guardians, duplicate files, and missing consent", () => {
    expect(admissionSubmissionSchema.safeParse({
      ...validSubmission,
      guardian: { ...validSubmission.guardian, cnic: "bad" },
    }).success).toBe(false);
    expect(admissionSubmissionSchema.safeParse({
      ...validSubmission,
      documents: [validSubmission.documents[0], validSubmission.documents[0]],
    }).success).toBe(false);
    expect(admissionSubmissionSchema.safeParse({ ...validSubmission, consent: false }).success).toBe(false);
  });
});
