import { connectDB } from "@/lib/db";
import { fail, ok } from "@/lib/api";
import { CsrInitiative } from "@/models/CsrInitiative";

export async function GET() {
  try {
    await connectDB();
    const initiatives = await CsrInitiative.find({ isPublished: true }).sort({ order: 1, title: 1 }).lean();
    return ok(initiatives);
  } catch (error) {
    console.error("GET /api/csr failed:", error);
    return fail("Unable to load community initiatives.", 500);
  }
}
