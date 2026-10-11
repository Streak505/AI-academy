import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rate-limit";
import { connectDB } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { sendCounselingConfirmationEmail, sendEmail } from "@/lib/email";
import { CounselingBooking } from "@/models/CounselingBooking";
import { reserveCounselingSlot, releaseCounselingSlot } from "@/lib/counseling-slots";
import { isValidCounselingSlot } from "@/lib/counseling-validation";
import { isValidEnum, isValidString, sanitizeText, validateEmail } from "@/lib/validations";
import { getAcademySettings } from "@/lib/academy-settings";

const bookingTypes = ["Career Assessment", "Degree Selection", "University Selection", "Parent Counseling", "Scholarship Guidance", "Study Abroad"] as const;
function karachiToday() {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Karachi", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date());
  return `${parts.find((part) => part.type === "year")?.value}-${parts.find((part) => part.type === "month")?.value}-${parts.find((part) => part.type === "day")?.value}`;
}

export async function POST(request: NextRequest) {
  try {
    const clientIp = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const limit = await checkRateLimit(`counseling:${clientIp}`, 5, 60 * 60 * 1000);
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
    const name = typeof input.name === "string" ? sanitizeText(input.name) : "";
    const phone = typeof input.phone === "string" ? sanitizeText(input.phone) : "";
    const email = typeof input.email === "string" ? input.email.trim().toLowerCase() : "";
    const message = typeof input.message === "string" ? sanitizeText(input.message) : "";
    if (!isValidString(name, 2, 120)) return NextResponse.json({ success: false, message: "Enter your name." }, { status: 400 });
    if (!isValidString(phone, 7, 30)) return NextResponse.json({ success: false, message: "Enter a valid phone number." }, { status: 400 });
    if (!validateEmail(email) || email.length > 254) return NextResponse.json({ success: false, message: "Enter a valid email address." }, { status: 400 });
    if (!isValidEnum(input.type, bookingTypes)) return NextResponse.json({ success: false, message: "Choose a valid counseling type." }, { status: 400 });
    const preferredDate = typeof input.preferredDate === "string" ? input.preferredDate : "";
    if (!/^\d{4}-\d{2}-\d{2}$/.test(preferredDate)) return NextResponse.json({ success: false, message: "Choose a valid preferred date." }, { status: 400 });
    const date = new Date(`${preferredDate}T12:00:00.000Z`);
    if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== preferredDate) return NextResponse.json({ success: false, message: "Choose a valid preferred date." }, { status: 400 });
    if (preferredDate < karachiToday()) return NextResponse.json({ success: false, message: "The preferred date cannot be in the past." }, { status: 400 });
    const preferredSlot = typeof input.preferredSlot === "string" ? input.preferredSlot : "";
    if (!isValidCounselingSlot(preferredDate, preferredSlot)) {
      const isDateAvailable = isValidCounselingSlot(preferredDate, "17:00");
      return NextResponse.json({ success: false, message: isDateAvailable
        ? "Choose a time between 17:00 and 20:00 in 30-minute steps."
        : "Counseling sessions are available Monday through Saturday." }, { status: 400 });
    }
    if (message.length > 2000) return NextResponse.json({ success: false, message: "Message must be 2,000 characters or fewer." }, { status: 400 });

    const user = await getCurrentUser();
    await connectDB();
    const reserved = await reserveCounselingSlot(date, preferredSlot);
    if (!reserved) return NextResponse.json({ success: false, message: "That counseling slot is full. Please choose another time." }, { status: 409 });
    let booking;
    try {
      booking = await CounselingBooking.create({
      requestedBy: user?.id || null,
      name,
      phone,
      email,
      type: input.type,
      preferredDate: date,
      preferredSlot,
      message,
      });
    } catch (error) {
      await releaseCounselingSlot(date, preferredSlot);
      throw error;
    }

    const academy = await getAcademySettings();
    const adminEmail = process.env.ADMIN_EMAIL?.trim() || academy.email;
    if (adminEmail) await sendEmail({
      to: adminEmail,
      subject: `New counseling request — ${name}`,
      html: "",
      text: `A ${String(input.type)} session was requested for ${preferredDate} at ${preferredSlot} Asia/Karachi.\nName: ${name}\nPhone: ${phone}\nEmail: ${email || "Not provided"}\nMessage: ${message || "None"}`,
    });
    if (typeof input.email === "string" && input.email.trim()) {
      await sendCounselingConfirmationEmail({ to: email, name, type: String(input.type), date: preferredDate, time: preferredSlot, status: "requested" });
    }
    return NextResponse.json({ success: true, data: { id: String(booking._id) } }, { status: 201 });
  } catch (error) {
    console.error("POST /api/counseling failed:", error);
    return NextResponse.json({ success: false, message: "Unable to submit the counseling request." }, { status: 500 });
  }
}
