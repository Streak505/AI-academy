import type { Metadata } from "next";

export const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://aiacademy.pk").replace(/\/$/, "");
export const siteName = "AI Academy";

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
