import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rate-limit";
import { connectDB } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { sendEmail } from "@/lib/email";
import { CounselingBooking } from "@/models/CounselingBooking";
import { reserveCounselingSlot, releaseCounselingSlot } from "@/lib/counseling-slots";
import { isValidEnum, isValidString, validateEmail } from "@/lib/validations";
import { getAcademySettings } from "@/lib/academy-settings";

const bookingTypes = ["Career Assessment", "Degree Selection", "University Selection", "Parent Counseling", "Scholarship Guidance", "Study Abroad"] as const;
const validSlots = Array.from({ length: 6 }, (_, index) => {
  const minutes = 17 * 60 + index * 30;
  return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
});

function karachiToday() {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Karachi", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date());
  return `${parts.find((part) => part.type === "year")?.value}-${parts.find((part) => part.type === "month")?.value}-${parts.find((part) => part.type === "day")?.value}`;
}

export async function POST(request: NextRequest) {
  try {
    const clientIp = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const limit = checkRateLimit(`counseling:${clientIp}`, 5, 60 * 60 * 1000);
    if (!limit.allowed) return NextResponse.json({ success: false, message: "Too many requests. Please try again later." }, { status: 429 });

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ success: false, message: "Invalid request body." }, { status: 400 });
    }
    if (!body || typeof body !== "object" || Array.isArray(body)) return NextResponse.json({ success: false, message: "Invalid request." }, { status: 400 });
    const input = body as Record<string, unknown>;
    if (typeof input.website === "string" && input.website.trim()) return NextResponse.json({ success: true, data: { accepted: true } });
    if (!isValidString(input.name, 2, 120)) return NextResponse.json({ success: false, message: "Enter your name." }, { status: 400 });
    if (!isValidString(input.phone, 7, 30)) return NextResponse.json({ success: false, message: "Enter a valid phone number." }, { status: 400 });
    if (!validateEmail(input.email) || String(input.email).length > 254) return NextResponse.json({ success: false, message: "Enter a valid email address." }, { status: 400 });
    if (!isValidEnum(input.type, bookingTypes)) return NextResponse.json({ success: false, message: "Choose a valid counseling type." }, { status: 400 });
    if (typeof input.preferredDate !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(input.preferredDate)) return NextResponse.json({ success: false, message: "Choose a valid preferred date." }, { status: 400 });
    const date = new Date(`${input.preferredDate}T12:00:00.000Z`);
    if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== input.preferredDate) return NextResponse.json({ success: false, message: "Choose a valid preferred date." }, { status: 400 });
    if (input.preferredDate < karachiToday()) return NextResponse.json({ success: false, message: "The preferred date cannot be in the past." }, { status: 400 });
    const weekday = new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Karachi", weekday: "short" }).format(date);
    if (!["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].includes(weekday)) return NextResponse.json({ success: false, message: "Counseling sessions are available Monday through Saturday." }, { status: 400 });
    if (typeof input.preferredSlot !== "string" || !validSlots.includes(input.preferredSlot)) return NextResponse.json({ success: false, message: "Choose a time between 17:00 and 20:00 in 30-minute steps." }, { status: 400 });
    if (input.message !== undefined && input.message !== "" && !isValidString(input.message, 0, 2000)) return NextResponse.json({ success: false, message: "Message must be 2,000 characters or fewer." }, { status: 400 });

    const user = await getCurrentUser();
    await connectDB();
    const reserved = await reserveCounselingSlot(date, input.preferredSlot);
    if (!reserved) return NextResponse.json({ success: false, message: "That counseling slot is full. Please choose another time." }, { status: 409 });
    let booking;
    try {
      booking = await CounselingBooking.create({
      requestedBy: user?.id || null,
      name: String(input.name).trim(),
      phone: String(input.phone).trim(),
      email: String(input.email || "").trim().toLowerCase(),
      type: input.type,
      preferredDate: date,
      preferredSlot: input.preferredSlot,
      message: String(input.message || "").trim(),
      });
    } catch (error) {
      await releaseCounselingSlot(date, input.preferredSlot);
      throw error;
    }

    const academy = await getAcademySettings();
    const adminEmail = process.env.ADMIN_EMAIL?.trim() || academy.email;
    if (adminEmail) await sendEmail({
      to: adminEmail,
      subject: `New counseling request — ${String(input.name).trim()}`,
      html: "",
      text: `A ${String(input.type)} session was requested for ${input.preferredDate} at ${input.preferredSlot} Asia/Karachi.\nName: ${String(input.name).trim()}\nPhone: ${String(input.phone).trim()}\nEmail: ${String(input.email || "Not provided")}\nMessage: ${String(input.message || "None")}`,
    });
    if (typeof input.email === "string" && input.email.trim()) {
      await sendEmail({
        to: input.email.trim().toLowerCase(),
        subject: `Counseling request received — ${academy.name}`,
        html: "",
        text: `Hello ${String(input.name).trim()},\n\nWe received your request for ${String(input.type)} on ${input.preferredDate} at ${input.preferredSlot} (Pakistan time). The academy will contact you to confirm the session.`,
      });
    }
    return NextResponse.json({ success: true, data: { id: String(booking._id) } }, { status: 201 });
  } catch (error) {
    console.error("POST /api/counseling failed:", error);
    return NextResponse.json({ success: false, message: "Unable to submit the counseling request." }, { status: 500 });
  }
}
