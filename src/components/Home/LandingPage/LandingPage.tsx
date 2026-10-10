"use client";

import Link from "next/link";
import Image from "next/image";
import Slider from "react-slick";
import { Icon } from "@iconify/react/dist/iconify.js";
import { useCallback, useEffect, useState } from "react";
import { formatAcademyDate, getImagePrefix } from "@/utils/util";
import { EmptyState, ErrorState, LoadingState } from "@/components/Common/DataState";
import "./landing-page.css";
import { academy } from "@/config/academy";

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
  group?: string;
  monthlyFee?: number;
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

type SectionKey = "courses" | "reviews" | "instructors" | "news" | "events";
type SectionStatus = "loading" | "loaded" | "error";

const LandingPage = () => {
  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [instructors, setInstructors] = useState<InstructorItem[]>([]);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [sectionStatus, setSectionStatus] = useState<Record<SectionKey, SectionStatus>>({
    courses: "loading",
    reviews: "loading",
    instructors: "loading",
    news: "loading",
    events: "loading",
  });

  const loadSection = useCallback(async <T,>(
    endpoint: string,
    section: SectionKey,
    setItems: React.Dispatch<React.SetStateAction<T[]>>
  ) => {
    setSectionStatus((current) => ({ ...current, [section]: "loading" }));
    let status: number | undefined;

    try {
      const response = await fetch(endpoint, { cache: "no-store" });
      status = response.status;
      const payload = await response.json() as { success?: unknown; data?: unknown };
      const responseData = payload.data;
      const items = Array.isArray(responseData)
        ? responseData
        : responseData && typeof responseData === "object" && "items" in responseData && Array.isArray(responseData.items)
          ? responseData.items
          : null;
      if (!response.ok || payload.success !== true || !items) {
        throw new Error("Request did not return a successful data collection.");
      }
      setItems(items as T[]);
      setSectionStatus((current) => ({ ...current, [section]: "loaded" }));
    } catch {
      if (process.env.NODE_ENV === "development") {
        console.warn(`Landing page request failed: ${endpoint} (status: ${status ?? "network error"})`);
      }
      setSectionStatus((current) => ({ ...current, [section]: "error" }));
    }
  }, []);

  const renderSectionState = (section: SectionKey, isEmpty: boolean, title: string, message: string, retry: () => void) => {
    if (sectionStatus[section] === "loading") return <LoadingState label={`Loading ${title.toLowerCase()}`} />;
    if (sectionStatus[section] === "error") return <ErrorState message={`Unable to load ${title.toLowerCase()} right now.`} onRetry={retry} />;
    if (isEmpty) return <EmptyState title={title} message={message} />;
    return null;
  };

  useEffect(() => {
    void Promise.all([
      loadSection("/api/programs?limit=6", "courses", setCourses),
      loadSection("/api/reviews?limit=6", "reviews", setReviews),
      loadSection("/api/instructors?limit=6", "instructors", setInstructors),
      loadSection("/api/news?limit=3", "news", setNews),
      loadSection("/api/events?upcoming=true&limit=3", "events", setEvents),
    ]);
  }, [loadSection]);

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
              <div className="admission-pill">
                <Icon icon="mdi:robot" className="text-primary text-xl" />
                <p>                Evening coaching for 2026</p>
              </div>

              <div className="space-y-4">
                <h1 className="hero-title">
                  Build strong foundations for a brighter future.
                </h1>
                <p className="hero-subtitle">
                  {academy.name} helps students excel at school, plan their careers, develop leadership, and explore global opportunities.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3 pt-2">
                {[
                  "Academic Support",
                  "Career Guidance",
                  "Evening Classes",
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
                  alt={`Students at ${academy.name}`}
                  width={700}
                  height={700}
                  className="h-auto w-full object-cover"
                />
                <div className="overlay-card">
                  <p className="text-xs uppercase tracking-[0.35em] text-primary/80">{academy.timing.days}</p>
                  <h2 className="mt-3 text-3xl font-semibold">{academy.name}</h2>
                  <p className="mt-3 text-sm leading-6 text-slate-300">
                    Evening classes from {academy.timing.from} to {academy.timing.to}.
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
              <h2 className="landing-section-title">Popular programs.</h2>
              <p className="landing-section-subtitle mt-3">Explore the programs learners are choosing most often.</p>
            </div>
            <Link href="/programs" className="text-primary font-semibold hover:text-secondary">
              Explore programs &rarr;
            </Link>
          </div>

          {renderSectionState("courses", courses.length === 0, "No published programs", "Programs will appear here when they are published.", () => void loadSection("/api/programs?limit=6", "courses", setCourses))}
          {sectionStatus.courses === "loaded" && courses.length > 0 ? <Slider {...coursesSettings}>
            {courses.map((item, index) => (
              <div key={`${item.slug ?? item.title ?? index}`}>
                <div className="landing-card landing-card-hover group m-3 mb-10 overflow-hidden relative border border-slate-200 bg-white transition duration-500 hover:-translate-y-2 hover:shadow-[0_30px_80px_rgba(101,86,255,0.18)] hover:bg-slate-50">
                  <div className="relative overflow-hidden">
                    <Image
                      src={`${getImagePrefix()}${item.thumbnail ?? "/images/banner/Hero.png"}`}
                      alt={item.title ?? "Academy program"}
                      width={389}
                      height={262}
                      className="landing-card-image h-56 w-full object-cover transition-transform duration-500 ease-out group-hover:scale-110"
                    />
                    <div className="absolute right-4 bottom-4 rounded-full bg-gradient-to-r from-violet-600 via-fuchsia-500 to-rose-500 px-4 py-3 text-center text-white shadow-xl shadow-violet-400/20 transition duration-500 group-hover:-translate-y-1 group-hover:scale-105">
                      <p className="text-[0.65rem] font-semibold uppercase tracking-[0.18em]">{item.level ?? item.group ?? "Program"}</p>
                    </div>
                  </div>

                  <div className="space-y-5 p-6">
                    <Link href={`/admissions?program=${encodeURIComponent(item.title ?? "")}`} className="text-xl font-semibold text-slate-950 transition-colors duration-300 hover:text-primary">
                      {item.title}
                    </Link>
                    <p className="text-sm text-slate-700">{item.category?.name ?? item.group ?? academy.shortName}</p>

                    <div className="flex items-center justify-between border-b border-slate-100 pb-5">
                      <div>
                        <p className="text-lg font-semibold text-violet-600">4.8</p>
                        {renderStars(4.8)}
                      </div>
                      <p className="text-sm font-semibold text-slate-700">Contact admissions for the fee schedule</p>
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

          {renderSectionState("instructors", instructors.length === 0, "No faculty profiles", "Faculty profiles will appear here when they are published.", () => void loadSection("/api/instructors?limit=6", "instructors", setInstructors))}
          {sectionStatus.instructors === "loaded" && instructors.length > 0 ? <Slider {...mentorSettings}>
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

          {renderSectionState("reviews", reviews.length === 0, "No student reviews", "Student reviews will appear here when they are published.", () => void loadSection("/api/reviews?limit=6", "reviews", setReviews))}
          {sectionStatus.reviews === "loaded" && reviews.length > 0 ? <Slider {...reviewSettings}>
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
                      <p className="text-sm text-slate-600">{item.role ?? "SRA Student"}</p>
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

          {renderSectionState("news", news.length === 0, "No academy news", "News will appear here when it is published.", () => void loadSection("/api/news?limit=3", "news", setNews))}
          {sectionStatus.news === "loaded" && news.length > 0 ? <Slider {...newsSettings}>
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
          {renderSectionState("events", events.length === 0, "No upcoming events", "Upcoming events will appear here when they are published.", () => void loadSection("/api/events?upcoming=true&limit=3", "events", setEvents))}
          {sectionStatus.events === "loaded" && events.length > 0 ? (
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
