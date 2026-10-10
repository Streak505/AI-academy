"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { academy } from "@/config/academy";
import { AcademyMap } from "@/components/Academy/AcademyMap";

const ContactPage = () => {
  const [form, setForm] = useState({ name: "", email: "", phone: "", subject: "", message: "" });
  const [status, setStatus] = useState<{ type: "idle" | "success" | "error"; message: string }>({ type: "idle", message: "" });

  const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setStatus({ type: "idle", message: "" });

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, website: formData.get("website") }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to send your message.");
      }

      setStatus({ type: "success", message: "Your message has been sent successfully. We will get back to you soon." });
      setForm({ name: "", email: "", phone: "", subject: "", message: "" });
    } catch (error) {
      setStatus({
        type: "error",
        message: error instanceof Error ? error.message : "Something went wrong while sending your message.",
      });
    }
  };

  return (
    <main className="bg-slate-50 text-slate-900">
      <section className="bg-slateGray pt-28 pb-20 sm:pt-32 sm:pb-24">
        <div className="container-standard grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div>
            <p className="landing-pill mb-4">Contact</p>
            <h1 className="hero-title text-4xl sm:text-5xl lg:text-6xl">
              Get in touch with our team today.
            </h1>
            <p className="hero-subtitle mt-6 text-slate-700 max-w-2xl">
              Have a question about programs, admissions, or career outcomes? Reach out and we’ll help you find the right next step.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link href="/admissions" className="rounded-full bg-primary px-6 py-3 font-semibold text-white transition hover:bg-secondary no-underline">
                Talk to admissions
              </Link>
              <Link href="/" className="rounded-full border border-slate-300 px-6 py-3 font-semibold text-slate-700 transition hover:border-primary hover:text-primary no-underline">
                Back to home
              </Link>
            </div>
          </div>
          <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-lg">
            <div className="space-y-6">
              <div>
                <p className="text-sm uppercase tracking-[0.28em] text-primary/80">Office</p>
                <h2 className="mt-4 text-3xl font-semibold text-slate-900">{academy.name}</h2>
                <p className="mt-3 text-slate-600 leading-7">
                  {academy.address}
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
                  <p className="font-semibold text-slate-900">Email</p>
                  {academy.email.startsWith("TODO_REPLACE") ? <p className="mt-2 text-slate-600">{academy.email}</p> : <a href={`mailto:${academy.email}`} className="mt-2 block text-slate-600 underline hover:text-primary">{academy.email}</a>}
                </div>
                <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
                  <p className="font-semibold text-slate-900">Phone</p>
                  {academy.phone.startsWith("TODO_REPLACE") ? <p className="mt-2 text-slate-600">{academy.phone}</p> : <a href={`tel:${academy.phone}`} className="mt-2 block text-slate-600 underline hover:text-primary">{academy.phone}</a>}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 sm:py-24">
        <div className="container-standard">
          <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
            <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-lg">
              <h2 className="landing-section-title">Send us a message</h2>
              <form onSubmit={handleSubmit} className="mt-8 space-y-5">
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="text-sm font-medium text-slate-700">Name
                  <input
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    type="text"
                    placeholder="Name"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 outline-none transition focus:border-primary"
                    required
                  />
                  </label>
                  <label className="text-sm font-medium text-slate-700">Email
                  <input
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    type="email"
                    placeholder="Email"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 outline-none transition focus:border-primary"
                    required
                  />
                  </label>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="text-sm font-medium text-slate-700">Phone (optional)
                  <input
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    type="tel"
                    placeholder="Phone"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 outline-none transition focus:border-primary"
                  />
                  </label>
                  <label className="text-sm font-medium text-slate-700">Subject
                  <input
                    name="subject"
                    value={form.subject}
                    onChange={handleChange}
                    type="text"
                    placeholder="Subject"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 outline-none transition focus:border-primary"
                    required
                  />
                  </label>
                </div>
                <label className="block text-sm font-medium text-slate-700">Message
                <textarea
                  name="message"
                  value={form.message}
                  onChange={handleChange}
                  placeholder="Your message"
                  rows={6}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 outline-none transition focus:border-primary"
                  required
                />
                </label>
                <div className="hidden" aria-hidden="true"><label>Leave this field empty<input name="website" tabIndex={-1} autoComplete="off" /></label></div>

                {status.message ? (
                  <div role={status.type === "success" ? "status" : "alert"} className={`rounded-2xl px-4 py-3 text-sm ${status.type === "success" ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>
                    {status.message}
                  </div>
                ) : null}

                <button type="submit" className="inline-flex items-center justify-center rounded-full bg-primary px-8 py-4 text-base font-semibold text-white transition hover:bg-secondary">
                  Send message
                </button>
              </form>
            </div>
            <div className="rounded-[2rem] bg-gradient-to-br from-primary to-secondary p-8 text-white shadow-2xl">
              <p className="text-sm uppercase tracking-[0.3em] text-white/80">Let’s connect</p>
              <h2 className="mt-4 text-3xl font-semibold">Ready to start your journey?</h2>
              <p className="mt-5 text-slate-100 leading-7">
                Our team is available to answer questions about programs, evening schedules, and admissions.
              </p>
              <div className="mt-8 space-y-4 text-sm text-slate-100">
                <div className="rounded-2xl border border-white/20 bg-white/10 p-5 shadow-sm">
                  <p className="font-semibold">Office hours</p>
                  <p className="mt-2">{academy.timing.days}, {academy.timing.from}–{academy.timing.to}</p>
                </div>
                <div className="rounded-2xl border border-white/20 bg-white/10 p-5 shadow-sm">
                  <p className="font-semibold">Support</p>
                  <p className="mt-2">{academy.email}</p>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-10"><AcademyMap /></div>
        </div>
      </section>
    </main>
  );
};

export default ContactPage;
