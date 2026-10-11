import type { Role } from "@/lib/auth";
import { Student } from "@/models/Student";

export async function getAccessibleStudentIds(user: { id: string; role: Role }) {
  if (user.role === "ADMIN") return null;
  if (user.role === "STUDENT") {
    const student = await Student.findOne({ user: user.id }).select("_id").lean();
    return student ? [String(student._id)] : [];
  }
  if (user.role === "PARENT") {
    const students = await Student.find({ guardian: user.id }).select("_id").lean();
    return students.map((student) => String(student._id));
  }
  return [];
}
