import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { Announcement } from "@/models/Announcement";
import { isValidString } from "@/lib/validations";
import { requireAdminResponse } from "@/lib/admin-auth";

export async function GET() {
  try {
    await connectToDatabase();
    const announcements = await Announcement.find({ isActive: true }).sort({ createdAt: -1 }).lean();
    return Response.json({ success: true, data: announcements });
  } catch (error) {
    console.error("GET /api/announcements failed:", error);
    return Response.json({ success: false, message: "Unable to load announcements." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const unauthorized = await requireAdminResponse();
    if (unauthorized) return unauthorized;
    await connectToDatabase();
    const body = await request.json();

    if (!body?.title || !isValidString(body.title, 3, 200)) {
      return Response.json({ success: false, message: "Announcement title is required." }, { status: 400 });
    }

    if (!body?.message || !isValidString(body.message, 10, 3000)) {
      return Response.json({ success: false, message: "Announcement message is required." }, { status: 400 });
    }

    const item = await Announcement.create({
      ...body,
      isActive: body.isActive ?? true,
    });

    return Response.json({ success: true, data: item }, { status: 201 });
  } catch (error) {
    console.error("POST /api/announcements failed:", error);
    return Response.json({ success: false, message: "Could not create announcement." }, { status: 500 });
  }
}
