import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: ["/", "/about", "/programs", "/career-counseling", "/entrepreneurship", "/ielts-international", "/professional-courses", "/csr", "/gallery", "/admissions", "/contact"], disallow: ["/admin", "/student", "/parent", "/dashboard", "/api", "/signin", "/signup"] },
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
