import { notFound } from "next/navigation";
import { connectToDatabase } from "@/lib/db";
import { Course } from "@/models/Course";
import { Review } from "@/models/Review";
import { Lesson } from "@/models/Lesson";
import Link from "next/link";
import Image from "next/image";
import EnrollButton from "@/components/Courses/EnrollButton";
import type { Metadata } from "next";
import { absoluteUrl, jsonLd, publicMetadata } from "@/lib/seo";
import { getAcademySettings } from "@/lib/academy-settings";

// DEPRECATED: not part of Shahzaib Royal Academy scope

async function getCourse(slug: string) {
  await connectToDatabase();

  const course = await Course.findOne({ slug, isPublished: true })
    .populate("category")
    .populate("instructor")
    .lean();

  if (!course) return null;

  const lessons = await Lesson.find({ course: course._id, isPublished: true }).sort({ order: 1 }).lean();
  const reviews = await Review.find({ course: course._id, isPublished: true }).sort({ createdAt: -1 }).limit(5).lean();

  return { course, lessons, reviews };
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const data = await getCourse(slug);
  if (!data) return { title: "Course not found", robots: { index: false, follow: false } };
  const academy = await getAcademySettings();
  const description = data.course.shortDescription || data.course.description.slice(0, 155);
  return {
    ...publicMetadata(data.course.title, description, `/courses/${data.course.slug}`),
    openGraph: { title: data.course.title, description, url: absoluteUrl(`/courses/${data.course.slug}`), type: "article", images: data.course.thumbnail ? [{ url: absoluteUrl(data.course.thumbnail), alt: data.course.title }] : undefined },
  };
}

export default async function CourseDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = await getCourse(slug);

  if (!data) {
    notFound();
  }

  const { course, lessons, reviews } = data;
  const academy = await getAcademySettings();
  const courseSchema = {
    "@context": "https://schema.org",
    "@type": "Course",
    name: course.title,
    description: course.description,
    provider: { "@type": "EducationalOrganization", name: academy.name, url: absoluteUrl("/") },
    educationalLevel: course.level,
    courseMode: course.mode,
    image: course.thumbnail ? absoluteUrl(course.thumbnail) : undefined,
    instructor: course.instructor?.name ? { "@type": "Person", name: course.instructor.name } : undefined,
    offers: { "@type": "Offer", price: Number(course.discountPrice || course.price), priceCurrency: "PKR", url: absoluteUrl(`/courses/${course.slug}`), availability: "https://schema.org/InStock" },
  };

  return (
    <main className="bg-slate-50 pb-20 pt-32">
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(courseSchema)} />
      <div className="mx-auto max-w-6xl px-4">
        <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <p className="mb-4 inline-flex rounded-full bg-violet-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-violet-600">
              {course.level}
            </p>
            <h1 className="text-4xl font-bold text-slate-900 sm:text-5xl">{course.title}</h1>
            <p className="mt-5 text-lg text-slate-700">{course.shortDescription}</p>

            <div className="mt-8 flex flex-wrap gap-4 text-sm text-slate-600">
              <span>Duration: {course.duration}</span>
              <span>Mode: {course.mode}</span>
              <span>Price: PKR {Number(course.price).toLocaleString()}</span>
            </div>

            <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-2xl font-semibold text-slate-900">About this course</h2>
              <p className="mt-4 text-slate-700">{course.description}</p>
            </div>

            <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-2xl font-semibold text-slate-900">Course syllabus</h2>
              <ul className="mt-5 space-y-3">
                {course.syllabus?.map((item: string, index: number) => (
                  <li key={`${item}-${index}`} className="flex gap-3 text-slate-700">
                    <span className="mt-1 inline-block h-2.5 w-2.5 rounded-full bg-violet-600" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <aside className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-lg">
            <div className="overflow-hidden rounded-2xl border border-slate-200">
              <Image src={course.thumbnail || "/images/courses/ai.png"} alt={course.title} width={720} height={480} className="h-60 w-full object-cover" />
            </div>

            <div className="mt-6 flex items-baseline gap-3">
              <span className="text-3xl font-bold text-slate-900">PKR {Number(course.price).toLocaleString()}</span>
              {course.discountPrice ? <span className="text-lg text-slate-400 line-through">PKR {Number(course.discountPrice).toLocaleString()}</span> : null}
            </div>

            <ul className="mt-6 space-y-4 text-sm text-slate-600">
              <li>Instructor: {course.instructor?.name}</li>
              <li>Category: {course.category?.name}</li>
              <li>Mode: {course.mode}</li>
              <li>Level: {course.level}</li>
            </ul>

            <div className="mt-8 space-y-3">
              <EnrollButton courseId={String(course._id)} courseSlug={course.slug} />
              <Link href="/contact" className="block rounded-full border border-slate-300 px-5 py-3 text-center font-semibold text-slate-700 no-underline hover:border-violet-600 hover:text-violet-600">
                Ask an advisor
              </Link>
            </div>
          </aside>
        </div>

        <section className="mt-16 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-semibold text-slate-900">Course lessons</h2>
          <div className="mt-6 space-y-3">
            {lessons.map((lesson: any, index: number) => (
              <div key={String(lesson._id)} className="flex items-center justify-between rounded-2xl border border-slate-200 p-4">
                <div>
                  <p className="font-medium text-slate-900">Lesson {index + 1}: {lesson.title}</p>
                  <p className="text-sm text-slate-500">{lesson.duration}</p>
                </div>
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">{lesson.isPublished ? "Live" : "Draft"}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-16">
          <h2 className="text-2xl font-semibold text-slate-900">Student reviews</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {reviews.map((review: any) => (
              <div key={String(review._id)} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="font-semibold text-slate-900">{review.name}</p>
                <p className="mt-2 text-sm text-slate-600">{review.review}</p>
                <p className="mt-3 text-amber-500">{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
