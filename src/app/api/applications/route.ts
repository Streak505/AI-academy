import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { Admission } from "@/models/Admission";
import { validateEmail, isValidString, isValidObjectId, isValidDate } from "@/lib/validations";
import { requireAdminResponse } from "@/lib/admin-auth";
import { Program } from "@/models/Program";
import { Student } from "@/models/Student";
import { requireAdmin } from "@/lib/auth";

function isAcademyBlobDocument(value: unknown): value is {
  kind: string;
  url: string;
  filename: string;
  size: number;
  mimeType: string;
} {
  if (!value || typeof value !== "object") return false;
  const document = value as Record<string, unknown>;
  if (typeof document.kind !== "string" || typeof document.filename !== "string" || typeof document.mimeType !== "string") return false;
  if (typeof document.url !== "string" || !Number.isSafeInteger(document.size) || Number(document.size) < 0) return false;
  try {
    const url = new URL(document.url);
    return url.protocol === "https:" && url.hostname.endsWith(".blob.vercel-storage.com");
  } catch {
    return false;
  }
}

export async function GET(request: NextRequest) {
  try {
    const unauthorized = await requireAdminResponse();
    if (unauthorized) return unauthorized;
    await connectToDatabase();
    const requestedId = new URL(request.url).searchParams.get("id");
    if (requestedId && !isValidObjectId(requestedId)) {
      return Response.json({ success: false, message: "A valid application id is required." }, { status: 400 });
    }
    const applications = requestedId
      ? await Admission.find({ _id: requestedId }).sort({ submittedAt: -1 }).lean()
      : await Admission.find().sort({ submittedAt: -1 }).lean();
    return NextResponse.json({ success: true, data: applications });
  } catch (error) {
    console.error("GET /api/applications failed:", error);
    return Response.json({ success: false, message: "Unable to load applications." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    const body = await request.json();

    if (!body?.applicantName || !isValidString(body.applicantName, 2, 120)) {
      return Response.json({ success: false, message: "Applicant name is required." }, { status: 400 });
    }

    if (body?.email && !validateEmail(body.email)) {
      return Response.json({ success: false, message: "Valid email is required." }, { status: 400 });
    }

    if (!body?.phone || !isValidString(body.phone, 5, 25)) {
      return Response.json({ success: false, message: "Phone number is required." }, { status: 400 });
    }
    if (body.fatherName !== undefined && !isValidString(body.fatherName, 2, 120)) {
      return NextResponse.json({ success: false, message: "Father's name is invalid." }, { status: 400 });
    }
    if (body.guardianName !== undefined && !isValidString(body.guardianName, 2, 120)) {
      return NextResponse.json({ success: false, message: "Guardian name is invalid." }, { status: 400 });
    }

    const programTitle = String(body?.course ?? body?.program ?? body?.applicant?.classApplyingFor ?? "").trim();
    if (!programTitle || !isValidString(programTitle, 2, 150)) {
      return Response.json({ success: false, message: "Program selection is required." }, { status: 400 });
    }
    if (body.dob && !isValidDate(body.dob)) {
      return Response.json({ success: false, message: "Date of birth is invalid." }, { status: 400 });
    }
    if (body.gender !== undefined && !["Male", "Female", "Other"].includes(body.gender)) {
      return Response.json({ success: false, message: "Gender selection is invalid." }, { status: 400 });
    }
    if (body.documents !== undefined && (!Array.isArray(body.documents) || !body.documents.every(isAcademyBlobDocument))) {
      return Response.json({ success: false, message: "Documents must be valid Vercel Blob URLs with file metadata." }, { status: 400 });
    }

    const program = await Program.findOne({
      $or: [{ title: programTitle }, { slug: programTitle }],
    }).select("_id title").lean();
    const application = await Admission.create({
      applicant: {
        studentName: body.applicantName,
        fatherName: body.fatherName ?? "",
        dob: body.dob || null,
        gender: body.gender ?? "Other",
        classApplyingFor: program?.title ?? programTitle,
        program: program?._id ?? null,
      },
      guardian: {
        name: body.guardianName ?? "",
        cnic: body.cnic ?? "",
        phone: body.guardianPhone ?? body.phone,
        whatsapp: body.whatsapp ?? "",
        email: body.email ?? "",
        occupation: body.occupation ?? "",
      },
      address: body.address ?? body.city ?? "",
      previousSchool: body.previousSchool ?? body.qualification ?? "",
      concessionRequest: body.concessionRequest ?? { type: "none", note: "" },
      documents: body.documents ?? [],
      applicantName: body.applicantName,
      email: body.email,
      phone: body.phone,
      course: program?.title ?? programTitle,
      qualification: body.qualification ?? "",
      city: body.city ?? "",
      message: body.message ?? "",
      status: "Submitted",
      submittedAt: new Date(),
    });

    return NextResponse.json({ success: true, data: application }, { status: 201 });
  } catch (error) {
    console.error("POST /api/applications failed:", error);
    return Response.json({ success: false, message: "Could not submit application." }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const unauthorized = await requireAdminResponse();
    if (unauthorized) return unauthorized;
    const admin = await requireAdmin();
    if (!admin) return Response.json({ success: false, message: "Administrator authentication is required." }, { status: 401 });
    await connectToDatabase();
    const body = await request.json();
    const appId = String(body?._id || body?.id || "");

    if (!appId || !isValidObjectId(appId)) {
      return Response.json({ success: false, message: "A valid application id is required." }, { status: 400 });
    }
    if (body.status !== undefined && !["Submitted", "UnderReview", "Approved", "Rejected", "Enrolled"].includes(body.status)) {
      return Response.json({ success: false, message: "Invalid application status." }, { status: 400 });
    }

    const app = await Admission.findById(appId);
    if (!app) {
      return Response.json({ success: false, message: "Application not found." }, { status: 404 });
    }

    const updates: Record<string, unknown> = { status: body.status ?? app.status };
    if (body.applicantName !== undefined) {
      updates.applicantName = body.applicantName;
      updates["applicant.studentName"] = body.applicantName;
    }
    if (body.email !== undefined) {
      updates.email = body.email;
      updates["guardian.email"] = body.email;
    }
    if (body.phone !== undefined) {
      updates.phone = body.phone;
      updates["guardian.phone"] = body.phone;
    }
    if (body.course !== undefined) {
      updates.course = body.course;
      updates["applicant.classApplyingFor"] = body.course;
      const program = await Program.findOne({ $or: [{ title: body.course }, { slug: body.course }] }).select("_id title").lean();
      updates["applicant.program"] = program?._id ?? null;
      updates["applicant.classApplyingFor"] = program?.title ?? body.course;
      updates.course = program?.title ?? body.course;
    }
    if (body.qualification !== undefined) updates.qualification = body.qualification;
    if (body.city !== undefined) updates.city = body.city;
    if (body.message !== undefined) updates.message = body.message;
    if (body.adminNotes !== undefined) updates.adminNotes = body.adminNotes;
    if (body.reviewedBy !== undefined && isValidObjectId(body.reviewedBy)) updates.reviewedBy = body.reviewedBy;

    if ((body.status === "Approved" || body.status === "Enrolled") && !app.student) {
      const programId = (updates["applicant.program"] as typeof app.applicant.program | undefined) ?? app.applicant?.program;
      if (!programId) {
        return Response.json({ success: false, message: "Select a valid program before approving this application." }, { status: 400 });
      }
      const year = new Date().getFullYear();
      const regPrefix = `SRA-${year}-`;
      const latestStudent = await Student.findOne({ regNo: new RegExp(`^SRA-${year}-\\d+$`) }).sort({ regNo: -1 }).select("regNo").lean();
      const nextSequence = latestStudent ? Number(latestStudent.regNo.slice(regPrefix.length)) + 1 : 1;
      let regNo = `${regPrefix}${String(nextSequence).padStart(4, "0")}`;
      while (await Student.exists({ regNo })) {
        regNo = `${regPrefix}${String(Number(regNo.slice(regPrefix.length)) + 1).padStart(4, "0")}`;
      }
      const student = await Student.create({
        regNo,
        fullName: String(updates["applicant.studentName"] ?? app.applicant.studentName ?? app.applicantName),
        fatherName: String(updates["applicant.fatherName"] ?? app.applicant.fatherName ?? ""),
        program: programId,
        classLevel: String(updates["applicant.classApplyingFor"] ?? app.applicant.classApplyingFor ?? ""),
        phone: String(updates["guardian.phone"] ?? app.guardian.phone ?? app.phone),
        dob: app.applicant.dob || null,
        gender: app.applicant.gender || "Other",
        address: app.address || "",
        concession: {
          type: app.concessionRequest?.type || "none",
          note: app.concessionRequest?.note || "",
        },
        status: "active",
        admissionDate: new Date(),
      });
      updates.student = student._id;
      updates.reviewedBy = admin.id;
    }

    const updated = await Admission.findByIdAndUpdate(appId, { $set: updates }, { new: true, runValidators: true });

    return Response.json({ success: true, data: updated });
  } catch (error) {
    console.error("PUT /api/applications failed:", error);
    return Response.json({ success: false, message: "Could not update application." }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const unauthorized = await requireAdminResponse();
    if (unauthorized) return unauthorized;
    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const appId = searchParams.get("id");

    if (!appId || !isValidObjectId(appId)) {
      return Response.json({ success: false, message: "A valid application id is required." }, { status: 400 });
    }

    const app = await Admission.findByIdAndDelete(appId);
    if (!app) {
      return Response.json({ success: false, message: "Application not found." }, { status: 404 });
    }

    return Response.json({ success: true, message: "Application deleted successfully." });
  } catch (error) {
    console.error("DELETE /api/applications failed:", error);
    return Response.json({ success: false, message: "Could not delete application." }, { status: 500 });
  }
}
