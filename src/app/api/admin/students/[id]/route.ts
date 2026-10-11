import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { fail, ok, requireAuth } from "@/lib/api";
import { isValidObjectId, isValidString } from "@/lib/validations";
import { Student } from "@/models/Student";
import { Program } from "@/models/Program";
import { User } from "@/models/User";
import { Attendance } from "@/models/Attendance";
import { FeeChallan } from "@/models/FeeChallan";
import { Assessment } from "@/models/Assessment";
import { recordAdminAudit } from "@/lib/admin-audit";

type Context = { params: Promise<{ id: string }> };
const concessionTypes = ["none", "orphan", "widow_child", "merit", "other"] as const;

export async function GET(_request: NextRequest, { params }: Context) {
  try {
    const auth = await requireAuth(["ADMIN"]);
    if (!auth.authorized) return auth.response;
    const { id } = await params;
    if (!isValidObjectId(id)) return fail("Invalid student id.", 400);
    await connectDB();
    const student = await Student.findById(id).populate("program", "title").populate("guardian", "name email phone").lean();
    if (!student) return fail("Student not found.", 404);
    const [attendance, fees, results] = await Promise.all([
      Attendance.find({ student: id }).sort({ date: -1 }).limit(100).lean(),
      FeeChallan.find({ student: id }).sort({ periodMonth: -1 }).limit(100).lean(),
      Assessment.find({ student: id }).sort({ createdAt: -1 }).limit(100).lean(),
    ]);
    return ok({ student, attendance, fees, results });
  } catch (error) {
    console.error("GET /api/admin/students/[id] failed:", error);
    return fail("Unable to load student profile.", 500);
  }
}

export async function PATCH(request: NextRequest, { params }: Context) {
  try {
    const auth = await requireAuth(["ADMIN"]);
    if (!auth.authorized) return auth.response;
    const { id } = await params;
    if (!isValidObjectId(id)) return fail("Invalid student id.", 400);
    const input = await request.json() as Record<string, unknown>;
    const updates: Record<string, unknown> = {};
    if (input.fullName !== undefined) {
      if (!isValidString(input.fullName, 2, 120)) return fail("Enter a valid student name.", 400);
      updates.fullName = input.fullName;
    }
    if (input.fatherName !== undefined) {
      if (!isValidString(input.fatherName, 2, 120)) return fail("Enter a valid father name.", 400);
      updates.fatherName = input.fatherName;
    }
    if (input.phone !== undefined) {
      if (!isValidString(input.phone, 7, 30)) return fail("Enter a valid phone number.", 400);
      updates.phone = input.phone;
    }
    if (input.classLevel !== undefined) {
      if (!isValidString(input.classLevel, 1, 80)) return fail("Enter a valid class.", 400);
      updates.classLevel = input.classLevel;
    }
    if (input.program !== undefined) {
      if (!isValidObjectId(input.program)) return fail("Choose a valid program.", 400);
      await connectDB();
      if (!await Program.exists({ _id: input.program })) return fail("Choose an existing program.", 400);
      updates.program = input.program;
    }
    if (input.guardian !== undefined) {
      if (input.guardian !== null && !isValidObjectId(input.guardian)) return fail("Choose a valid parent account.", 400);
      await connectDB();
      if (input.guardian && !await User.exists({ _id: input.guardian, role: "PARENT" })) return fail("Choose an existing parent account.", 400);
      updates.guardian = input.guardian || null;
    }
    if (input.status !== undefined) {
      if (!["active", "inactive", "alumni"].includes(String(input.status))) return fail("Choose a valid student status.", 400);
      updates.status = input.status;
    }
    if (input.concession !== undefined) {
      const concession = input.concession as Record<string, unknown>;
      if (!concessionTypes.includes(concession.type as (typeof concessionTypes)[number])
        || !Number.isInteger(concession.percent) || Number(concession.percent) < 0 || Number(concession.percent) > 100
        || (concession.note !== undefined && (typeof concession.note !== "string" || concession.note.length > 1000))) {
        return fail("Concession details are invalid.", 400);
      }
      updates.concession = concession;
    }
    await connectDB();
    const before = await Student.findById(id).select("status classLevel program concession").lean();
    if (!before) return fail("Student not found.", 404);
    const student = await Student.findByIdAndUpdate(id, updates, { new: true, runValidators: true });
    if (!student) return fail("Student not found.", 404);
    const statusChanged = input.status !== undefined && input.status !== before.status;
    const action = statusChanged ? "STUDENT_STATUS_UPDATED" : "STUDENT_UPDATED";
    await recordAdminAudit(auth.user, request, action, "Student", id, {
      previousStatus: before.status,
      newStatus: student.status,
      changedFields: Object.keys(updates),
    });
    return ok({ id: String(student._id), status: student.status });
  } catch (error) {
    console.error("PATCH /api/admin/students/[id] failed:", error);
    return fail("Unable to update student record.", 500);
  }
}
