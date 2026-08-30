import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { ContactMessage } from "@/models/ContactMessage";
import { validateEmail, isValidString, isValidObjectId } from "@/lib/validations";
import { requireAdminResponse } from "@/lib/admin-auth";

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
    await connectToDatabase();
    const body = await request.json();

    if (!body?.name || !isValidString(body.name, 2, 120)) {
      return Response.json({ success: false, message: "Name is required." }, { status: 400 });
    }

    if (!body?.email || !validateEmail(body.email)) {
      return Response.json({ success: false, message: "Valid email is required." }, { status: 400 });
    }

    if (!body?.subject || !isValidString(body.subject, 3, 200)) {
      return Response.json({ success: false, message: "Subject is required." }, { status: 400 });
    }

    if (!body?.message || !isValidString(body.message, 10, 4000)) {
      return Response.json({ success: false, message: "Message is required." }, { status: 400 });
    }

    const message = await ContactMessage.create({
      ...body,
      status: "Unread",
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
