import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { requireAuth, fail, ok, paginate } from "@/lib/api";
import { ContactMessage } from "@/models/ContactMessage";
import { isValidObjectId } from "@/lib/validations";
import { recordAdminAudit } from "@/lib/admin-audit";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(["ADMIN"]);
    if (!auth.authorized) return auth.response;
    const params = new URL(request.url).searchParams;
    const { page, limit, skip } = paginate(params);
    const status = params.get("status");
    const filter = status && ["Unread", "Read", "Resolved"].includes(status) ? { status } : {};
    await connectDB();
    const [messages, total] = await Promise.all([
      ContactMessage.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      ContactMessage.countDocuments(filter),
    ]);
    return ok({ messages, pagination: { page, limit, total, pages: Math.max(1, Math.ceil(total / limit)) } });
  } catch (error) {
    console.error("GET /api/admin/contact failed:", error);
    return fail("Unable to load contact messages.", 500);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const auth = await requireAuth(["ADMIN"]);
    if (!auth.authorized) return auth.response;
    let input: Record<string, unknown>;
    try {
      input = await request.json();
    } catch {
      return fail("Invalid request body.", 400);
    }
    if (!isValidObjectId(input.id) || !["Unread", "Read", "Resolved"].includes(String(input.status))) {
      return fail("Choose a valid message and inbox status.", 400);
    }
    await connectDB();
    const message = await ContactMessage.findById(input.id);
    if (!message) return fail("Contact message not found.", 404);
    const previousStatus = message.status;
    message.status = input.status as "Unread" | "Read" | "Resolved";
    await message.save();
    if (previousStatus !== message.status) {
      await recordAdminAudit(auth.user, request, "CONTACT_MESSAGE_STATUS_UPDATED", "ContactMessage", String(message._id), { previousStatus, newStatus: message.status });
    }
    return ok({ id: String(message._id), status: message.status });
  } catch (error) {
    console.error("PATCH /api/admin/contact failed:", error);
    return fail("Unable to update the message status.", 500);
  }
}
