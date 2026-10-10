"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@iconify/react";

const navItems = [
  { href: "/admin/dashboard", label: "Dashboard", icon: "solar:widget-2-linear" },
  { href: "/admin/courses", label: "Courses", icon: "solar:notebook-linear" },
  { href: "/admin/categories", label: "Categories", icon: "solar:layers-linear" },
  { href: "/admin/instructors", label: "Instructors", icon: "solar:users-group-rounded-linear" },
  { href: "/admin/applications", label: "Applications", icon: "solar:document-text-linear" },
  { href: "/admin/events", label: "Events", icon: "solar:calendar-linear" },
  { href: "/admin/news", label: "News", icon: "solar:news-linear" },
  { href: "/admin/contact", label: "Messages", icon: "solar:letter-linear" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800">
      <div className="flex min-h-screen">
        <aside className="hidden w-72 shrink-0 border-r border-slate-800 bg-slate-950 p-5 text-white lg:block">
          <div className="mb-10 border-b border-slate-800 pb-7">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-400">Shahzaib Royal Academy</p>
            <h1 className="mt-2 text-2xl font-bold">Control centre</h1>
            <p className="mt-2 text-sm text-slate-400">Manage learning, people, and admissions.</p>
          </div>

          <nav className="space-y-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                aria-current={pathname.startsWith(item.href) ? "page" : undefined}
                className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition ${pathname.startsWith(item.href) ? "bg-teal-700 text-white shadow-lg shadow-teal-950/30" : "text-slate-400 hover:bg-slate-900 hover:text-white"}`}
              >
                <Icon icon={item.icon} className="text-xl" aria-hidden="true" />
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>

        <div className="min-w-0 flex-1">
          <div className="border-b border-slate-200 bg-white px-4 py-4 lg:hidden">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">Shahzaib Royal Academy</p>
                <p className="font-bold text-slate-950">Control centre</p>
              </div>
              <form action="/logout" method="POST">
                <button type="submit" className="text-sm font-semibold text-slate-600">Log out</button>
              </form>
            </div>
            <nav className="mt-4 flex gap-2 overflow-x-auto pb-1" aria-label="Admin navigation">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={pathname.startsWith(item.href) ? "page" : undefined}
                  className={`inline-flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold no-underline ${pathname.startsWith(item.href) ? "bg-teal-700 text-white" : "bg-slate-100 text-slate-600"}`}
                >
                  <Icon icon={item.icon} className="text-base" aria-hidden="true" />
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="min-w-0">{children}</div>
        </div>
      </div>
    </div>
  );
}
