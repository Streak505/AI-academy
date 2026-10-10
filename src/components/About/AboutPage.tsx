import Link from "next/link";
import Image from "next/image";
import { Icon } from "@iconify/react/dist/iconify.js";
import { getImagePrefix } from "@/utils/util";
import { academy } from "@/config/academy";

const highlights = [
  {
    title: "Strong academic foundations",
    text: "Focused evening coaching helps students build confidence and improve academic performance.",
  },
  {
    title: "Guidance for families",
    text: "We support students and parents with practical education and career decisions.",
  },
  {
    title: "Skills for tomorrow",
    text: "Career, leadership, entrepreneurship, and international learning programs help students plan ahead.",
  },
];

const values = [
  "Quality education and academic improvement",
  "Successful careers and parent partnership",
  "Entrepreneurship and innovation",
  "Opportunities for deserving students",
];

const stats = [
  { value: "5:00–8:00 PM", label: "Evening class hours" },
  { value: "Mon–Sat", label: "Weekly class days" },
  { value: "6", label: "Mission commitments" },
];

const AboutPage = () => {
  return (
    <main className="bg-slate-50 text-slate-800">
      <section className="bg-slateGray pt-28 pb-20 sm:pt-32 sm:pb-24">
        <div className="container-standard grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div className="max-w-2xl">
            <p className="landing-pill mb-4">About {academy.name}</p>
            <h1 className="hero-title text-4xl sm:text-5xl lg:text-6xl">
              Strong foundations for every learner.
            </h1>
            <p className="hero-subtitle mt-6 text-slate-700">
              {academy.name} is an evening coaching academy supporting school students, families, and lifelong learners through focused teaching and practical guidance.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link href="/programs" className="rounded-full bg-primary px-6 py-3 font-semibold text-white transition hover:bg-secondary no-underline">
                Explore programs
              </Link>
              <Link href="/faculty" className="rounded-full border border-slate-300 px-6 py-3 font-semibold text-slate-700 transition hover:border-primary hover:text-primary no-underline">
                Meet our faculty
              </Link>
              <Link href="/contact" className="rounded-full border border-slate-300 px-6 py-3 font-semibold text-slate-700 transition hover:border-primary hover:text-primary no-underline">
                Contact us
              </Link>
            </div>
          </div>

          <div className="rounded-[2rem] bg-white p-4 shadow-[0_20px_60px_rgba(15,23,42,0.10)]">
            <Image
              src={`${getImagePrefix()}images/banner/Hero.png`}
              alt={`Students learning at ${academy.name}`}
              width={720}
              height={560}
              className="h-[420px] w-full rounded-[1.5rem] object-cover"
            />
          </div>
        </div>
      </section>

      <section className="py-20 sm:py-24">
        <div className="container-standard grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="rounded-[2rem] border border-slate-200 bg-slate-50 p-8 sm:p-10">
            <p className="landing-pill mb-4">Our vision</p>
            <h2 className="landing-section-title text-3xl sm:text-4xl">
              {academy.vision}
            </h2>
            <p className="mt-5 text-lg leading-8 text-slate-700">
              Classes run {academy.timing.days}, {academy.timing.from} to {academy.timing.to}.
            </p>
            <h3 className="mt-6 text-lg font-semibold">Our mission</h3>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-slate-700">{academy.mission.map((item) => <li key={item}>{item}</li>)}</ul>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {stats.map((item) => (
              <div key={item.label} className="rounded-[1.5rem] border border-slate-200 bg-white p-6 text-center shadow-sm">
                <p className="text-3xl font-semibold text-primary">{item.value}</p>
                <p className="mt-2 text-sm text-slate-700">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-deepSlate py-20 text-white sm:py-24">
        <div className="container-standard">
          <div className="max-w-2xl">
            <p className="landing-pill mb-4">Why students choose us</p>
            <h2 className="landing-section-title text-white">A campus experience built for growth.</h2>
            <p className="landing-section-subtitle mt-3 text-slate-300">
              From interactive classrooms to mentor support, every part of our environment is designed to help learners move forward with confidence.
            </p>
          </div>

          <div className="mt-12 grid gap-6 lg:grid-cols-3">
            {highlights.map((item) => (
              <div key={item.title} className="rounded-[1.5rem] border border-slate-200/60 bg-white/10 p-8 shadow-sm backdrop-blur-sm">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/20 text-primary">
                  <Icon icon="solar:rocket-2-outline" className="text-2xl" />
                </div>
                <h3 className="text-xl font-semibold text-white">{item.title}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-300">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 sm:py-24">
        <div className="container-standard grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div className="rounded-[2rem] bg-slate-50 p-8 sm:p-10">
            <Image
              src={`${getImagePrefix()}images/campus/campus.jpg`}
              alt={`${academy.name} learning environment`}
              width={700}
              height={460}
              className="h-[320px] w-full rounded-[1.5rem] object-cover"
            />
          </div>

          <div>
            <p className="landing-pill mb-4">Our values</p>
            <h2 className="landing-section-title text-3xl sm:text-4xl">
              Excellence, accessibility, and innovation in every step.
            </h2>
            <div className="mt-8 space-y-4">
              {values.map((value) => (
                <div key={value} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Icon icon="solar:check-circle-linear" className="text-xl" />
                  </div>
                  <p className="font-medium text-slate-700">{value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="pb-20 sm:pb-24">
        <div className="container-standard">
          <div className="rounded-[2rem] bg-gradient-to-r from-primary to-secondary px-8 py-12 text-center text-white sm:px-12">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-white/80">Join us</p>
            <h2 className="mt-3 text-3xl font-semibold sm:text-4xl">
              Ready to build your future with Shahzaib Royal Academy?
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-base text-white/85">
              Discover programs designed to help you learn, grow, and step confidently into a rewarding career.
            </p>
            <Link href="/" className="mt-8 inline-flex rounded-full bg-white px-6 py-3 font-semibold text-primary transition hover:bg-slate-100 no-underline">
              View our courses
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
};

export default AboutPage;
