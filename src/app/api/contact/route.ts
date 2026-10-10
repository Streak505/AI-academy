import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { ContactMessage } from "@/models/ContactMessage";
import { validateEmail, isValidString, isValidObjectId } from "@/lib/validations";
import { requireAdminResponse } from "@/lib/admin-auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { sendEmail } from "@/lib/email";
import { academy } from "@/config/academy";

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

    await sendEmail({
      to: process.env.ADMIN_EMAIL?.trim() || academy.email,
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
    const unauthorized = await requireAdminResponse();
    if (unauthorized) return unauthorized;
    await connectToDatabase();
    const body = await request.json();
    const msgId = String(body?._id || body?.id || "");

    if (!msgId || !isValidObjectId(msgId)) {
      return Response.json({ success: false, message: "A valid message id is required." }, { status: 400 });
    }

    const msg = await ContactMessage.findById(msgId);
    if (!msg) {
      return Response.json({ success: false, message: "Message not found." }, { status: 404 });
    }

    const updated = await ContactMessage.findByIdAndUpdate(
      msgId,
      { ...body, status: body.status ?? msg.status },
      { new: true }
    );

    return Response.json({ success: true, data: updated });
  } catch (error) {
    console.error("PUT /api/contact failed:", error);
    return Response.json({ success: false, message: "Could not update message." }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const unauthorized = await requireAdminResponse();
    if (unauthorized) return unauthorized;
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

    return Response.json({ success: true, message: "Message deleted successfully." });
  } catch (error) {
    console.error("DELETE /api/contact failed:", error);
    return Response.json({ success: false, message: "Could not delete message." }, { status: 500 });
  }
}
