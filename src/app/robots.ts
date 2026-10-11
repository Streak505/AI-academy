import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/admin/", "/student/", "/parent/", "/api/", "/instructor/", "/profile", "/settings", "/signin", "/signup"] },
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
