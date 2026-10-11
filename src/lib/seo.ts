import type { Metadata } from "next";

import { academy } from "@/config/academy";

export const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL?.trim() || "http://localhost:3000").replace(/\/$/, "");
export const siteName = academy.name;

export function absoluteUrl(path = "") {
  return `${siteUrl}${path.startsWith("/") ? path : `/${path}`}`;
}

export function publicMetadata(title: string, description: string, path = ""): Metadata {
  return {
    title,
    description,
    alternates: { canonical: absoluteUrl(path) },
    openGraph: { title, description, url: absoluteUrl(path), siteName, type: "website" },
    twitter: { card: "summary_large_image", title, description },
  };
}

export function jsonLd(data: Record<string, unknown>) {
  return {
    __html: JSON.stringify(data).replace(/</g, "\\u003c").replace(/>/g, "\\u003e").replace(/&/g, "\\u0026"),
  };
}

export function breadcrumbSchema(items: Array<{ name: string; path: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}
