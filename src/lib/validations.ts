import { z } from "zod";

export const ADMISSION_DOCUMENT_KINDS = [
  "student_identity",
  "guardian_identity",
  "previous_result",
  "passport_photo",
  "death_certificate",
  "other",
] as const;
export const ADMISSION_CONCESSION_TYPES = ["none", "orphan", "widow_child", "merit", "other"] as const;
export const ADMISSION_STATUSES = ["Submitted", "UnderReview", "Approved", "Rejected", "Enrolled"] as const;
export const ADMISSION_MAX_DOCUMENTS = 6;
export const ADMISSION_MAX_DOCUMENT_SIZE = 4 * 1024 * 1024;

const admissionText = (min: number, max: number, label: string) =>
  z.string().trim().min(min, `${label} is required.`).max(max, `${label} is too long.`);
const optionalAdmissionText = (max: number) => z.string().trim().max(max);

export const admissionDocumentSchema = z.object({
  kind: z.enum(ADMISSION_DOCUMENT_KINDS),
  uploadId: z.string().regex(/^admissions\/[a-f0-9-]{36}\/[^/]+$/i, "Invalid uploaded document."),
  filename: z.string().trim().min(1).max(180).refine((value) => !/[\\/]/.test(value), "Invalid file name."),
  size: z.number().int().positive().max(ADMISSION_MAX_DOCUMENT_SIZE),
  mimeType: z.enum(["application/pdf", "image/jpeg", "image/png"]),
}).refine((document) => {
  const extension = document.filename.toLowerCase().split(".").pop();
  return (extension === "pdf" && document.mimeType === "application/pdf")
    || (["jpg", "jpeg"].includes(extension ?? "") && document.mimeType === "image/jpeg")
    || (extension === "png" && document.mimeType === "image/png");
}, { message: "File extension and type do not match." });

export const storedAdmissionDocumentSchema = z.object({
  kind: z.enum(ADMISSION_DOCUMENT_KINDS),
  url: z.string().url().refine((value) => {
    try {
      const url = new URL(value);
      return url.protocol === "https:" && url.hostname.endsWith(".blob.vercel-storage.com")
        && /^\/admissions\/[a-f0-9-]{36}\//i.test(url.pathname);
    } catch {
      return false;
    }
  }, "Document must be stored in Vercel Blob."),
  filename: z.string().trim().min(1).max(180).refine((value) => !/[\\/]/.test(value), "Invalid file name."),
  size: z.number().int().positive().max(ADMISSION_MAX_DOCUMENT_SIZE),
  mimeType: z.enum(["application/pdf", "image/jpeg", "image/png"]),
});

export const storedAdmissionDocumentListSchema = z.array(storedAdmissionDocumentSchema).max(ADMISSION_MAX_DOCUMENTS);

export const admissionSubmissionSchema = z.object({
  student: z.object({
    fullName: admissionText(2, 120, "Student name"),
    fatherName: admissionText(2, 120, "Father's name"),
    dob: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Enter a valid date of birth.").refine((value) => {
      const date = new Date(`${value}T00:00:00.000Z`);
      return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value && date <= new Date();
    }, "Date of birth must be a valid date in the past."),
    gender: z.enum(["Male", "Female", "Other"]),
    program: admissionText(1, 120, "Program"),
    previousSchool: optionalAdmissionText(160),
    address: admissionText(3, 500, "Address"),
  }),
  guardian: z.object({
    name: admissionText(2, 120, "Guardian name"),
    cnic: z.string().trim().regex(/^\d{5}-\d{7}-\d$/, "Enter CNIC in 12345-1234567-1 format."),
    phone: z.string().trim().min(7).max(30).regex(/^[+()\d\s-]+$/, "Enter a valid phone number."),
    whatsapp: z.string().trim().max(30).regex(/^[+()\d\s-]*$/, "Enter a valid WhatsApp number."),
    email: z.string().trim().email().max(254),
    occupation: optionalAdmissionText(120),
  }),
  concessionRequest: z.object({
    type: z.enum(ADMISSION_CONCESSION_TYPES),
    note: optionalAdmissionText(1000),
  }),
  documents: z.array(admissionDocumentSchema).min(1, "Upload at least one supporting document.").max(ADMISSION_MAX_DOCUMENTS),
  consent: z.boolean().refine((value) => value, "Please confirm the consent statement before submitting."),
  website: z.string().max(200).optional(),
}).superRefine((value, context) => {
  if (new Set(value.documents.map((document) => document.uploadId)).size !== value.documents.length) {
    context.addIssue({ code: "custom", path: ["documents"], message: "Remove duplicate documents before submitting." });
  }
  if (value.concessionRequest.type !== "none" && value.documents.length === 0) {
    context.addIssue({ code: "custom", path: ["documents"], message: "Upload proof documents for the concession request." });
  }
  if (["orphan", "widow_child"].includes(value.concessionRequest.type)
    && !value.documents.some((document) => document.kind === "death_certificate")) {
    context.addIssue({ code: "custom", path: ["documents"], message: "Upload a death certificate as proof for this concession request." });
  }
});

export type AdmissionSubmission = z.infer<typeof admissionSubmissionSchema>;

export function isValidObjectId(value: unknown) {
  if (typeof value !== "string") return false;
  return /^[a-fA-F0-9]{24}$/.test(value);
}

export function validateEmail(value: unknown) {
  if (typeof value !== "string") return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export function isValidRating(value: unknown) {
  if (typeof value !== "number") return false;
  return Number.isFinite(value) && value >= 1 && value <= 5;
}

export function isValidPrice(value: unknown) {
  if (typeof value !== "number") return false;
  return Number.isFinite(value) && value >= 0;
}

export function isValidString(value: unknown, min = 2, max = 200) {
  if (typeof value !== "string") return false;
  const trimmed = value.trim();
  return trimmed.length >= min && trimmed.length <= max;
}

export function isValidDate(value: unknown) {
  if (!(value instanceof Date) && typeof value !== "string") return false;
  const date = value instanceof Date ? value : new Date(value);
  return !Number.isNaN(date.getTime());
}

export function isValidEnum(value: unknown, allowed: readonly string[]) {
  return typeof value === "string" && allowed.includes(value);
}

export function parseJsonBody(body: unknown) {
  if (!body || typeof body !== "object") {
    return null;
  }
  return body as Record<string, unknown>;
}
