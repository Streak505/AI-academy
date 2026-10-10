import Image from "next/image";
import { Icon } from "@iconify/react/dist/iconify.js";
import { connectToDatabase, logMongoError } from "@/lib/db";
import { Instructor as InstructorModel } from "@/models/Instructor";
import { getImagePrefix } from "@/utils/util";
import { EmptyState, ErrorState } from "@/components/Common/DataState";

type FacultyMember = {
  _id: string;
  name: string;
  image?: string;
  specialization?: string;
  bio?: string;
  experience?: string;
};

const FacultyPage = async () => {
  let instructors: FacultyMember[] = [];
  let hasError = false;

  try {
    await connectToDatabase();
    instructors = (await InstructorModel.find({ isActive: true }).sort({ createdAt: -1 }).lean()).map((instructor) => ({
      _id: String(instructor._id),
      name: instructor.name,
      image: instructor.image,
      specialization: instructor.specialization,
      bio: instructor.bio,
      experience: instructor.experience,
    }));
  } catch (error) {
    hasError = true;
    logMongoError("Faculty page", error);
  }

  return (
    <main className="bg-slate-50 text-slate-900">
      <section className="bg-slateGray pt-28 pb-20 sm:pt-32 sm:pb-24">
        <div className="container-standard grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div>
            <p className="landing-pill mb-4">Faculty</p>
            <h1 className="hero-title text-4xl sm:text-5xl lg:text-6xl">
              Meet the experts guiding every student forward.
            </h1>
            <p className="hero-subtitle mt-6 text-slate-700 max-w-2xl">
              Our faculty members combine academic excellence with real industry experience, mentor-led training, and practical coaching.
            </p>
          </div>
          <div className="relative overflow-hidden rounded-[2rem] border border-slate-200 bg-white p-6 shadow-lg">
            <Image
              src={`${getImagePrefix()}images/mentor/teacher1.png`}
              alt="Faculty showcase"
              width={720}
              height={520}
              className="h-full w-full rounded-[1.5rem] object-cover"
            />
          </div>
        </div>
      </section>

      <section className="py-20 sm:py-24">
        <div className="container-standard">
          <div className="mb-12 text-center">
            <p className="landing-pill mb-4">Our teachers</p>
            <h2 className="landing-section-title">The people behind every lesson.</h2>
            <p className="landing-section-subtitle mt-3 max-w-2xl mx-auto">
              From AI trainers to web development mentors, our team is built for guidance, feedback, and strong career support.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {hasError ? (
              <div className="md:col-span-2 xl:col-span-3"><ErrorState message="Unable to load faculty right now." /></div>
            ) : instructors.length === 0 ? (
              <div className="md:col-span-2 xl:col-span-3"><EmptyState title="No faculty profiles" message="Faculty profiles will appear here when they are published." /></div>
            ) : instructors.map((mentor) => (
              <article key={String(mentor._id)} className="group overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white p-8 text-center shadow-sm transition duration-300 hover:-translate-y-2 hover:shadow-2xl">
                <div className="relative mx-auto mb-6 h-56 w-56 overflow-hidden rounded-full border-4 border-white bg-slate-100 shadow-md transition duration-300 group-hover:scale-105">
                  <Image
                    src={`${getImagePrefix()}${mentor.image || "/images/mentor/teacher1.png"}`}
                    alt={mentor.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <h3 className="text-xl font-semibold text-slate-900">{mentor.name}</h3>
                <p className="mt-3 text-sm text-slate-600">{mentor.specialization || "AI Mentor"}</p>
                {mentor.bio ? <p className="mt-4 line-clamp-3 text-sm leading-6 text-slate-600">{mentor.bio}</p> : null}
                <div className="mt-6 flex items-center justify-center gap-3 text-primary">
                  <Icon icon="solar:rocket-2-outline" className="text-2xl" />
                  <span className="font-semibold">Mentor-led sessions</span>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
};

export default FacultyPage;
