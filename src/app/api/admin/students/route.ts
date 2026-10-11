import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { fail, ok, paginate, requireAuth } from "@/lib/api";
import { isValidObjectId, isValidString } from "@/lib/validations";
import { Student } from "@/models/Student";
import { Program } from "@/models/Program";
import { User } from "@/models/User";
import { recordAdminAudit } from "@/lib/admin-audit";

const concessionTypes = ["none", "orphan", "widow_child", "merit", "other"] as const;

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function buildFilter(searchParams: URLSearchParams) {
  const filter: Record<string, unknown> = {};
  const search = searchParams.get("search")?.trim().slice(0, 120);
  const program = searchParams.get("program");
  const status = searchParams.get("status");
  const concession = searchParams.get("concession");

  if (search) {
    const match = new RegExp(escapeRegex(search), "i");
    filter.$or = [{ fullName: match }, { regNo: match }, { phone: match }];
  }
  if (program && isValidObjectId(program)) filter.program = program;
  if (status && ["active", "inactive", "alumni"].includes(status)) filter.status = status;
  if (concession && concessionTypes.includes(concession as (typeof concessionTypes)[number])) {
    filter["concession.type"] = concession;
  }
  return filter;
}

function csvCell(value: unknown) {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
}

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(["ADMIN"]);
    if (!auth.authorized) return auth.response;
    await connectDB();
    const { searchParams } = new URL(request.url);
    const filter = buildFilter(searchParams);
    if (searchParams.get("format") === "csv") {
      const students = await Student.find(filter).populate("program", "title").sort({ fullName: 1 }).lean();
      const rows = [
        ["Registration No", "Name", "Father Name", "Phone", "Program", "Class", "Status", "Concession", "Discount Percent"],
        ...students.map((student) => [
          student.regNo, student.fullName, student.fatherName, student.phone,
          typeof student.program === "object" && student.program ? student.program.title : "",
          student.classLevel, student.status, student.concession?.type, student.concession?.percent,
        ]),
      ];
      return new Response(rows.map((row) => row.map(csvCell).join(",")).join("\r\n"), {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": 'attachment; filename="students.csv"',
          "Cache-Control": "private, no-store",
        },
      });
    }

    const { page, limit, skip } = paginate(searchParams);
    const [students, total, programs, guardians] = await Promise.all([
      Student.find(filter).populate("program", "title").populate("guardian", "name email phone").sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Student.countDocuments(filter),
      Program.find({ isPublished: true }).select("title").sort({ order: 1, title: 1 }).lean(),
      User.find({ role: "PARENT", isActive: true }).select("name email phone").sort({ name: 1 }).limit(500).lean(),
    ]);
    return ok({
      students,
      programs: programs.map((program) => ({ id: String(program._id), title: program.title })),
      guardians: guardians.map((guardian) => ({ id: String(guardian._id), name: guardian.name, email: guardian.email, phone: guardian.phone })),
      pagination: { page, limit, total, pages: Math.max(1, Math.ceil(total / limit)) },
    });
  } catch (error) {
    console.error("GET /api/admin/students failed:", error);
    return fail("Unable to load student records.", 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(["ADMIN"]);
    if (!auth.authorized) return auth.response;
    const input = await request.json() as Record<string, unknown>;
    if (!isValidString(input.regNo, 2, 40) || !isValidString(input.fullName, 2, 120)
      || !isValidString(input.fatherName, 2, 120) || !isValidString(input.phone, 7, 30)
      || !isValidString(input.classLevel, 1, 80) || !isValidObjectId(input.program)) {
      return fail("Student details are incomplete or invalid.", 400);
    }
    const concession = input.concession as Record<string, unknown> | undefined;
    const type = concession?.type ?? "none";
    const percent = concession?.percent ?? 0;
    if (!concessionTypes.includes(type as (typeof concessionTypes)[number])
      || !Number.isInteger(percent) || Number(percent) < 0 || Number(percent) > 100
      || (concession?.note !== undefined && (typeof concession.note !== "string" || concession.note.length > 1000))) {
      return fail("Concession details are invalid.", 400);
    }
    if (input.guardian && !isValidObjectId(input.guardian)) return fail("Choose a valid parent account.", 400);

    await connectDB();
    const programExists = await Program.exists({ _id: input.program });
    if (!programExists) return fail("Choose an existing program.", 400);
    if (input.guardian && !await User.exists({ _id: input.guardian, role: "PARENT" })) return fail("Choose an existing parent account.", 400);
    const student = await Student.create({
      regNo: String(input.regNo).trim(),
      fullName: String(input.fullName).trim(),
      fatherName: String(input.fatherName).trim(),
      phone: String(input.phone).trim(),
      program: input.program,
      classLevel: String(input.classLevel).trim(),
      guardian: input.guardian || null,
      status: "active",
      concession: { type, percent, note: concession?.note ?? "" },
    });
    await recordAdminAudit(auth.user, request, "STUDENT_CREATED", "Student", String(student._id), { regNo: student.regNo });
    return ok({ id: String(student._id) }, 201);
  } catch (error) {
    console.error("POST /api/admin/students failed:", error);
    return fail("Unable to create student. Registration numbers must be unique.", 500);
  }
}
