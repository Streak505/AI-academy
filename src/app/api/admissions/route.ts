import { NextRequest, NextResponse } from "next/server";
import { head } from "@vercel/blob";
import { connectDB } from "@/lib/db";
import { nextCounterValue } from "@/lib/counters";
import { checkRateLimit } from "@/lib/rate-limit";
import { sendEmail } from "@/lib/email";
import { Admission } from "@/models/Admission";
import { Program } from "@/models/Program";
import { requireAdmin } from "@/lib/admin-auth";
import { ADMISSION_CONCESSION_TYPES, ADMISSION_STATUSES, admissionSubmissionSchema } from "@/lib/validations";
import { getPrivateBlobToken } from "@/lib/blob";
import { getAcademySettings } from "@/lib/academy-settings";

function sanitizeText(value: string) {
  return value.replace(/<[^>]*>/g, "").replace(/\p{Cc}/gu, "").trim();
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#39;",
  })[character] ?? character);
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function csvCell(value: unknown) {
  const text = String(value ?? "");
  const safe = /^[\s]*[=+\-@]/.test(text) ? `'${text}` : text;
  return `"${safe.replace(/"/g, '""')}"`;
}

function formatCsvDate(value: Date | string | null | undefined) {
  if (!value) return "";
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Karachi", dateStyle: "short" }).format(new Date(value));
}

function parseDateOnly(value: string, endOfDay: boolean) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) return null;
  return new Date(`${value}T${endOfDay ? "23:59:59.999" : "00:00:00.000"}+05:00`);
}

function omitDocumentUrls<T extends { documents?: Array<Record<string, unknown>> }>(application: T) {
  return {
    ...application,
    documents: application.documents?.map(({ url: _url, ...document }) => document) ?? [],
  };
}

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const limit = checkRateLimit(`admission:${ip}`, 5, 60 * 60 * 1000);
    if (!limit.allowed) {
      return NextResponse.json({ success: false, message: "Too many applications. Please try again later." }, { status: 429 });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ success: false, message: "Invalid request body." }, { status: 400 });
    }
    const parsed = admissionSubmissionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, message: parsed.error.issues[0]?.message || "Please check the application details." }, { status: 400 });
    }
    if (parsed.data.website) return NextResponse.json({ success: true, data: { accepted: true } }, { status: 201 });

    const input = {
      ...parsed.data,
      student: Object.fromEntries(Object.entries(parsed.data.student).map(([key, value]) => [key, typeof value === "string" ? sanitizeText(value) : value])) as typeof parsed.data.student,
      guardian: Object.fromEntries(Object.entries(parsed.data.guardian).map(([key, value]) => [key, typeof value === "string" ? sanitizeText(value) : value])) as typeof parsed.data.guardian,
      concessionRequest: {
        ...parsed.data.concessionRequest,
        note: sanitizeText(parsed.data.concessionRequest.note),
      },
    };
    const cleanResult = admissionSubmissionSchema.safeParse(input);
    if (!cleanResult.success) {
      return NextResponse.json({ success: false, message: cleanResult.error.issues[0]?.message || "Please check the application details." }, { status: 400 });
    }

    await connectDB();
    const program = await Program.findOne({ slug: cleanResult.data.student.program, isPublished: true }).select("_id title").lean();
    if (!program) {
      return NextResponse.json({ success: false, message: "Choose an available program." }, { status: 400 });
    }

    const { student, guardian, concessionRequest, documents } = cleanResult.data;
    const privateToken = documents.length > 0 ? getPrivateBlobToken() : "";
    const storedDocuments = await Promise.all(documents.map(async (document) => {
      if (!/^admissions\/[a-f0-9-]{36}\/[^/]+$/i.test(document.uploadId)) {
        throw new Error("Invalid uploaded document identifier.");
      }
      const blob = await head(document.uploadId, { token: privateToken });
      if (blob.pathname !== document.uploadId || blob.size !== document.size || blob.contentType !== document.mimeType) {
        throw new Error("Uploaded document metadata does not match.");
      }
      return {
        kind: document.kind,
        url: blob.url,
        filename: document.filename,
        size: document.size,
        mimeType: document.mimeType,
      };
    }));
    const year = new Date().getFullYear();
    const sequence = await nextCounterValue(`admission-${year}`);
    const applicationRef = `ADM-${year}-${String(sequence).padStart(5, "0")}`;
    const application = await Admission.create({
      applicationRef,
      applicant: {
        studentName: student.fullName,
        fatherName: student.fatherName,
        dob: new Date(`${student.dob}T00:00:00.000Z`),
        gender: student.gender,
        classApplyingFor: program.title,
        program: program._id,
      },
      guardian,
      address: student.address,
      previousSchool: student.previousSchool,
      concessionRequest,
      documents: storedDocuments,
      status: "Submitted",
      submittedAt: new Date(),
      consentAt: new Date(),
    });

    const escapedName = escapeHtml(student.fullName);
    const academySettings = await getAcademySettings();
    const emailTasks = [
      sendEmail({
        to: guardian.email,
        subject: `Admission application received — ${academySettings.name}`,
        html: `<p>Hello ${escapeHtml(guardian.name)},</p><p>We received the admission application for ${escapedName}.</p><p>Reference: <strong>${applicationRef}</strong></p><p>Our admissions team will contact you about the next steps.</p>`,
        text: `Hello ${guardian.name},\n\nWe received the admission application for ${student.fullName}.\nReference: ${applicationRef}\nOur admissions team will contact you about the next steps.`,
      }),
      sendEmail({
        to: process.env.ADMIN_EMAIL?.trim() || academySettings.email,
        subject: `New admission application — ${applicationRef}`,
        html: `<p>A new admission application was submitted for ${escapedName}.</p><p>Program: ${escapeHtml(program.title)}</p><p>Reference: <strong>${applicationRef}</strong></p>`,
        text: `New admission application ${applicationRef}\nStudent: ${student.fullName}\nProgram: ${program.title}\nGuardian: ${guardian.name} (${guardian.phone}, ${guardian.email})`,
      }),
    ];
    const emailResults = await Promise.allSettled(emailTasks);
    emailResults.forEach((result, index) => {
      if (result.status === "rejected") console.error(`Admission email ${index === 0 ? "confirmation" : "notification"} failed for ${applicationRef}:`, result.reason);
    });

    return NextResponse.json({ success: true, data: { id: String(application._id), applicationRef } }, { status: 201 });
  } catch (error) {
    console.error("POST /api/admissions failed:", error);
    return NextResponse.json({ success: false, message: "Could not submit the admission application." }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json({ success: false, message: "Administrator authentication is required." }, { status: 401 });
    }
    await connectDB();
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, Number.parseInt(searchParams.get("page") || "1", 10) || 1);
    const limit = Math.min(100, Math.max(1, Number.parseInt(searchParams.get("limit") || "20", 10) || 20));
    const status = searchParams.get("status") || "";
    const concession = searchParams.get("concession") || "";
    const programSlug = searchParams.get("program") || "";
    const from = searchParams.get("from") || "";
    const to = searchParams.get("to") || "";
    const search = (searchParams.get("search") || "").trim().slice(0, 120);
    const filter: Record<string, unknown> = {};

    if (status && !ADMISSION_STATUSES.includes(status as (typeof ADMISSION_STATUSES)[number])) {
      return NextResponse.json({ success: false, message: "Invalid status filter." }, { status: 400 });
    }
    if (status) filter.status = status;
    if (concession && !ADMISSION_CONCESSION_TYPES.includes(concession as (typeof ADMISSION_CONCESSION_TYPES)[number])) {
      return NextResponse.json({ success: false, message: "Invalid concession filter." }, { status: 400 });
    }
    if (concession) filter["concessionRequest.type"] = concession;
    if (programSlug) {
      const program = await Program.findOne({ slug: programSlug }).select("_id").lean();
      if (!program) return NextResponse.json({ success: false, message: "Invalid program filter." }, { status: 400 });
      filter["applicant.program"] = program._id;
    }
    if (from || to) {
      const dateRange: Record<string, Date> = {};
      if (from) {
        const start = parseDateOnly(from, false);
        if (!start) return NextResponse.json({ success: false, message: "Invalid start date." }, { status: 400 });
        dateRange.$gte = start;
      }
      if (to) {
        const end = parseDateOnly(to, true);
        if (!end) return NextResponse.json({ success: false, message: "Invalid end date." }, { status: 400 });
        dateRange.$lte = end;
      }
      if (dateRange.$gte && dateRange.$lte && dateRange.$gte > dateRange.$lte) {
        return NextResponse.json({ success: false, message: "Start date must be before the end date." }, { status: 400 });
      }
      filter.submittedAt = dateRange;
    }
    if (search) {
      const query = new RegExp(escapeRegex(search), "i");
      filter.$or = [
        { applicationRef: query },
        { "applicant.studentName": query },
        { "guardian.name": query },
        { "guardian.email": query },
        { "guardian.phone": query },
      ];
    }

    if (searchParams.get("export") === "csv") {
      const applications = await Admission.find(filter).sort({ submittedAt: -1 }).populate("applicant.program", "title").lean();
      const headings = ["Reference", "Student", "Guardian", "Email", "Phone", "Program", "Concession", "Status", "Submitted"];
      const rows = applications.map((application) => [
        application.applicationRef,
        application.applicant?.studentName || application.applicantName,
        application.guardian?.name,
        application.guardian?.email || application.email,
        application.guardian?.phone || application.phone,
        (application.applicant?.program as { title?: string } | null)?.title || application.applicant?.classApplyingFor,
        application.concessionRequest?.type,
        application.status,
        formatCsvDate(application.submittedAt),
      ].map(csvCell).join(","));
      return new NextResponse([headings.map(csvCell).join(","), ...rows].join("\r\n"), {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": 'attachment; filename="admissions.csv"',
          "Cache-Control": "no-store",
        },
      });
    }

    const [items, total] = await Promise.all([
      Admission.find(filter).sort({ submittedAt: -1 }).skip((page - 1) * limit).limit(limit).populate("applicant.program", "title slug").lean(),
      Admission.countDocuments(filter),
    ]);
    return NextResponse.json({ success: true, data: { items: items.map(omitDocumentUrls), pagination: { page, limit, total, pages: Math.ceil(total / limit) } } }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    console.error("GET /api/admissions failed:", error);
    return NextResponse.json({ success: false, message: "Unable to load admission applications." }, { status: 500 });
  }
}
