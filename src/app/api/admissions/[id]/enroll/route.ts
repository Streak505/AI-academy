import mongoose from "mongoose";
import { NextRequest, NextResponse } from "next/server";
import { academy } from "@/config/academy";
import { connectDB } from "@/lib/db";
import { hashPassword, generateSecureToken } from "@/lib/auth";
import { requireAdmin } from "@/lib/admin-auth";
import { nextCounterValue } from "@/lib/counters";
import { sendEmail } from "@/lib/email";
import { Admission } from "@/models/Admission";
import { AuditLog } from "@/models/AuditLog";
import { Student } from "@/models/Student";
import { User } from "@/models/User";
import { isValidObjectId } from "@/lib/validations";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(_request: NextRequest, { params }: RouteContext) {
  try {
    const admin = await requireAdmin();
    if (!admin) return NextResponse.json({ success: false, message: "Administrator authentication is required." }, { status: 401 });
    const { id } = await params;
    if (!isValidObjectId(id)) return NextResponse.json({ success: false, message: "Invalid application id." }, { status: 400 });
    let requestBody: unknown;
    try {
      requestBody = await _request.json();
    } catch {
      return NextResponse.json({ success: false, message: "A confirmed concession percentage is required." }, { status: 400 });
    }
    const concessionPercent = requestBody && typeof requestBody === "object" && !Array.isArray(requestBody)
      ? (requestBody as Record<string, unknown>).concessionPercent
      : undefined;
    if (typeof concessionPercent !== "number" || !Number.isInteger(concessionPercent) || concessionPercent < 0 || concessionPercent > 100) {
      return NextResponse.json({ success: false, message: "Concession percentage must be a whole number from 0 to 100." }, { status: 400 });
    }
    await connectDB();

    const session = await mongoose.startSession();
    type EnrollmentResult =
      | { alreadyEnrolled: true; applicationRef: string; regNo: string }
      | { alreadyEnrolled: false; applicationRef: string; regNo: string; parentEmail: string; parentPassword: string | null; studentEmail: string; studentPassword: string; concessionPercent: number };
    const transactionResult: { value?: EnrollmentResult } = {};
    try {
      await session.withTransaction(async () => {
        const application = await Admission.findById(id).session(session);
        if (!application) throw Object.assign(new Error("Application not found."), { statusCode: 404 });
        if (application.status === "Enrolled" && application.student) {
          const enrolledStudent = await Student.findById(application.student).select("regNo").session(session).lean();
          if (!enrolledStudent) throw new Error("Enrolled admission is missing its student record.");
          transactionResult.value = { alreadyEnrolled: true, applicationRef: application.applicationRef || "", regNo: enrolledStudent.regNo };
          return;
        }
        if (application.status !== "Approved") {
          throw Object.assign(new Error("Only approved applications can be enrolled."), { statusCode: 409 });
        }
        if (application.concessionRequest?.type === "none" && concessionPercent !== 0) {
          throw Object.assign(new Error("Applications without a concession request must use a 0% concession."), { statusCode: 400 });
        }
        if (application.student) {
          throw Object.assign(new Error("This application already has a student record and needs manual reconciliation."), { statusCode: 409 });
        }
        if (!application.applicant.program) throw Object.assign(new Error("The application must have a valid program before enrollment."), { statusCode: 400 });

        const year = new Date().getFullYear();
        const sequence = await nextCounterValue(`student-regno-${year}`, session);
        const regNo = `SRA-${year}-${String(sequence).padStart(4, "0")}`;
        const guardianEmail = application.guardian.email.toLowerCase();
        let parent = await User.findOne({ email: guardianEmail }).session(session);
        let parentPassword: string | null = null;
        if (parent && parent.role !== "PARENT") {
          throw Object.assign(new Error("The guardian email is already used by a non-parent account."), { statusCode: 409 });
        }
        if (!parent) {
          parentPassword = generateSecureToken(12);
          const [createdParent] = await User.create([{
            name: application.guardian.name,
            email: guardianEmail,
            passwordHash: await hashPassword(parentPassword),
            phone: application.guardian.phone,
            role: "PARENT",
            status: "ACTIVE",
            isActive: true,
            emailVerified: true,
            authProvider: "local",
            forcePasswordChange: true,
          }], { session });
          parent = createdParent;
        }

        const studentEmail = `${regNo.toLowerCase()}@students.shahzaibroyalacademy.local`;
        const studentPassword = generateSecureToken(12);
        const [studentUser] = await User.create([{
          name: application.applicant.studentName,
          email: studentEmail,
          passwordHash: await hashPassword(studentPassword),
          phone: application.guardian.phone,
          role: "STUDENT",
          status: "ACTIVE",
          isActive: true,
          emailVerified: true,
          authProvider: "local",
          forcePasswordChange: true,
        }], { session });

        const [student] = await Student.create([{
          user: studentUser._id,
          regNo,
          fullName: application.applicant.studentName,
          fatherName: application.applicant.fatherName,
          guardian: parent._id,
          program: application.applicant.program,
          classLevel: application.applicant.classApplyingFor,
          phone: application.guardian.phone,
          dob: application.applicant.dob || null,
          gender: application.applicant.gender || "Other",
          address: application.address || "",
          concession: {
            type: application.concessionRequest?.type || "none",
            percent: concessionPercent,
            note: application.concessionRequest?.note || "",
          },
          status: "active",
          admissionDate: new Date(),
        }], { session });

        application.status = "Enrolled";
        application.student = student._id;
        application.reviewedBy = admin.id as never;
        await application.save({ session });
        await AuditLog.create([{
          actorId: admin.id,
          actorEmail: admin.email,
          action: "ADMISSION_ENROLLED",
          targetResource: "Admission",
          targetId: application._id,
          metadata: { applicationRef: application.applicationRef || "", regNo, studentId: String(student._id), concessionPercent },
        }], { session });

        transactionResult.value = {
          alreadyEnrolled: false,
          applicationRef: application.applicationRef || "",
          regNo,
          concessionPercent,
          parentEmail: guardianEmail,
          parentPassword,
          studentEmail,
          studentPassword,
        };
      });
    } finally {
      await session.endSession();
    }

    const result = transactionResult.value;
    if (!result) throw new Error("Enrollment transaction did not complete.");
    if (result.alreadyEnrolled) {
      return NextResponse.json({ success: true, data: { applicationRef: result.applicationRef, regNo: result.regNo, alreadyEnrolled: true } });
    }

    const parentCredentials = result.parentPassword
      ? `\nParent login: ${result.parentEmail}\nTemporary password: ${result.parentPassword}\n`
      : `\nYour existing parent account is linked: ${result.parentEmail}\n`;
    const passwordNotice = result.parentPassword
      ? "Both accounts must change their temporary password after signing in."
      : "The student account must change its temporary password after signing in.";
    try {
      await sendEmail({
        to: result.parentEmail,
        subject: `Enrollment complete — ${academy.name}`,
        html: `<p>${applicationGreeting(result.applicationRef)}</p><p>Student registration number: <strong>${result.regNo}</strong></p><p>Student login: ${result.studentEmail}<br>Temporary password: ${result.studentPassword}</p>${result.parentPassword ? `<p>Parent login: ${result.parentEmail}<br>Temporary password: ${result.parentPassword}</p>` : "<p>Your existing parent account has been linked.</p>"}<p>${passwordNotice}</p>`,
        text: `${applicationGreeting(result.applicationRef)}\nStudent registration number: ${result.regNo}\nStudent login: ${result.studentEmail}\nTemporary password: ${result.studentPassword}${parentCredentials}\n${passwordNotice}`,
      });
    } catch (emailError) {
      console.error(`Enrollment email failed for ${result.applicationRef}:`, emailError);
    }

    return NextResponse.json({
      success: true,
      data: {
        applicationRef: result.applicationRef,
        regNo: result.regNo,
        alreadyEnrolled: false,
        credentials: {
          parent: { email: result.parentEmail, ...(result.parentPassword ? { temporaryPassword: result.parentPassword } : {}) },
          student: { email: result.studentEmail, temporaryPassword: result.studentPassword },
          passwordChangeRequired: true,
        },
      },
    }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    const statusCode = error && typeof error === "object" && "statusCode" in error ? Number(error.statusCode) : 500;
    if (statusCode >= 500) console.error("POST /api/admissions/[id]/enroll failed:", error);
    return NextResponse.json({
      success: false,
      message: statusCode === 500 ? "Unable to enroll this application." : error instanceof Error ? error.message : "Unable to enroll this application.",
    }, { status: statusCode });
  }
}

function applicationGreeting(reference: string) {
  return reference ? `Your application ${reference} has been enrolled.` : `Your application has been enrolled at ${academy.name}.`;
}
