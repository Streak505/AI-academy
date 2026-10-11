import { NextRequest } from "next/server";
import { revalidateTag } from "next/cache";
import { connectDB } from "@/lib/db";
import { fail, ok, requireAuth } from "@/lib/api";
import { AcademySettings } from "@/models/AcademySettings";
import { recordAdminAudit } from "@/lib/admin-audit";
import { getAcademySettings } from "@/lib/academy-settings";
import { validateEmail } from "@/lib/validations";

function validUrl(value: unknown) {
  if (typeof value !== "string" || value.length > 500) return false;
  if (!value) return true;
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

export async function GET() {
  try {
    const auth = await requireAuth(["ADMIN"]);
    if (!auth.authorized) return auth.response;
    await connectDB();
    return ok(await getAcademySettings());
  } catch (error) {
    console.error("GET /api/admin/academy-settings failed:", error);
    return fail("Unable to load academy settings.", 500);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const auth = await requireAuth(["ADMIN"]);
    if (!auth.authorized) return auth.response;
    let input: Record<string, unknown>;
    try {
      input = await request.json();
    } catch {
      return fail("Invalid request body.", 400);
    }
    const timing = input.timing as Record<string, unknown> | undefined;
    const socials = input.socials as Record<string, unknown> | undefined;
    if (typeof input.phone !== "string" || input.phone.length > 60
      || typeof input.whatsappNumber !== "string" || !/^[+()\d\s-]{7,30}$/.test(input.whatsappNumber)
      || typeof input.email !== "string" || !validateEmail(input.email)
      || typeof input.address !== "string" || input.address.length > 500
      || !validUrl(input.mapsEmbedUrl) || !validUrl(input.mapsLink)
      || !timing || typeof timing.days !== "string" || timing.days.length > 80
      || typeof timing.from !== "string" || timing.from.length > 40 || typeof timing.to !== "string" || timing.to.length > 40
      || !socials || !validUrl(socials.facebook) || !validUrl(socials.instagram) || !validUrl(socials.youtube)) {
      return fail("Check phone, WhatsApp, email, address, timing, map, and social link values.", 400);
    }
    await connectDB();
    const saved = await AcademySettings.findOneAndUpdate(
      { key: "public" },
      {
        $set: {
          phone: input.phone.trim(),
          whatsappNumber: input.whatsappNumber.replace(/\D/g, ""),
          email: input.email.trim().toLowerCase(),
          address: input.address.trim(),
          mapsEmbedUrl: input.mapsEmbedUrl,
          mapsLink: input.mapsLink,
          timing: { days: timing.days.trim(), from: timing.from.trim(), to: timing.to.trim() },
          socials: { facebook: socials.facebook, instagram: socials.instagram, youtube: socials.youtube },
        },
        $setOnInsert: { key: "public" },
      },
      { new: true, upsert: true, runValidators: true }
    );
    await recordAdminAudit(auth.user, request, "ACADEMY_SETTINGS_UPDATED", "AcademySettings", String(saved._id), { fields: ["phone", "whatsappNumber", "email", "address", "mapsEmbedUrl", "mapsLink", "timing", "socials"] });
    revalidateTag("academy-settings");
    return ok(await getAcademySettings());
  } catch (error) {
    console.error("PUT /api/admin/academy-settings failed:", error);
    return fail("Unable to save academy settings.", 500);
  }
}
