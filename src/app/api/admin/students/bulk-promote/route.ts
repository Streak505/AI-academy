import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { fail, ok, requireAuth } from "@/lib/api";
import { isValidString } from "@/lib/validations";
import { Student } from "@/models/Student";
import { recordAdminAudit } from "@/lib/admin-audit";

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(["ADMIN"]);
    if (!auth.authorized) return auth.response;
    let input: Record<string, unknown>;
    try {
      input = await request.json();
    } catch {
      return fail("Invalid request body.", 400);
    }
    if (!isValidString(input.fromClass, 1, 80) || !isValidString(input.toClass, 1, 80) || input.fromClass === input.toClass) {
      return fail("Choose different valid source and destination classes.", 400);
    }
    await connectDB();
    const filter = { classLevel: String(input.fromClass).trim(), status: "active" };
    const students = await Student.find(filter).select("_id regNo fullName classLevel").sort({ fullName: 1 }).lean();
    if (input.confirmed !== true) {
      return ok({ preview: students.map((student) => ({ id: String(student._id), regNo: student.regNo, fullName: student.fullName })), count: students.length });
    }
    if (!Array.isArray(input.studentIds) || input.studentIds.length > 5000 || input.studentIds.some((id) => typeof id !== "string" || !/^[a-fA-F0-9]{24}$/.test(id))) {
      return fail("The promotion preview is invalid. Please preview again.", 400);
    }
    const confirmedFilter = { ...filter, _id: { $in: input.studentIds } };
    const confirmedStudents = await Student.find(confirmedFilter).select("_id regNo").lean();
    const result = await Student.updateMany(confirmedFilter, { $set: { classLevel: String(input.toClass).trim() } }, { runValidators: true });
    for (const student of confirmedStudents) {
      await recordAdminAudit(auth.user, request, "STUDENT_CLASS_PROMOTED", "Student", String(student._id), {
        regNo: student.regNo,
        previousClass: input.fromClass,
        newClass: input.toClass,
      });
    }
    return ok({ promoted: result.modifiedCount });
  } catch (error) {
    console.error("POST /api/admin/students/bulk-promote failed:", error);
    return fail("Unable to promote this class.", 500);
  }
}
