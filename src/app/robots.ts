import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: ["/", "/courses/", "/programs", "/faculty", "/news", "/events", "/admissions", "/contact"], disallow: ["/admin", "/student", "/dashboard", "/api", "/signin", "/signup"] },
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
