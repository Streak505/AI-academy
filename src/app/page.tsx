import React from "react";
import { Metadata } from "next";
import AcademyHome from "@/components/Home/AcademyHome";
import { absoluteUrl, jsonLd, publicMetadata } from "@/lib/seo";
import { academy } from "@/config/academy";

export const revalidate = 300;
export const metadata: Metadata = publicMetadata(academy.name, academy.tagline, "/");

export default function Home() {
  return <><script type="application/ld+json" dangerouslySetInnerHTML={jsonLd({ "@context": "https://schema.org", "@type": "EducationalOrganization", name: academy.name, description: academy.tagline, url: absoluteUrl("/"), logo: absoluteUrl("/images/logo/logo-placeholder.svg") })} /><AcademyHome /></>;
}