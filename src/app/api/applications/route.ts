import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { Admission } from "@/models/Admission";
import { validateEmail, isValidString, isValidObjectId } from "@/lib/validations";
import { requireAdminResponse } from "@/lib/admin-auth";

export async function GET() {
  try {
    const unauthorized = await requireAdminResponse();
    if (unauthorized) return unauthorized;
    await connectToDatabase();
    const applications = await Admission.find().sort({ submittedAt: -1 }).lean();
    return Response.json({ success: true, data: applications });
  } catch (error) {
    console.error("GET /api/applications failed:", error);
    return Response.json({ success: false, message: "Unable to load applications." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    const body = await request.json();

    if (!body?.applicantName || !isValidString(body.applicantName, 2, 120)) {
      return Response.json({ success: false, message: "Applicant name is required." }, { status: 400 });
    }

    if (!body?.email || !validateEmail(body.email)) {
      return Response.json({ success: false, message: "Valid email is required." }, { status: 400 });
    }

    if (!body?.phone || !isValidString(body.phone, 5, 25)) {
      return Response.json({ success: false, message: "Phone number is required." }, { status: 400 });
    }

    if (!body?.course || !isValidString(body.course, 2, 150)) {
      return Response.json({ success: false, message: "Course selection is required." }, { status: 400 });
    }

    const application = await Admission.create({
      ...body,
      status: "Pending",
      submittedAt: new Date(),
    });

    return Response.json({ success: true, data: application }, { status: 201 });
  } catch (error) {
    console.error("POST /api/applications failed:", error);
    return Response.json({ success: false, message: "Could not submit application." }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const unauthorized = await requireAdminResponse();
    if (unauthorized) return unauthorized;
    await connectToDatabase();
    const body = await request.json();
    const appId = String(body?._id || body?.id || "");

    if (!appId || !isValidObjectId(appId)) {
      return Response.json({ success: false, message: "A valid application id is required." }, { status: 400 });
    }

    const app = await Admission.findById(appId);
    if (!app) {
      return Response.json({ success: false, message: "Application not found." }, { status: 404 });
    }

    const updated = await Admission.findByIdAndUpdate(
      appId,
      { ...body, status: body.status ?? app.status },
      { new: true }
    );

    return Response.json({ success: true, data: updated });
  } catch (error) {
    console.error("PUT /api/applications failed:", error);
    return Response.json({ success: false, message: "Could not update application." }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const unauthorized = await requireAdminResponse();
    if (unauthorized) return unauthorized;
    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const appId = searchParams.get("id");

    if (!appId || !isValidObjectId(appId)) {
      return Response.json({ success: false, message: "A valid application id is required." }, { status: 400 });
    }

    const app = await Admission.findByIdAndDelete(appId);
    if (!app) {
      return Response.json({ success: false, message: "Application not found." }, { status: 404 });
    }

    return Response.json({ success: true, message: "Application deleted successfully." });
  } catch (error) {
    console.error("DELETE /api/applications failed:", error);
    return Response.json({ success: false, message: "Could not delete application." }, { status: 500 });
  }
}
