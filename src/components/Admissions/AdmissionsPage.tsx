"use client";

import Link from "next/link";
import { Icon } from "@iconify/react/dist/iconify.js";
import { useState } from "react";

const steps = [
  {
    number: "01",
    title: "Choose your program",
    description: "Pick the track that matches your goals, whether it is AI, data science, or web development.",
  },
  {
    number: "02",
    title: "Submit your application",
    description: "Fill out the online form, share your background, and select your preferred start date.",
  },
  {
    number: "03",
    title: "Start learning",
    description: "Join live sessions, complete project work, and get dedicated mentorship support.",
  },
];

const AdmissionsPage = () => {
  const [form, setForm] = useState({
    applicantName: "",
    email: "",
    phone: "",
    course: "",
    qualification: "",
    city: "",
    message: "",
  });
  const [status, setStatus] = useState<{ type: "idle" | "success" | "error"; message: string }>({
    type: "idle",
    message: "",
  });

  const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus({ type: "idle", message: "" });

    try {
      const response = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to submit application.");
      }

      setStatus({ type: "success", message: "Application submitted successfully. Our admissions team will contact you soon." });
      setForm({
        applicantName: "",
        email: "",
        phone: "",
        course: "",
        qualification: "",
        city: "",
        message: "",
      });
    } catch (error) {
      setStatus({
        type: "error",
        message: error instanceof Error ? error.message : "Something went wrong while submitting your application.",
      });
    }
  };

  return (
    <main className="bg-slate-50 text-slate-900">
      <section className="bg-slateGray pt-28 pb-20 sm:pt-32 sm:pb-24">
        <div className="container-standard grid gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
          <div>
            <p className="landing-pill mb-4">Admissions</p>
            <h1 className="hero-title text-4xl sm:text-5xl lg:text-6xl">
              Start your application and join the next AI cohort.
            </h1>
            <p className="hero-subtitle mt-6 text-slate-700 max-w-2xl">
              We have a simple intake process, flexible start dates, and advisor support to help you enroll in the right program.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link href="/contact" className="rounded-full bg-primary px-6 py-3 font-semibold text-white transition hover:bg-secondary no-underline">
                Talk to admissions
              </Link>
              <Link href="/programs" className="rounded-full border border-slate-300 px-6 py-3 font-semibold text-slate-700 transition hover:border-primary hover:text-primary no-underline">
                View programs
              </Link>
            </div>
          </div>
          <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-lg">
            <div className="space-y-6">
              {steps.map((step) => (
                <div key={step.number} className="group rounded-[1.5rem] border border-slate-200 bg-slate-50 p-6 transition duration-300 hover:-translate-y-1 hover:shadow-lg">
                  <div className="mb-4 flex items-center gap-4">
                    <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-white text-lg font-semibold">
                      {step.number}
                    </span>
                    <h2 className="text-xl font-semibold text-slate-900">{step.title}</h2>
                  </div>
                  <p className="text-slate-600">{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 sm:py-24">
        <div className="container-standard">
          <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="rounded-[2rem] bg-white p-8 shadow-lg">
              <h2 className="landing-section-title">What you need to apply.</h2>
              <ul className="mt-6 space-y-4 text-slate-700">
                <li className="flex items-start gap-3">
                  <Icon icon="solar:check-circle-linear" className="text-primary text-2xl mt-1" />
                  <span>Basic academic history and contact information.</span>
                </li>
                <li className="flex items-start gap-3">
                  <Icon icon="solar:check-circle-linear" className="text-primary text-2xl mt-1" />
                  <span>A short description of your goals and past experience.</span>
                </li>
                <li className="flex items-start gap-3">
                  <Icon icon="solar:check-circle-linear" className="text-primary text-2xl mt-1" />
                  <span>No coding background is required for beginner-friendly tracks.</span>
                </li>
              </ul>
            </div>

            <div className="rounded-[2rem] bg-white p-8 shadow-lg">
              <h2 className="landing-section-title">Apply now</h2>
              <form onSubmit={handleSubmit} className="mt-8 space-y-5">
                <div className="grid gap-4 sm:grid-cols-2">
                  <input name="applicantName" value={form.applicantName} onChange={handleChange} type="text" placeholder="Full name" className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 outline-none transition focus:border-primary" required />
                  <input name="email" value={form.email} onChange={handleChange} type="email" placeholder="Email" className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 outline-none transition focus:border-primary" required />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <input name="phone" value={form.phone} onChange={handleChange} type="tel" placeholder="Phone" className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 outline-none transition focus:border-primary" required />
                  <select name="course" value={form.course} onChange={handleChange} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 outline-none transition focus:border-primary" required>
                    <option value="">Select a program</option>
                    <option value="Artificial Intelligence Essentials">Artificial Intelligence Essentials</option>
                    <option value="Machine Learning Bootcamp">Machine Learning Bootcamp</option>
                    <option value="Python Programming for AI">Python Programming for AI</option>
                    <option value="Data Science with Analytics">Data Science with Analytics</option>
                    <option value="Full Stack Web Development">Full Stack Web Development</option>
                  </select>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <input name="qualification" value={form.qualification} onChange={handleChange} type="text" placeholder="Qualification" className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 outline-none transition focus:border-primary" />
                  <input name="city" value={form.city} onChange={handleChange} type="text" placeholder="City" className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 outline-none transition focus:border-primary" />
                </div>
                <textarea name="message" value={form.message} onChange={handleChange} placeholder="Tell us about your goals" rows={5} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 outline-none transition focus:border-primary" />

                {status.message ? (
                  <div className={`rounded-2xl px-4 py-3 text-sm ${status.type === "success" ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>
                    {status.message}
                  </div>
                ) : null}

                <button type="submit" className="inline-flex items-center justify-center rounded-full bg-primary px-8 py-4 text-base font-semibold text-white transition hover:bg-secondary">
                  Submit application
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};

export default AdmissionsPage;
