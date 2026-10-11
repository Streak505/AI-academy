import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { ContactMessage } from "@/models/ContactMessage";
import { validateEmail, isValidString, isValidObjectId } from "@/lib/validations";
import { requireAdminResponse } from "@/lib/admin-auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { sendEmail } from "@/lib/email";
import { requireAdmin } from "@/lib/admin-auth";
import { recordAdminAudit } from "@/lib/admin-audit";
import { getAcademySettings } from "@/lib/academy-settings";

export async function GET() {
  try {
    const unauthorized = await requireAdminResponse();
    if (unauthorized) return unauthorized;
    await connectToDatabase();
    const messages = await ContactMessage.find().sort({ createdAt: -1 }).lean();
    return Response.json({ success: true, data: messages });
  } catch (error) {
    console.error("GET /api/contact failed:", error);
    return Response.json({ success: false, message: "Unable to load contact messages." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const clientIp = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const limit = checkRateLimit(`contact:${clientIp}`, 5, 60 * 60 * 1000);
    if (!limit.allowed) {
      return Response.json({ success: false, message: "Too many messages. Please try again later." }, { status: 429 });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return Response.json({ success: false, message: "Invalid request body." }, { status: 400 });
    }
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return Response.json({ success: false, message: "Invalid request." }, { status: 400 });
    }
    const input = body as Record<string, unknown>;
    if (typeof input.website === "string" && input.website.trim()) {
      return Response.json({ success: true, data: { accepted: true } });
    }

    if (!input.name || !isValidString(input.name, 2, 120)) {
      return Response.json({ success: false, message: "Name is required." }, { status: 400 });
    }

    if (!input.email || !validateEmail(input.email) || String(input.email).length > 254) {
      return Response.json({ success: false, message: "Valid email is required." }, { status: 400 });
    }

    if (!input.subject || !isValidString(input.subject, 3, 200)) {
      return Response.json({ success: false, message: "Subject is required." }, { status: 400 });
    }

    if (!input.message || !isValidString(input.message, 10, 4000)) {
      return Response.json({ success: false, message: "Message is required." }, { status: 400 });
    }

    await connectToDatabase();
    const message = await ContactMessage.create({
      name: String(input.name).trim(),
      email: String(input.email).trim().toLowerCase(),
      phone: typeof input.phone === "string" ? input.phone.trim().slice(0, 30) : "",
      subject: String(input.subject).trim(),
      message: String(input.message).trim(),
      status: "Unread",
    });

    const academy = await getAcademySettings();
    const recipient = process.env.ADMIN_EMAIL?.trim() || academy.email;
    if (recipient) await sendEmail({
      to: recipient,
      subject: `New website message: ${message.subject}`,
      html: "",
      text: `Name: ${message.name}\nEmail: ${message.email}\nPhone: ${message.phone || "Not provided"}\n\n${message.message}`,
    });
    return Response.json({ success: true, data: message }, { status: 201 });
  } catch (error) {
    console.error("POST /api/contact failed:", error);
    return Response.json({ success: false, message: "Could not send message." }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (!admin) return Response.json({ success: false, message: "Administrator authentication is required." }, { status: 401 });
    await connectToDatabase();
    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return Response.json({ success: false, message: "Invalid request body." }, { status: 400 });
    }
    const msgId = String(body?._id || body?.id || "");

    if (!msgId || !isValidObjectId(msgId)) {
      return Response.json({ success: false, message: "A valid message id is required." }, { status: 400 });
    }

    const msg = await ContactMessage.findById(msgId);
    if (!msg) {
      return Response.json({ success: false, message: "Message not found." }, { status: 404 });
    }

    if (body.status !== undefined && !["Unread", "Read", "Resolved"].includes(String(body.status))) {
      return Response.json({ success: false, message: "Choose a valid inbox status." }, { status: 400 });
    }
    if (body.name !== undefined && !isValidString(body.name, 2, 120)) return Response.json({ success: false, message: "Enter a valid sender name." }, { status: 400 });
    if (body.email !== undefined && (!validateEmail(body.email) || String(body.email).length > 254)) return Response.json({ success: false, message: "Enter a valid email." }, { status: 400 });
    if (body.subject !== undefined && !isValidString(body.subject, 3, 200)) return Response.json({ success: false, message: "Enter a valid subject." }, { status: 400 });
    if (body.message !== undefined && !isValidString(body.message, 10, 4000)) return Response.json({ success: false, message: "Enter a valid message." }, { status: 400 });
    const updates = {
      ...(typeof body.name === "string" ? { name: body.name.trim() } : {}),
      ...(typeof body.email === "string" ? { email: body.email.trim().toLowerCase() } : {}),
      ...(typeof body.subject === "string" ? { subject: body.subject.trim() } : {}),
      ...(typeof body.message === "string" ? { message: body.message.trim() } : {}),
      ...(typeof body.status === "string" ? { status: body.status } : {}),
    };
    const updated = await ContactMessage.findByIdAndUpdate(msgId, updates, { new: true, runValidators: true });
    if (updated) {
      await recordAdminAudit(admin, request, msg.status !== updated.status ? "CONTACT_MESSAGE_STATUS_UPDATED" : "CONTACT_MESSAGE_UPDATED", "ContactMessage", msgId, { previousStatus: msg.status, newStatus: updated.status });
    }

    return Response.json({ success: true, data: updated });
  } catch (error) {
    console.error("PUT /api/contact failed:", error);
    return Response.json({ success: false, message: "Could not update message." }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (!admin) return Response.json({ success: false, message: "Administrator authentication is required." }, { status: 401 });
    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const msgId = searchParams.get("id");

    if (!msgId || !isValidObjectId(msgId)) {
      return Response.json({ success: false, message: "A valid message id is required." }, { status: 400 });
    }

    const msg = await ContactMessage.findByIdAndDelete(msgId);
    if (!msg) {
      return Response.json({ success: false, message: "Message not found." }, { status: 404 });
    }

    await recordAdminAudit(admin, request, "CONTACT_MESSAGE_DELETED", "ContactMessage", msgId, { subject: msg.subject });
    return Response.json({ success: true, message: "Message deleted successfully." });
  } catch (error) {
    console.error("DELETE /api/contact failed:", error);
    return Response.json({ success: false, message: "Could not delete message." }, { status: 500 });
  }
}
