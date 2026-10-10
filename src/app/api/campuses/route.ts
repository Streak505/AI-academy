import { NextRequest } from "next/server";
import { connectToDatabase, logMongoError } from "@/lib/db";
import { Campus } from "@/models/Campus";
import { isValidString } from "@/lib/validations";
import { requireAdminResponse } from "@/lib/admin-auth";

export async function GET() {
  try {
    await connectToDatabase();
    const campuses = await Campus.find({ isActive: true }).sort({ city: 1 }).lean();
    return Response.json({ success: true, data: campuses });
  } catch (error) {
    logMongoError("GET /api/campuses", error);
    return Response.json({ success: false, message: "Unable to load campuses." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const unauthorized = await requireAdminResponse();
    if (unauthorized) return unauthorized;
    await connectToDatabase();
    const body = await request.json();

    if (!body?.name || !isValidString(body.name, 2, 120)) {
      return Response.json({ success: false, message: "Campus name is required." }, { status: 400 });
    }

    if (!body?.city || !isValidString(body.city, 2, 80)) {
      return Response.json({ success: false, message: "Campus city is required." }, { status: 400 });
    }

    const campus = await Campus.create({
      ...body,
      isActive: body.isActive ?? true,
      facilities: body.facilities ?? [],
    });

    return Response.json({ success: true, data: campus }, { status: 201 });
  } catch (error) {
    logMongoError("POST /api/campuses", error);
    return Response.json({ success: false, message: "Could not create campus." }, { status: 500 });
  }
}
