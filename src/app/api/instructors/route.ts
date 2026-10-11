import { NextRequest } from "next/server";
import { connectToDatabase, logMongoError } from "@/lib/db";
import { Instructor } from "@/models/Instructor";
import { isValidString, validateEmail } from "@/lib/validations";
import { requireAdmin, requireAdminResponse } from "@/lib/admin-auth";
import { recordAdminAudit } from "@/lib/admin-audit";

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    const searchParams = new URL(request.url).searchParams;
    const requestedId = searchParams.get("id");
    if (requestedId) {
      const admin = await requireAdmin();
      if (!admin) return Response.json({ success: false, message: "Administrator authentication is required." }, { status: 401 });
      if (!/^[0-9a-fA-F]{24}$/.test(requestedId)) return Response.json({ success: false, message: "A valid instructor id is required." }, { status: 400 });
      const instructor = await Instructor.findById(requestedId).lean();
      return instructor ? Response.json({ success: true, data: [instructor] }) : Response.json({ success: false, message: "Instructor not found." }, { status: 404 });
    }
    const limit = Math.min(Math.max(Number(searchParams.get("limit") || 0), 0), 50);
    const instructorsQuery = Instructor.find({ isActive: true }).sort({ createdAt: -1 });
    if (limit) instructorsQuery.limit(limit);
    const instructors = await instructorsQuery.lean();
    return Response.json({ success: true, data: instructors });
  } catch (error) {
    logMongoError("GET /api/instructors", error);
    return Response.json({ success: false, message: "Unable to load instructors." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (!admin) return Response.json({ success: false, message: "Administrator authentication is required." }, { status: 401 });
    await connectToDatabase();
    const body = await request.json();

    if (!body?.name || !isValidString(body.name, 2, 120)) {
      return Response.json({ success: false, message: "Instructor name is required." }, { status: 400 });
    }

    if (!body?.email || !validateEmail(body.email)) {
      return Response.json({ success: false, message: "Valid instructor email is required." }, { status: 400 });
    }

    if (!body?.bio || !isValidString(body.bio, 20, 2000)) {
      return Response.json({ success: false, message: "Instructor biography is required." }, { status: 400 });
    }

    const instructor = await Instructor.create({
      ...body,
      isActive: body.isActive ?? true,
      socialLinks: body.socialLinks ?? {},
    });
    await recordAdminAudit(admin, request, "INSTRUCTOR_CREATED", "Instructor", String(instructor._id), { name: instructor.name });

    return Response.json({ success: true, data: instructor }, { status: 201 });
  } catch (error) {
    logMongoError("POST /api/instructors", error);
    return Response.json({ success: false, message: "Could not create instructor." }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (!admin) return Response.json({ success: false, message: "Administrator authentication is required." }, { status: 401 });
    await connectToDatabase();
    const body = await request.json();
    const instructorId = String(body?._id || body?.id || "");

    if (!instructorId || !/^[0-9a-fA-F]{24}$/.test(instructorId)) {
      return Response.json({ success: false, message: "A valid instructor id is required." }, { status: 400 });
    }

    const instructor = await Instructor.findById(instructorId);
    if (!instructor) {
      return Response.json({ success: false, message: "Instructor not found." }, { status: 404 });
    }

    const updatedInstructor = await Instructor.findByIdAndUpdate(
      instructorId,
      {
        ...body,
        isActive: body.isActive ?? instructor.isActive,
      },
      { new: true }
    );
    if (updatedInstructor) await recordAdminAudit(admin, request, body.isActive !== undefined && body.isActive !== instructor.isActive ? "INSTRUCTOR_STATUS_UPDATED" : "INSTRUCTOR_UPDATED", "Instructor", instructorId, { name: updatedInstructor.name });

    return Response.json({ success: true, data: updatedInstructor });
  } catch (error) {
    logMongoError("PUT /api/instructors", error);
    return Response.json({ success: false, message: "Could not update instructor." }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (!admin) return Response.json({ success: false, message: "Administrator authentication is required." }, { status: 401 });
    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const instructorId = searchParams.get("id");

    if (!instructorId || !/^[0-9a-fA-F]{24}$/.test(instructorId)) {
      return Response.json({ success: false, message: "A valid instructor id is required." }, { status: 400 });
    }

    const instructor = await Instructor.findByIdAndDelete(instructorId);
    if (!instructor) {
      return Response.json({ success: false, message: "Instructor not found." }, { status: 404 });
    }
    await recordAdminAudit(admin, request, "INSTRUCTOR_DELETED", "Instructor", instructorId, { name: instructor.name });

    return Response.json({ success: true, message: "Instructor deleted successfully." });
  } catch (error) {
    logMongoError("DELETE /api/instructors", error);
    return Response.json({ success: false, message: "Could not delete instructor." }, { status: 500 });
  }
}
