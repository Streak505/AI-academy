import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { fail, ok, requireAuth } from "@/lib/api";
import { isValidObjectId } from "@/lib/validations";
import { CounselingBooking } from "@/models/CounselingBooking";
import { CounselingSettings } from "@/models/CounselingSettings";
import { reserveCounselingSlot, releaseCounselingSlot } from "@/lib/counseling-slots";
import { recordAdminAudit } from "@/lib/admin-audit";
import { sendCounselingConfirmationEmail } from "@/lib/email";

const statuses = ["Requested", "Confirmed", "Completed", "Cancelled"] as const;
const types = ["Career Assessment", "Degree Selection", "University Selection", "Parent Counseling", "Scholarship Guidance", "Study Abroad"] as const;
const slots = Array.from({ length: 6 }, (_, index) => {
  const minutes = 17 * 60 + index * 30;
  return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
});

function parseDate(value: unknown) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T12:00:00.000Z`);
  return Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value ? null : date;
}

function isOpenDay(date: Date) {
  return ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].includes(
    new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Karachi", weekday: "short" }).format(date)
  );
}

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(["ADMIN"]);
    if (!auth.authorized) return auth.response;
    await connectDB();
    const { searchParams } = new URL(request.url);
    const filter: Record<string, unknown> = {};
    const type = searchParams.get("type");
    const status = searchParams.get("status");
    const date = searchParams.get("date");
    const startDate = parseDate(searchParams.get("startDate"));
    const endDate = parseDate(searchParams.get("endDate"));
    if (type && types.includes(type as (typeof types)[number])) filter.type = type;
    if (status && statuses.includes(status as (typeof statuses)[number])) filter.status = status;
    if (date) {
      const parsed = parseDate(date);
      if (!parsed) return fail("Choose a valid counseling date.", 400);
      const nextDay = new Date(parsed.getTime() + 24 * 60 * 60 * 1000);
      filter.preferredDate = { $gte: parsed, $lt: nextDay };
    } else if (startDate || endDate) {
      if (!startDate || !endDate || startDate > endDate) return fail("Choose a valid date range.", 400);
      filter.preferredDate = { $gte: startDate, $lt: new Date(endDate.getTime() + 24 * 60 * 60 * 1000) };
    }
    const [bookings, settings] = await Promise.all([
      CounselingBooking.find(filter).sort({ preferredDate: 1, preferredSlot: 1 }).limit(500).lean(),
      CounselingSettings.findOne({ key: "default" }).lean(),
    ]);
    return ok({ bookings, capacityPerSlot: settings?.capacityPerSlot ?? 1 });
  } catch (error) {
    console.error("GET /api/admin/counseling failed:", error);
    return fail("Unable to load counseling bookings.", 500);
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

    if (input.capacityPerSlot !== undefined) {
      if (!Number.isInteger(input.capacityPerSlot) || Number(input.capacityPerSlot) < 1 || Number(input.capacityPerSlot) > 20) {
        return fail("Capacity must be a whole number from 1 to 20.", 400);
      }
      await connectDB();
      const settings = await CounselingSettings.findOneAndUpdate(
        { key: "default" },
        { $set: { capacityPerSlot: input.capacityPerSlot }, $setOnInsert: { key: "default" } },
        { new: true, upsert: true, runValidators: true }
      );
      await recordAdminAudit(auth.user, request, "COUNSELING_CAPACITY_UPDATED", "CounselingSettings", String(settings._id), { capacityPerSlot: settings.capacityPerSlot });
      return ok({ capacityPerSlot: settings.capacityPerSlot });
    }

    if (!isValidObjectId(input.id)) return fail("A valid booking id is required.", 400);
    if (input.status !== undefined && !statuses.includes(input.status as (typeof statuses)[number])) return fail("Choose a valid booking status.", 400);
    if (input.adminNotes !== undefined && (typeof input.adminNotes !== "string" || input.adminNotes.length > 3000)) return fail("Notes must be 3,000 characters or fewer.", 400);
    const nextDate = input.preferredDate === undefined ? undefined : parseDate(input.preferredDate);
    if (input.preferredDate !== undefined && (!nextDate || !isOpenDay(nextDate))) return fail("Choose a Monday to Saturday date.", 400);
    if (input.preferredSlot !== undefined && !slots.includes(String(input.preferredSlot))) return fail("Choose a 30-minute slot between 5:00 PM and 8:00 PM.", 400);
    if (input.preferredDate !== undefined && input.preferredSlot === undefined) return fail("A time slot is required when rescheduling.", 400);
    if (input.preferredSlot !== undefined && input.preferredDate === undefined) return fail("A date is required when rescheduling.", 400);

    await connectDB();
    const booking = await CounselingBooking.findById(input.id);
    if (!booking) return fail("Counseling booking not found.", 404);
    const previousStatus = booking.status;
    const previousDate = booking.preferredDate;
    const previousSlot = booking.preferredSlot;
    const nextStatus = (input.status as (typeof statuses)[number] | undefined) ?? booking.status;
    const changesSlot = Boolean(nextDate && input.preferredSlot
      && (nextDate.toISOString().slice(0, 10) !== booking.preferredDate.toISOString().slice(0, 10) || input.preferredSlot !== booking.preferredSlot));
    const wasOccupying = booking.status !== "Cancelled";
    const willOccupy = nextStatus !== "Cancelled";

    if ((changesSlot || (!wasOccupying && willOccupy)) && willOccupy) {
      const reservationDate = nextDate ?? booking.preferredDate;
      const reservationSlot = String(input.preferredSlot ?? booking.preferredSlot);
      if (!await reserveCounselingSlot(reservationDate, reservationSlot)) return fail("That counseling slot is full.", 409);
    }

    if (nextDate) booking.preferredDate = nextDate;
    if (input.preferredSlot !== undefined) booking.preferredSlot = String(input.preferredSlot);
    booking.status = nextStatus;
    if (typeof input.adminNotes === "string") booking.adminNotes = input.adminNotes.trim();
    await booking.save();

    if (wasOccupying && (!willOccupy || changesSlot)) await releaseCounselingSlot(previousDate, previousSlot);
    const changedStatus = previousStatus !== booking.status;
    const changedSlot = previousDate.toISOString().slice(0, 10) !== booking.preferredDate.toISOString().slice(0, 10) || previousSlot !== booking.preferredSlot;
    if (changedStatus || changedSlot) {
      await recordAdminAudit(auth.user, request, changedStatus ? "COUNSELING_STATUS_UPDATED" : "COUNSELING_RESCHEDULED", "CounselingBooking", String(booking._id), {
        previousStatus,
        newStatus: booking.status,
        previousDate: previousDate.toISOString(),
        previousSlot,
        newDate: booking.preferredDate.toISOString(),
        newSlot: booking.preferredSlot,
      });
    } else if (input.adminNotes !== undefined) {
      await recordAdminAudit(auth.user, request, "COUNSELING_NOTES_UPDATED", "CounselingBooking", String(booking._id));
    }
    if (changedStatus || changedSlot) {
      await sendCounselingConfirmationEmail({
        to: booking.email,
        name: booking.name,
        type: booking.type,
        date: booking.preferredDate.toISOString().slice(0, 10),
        time: booking.preferredSlot,
        status: booking.status,
        ...(booking.adminNotes ? { note: booking.adminNotes } : {}),
      });
    }
    return ok({ id: String(booking._id), status: booking.status, preferredDate: booking.preferredDate, preferredSlot: booking.preferredSlot });
  } catch (error) {
    console.error("PATCH /api/admin/counseling failed:", error);
    return fail("Unable to update this counseling booking.", 500);
  }
}
