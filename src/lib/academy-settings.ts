import { unstable_cache } from "next/cache";
import { academy } from "@/config/academy";
import { connectDB } from "@/lib/db";
import { AcademySettings } from "@/models/AcademySettings";

export type AcademySettingsValue = {
  name: string;
  shortName: string;
  tagline: string;
  vision: string;
  mission: readonly string[];
  timing: { days: string; from: string; to: string };
  phone: string;
  whatsappNumber: string;
  email: string;
  address: string;
  mapsEmbedUrl: string;
  mapsLink: string;
  socials: { facebook: string; instagram: string; youtube: string };
  payments: {
    easyPaisa: { accountTitle: string; accountNumber: string };
    jazzCash: { accountTitle: string; accountNumber: string };
    bankTransfer: { accountTitle: string; bankName: string; iban: string };
  };
  fees: typeof academy.fees;
};

function settingString(value: unknown, fallback: unknown): string {
  for (const candidate of [value, fallback]) {
    if (typeof candidate !== "string") continue;
    const normalized = candidate.trim();
    if (normalized && !/^TODO_REPLACE/i.test(normalized)) return normalized;
  }
  return "";
}

async function loadAcademySettings(): Promise<AcademySettingsValue> {
  await connectDB();
  const saved = await AcademySettings.findOne({ key: "public" }).lean();
  return {
    name: academy.name,
    shortName: academy.shortName,
    tagline: academy.tagline,
    vision: academy.vision,
    mission: academy.mission,
    timing: {
      days: settingString(saved?.timing?.days, academy.timing.days),
      from: settingString(saved?.timing?.from, academy.timing.from),
      to: settingString(saved?.timing?.to, academy.timing.to),
    },
    phone: settingString(saved?.phone, academy.phone),
    whatsappNumber: settingString(saved?.whatsappNumber, academy.whatsappNumber),
    email: settingString(saved?.email, academy.email),
    address: settingString(saved?.address, academy.address),
    mapsEmbedUrl: settingString(saved?.mapsEmbedUrl, academy.mapsEmbedUrl),
    mapsLink: settingString(saved?.mapsLink, academy.mapsLink),
    socials: {
      facebook: settingString(saved?.socials?.facebook, academy.socials.facebook),
      instagram: settingString(saved?.socials?.instagram, academy.socials.instagram),
      youtube: settingString(saved?.socials?.youtube, academy.socials.youtube),
    },
    payments: {
      easyPaisa: {
        accountTitle: settingString(academy.payments.easyPaisa.accountTitle, ""),
        accountNumber: settingString(academy.payments.easyPaisa.accountNumber, ""),
      },
      jazzCash: {
        accountTitle: settingString(academy.payments.jazzCash.accountTitle, ""),
        accountNumber: settingString(academy.payments.jazzCash.accountNumber, ""),
      },
      bankTransfer: {
        accountTitle: settingString(academy.payments.bankTransfer.accountTitle, ""),
        bankName: settingString(academy.payments.bankTransfer.bankName, ""),
        iban: settingString(academy.payments.bankTransfer.iban, ""),
      },
    },
    fees: academy.fees,
  };
}

export const getAcademySettings = unstable_cache(loadAcademySettings, ["academy-settings"], {
  tags: ["academy-settings"],
  revalidate: 3600,
});

export const getPublicAcademySettings = getAcademySettings;
