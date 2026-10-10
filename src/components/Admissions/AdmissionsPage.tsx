"use client";

import Link from "next/link";
import { Icon } from "@iconify/react/dist/iconify.js";
import { useCallback, useEffect, useState } from "react";
import { EmptyState, ErrorState, LoadingState } from "@/components/Common/DataState";

type AdmissionProgram = { _id: string; title: string; slug: string; group: string };

const steps = [
  {
    number: "01",
    title: "Choose your program",
    description: "Choose an academic, career, language, or professional program that matches your goals.",
  },
  {
    number: "02",
    title: "Submit your application",
    description: "Share student and guardian details so our admissions team can guide you.",
  },
  {
    number: "03",
    title: "Start learning",
    description: "Join evening classes and receive focused support from our teaching team.",
  },
];

const AdmissionsPage = () => {
  const [programs, setPrograms] = useState<AdmissionProgram[]>([]);
  const [programStatus, setProgramStatus] = useState<"loading" | "loaded" | "error">("loading");
  const [form, setForm] = useState({
    applicantName: "",
    fatherName: "",
    email: "",
    phone: "",
    guardianName: "",
    dob: "",
    gender: "Other",
    previousSchool: "",
    course: "",
    qualification: "",
    city: "",
    message: "",
  });
  const [status, setStatus] = useState<{ type: "idle" | "success" | "error"; message: string }>({
    type: "idle",
    message: "",
  });

  const loadPrograms = useCallback(async () => {
    setProgramStatus("loading");
    try {
      const response = await fetch("/api/programs?limit=100", { cache: "no-store" });
      const result = await response.json();
      if (!response.ok || !result.success || !Array.isArray(result.data?.items)) {
        throw new Error(result.message || "Unable to load programs.");
      }
      setPrograms(result.data.items);
      setProgramStatus("loaded");
    } catch (error) {
      console.error("Unable to load admission programs:", error);
      setProgramStatus("error");
    }
  }, []);

  useEffect(() => {
    void loadPrograms();
  }, [loadPrograms]);

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
        fatherName: "",
        email: "",
        phone: "",
        guardianName: "",
        dob: "",
        gender: "Other",
        previousSchool: "",
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
              Start your application and join Shahzaib Royal Academy.
            </h1>
            <p className="hero-subtitle mt-6 text-slate-700 max-w-2xl">
              Classes take place Monday through Saturday, 5:00 PM to 8:00 PM. Our team can help you choose the right program.
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
                  <span>Share previous school details and any concession request.</span>
                </li>
              </ul>
            </div>

            <div className="rounded-[2rem] bg-white p-8 shadow-lg">
              <h2 className="landing-section-title">Apply now</h2>
              <form onSubmit={handleSubmit} className="mt-8 space-y-5">
                <div className="grid gap-4 sm:grid-cols-2">
                  <input name="applicantName" value={form.applicantName} onChange={handleChange} type="text" placeholder="Student full name" aria-label="Student full name" className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 outline-none transition focus:border-primary" required />
                  <input name="fatherName" value={form.fatherName} onChange={handleChange} type="text" placeholder="Father's name" aria-label="Father's name" className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 outline-none transition focus:border-primary" required />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <input name="phone" value={form.phone} onChange={handleChange} type="tel" placeholder="Guardian phone" aria-label="Guardian phone" className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 outline-none transition focus:border-primary" required />
                  <input name="email" value={form.email} onChange={handleChange} type="email" placeholder="Guardian email (optional)" aria-label="Guardian email (optional)" className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 outline-none transition focus:border-primary" />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <input name="dob" value={form.dob} onChange={handleChange} type="date" aria-label="Student date of birth" className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 outline-none transition focus:border-primary" />
                  <select name="course" value={form.course} onChange={handleChange} aria-label="Select a program" disabled={programStatus !== "loaded" || programs.length === 0} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 outline-none transition focus:border-primary" required>
                    <option value="">Select a program</option>
                    {programs.map((program) => <option key={program._id} value={program.slug}>{program.title}</option>)}
                  </select>
                </div>
                {programStatus === "loading" ? <LoadingState label="Loading programs" /> : null}
                {programStatus === "error" ? <ErrorState message="Unable to load programs. Please retry before submitting." onRetry={() => void loadPrograms()} /> : null}
                {programStatus === "loaded" && programs.length === 0 ? <EmptyState title="No programs available" message="Admissions are not available until a program is published." /> : null}
                <div className="grid gap-4 sm:grid-cols-2">
                  <input name="previousSchool" value={form.previousSchool} onChange={handleChange} type="text" placeholder="Previous school" aria-label="Previous school" className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 outline-none transition focus:border-primary" />
                  <input name="city" value={form.city} onChange={handleChange} type="text" placeholder="City" aria-label="City" className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 outline-none transition focus:border-primary" />
                </div>
                <textarea name="message" value={form.message} onChange={handleChange} placeholder="Tell us about your goals" aria-label="Tell us about your goals" rows={5} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 outline-none transition focus:border-primary" />

                {status.message ? (
                  <div className={`rounded-2xl px-4 py-3 text-sm ${status.type === "success" ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>
                    {status.message}
                  </div>
                ) : null}

                <button type="submit" disabled={programStatus !== "loaded" || programs.length === 0} className="inline-flex items-center justify-center rounded-full bg-primary px-8 py-4 text-base font-semibold text-white transition hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-50">
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
