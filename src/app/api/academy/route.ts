import { getAcademySettings } from "@/lib/academy-settings";
import { fail, ok } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const settings = await getAcademySettings();
    return ok({
      name: settings.name,
      shortName: settings.shortName,
      tagline: settings.tagline,
      vision: settings.vision,
      mission: settings.mission,
      timing: settings.timing,
      phone: settings.phone,
      whatsappNumber: settings.whatsappNumber,
      email: settings.email,
      address: settings.address,
      mapsEmbedUrl: settings.mapsEmbedUrl,
      mapsLink: settings.mapsLink,
      socials: settings.socials,
    });
  } catch (error) {
    console.error("GET /api/academy failed:", error);
    return fail("Academy contact details are temporarily unavailable.", 500);
  }
}
