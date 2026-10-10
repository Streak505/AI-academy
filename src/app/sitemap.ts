import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/seo";
import { getPublicPrograms } from "@/lib/public-data";

export const dynamic = "force-dynamic";

// Deprecated campus/news/events/faculty detail routes and online LMS routes are intentionally omitted.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const programs = await getPublicPrograms();
  if (!programs.success) throw new Error("Unable to build sitemap because program data could not be loaded.");
  const paths = ["/", "/about", "/programs", "/career-counseling", "/entrepreneurship", "/international", "/professional-courses", "/csr", "/gallery", "/admissions", "/contact"];
  paths.push(...programs.data.map((program) => `/programs/${program.slug}`));
  return paths.map((path) => ({ url: absoluteUrl(path), changeFrequency: "weekly", priority: path === "/" ? 1 : 0.7 }));
}
