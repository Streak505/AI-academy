import type { MetadataRoute } from "next";
import { connectToDatabase } from "@/lib/db";
import { Course } from "@/models/Course";
import { absoluteUrl } from "@/lib/seo";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const routes: MetadataRoute.Sitemap = ["/", "/programs", "/faculty", "/admissions", "/news", "/events", "/contact"].map((path) => ({ url: absoluteUrl(path), changeFrequency: "weekly", priority: path === "/" ? 1 : 0.7 }));
  try {
    await connectToDatabase();
    const courses = await Course.find({ isPublished: true }).select("slug updatedAt").lean();
    routes.push(...courses.map((item) => ({ url: absoluteUrl(`/courses/${item.slug}`), lastModified: item.updatedAt })));
  } catch (error) {
    console.error("Unable to build sitemap:", error);
  }
  return routes;
}
