import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/seo";
import { getPublicGallery, getPublicPrograms, getPublishedCourseSlugs } from "@/lib/public-data";

export const dynamic = "force-dynamic";

// Deprecated campus/news/events/faculty detail routes and online LMS routes are intentionally omitted.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [programs, gallery, courses] = await Promise.all([getPublicPrograms(), getPublicGallery(), getPublishedCourseSlugs()]);
  if (!programs.success) throw new Error("Unable to build sitemap because program data could not be loaded.");
  if (!gallery.success) throw new Error("Unable to build sitemap because gallery data could not be loaded.");
  if (!courses.success) throw new Error("Unable to build sitemap because course data could not be loaded.");
  const paths = ["/", "/about", "/programs", "/career-counseling", "/entrepreneurship", "/international", "/professional-courses", "/csr", "/gallery", "/admissions", "/contact", "/campuses", "/events", "/faculty", "/news", "/privacy", "/terms"];
  paths.push(...programs.data.map((program) => `/programs/${program.slug}`));
  paths.push(...courses.data.map((slug) => `/courses/${slug}`));
  return paths.map((path) => ({
    url: absoluteUrl(path),
    changeFrequency: "weekly",
    priority: path === "/" ? 1 : 0.7,
    ...(path === "/gallery" ? { images: gallery.data.map(({ imageUrl }) => imageUrl).filter(Boolean) } : {}),
  }));
}
