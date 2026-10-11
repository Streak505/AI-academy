import { NextRequest, NextResponse } from "next/server";
import { isValidObjectId } from "@/lib/validations";
import { connectDB } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";
import { Admission } from "@/models/Admission";
import { AuditLog } from "@/models/AuditLog";
import { ADMISSION_STATUSES } from "@/lib/validations";
import { sendAdmissionApprovedEmail } from "@/lib/email";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: RouteContext) {
  try {
    const admin = await requireAdmin();
    if (!admin) return NextResponse.json({ success: false, message: "Administrator authentication is required." }, { status: 401 });
    const { id } = await params;
    if (!isValidObjectId(id)) return NextResponse.json({ success: false, message: "Invalid application id." }, { status: 400 });

    await connectDB();
    const [application, auditTrail] = await Promise.all([
      Admission.findById(id).populate("applicant.program", "title slug").populate({ path: "student", select: "regNo fullName user guardian concession", populate: [{ path: "user", select: "name email role" }, { path: "guardian", select: "name email role" }] }).lean(),
      AuditLog.find({ targetResource: "Admission", targetId: id }).sort({ createdAt: -1 }).limit(100).lean(),
    ]);
    if (!application) return NextResponse.json({ success: false, message: "Application not found." }, { status: 404 });
    const documents = application.documents.map((document: { url: string; [key: string]: unknown }) => {
      const { url: _url, ...metadata } = document;
      return metadata;
    });
    return NextResponse.json({ success: true, data: { application: { ...application, documents }, auditTrail } }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    console.error("GET /api/admissions/[id] failed:", error);
    return NextResponse.json({ success: false, message: "Unable to load this application." }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  try {
    const admin = await requireAdmin();
    if (!admin) return NextResponse.json({ success: false, message: "Administrator authentication is required." }, { status: 401 });
    const { id } = await params;
    if (!isValidObjectId(id)) return NextResponse.json({ success: false, message: "Invalid application id." }, { status: 400 });

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ success: false, message: "Invalid request body." }, { status: 400 });
    }
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json({ success: false, message: "Invalid request." }, { status: 400 });
    }
    const input = body as Record<string, unknown>;
    if (input.status !== undefined && (typeof input.status !== "string" || !ADMISSION_STATUSES.includes(input.status as (typeof ADMISSION_STATUSES)[number]) || input.status === "Enrolled")) {
      return NextResponse.json({ success: false, message: "Choose a valid review status. Enrollment uses the Enroll action." }, { status: 400 });
    }
    if (input.adminNotes !== undefined && (typeof input.adminNotes !== "string" || input.adminNotes.length > 4000)) {
      return NextResponse.json({ success: false, message: "Admin notes must be 4,000 characters or fewer." }, { status: 400 });
    }

    await connectDB();
    const application = await Admission.findById(id);
    if (!application) return NextResponse.json({ success: false, message: "Application not found." }, { status: 404 });
    if (application.status === "Enrolled") return NextResponse.json({ success: false, message: "Enrolled applications cannot be changed." }, { status: 409 });

    const previousStatus = application.status;
    const previousNotes = application.adminNotes;
    if (input.status !== undefined) {
      const nextStatus = input.status as (typeof ADMISSION_STATUSES)[number];
      const allowed: Record<string, string[]> = {
        Submitted: ["UnderReview"],
        UnderReview: ["Approved", "Rejected"],
        Approved: ["UnderReview", "Rejected"],
        Rejected: ["UnderReview"],
      };
      if (nextStatus !== previousStatus && !allowed[previousStatus]?.includes(nextStatus)) {
        return NextResponse.json({ success: false, message: `Cannot move an application from ${previousStatus} to ${nextStatus}.` }, { status: 409 });
      }
      application.status = nextStatus;
      application.reviewedBy = admin.id as never;
    }
    if (typeof input.adminNotes === "string") application.adminNotes = input.adminNotes.replace(/<[^>]*>/g, "").trim();
    await application.save();

    await AuditLog.create({
      actorId: admin.id,
      actorEmail: admin.email,
      action: input.status !== undefined && input.status !== previousStatus ? "ADMISSION_STATUS_UPDATED" : "ADMISSION_NOTES_UPDATED",
      targetResource: "Admission",
      targetId: application._id,
      metadata: {
        applicationRef: application.applicationRef || "",
        previousStatus,
        newStatus: application.status,
        notesChanged: previousNotes !== application.adminNotes,
      },
    });
    if (application.status === "Approved" && previousStatus !== "Approved" && application.guardian?.email) {
      await sendAdmissionApprovedEmail({
        to: application.guardian.email,
        guardianName: application.guardian.name,
        studentName: application.applicant.studentName,
        reference: application.applicationRef,
      });
    }

    return NextResponse.json({ success: true, data: { id: String(application._id), status: application.status, adminNotes: application.adminNotes } });
  } catch (error) {
    console.error("PATCH /api/admissions/[id] failed:", error);
    return NextResponse.json({ success: false, message: "Unable to update this application." }, { status: 500 });
  }
}
