import { NextRequest } from "next/server";
import { connectToDatabase, logMongoError } from "@/lib/db";
import { Event } from "@/models/Event";
import { isValidString, isValidObjectId } from "@/lib/validations";
import { requireAdminResponse } from "@/lib/admin-auth";

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    const searchParams = new URL(request.url).searchParams;
    const requestedId = searchParams.get("id");
    if (requestedId) {
      const unauthorized = await requireAdminResponse();
      if (unauthorized) return unauthorized;
      if (!isValidObjectId(requestedId)) return Response.json({ success: false, message: "A valid event id is required." }, { status: 400 });
      const event = await Event.findById(requestedId).lean();
      return event ? Response.json({ success: true, data: [event] }) : Response.json({ success: false, message: "Event not found." }, { status: 404 });
    }
    const limit = Math.min(Math.max(Number(searchParams.get("limit") || 0), 0), 50);
    const query = { isPublished: true, ...(searchParams.get("upcoming") === "true" ? { date: { $gte: new Date() } } : {}) };
    const eventsQuery = Event.find(query).sort({ date: 1 });
    if (limit) eventsQuery.limit(limit);
    const events = await eventsQuery.lean();
    return Response.json({ success: true, data: events });
  } catch (error) {
    logMongoError("GET /api/events", error);
    return Response.json({ success: false, message: "Unable to load events." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const unauthorized = await requireAdminResponse();
    if (unauthorized) return unauthorized;
    await connectToDatabase();
    const body = await request.json();

    if (!body?.title || !isValidString(body.title, 3, 200)) {
      return Response.json({ success: false, message: "Event title is required." }, { status: 400 });
    }

    if (!body?.description || !isValidString(body.description, 20, 2000)) {
      return Response.json({ success: false, message: "Event description is required." }, { status: 400 });
    }

    if (!body?.date || Number.isNaN(new Date(body.date).getTime())) {
      return Response.json({ success: false, message: "Event date is required." }, { status: 400 });
    }

    if (!body?.location || !isValidString(body.location, 2, 200)) {
      return Response.json({ success: false, message: "Event location is required." }, { status: 400 });
    }

    if (body.capacity !== undefined && (!Number.isInteger(Number(body.capacity)) || Number(body.capacity) < 1)) {
      return Response.json({ success: false, message: "Event capacity must be a positive whole number." }, { status: 400 });
    }

    const event = await Event.create({
      ...body,
      date: new Date(body.date),
      capacity: body.capacity === undefined ? undefined : Number(body.capacity),
      isPublished: body.isPublished ?? true,
    });

    return Response.json({ success: true, data: event }, { status: 201 });
  } catch (error) {
    logMongoError("POST /api/events", error);
    return Response.json({ success: false, message: "Could not create event." }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const unauthorized = await requireAdminResponse();
    if (unauthorized) return unauthorized;
    await connectToDatabase();
    const body = await request.json();
    const eventId = String(body?._id || body?.id || "");

    if (!eventId || !isValidObjectId(eventId)) {
      return Response.json({ success: false, message: "A valid event id is required." }, { status: 400 });
    }

    const event = await Event.findById(eventId);
    if (!event) {
      return Response.json({ success: false, message: "Event not found." }, { status: 404 });
    }

    const updated = await Event.findByIdAndUpdate(
      eventId,
      { ...body, isPublished: body.isPublished ?? event.isPublished },
      { new: true }
    );

    return Response.json({ success: true, data: updated });
  } catch (error) {
    logMongoError("PUT /api/events", error);
    return Response.json({ success: false, message: "Could not update event." }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const unauthorized = await requireAdminResponse();
    if (unauthorized) return unauthorized;
    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get("id");

    if (!eventId || !isValidObjectId(eventId)) {
      return Response.json({ success: false, message: "A valid event id is required." }, { status: 400 });
    }

    const event = await Event.findByIdAndDelete(eventId);
    if (!event) {
      return Response.json({ success: false, message: "Event not found." }, { status: 404 });
    }

    return Response.json({ success: true, message: "Event deleted successfully." });
  } catch (error) {
    logMongoError("DELETE /api/events", error);
    return Response.json({ success: false, message: "Could not delete event." }, { status: 500 });
  }
}
