import React from "react";
import { Metadata } from "next";
import LandingPage from "@/components/Home/LandingPage/LandingPage";
import { absoluteUrl, jsonLd, publicMetadata } from "@/lib/seo";

export const metadata: Metadata = publicMetadata("AI Academy", "Practical AI, programming, data science, web development, and technology education for ambitious learners.", "/");

export default function Home() {
  return <><script type="application/ld+json" dangerouslySetInnerHTML={jsonLd({ "@context": "https://schema.org", "@type": "EducationalOrganization", name: "AI Academy", url: absoluteUrl("/"), logo: absoluteUrl("/images/logo/AI-logo.png") })} /><LandingPage /></>;
}