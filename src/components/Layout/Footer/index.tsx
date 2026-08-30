import Link from "next/link";
import Logo from "../Header/Logo";
import { Icon } from "@iconify/react/dist/iconify.js";
import { headerData } from "../Header/Navigation/menuData";

const socialLinks = [
  { label: "Facebook", icon: "tabler:brand-facebook", href: process.env.NEXT_PUBLIC_FACEBOOK_URL },
  { label: "X", icon: "tabler:brand-x", href: process.env.NEXT_PUBLIC_X_URL },
  { label: "Instagram", icon: "tabler:brand-instagram", href: process.env.NEXT_PUBLIC_INSTAGRAM_URL },
];

const footer = () => {
  return (
    <footer className="border-t border-slate-800 bg-slate-950 py-12 text-slate-300 sm:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr_0.8fr_1fr]">
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-xl shadow-slate-950/30">
            <div className="border-l-4 border-amber-400 pl-4"><Logo className="text-white" /><h2 className="mt-2 text-2xl font-bold text-white">Learn. Build. Innovate.</h2></div>
            <p className="mt-5 max-w-sm text-sm leading-7 text-slate-400">Practical AI, programming, and technology education for the next generation of builders.</p>
            <div className="mt-6 flex items-center gap-3">
              {socialLinks.map((social) => social.href ? <a key={social.label} href={social.href} target="_blank" rel="noreferrer" aria-label={social.label} className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-700 bg-slate-950 text-xl text-slate-200 transition hover:border-teal-400 hover:text-teal-300 focus-visible:outline-amber-400"><Icon icon={social.icon} aria-hidden="true" /></a> : <span key={social.label} aria-label={`${social.label} link not configured`} aria-disabled="true" className="flex h-10 w-10 cursor-default items-center justify-center rounded-xl border border-slate-800 bg-slate-950 text-xl text-slate-600"><Icon icon={social.icon} aria-hidden="true" /></span>)}
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
              {[['Courses', '/programs'], ['Faculty', '/faculty'], ['News', '/news'], ['Events', '/events'], ['Admissions', '/admissions']].map(([label, href]) => <li key={href} className="w-fit text-sm text-slate-400 transition hover:text-teal-300"><Link href={href}>{label}</Link></li>)}
            </ul>
          </div>
          <div>
            <h3 className="mb-5 text-sm font-semibold uppercase tracking-[0.2em] text-amber-300">Contact</h3>
            <div className="space-y-5 text-sm"><div className="flex gap-3"><Icon icon="tabler:map-pin" className="mt-0.5 shrink-0 text-xl text-teal-300" aria-hidden="true" /><span className="text-slate-400">Main Campus, Islamabad, Pakistan</span></div><div className="flex gap-3"><Icon icon="tabler:phone" className="mt-0.5 shrink-0 text-xl text-teal-300" aria-hidden="true" /><a href="tel:+9251111222333" className="text-slate-400 transition hover:text-teal-300">+92 51 111 222 333</a></div><div className="flex gap-3"><Icon icon="tabler:mail" className="mt-0.5 shrink-0 text-xl text-teal-300" aria-hidden="true" /><a href="mailto:info@aiacademy.edu.pk" className="text-slate-400 transition hover:text-teal-300">info@aiacademy.edu.pk</a></div></div>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-4 border-t border-slate-800 pt-6 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <h4>© 2026 AI Academy. All rights reserved.</h4>
          <div className="flex gap-5"><Link href="/privacy" className="transition hover:text-teal-300">Privacy policy</Link><Link href="/terms" className="transition hover:text-teal-300">Terms & conditions</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default footer;
