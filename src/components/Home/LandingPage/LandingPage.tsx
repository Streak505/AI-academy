"use client";

import Link from "next/link";
import Image from "next/image";
import Slider from "react-slick";
import { Icon } from "@iconify/react/dist/iconify.js";
import { useEffect, useState } from "react";
import { formatAcademyDate, getImagePrefix } from "@/utils/util";
import "./landing-page.css";

type CourseItem = {
  _id?: string;
  title?: string;
  slug?: string;
  thumbnail?: string;
  shortDescription?: string;
  level?: string;
  price?: number;
  mode?: string;
  instructor?: { name?: string };
  category?: { name?: string };
  isFeatured?: boolean;
};

type ReviewItem = {
  _id?: string;
  name?: string;
  rating?: number;
  review?: string;
  avatar?: string;
  course?: string;
  role?: string;
};

type InstructorItem = {
  _id?: string;
  name?: string;
  image?: string;
  specialization?: string;
};

type NewsItem = {
  _id?: string;
  title?: string;
  excerpt?: string;
  image?: string;
  publishedAt?: string;
};

type EventItem = {
  _id?: string;
  title?: string;
  description?: string;
  image?: string;
  date?: string;
  location?: string;
};

const LandingPage = () => {
  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [instructors, setInstructors] = useState<InstructorItem[]>([]);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [dataError, setDataError] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [coursesRes, reviewsRes, instructorsRes, newsRes, eventsRes] = await Promise.all([
          fetch("/api/courses?featured=true&limit=6", { cache: "no-store" }),
          fetch("/api/reviews?limit=6", { cache: "no-store" }),
          fetch("/api/instructors?limit=6", { cache: "no-store" }),
          fetch("/api/news?limit=3", { cache: "no-store" }),
          fetch("/api/events?upcoming=true&limit=3", { cache: "no-store" }),
        ]);

        const [courseData, reviewData, instructorData, newsData, eventData] = await Promise.all([
          coursesRes.ok ? coursesRes.json() : { success: false, data: [] },
          reviewsRes.ok ? reviewsRes.json() : { success: false, data: [] },
          instructorsRes.ok ? instructorsRes.json() : { success: false, data: [] },
          newsRes.ok ? newsRes.json() : { success: false, data: [] },
          eventsRes.ok ? eventsRes.json() : { success: false, data: [] },
        ]);

        setDataError([courseData, reviewData, instructorData, newsData, eventData].some((item) => !item?.success));
        if (courseData?.success && Array.isArray(courseData.data)) setCourses(courseData.data);
        if (reviewData?.success && Array.isArray(reviewData.data)) setReviews(reviewData.data);
        if (instructorData?.success && Array.isArray(instructorData.data)) setInstructors(instructorData.data);
        if (newsData?.success && Array.isArray(newsData.data)) setNews(newsData.data);
        if (eventData?.success && Array.isArray(eventData.data)) setEvents(eventData.data);
      } catch (error) {
        setDataError(true);
        console.error("Landing page data load failed", error);
      }
    };

    fetchData();
  }, []);

  const coursesSettings = {
    dots: false,
    infinite: true,
    slidesToShow: 3,
    slidesToScroll: 1,
    arrows: false,
    autoplay: true,
    speed: 600,
    cssEase: "linear",
    responsive: [
      {
        breakpoint: 1200,
        settings: { slidesToShow: 2, slidesToScroll: 1 },
      },
      {
        breakpoint: 700,
        settings: { slidesToShow: 1, slidesToScroll: 1 },
      },
    ],
  };

  const mentorSettings = {
    dots: false,
    infinite: true,
    slidesToShow: 3,
    slidesToScroll: 1,
    arrows: false,
    autoplay: true,
    cssEase: "linear",
    responsive: [
      { breakpoint: 1200, settings: { slidesToShow: 3 } },
      { breakpoint: 1000, settings: { slidesToShow: 2 } },
      { breakpoint: 530, settings: { slidesToShow: 1 } },
    ],
  };

  const newsSettings = {
    dots: false,
    infinite: true,
    slidesToShow: 2,
    slidesToScroll: 1,
    arrows: false,
    autoplay: true,
    cssEase: "linear",
    responsive: [
      { breakpoint: 900, settings: { slidesToShow: 1 } },
    ],
  };

  const reviewSettings = {
    dots: true,
    dotsClass: "slick-dots",
    infinite: true,
    slidesToShow: 3,
    slidesToScroll: 1,
    arrows: false,
    autoplay: true,
    cssEase: "linear",
    responsive: [
      { breakpoint: 1200, settings: { slidesToShow: 3, slidesToScroll: 1 } },
      { breakpoint: 800, settings: { slidesToShow: 2, slidesToScroll: 1 } },
      { breakpoint: 600, settings: { slidesToShow: 1, slidesToScroll: 1 } },
    ],
  };

  const renderStars = (rating: number) => {
    const fullStars = Math.floor(rating);
    const halfStars = rating % 1 >= 0.5 ? 1 : 0;
    const emptyStars = 5 - fullStars - halfStars;

    return (
      <div className="flex items-center gap-1">
        {Array(fullStars)
          .fill(null)
          .map((_, index) => (
            <Icon key={`full-${index}`} icon="tabler:star-filled" className="text-yellow-500 text-sm" />
          ))}
        {halfStars > 0 && <Icon icon="tabler:star-half-filled" className="text-yellow-500 text-sm" />}
        {Array(emptyStars)
          .fill(null)
          .map((_, index) => (
            <Icon key={`empty-${index}`} icon="tabler:star-filled" className="text-slate-300 text-sm" />
          ))}
      </div>
    );
  };

  const isProd = process.env.NODE_ENV === "production";

  return (
    <main>
      <section id="home-section" className="landing-space bg-slateGray pt-32 pb-20 sm:pt-36 sm:pb-24">
        <div className="container-standard">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            <div className="lg:col-span-6 flex flex-col gap-6">
              {dataError ? (
                <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
                  Some academy content is unavailable right now. Please try again later.
                </p>
              ) : null}
              <div className="admission-pill">
                <Icon icon="mdi:robot" className="text-primary text-xl" />
                <p>Admission Open for 2026</p>
              </div>

              <div className="space-y-4">
                <h1 className="hero-title">
                  Shape your future with <span className="text-primary">AI</span>.
                </h1>
                <p className="hero-subtitle">
                  AI Academy delivers practical training in Artificial Intelligence, Machine Learning,
                  Data Science, Web Development, and Robotics.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3 pt-2">
                {[
                  "Expert Faculty",
                  "Modern Labs",
                  "Career Support",
                ].map((item) => (
                  <div key={item} className="feature-pill">
                    <Image src={`${getImagePrefix()}images/banner/check-circle.svg`} alt="check" width={30} height={30} />
                    <p>{item}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-6 flex justify-center">
              <div className="image-panel">
                <Image
                  src={`${getImagePrefix()}images/banner/Hero.png`}
                  alt="AI academy"
                  width={700}
                  height={700}
                  className="h-auto w-full object-cover"
                />
                <div className="overlay-card">
                  <p className="text-xs uppercase tracking-[0.35em] text-primary/80">Next-gen learning</p>
                  <h2 className="mt-3 text-3xl font-semibold">AI Academy</h2>
                  <p className="mt-3 text-sm leading-6 text-slate-300">
                    Practical AI programs with hands-on labs, mentor support, and career-ready projects.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="courses" className="py-20 sm:py-24">
        <div className="container-standard">
          <div className="mb-12 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="landing-pill mb-4">Trending now</p>
              <h2 className="landing-section-title">Popular courses.</h2>
              <p className="landing-section-subtitle mt-3">Explore the programs learners are choosing most often.</p>
            </div>
            <Link href="/" className="text-primary font-semibold hover:text-secondary">
              Explore courses &rarr;
            </Link>
          </div>

          {courses.length === 0 ? <p className="rounded-xl border border-slate-200 bg-white p-6 text-center text-slate-600">No featured courses are available right now.</p> : null}
          {courses.length > 0 ? <Slider {...coursesSettings}>
            {courses.map((item, index) => (
              <div key={`${item.slug ?? item.title ?? index}`}>
                <div className="landing-card landing-card-hover group m-3 mb-10 overflow-hidden relative border border-slate-200 bg-white transition duration-500 hover:-translate-y-2 hover:shadow-[0_30px_80px_rgba(101,86,255,0.18)] hover:bg-slate-50">
                  <div className="relative overflow-hidden">
                    <Image
                      src={`${getImagePrefix()}${item.thumbnail ?? "/images/courses/ai.png"}`}
                      alt={item.title ?? "AI Academy course"}
                      width={389}
                      height={262}
                      className="landing-card-image h-56 w-full object-cover transition-transform duration-500 ease-out group-hover:scale-110"
                    />
                    <div className="absolute right-4 bottom-4 rounded-full bg-gradient-to-r from-violet-600 via-fuchsia-500 to-rose-500 px-4 py-3 text-center text-white shadow-xl shadow-violet-400/20 transition duration-500 group-hover:-translate-y-1 group-hover:scale-105">
                      <p className="text-[0.65rem] font-semibold uppercase tracking-[0.18em]">{item.level ?? "Featured"}</p>
                    </div>
                  </div>

                  <div className="space-y-5 p-6">
                    <Link href={`/courses/${item.slug ?? ""}`} className="text-xl font-semibold text-slate-950 transition-colors duration-300 hover:text-primary">
                      {item.title}
                    </Link>
                    <p className="text-sm text-slate-700">{item.category?.name ?? "AI Academy"}</p>

                    <div className="flex items-center justify-between border-b border-slate-100 pb-5">
                      <div>
                        <p className="text-lg font-semibold text-violet-600">4.8</p>
                        {renderStars(4.8)}
                      </div>
                      <p className="text-2xl font-semibold text-slate-900">PKR {Number(item.price ?? 0).toLocaleString()}</p>
                    </div>

                    <div className="flex items-center justify-between text-sm text-slate-700">
                      <div className="flex items-center gap-2">
                        <Icon icon="solar:notebook-minimalistic-outline" className="text-violet-600 text-lg" />
                        <span className="font-medium text-slate-900">{item.mode ?? "Hybrid"}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Icon icon="solar:users-group-rounded-linear" className="text-violet-600 text-lg" />
                        <span className="font-medium text-slate-900">{item.instructor?.name ?? "Mentor"}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </Slider> : null}
        </div>
      </section>

      <section className="bg-deepSlate py-20 sm:py-24" id="mentor">
        <div className="container-standard">
          <div className="mb-10 max-w-2xl">
            <p className="landing-pill mb-4">Meet the experts</p>
            <h2 className="landing-section-title text-white">Meet with our mentor.</h2>
            <p className="landing-section-subtitle mt-3 text-slate-300">
              Learn from professionals who have built real-world AI solutions.
            </p>
          </div>

          {instructors.length === 0 ? <p className="rounded-xl border border-slate-700 bg-slate-800 p-6 text-center text-slate-300">Faculty information is not available right now.</p> : null}
          {instructors.length > 0 ? <Slider {...mentorSettings}>
            {instructors.map((item, index) => (
              <div key={`${item.name}-${index}`}>
                <div className="mentor-card group m-3 relative overflow-hidden rounded-[2rem] bg-white/95 p-8 text-center shadow-lg border border-slate-200 transition duration-500 hover:-translate-y-2 hover:shadow-[0_28px_90px_rgba(99,102,241,0.24)] hover:bg-gradient-to-br hover:from-violet-50 hover:via-fuchsia-50 hover:to-rose-50">
                  <div className="relative mx-auto w-fit transition duration-500 group-hover:scale-105">
                    <div className="absolute inset-0 bg-gradient-to-br from-violet-200/20 via-transparent to-rose-200/10 opacity-0 transition duration-500 group-hover:opacity-100" />
                    <Image
                      src={`${getImagePrefix()}${item.image ?? "/images/mentor/teacher1.png"}`}
                      alt={item.name ?? "Instructor"}
                      width={260}
                      height={260}
                      className="landing-image-round relative h-56 w-56 border-4 border-white shadow-2xl shadow-slate-200"
                    />
                    <div className="absolute bottom-3 right-3 rounded-full bg-white p-3 shadow-md transition duration-500 group-hover:bg-primary/90 group-hover:text-white">
                      <Image src={`${getImagePrefix()}images/mentor/linkedin.svg`} alt="linkedin" width={24} height={24} />
                    </div>
                  </div>
                  <div className="mt-6">
                    <h3 className="text-xl font-semibold text-slate-950 transition-colors duration-300 group-hover:text-primary">{item.name}</h3>
                    <p className="mt-2 text-sm font-medium text-slate-700">{item.specialization ?? "AI Mentor"}</p>
                  </div>
                </div>
              </div>
            ))}
          </Slider> : null}
        </div>
      </section>

      <section id="testimonial" className="py-20 sm:py-24">
        <div className="container-standard">
          <div className="mb-12 text-center">
            <p className="landing-pill mb-4">Student success</p>
            <h2 className="landing-section-title">What learners are saying.</h2>
          </div>

          {reviews.length === 0 ? <p className="rounded-xl border border-slate-200 bg-white p-6 text-center text-slate-600">Student reviews will appear here soon.</p> : null}
          {reviews.length > 0 ? <Slider {...reviewSettings}>
            {reviews.map((item, index) => (
              <div key={`${item.name ?? "review"}-${index}`}>
                <div className="m-3 rounded-[1.5rem] bg-white p-6 shadow-[0_18px_45px_rgba(15,23,42,0.08)]">
                  <div className="mb-5 flex items-center gap-4">
                    <Image
                      src={`${getImagePrefix()}${item.avatar ?? "/images/testimonial/student1.png"}`}
                      alt={item.name ?? "Student review"}
                      width={64}
                      height={64}
                      className="landing-image-round h-16 w-16 border-2 border-primary/20"
                    />
                    <div>
                      <h3 className="font-semibold text-slate-900">{item.name}</h3>
                      <p className="text-sm text-slate-600">{item.role ?? "AI Academy Student"}</p>
                    </div>
                  </div>
                  <p className="mb-5 text-sm leading-7 text-slate-700">{item.review}</p>
                  {renderStars(item.rating ?? 5)}
                </div>
              </div>
            ))}
          </Slider> : null}
        </div>
      </section>

      <section className="pb-20 sm:pb-24">
        <div className="container-standard">
          <div className="mb-12 text-center">
            <p className="landing-pill mb-4">Latest updates</p>
            <h2 className="landing-section-title">News & events</h2>
          </div>

          {news.length === 0 && events.length === 0 ? <p className="rounded-xl border border-slate-200 bg-white p-6 text-center text-slate-600">No academy updates are available right now.</p> : null}
          {news.length > 0 ? <Slider {...newsSettings}>
            {news.map((item, index) => (
              <div key={`${item.title ?? "news"}-${index}`} className="p-3">
                <article className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-[0_18px_45px_rgba(15,23,42,0.08)]">
                  <Image src={`${getImagePrefix()}${item.image ?? "/images/banner/Hero.png"}`} alt={item.title ?? "Academy update"} width={640} height={400} className="h-56 w-full object-cover" />
                  <div className="p-6">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-600">{item.publishedAt ? formatAcademyDate(item.publishedAt) : "Recent"}</p>
                    <h3 className="mt-3 text-xl font-semibold text-slate-900">{item.title}</h3>
                    <p className="mt-3 text-sm text-slate-600">{item.excerpt}</p>
                  </div>
                </article>
              </div>
            ))}
          </Slider> : null}
          {events.length > 0 ? (
            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {events.map((item, index) => (
                <article key={`${item._id ?? item.title ?? "event"}-${index}`} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Upcoming event</p>
                  <h3 className="mt-3 text-lg font-semibold text-slate-900">{item.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{item.description}</p>
                  <p className="mt-4 text-sm font-semibold text-slate-800">{item.date ? formatAcademyDate(item.date) : "Date to be announced"}</p>
                  {item.location ? <p className="mt-1 text-sm text-slate-500">{item.location}</p> : null}
                </article>
              ))}
            </div>
          ) : null}
        </div>
      </section>

      <section className="pb-20 sm:pb-24">
        <div className="container-standard">
          <div className={`rounded-[2rem] bg-cover bg-center px-6 py-16 sm:px-10 lg:px-16 ${isProd ? "bg-newsletter-bg-2" : "bg-newsletter-bg"}`}>
            <div className="mx-auto max-w-2xl text-center text-white">
              <p className="mb-4 text-sm font-semibold uppercase tracking-[0.3em] text-white/80">Stay ahead</p>
              <h3 className="text-3xl sm:text-4xl font-semibold">Newsletter.</h3>
              <p className="mt-4 text-base text-white/80">
                Subscribe for updates, discounts, and the latest AI learning opportunities.
              </p>
              <div className="mt-8 flex flex-col gap-3 rounded-full bg-white/95 p-2 shadow-lg sm:flex-row">
                <input
                  type="email"
                  className="w-full rounded-full border border-transparent bg-transparent px-5 py-3 text-base text-slate-800 outline-none"
                  placeholder="Enter your email address"
                  autoComplete="off"
                />
                <button className="rounded-full bg-primary px-6 py-3 font-semibold text-white transition-colors hover:bg-secondary">
                  <span className="flex items-center justify-center gap-2">
                    <Image src={`${getImagePrefix()}images/newsletter/send.svg`} alt="send" width={20} height={20} />
                    Join now
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};

export default LandingPage;
