import { connectDB } from "@/lib/db";
import { Program, PROGRAM_GROUPS } from "@/models/Program";
import { CsrInitiative } from "@/models/CsrInitiative";
import { GalleryItem } from "@/models/GalleryItem";
import { Instructor } from "@/models/Instructor";
import { Course } from "@/models/Course";

export type PublicProgram = {
  id: string;
  title: string;
  slug: string;
  group: (typeof PROGRAM_GROUPS)[number];
  level: string;
  description: string;
  features: string[];
  duration: string;
  monthlyFee: number;
  admissionFee: number;
  mode: "Physical" | "Online" | "Hybrid";
};

export type PublicInitiative = { id: string; title: string; description: string; imageUrl: string };
export type PublicGalleryItem = {
  id: string;
  title: string;
  caption: string;
  category: "events" | "workshops" | "achievements" | "csr";
  imageUrl: string;
};
export type PublicInstructor = {
  id: string;
  name: string;
  bio: string;
  specialization: string;
  qualification: string;
  experience: string;
  image: string;
};
export type PublicResult<T> = { success: true; data: T } | { success: false };

export async function getPublicPrograms(group?: (typeof PROGRAM_GROUPS)[number]): Promise<PublicResult<PublicProgram[]>> {
  try {
    await connectDB();
    const filter = { isPublished: true, ...(group ? { group } : {}) };
    const programs = await Program.find(filter).sort({ order: 1, title: 1 }).lean();
    return {
      success: true,
      data: programs.map((program) => ({
        id: String(program._id),
        title: program.title,
        slug: program.slug,
        group: program.group,
        level: program.level,
        description: program.description,
        features: program.features,
        duration: program.duration,
        monthlyFee: program.monthlyFee,
        admissionFee: program.admissionFee,
        mode: program.mode,
      })),
    };
  } catch (error) {
    console.error("Unable to read published programs:", error);
    return { success: false };
  }

}

export async function getPublishedCourseSlugs(): Promise<PublicResult<string[]>> {
  try {
    await connectDB();
    const courses = await Course.find({ isPublished: true }).select("slug").lean();
    return { success: true, data: courses.map((course) => course.slug) };
  } catch (error) {
    console.error("Unable to read published course slugs:", error);
    return { success: false };
  }
}

export async function getPublicProgram(slug: string): Promise<PublicResult<PublicProgram | null>> {
  try {
    await connectDB();
    const program = await Program.findOne({ slug, isPublished: true }).lean();
    return {
      success: true,
      data: program
        ? {
            id: String(program._id),
            title: program.title,
            slug: program.slug,
            group: program.group,
            level: program.level,
            description: program.description,
            features: program.features,
            duration: program.duration,
            monthlyFee: program.monthlyFee,
            admissionFee: program.admissionFee,
            mode: program.mode,
          }
        : null,
    };
  } catch (error) {
    console.error(`Unable to read published program "${slug}":`, error);
    return { success: false };
  }
}

export async function getPublicInitiatives(): Promise<PublicResult<PublicInitiative[]>> {
  try {
    await connectDB();
    const items = await CsrInitiative.find({ isPublished: true }).sort({ order: 1, title: 1 }).lean();
    return { success: true, data: items.map((item) => ({ id: String(item._id), title: item.title, description: item.description, imageUrl: item.imageUrl ?? "" })) };
  } catch (error) {
    console.error("Unable to read published CSR initiatives:", error);
    return { success: false };
  }
}

export async function getPublicGallery(category?: PublicGalleryItem["category"], limit?: number): Promise<PublicResult<PublicGalleryItem[]>> {
  try {
    await connectDB();
    const query = GalleryItem.find({ isPublished: true, ...(category ? { category } : {}) }).sort({ createdAt: -1, order: 1 });
    if (limit) query.limit(limit);
    const items = await query.lean();
    return {
      success: true,
      data: items.map((item) => ({
        id: String(item._id),
        title: item.title,
        caption: item.caption,
        category: item.category,
        imageUrl: item.imageUrl,
      })),
    };
  } catch (error) {
    console.error("Unable to read published gallery items:", error);
    return { success: false };
  }
}

export async function getPublicInstructors(): Promise<PublicResult<PublicInstructor[]>> {
  try {
    await connectDB();
    const items = await Instructor.find({ isActive: true }).sort({ createdAt: -1 }).lean();
    return {
      success: true,
      data: items.map((item) => ({
        id: String(item._id),
        name: item.name,
        bio: item.bio,
        specialization: item.specialization,
        qualification: item.qualification,
        experience: item.experience,
        image: item.image,
      })),
    };
  } catch (error) {
    console.error("Unable to read active faculty:", error);
    return { success: false };
  }
}
