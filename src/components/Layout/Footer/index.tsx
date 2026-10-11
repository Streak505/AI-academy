"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Logo from "../Header/Logo";
import { Icon } from "@iconify/react/dist/iconify.js";
import { headerData } from "../Header/Navigation/menuData";
import type { AcademySettingsValue } from "@/lib/academy-settings";

const footer = ({ initialDetails }: { initialDetails: AcademySettingsValue }) => {
  const [details, setDetails] = useState<AcademySettingsValue>(initialDetails);
  useEffect(() => {
    let active = true;
    const refresh = async () => {
      try {
        const response = await fetch("/api/academy", { cache: "no-store" });
        const payload = await response.json();
        if (!response.ok || !payload.success) throw new Error(payload.message || "Unable to load academy details.");
        if (active) setDetails(payload.data);
      } catch (error) {
        console.error("Unable to refresh academy footer details:", error);
      }
    };
    void refresh();
    const timer = window.setInterval(refresh, 5_000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, []);
  const socialLinks = [
    { label: "Facebook", icon: "tabler:brand-facebook", href: details.socials.facebook },
    { label: "Instagram", icon: "tabler:brand-instagram", href: details.socials.instagram },
    { label: "YouTube", icon: "tabler:brand-youtube", href: details.socials.youtube },
  ];
  const phoneConfigured = Boolean(details.phone);
  const emailConfigured = Boolean(details.email);
  const mapsConfigured = details.mapsLink.startsWith("https://");
  return (
    <footer className="border-t border-slate-800 bg-slate-950 py-12 text-slate-300 sm:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr_0.8fr_1fr]">
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-xl shadow-slate-950/30">
            <div className="border-l-4 border-amber-400 pl-4"><Logo name={details.name} className="text-white" /><h2 className="mt-2 text-2xl font-bold text-white">Learn. Grow. Succeed.</h2></div>
            <p className="mt-5 max-w-sm text-sm leading-7 text-slate-400">{details.tagline}{details.timing.days || details.timing.from || details.timing.to ? ` Evening classes: ${[details.timing.days, [details.timing.from, details.timing.to].filter(Boolean).join("–")].filter(Boolean).join(", ")}.` : ""}</p>
            <div className="mt-6 flex items-center gap-3">
              {socialLinks.map((social) => social.href.startsWith("https://") ? <a key={social.label} href={social.href} target="_blank" rel="noreferrer" aria-label={social.label} className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-700 bg-slate-950 text-xl text-slate-200 transition hover:border-amber-400 hover:text-amber-300 focus-visible:outline-amber-400"><Icon icon={social.icon} aria-hidden="true" /></a> : null)}
            </div>
          </div>
          <div>
            <h3 className="mb-5 text-sm font-semibold uppercase tracking-[0.2em] text-amber-300">Explore</h3>
            <ul className="space-y-3">
              {headerData.map((item, index) => (
                <li key={index} className="w-fit text-sm text-slate-400 transition hover:text-teal-300">
                  <Link href={item.href}>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="mb-5 text-sm font-semibold uppercase tracking-[0.2em] text-amber-300">Quick links</h3>
            <ul className="space-y-3">
              {[["Faculty", "/faculty"], ["Admissions", "/admissions"], ["Contact", "/contact"], ["Login", "/signin"]].map(([label, href]) => <li key={href} className="w-fit text-sm text-slate-400 transition hover:text-amber-300"><Link href={href}>{label}</Link></li>)}
            </ul>
          </div>
          <div>
            <h3 className="mb-5 text-sm font-semibold uppercase tracking-[0.2em] text-amber-300">Contact</h3>
            <div className="space-y-5 text-sm">{details.address ? <div className="flex gap-3"><Icon icon="tabler:map-pin" className="mt-0.5 shrink-0 text-xl text-amber-300" aria-hidden="true" /><span className="text-slate-400">{details.address}</span></div> : null}{phoneConfigured ? <div className="flex gap-3"><Icon icon="tabler:phone" className="mt-0.5 shrink-0 text-xl text-amber-300" aria-hidden="true" /><a href={`tel:${details.phone}`} className="text-slate-400 transition hover:text-amber-300">{details.phone}</a></div> : null}{emailConfigured ? <div className="flex gap-3"><Icon icon="tabler:mail" className="mt-0.5 shrink-0 text-xl text-amber-300" aria-hidden="true" /><a href={`mailto:${details.email}`} className="text-slate-400 transition hover:text-amber-300">{details.email}</a></div> : null}{details.timing.days || details.timing.from || details.timing.to ? <div className="text-slate-400">Hours: {[details.timing.days, [details.timing.from, details.timing.to].filter(Boolean).join("–")].filter(Boolean).join(", ")}</div> : null}{mapsConfigured ? <a href={details.mapsLink} target="_blank" rel="noreferrer" className="inline-block font-semibold text-amber-300 underline">Google Maps</a> : null}</div>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-4 border-t border-slate-800 pt-6 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <h4>© {new Date().getFullYear()} {details.name}. All rights reserved.</h4>
          <div className="flex gap-5"><Link href="/privacy" className="transition hover:text-teal-300">Privacy policy</Link><Link href="/terms" className="transition hover:text-teal-300">Terms & conditions</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default footer;
