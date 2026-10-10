import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/seo";

// Deprecated campus/news/events/faculty detail routes and online LMS routes are intentionally omitted.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const paths = ["/", "/about", "/programs", "/career-counseling", "/entrepreneurship", "/ielts-international", "/professional-courses", "/csr", "/gallery", "/admissions", "/contact"];
  return paths.map((path) => ({ url: absoluteUrl(path), changeFrequency: "weekly", priority: path === "/" ? 1 : 0.7 }));
}
