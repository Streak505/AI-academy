import React from "react";
import { Metadata } from "next";
import AcademyHome from "@/components/Home/AcademyHome";
import { absoluteUrl, publicMetadata } from "@/lib/seo";
import { getAcademySettings } from "@/lib/academy-settings";
import { StructuredData } from "@/components/Seo/StructuredData";

export const revalidate = 300;
export async function generateMetadata(): Promise<Metadata> {
  const academy = await getAcademySettings();
  return publicMetadata(academy.name, academy.tagline, "/");
}

export default async function Home() {
  const academy = await getAcademySettings();
  const address = academy.address ? {
    "@type": "PostalAddress",
    streetAddress: academy.address,
    addressLocality: academy.locality || undefined,
    addressCountry: "PK",
  } : undefined;
  return <><StructuredData data={{
    "@context": "https://schema.org",
    "@type": "EducationalOrganization",
    name: academy.name,
    description: academy.tagline,
    url: absoluteUrl("/"),
    logo: absoluteUrl("/images/logo/logo-placeholder.svg"),
    ...(academy.phone ? { telephone: academy.phone } : {}),
    ...(academy.email ? { email: academy.email } : {}),
    ...(address ? { address } : {}),
    ...(academy.mapsLink ? { hasMap: academy.mapsLink } : {}),
    openingHours: "Mo-Sa 17:00-20:00",
    ...(academy.locality ? { areaServed: academy.locality } : {}),
    sameAs: Object.values(academy.socials).filter(Boolean),
  }} /><AcademyHome /></>;
}