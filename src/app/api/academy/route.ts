import { academy } from "@/config/academy";
import { ok } from "@/lib/api";

export async function GET() {
  return ok({
    name: academy.name,
    shortName: academy.shortName,
    tagline: academy.tagline,
    vision: academy.vision,
    mission: academy.mission,
    timing: academy.timing,
    phone: academy.phone,
    whatsappNumber: academy.whatsappNumber,
    email: academy.email,
    address: academy.address,
    mapsEmbedUrl: academy.mapsEmbedUrl,
    mapsLink: academy.mapsLink,
    socials: academy.socials,
  });
}
