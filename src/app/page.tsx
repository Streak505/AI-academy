import React from "react";
import { Metadata } from "next";
import AcademyHome from "@/components/Home/AcademyHome";
import { absoluteUrl, jsonLd, publicMetadata } from "@/lib/seo";
import { getAcademySettings } from "@/lib/academy-settings";

export const revalidate = 300;
export async function generateMetadata(): Promise<Metadata> {
  const academy = await getAcademySettings();
  return publicMetadata(academy.name, academy.tagline, "/");
}

export default async function Home() {
  const academy = await getAcademySettings();
  return <><script type="application/ld+json" dangerouslySetInnerHTML={jsonLd({
    "@context": "https://schema.org",
    "@type": "EducationalOrganization",
    name: academy.name,
    description: academy.tagline,
    url: absoluteUrl("/"),
    logo: absoluteUrl("/images/logo/logo-placeholder.svg"),
    ...(academy.phone ? { telephone: academy.phone } : {}),
    ...(academy.email ? { email: academy.email } : {}),
    ...(academy.address ? { address: academy.address } : {}),
    ...(academy.mapsLink ? { hasMap: academy.mapsLink } : {}),
    sameAs: Object.values(academy.socials).filter(Boolean),
  })} /><AcademyHome /></>;
}