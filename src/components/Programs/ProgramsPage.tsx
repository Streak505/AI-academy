import Link from "next/link";
import { Icon } from "@iconify/react/dist/iconify.js";
import Image from "next/image";
import { getImagePrefix } from "@/utils/util";
import { EmptyState, ErrorState } from "@/components/Common/DataState";

import { connectToDatabase, logMongoError } from "@/lib/db";
import { Category } from "@/models/Category";

async function getPrograms() {
  await connectToDatabase();
  return Category.aggregate([
    { $match: { isActive: true } },
    {
      $lookup: {
        from: "courses",
        let: { categoryId: "$_id" },
        pipeline: [
          { $match: { $expr: { $and: [{ $eq: ["$category", "$$categoryId"] }, { $eq: ["$isPublished", true] }] } } },
          { $count: "count" },
        ],
        as: "courseStats",
      },
    },
    {
      $project: {
        name: 1,
        slug: 1,
        description: 1,
        image: 1,
        courseCount: { $ifNull: [{ $arrayElemAt: ["$courseStats.count", 0] }, 0] },
      },
    },
    { $sort: { name: 1 } },
  ]);
}

const ProgramsPage = async () => {
  let programs: Array<{ _id: string; name: string; slug: string; description?: string; image?: string; courseCount: number }> = [];
  let hasError = false;

  try {
    programs = (await getPrograms()).map((program) => ({ ...program, _id: String(program._id) }));
  } catch (error) {
    hasError = true;
    logMongoError("Programs page", error);
  }

  return (
    <main className="bg-slate-50 text-slate-900">
      <section className="bg-slateGray pt-28 pb-20 sm:pt-32 sm:pb-24">
        <div className="container-standard grid gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
          <div>
            <p className="landing-pill mb-4">Programs</p>
            <h1 className="hero-title text-4xl sm:text-5xl lg:text-6xl">
              Discover learning paths for every level of AI ambition.
            </h1>
            <p className="hero-subtitle mt-6 text-slate-700 max-w-2xl">
              From foundational coding skills to advanced machine learning and robotics, choose a program designed to help you grow quickly and confidently.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link href="/admissions" className="rounded-full bg-primary px-6 py-3 font-semibold text-white transition hover:bg-secondary no-underline">
                Apply now
              </Link>
              <Link href="/contact" className="rounded-full border border-slate-300 px-6 py-3 font-semibold text-slate-700 transition hover:border-primary hover:text-primary no-underline">
                Talk to an advisor
              </Link>
            </div>
          </div>
          <div className="relative overflow-hidden rounded-[2rem] border border-slate-200 bg-white p-6 shadow-lg">
            <Image
              src={`${getImagePrefix()}images/courses/ai.png`}
              alt="Programs showcase"
              width={760}
              height={560}
              className="h-full w-full rounded-[1.5rem] object-cover"
            />
          </div>
        </div>
      </section>

      <section className="py-20 sm:py-24">
        <div className="container-standard">
          <div className="mb-12 text-center">
            <p className="landing-pill mb-4">Curriculum</p>
            <h2 className="landing-section-title">Popular program tracks.</h2>
            <p className="landing-section-subtitle mt-3 max-w-2xl mx-auto">
              Each pathway includes project-based learning, mentor support, and career-ready outcomes.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {hasError ? (
              <div className="md:col-span-2 xl:col-span-3"><ErrorState message="Unable to load programs right now." /></div>
            ) : programs.length === 0 ? (
              <div className="md:col-span-2 xl:col-span-3"><EmptyState title="No programs available" message="Programs will appear here when they are published." /></div>
            ) : programs.map((item) => (
              <article key={item._id} className="group overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-[0_20px_55px_rgba(15,23,42,0.12)] transition duration-300 hover:-translate-y-2 hover:shadow-[0_30px_95px_rgba(15,23,42,0.18)]">
                <div className="overflow-hidden rounded-t-[1.5rem] border-b border-slate-200 bg-slate-100">
                  <Image
                    src={`${getImagePrefix()}${item.image}`}
                    alt={item.name}
                    width={560}
                    height={360}
                    className="h-56 w-full object-cover transition duration-500 group-hover:scale-105"
                  />
                </div>
                <div className="p-6">
                  <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary transition duration-300 group-hover:bg-primary group-hover:text-white">
                    <Icon icon="solar:layers-minimalistic-linear" className="text-2xl" />
                  </div>
                  <div className="mb-4 text-sm font-semibold uppercase tracking-[0.24em] text-slate-600">
                    Track
                  </div>
                  <h3 className="text-2xl font-semibold text-slate-950">{item.name}</h3>
                  <p className="mt-4 text-slate-800 leading-7">{item.description || "Explore practical courses and build skills with AI Academy."}</p>
                  <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
                    <Link href={`/admissions?program=${encodeURIComponent(item.name)}`} className="text-primary font-semibold hover:text-secondary no-underline transition">
                      Explore courses →
                    </Link>
                    <span className="inline-flex items-center justify-center rounded-full bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700">
                      {item.courseCount} {item.courseCount === 1 ? "course" : "courses"}
                    </span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
};

export default ProgramsPage;
