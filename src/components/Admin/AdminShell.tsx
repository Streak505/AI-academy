"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Icon } from "@iconify/react";

const navGroups = [
  {
    label: "Overview",
    items: [{ href: "/admin/dashboard", label: "Dashboard", icon: "solar:widget-2-linear" }],
  },
  {
    label: "People & admissions",
    items: [
      { href: "/admin/students", label: "Students", icon: "solar:users-group-rounded-linear" },
      { href: "/admin/applications", label: "Admissions", icon: "solar:document-text-linear" },
      { href: "/admin/instructors", label: "Faculty", icon: "solar:user-id-linear" },
      { href: "/admin/users", label: "Staff & users", icon: "solar:shield-user-linear" },
    ],
  },
  {
    label: "Academy operations",
    items: [
      { href: "/admin/fees", label: "Fees", icon: "solar:bill-list-linear" },
      { href: "/admin/counseling", label: "Counseling", icon: "solar:chat-round-call-linear" },
      { href: "/admin/academic", label: "Academic records", icon: "solar:clipboard-list-linear" },
      { href: "/admin/reports", label: "Reports & analytics", icon: "solar:chart-2-linear" },
    ],
  },
  {
    label: "Website content",
    items: [
      { href: "/admin/programs", label: "Programs", icon: "solar:notebook-linear" },
      { href: "/admin/gallery", label: "Gallery", icon: "solar:gallery-linear" },
      { href: "/admin/csr", label: "CSR initiatives", icon: "solar:hand-heart-linear" },
      { href: "/admin/reviews", label: "Testimonials", icon: "solar:star-linear" },
      { href: "/admin/notices", label: "Notices", icon: "solar:bell-linear" },
      { href: "/admin/news", label: "News", icon: "solar:news-linear" },
      { href: "/admin/contact", label: "Messages", icon: "solar:letter-linear" },
      { href: "/admin/settings", label: "Academy settings", icon: "solar:settings-linear" },
      { href: "/admin/courses", label: "Courses", icon: "solar:notebook-linear" },
      { href: "/admin/categories", label: "Categories", icon: "solar:layers-linear" },
      { href: "/admin/events", label: "Events", icon: "solar:calendar-linear" },
    ],
  },
];

export default function AdminShell({ children, identity, isAdmin }: { children: React.ReactNode; identity: string; isAdmin: boolean }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sessionMessage, setSessionMessage] = useState("");

  useEffect(() => {
    if (pathname === "/admin/login") return;
    let checking = false;
    const checkSession = async () => {
      if (checking || document.visibilityState === "hidden") return;
      checking = true;
      try {
        const session = await fetch("/api/auth/session", { cache: "no-store" });
        if (session.ok) {
          const payload = await session.json();
          if (payload.user?.role === "ADMIN") return;
        }

        const refreshed = await fetch("/api/auth/refresh", { method: "POST", cache: "no-store" });
        if (refreshed.ok) {
          const payload = await refreshed.json();
          if (payload.user?.role === "ADMIN") {
            router.refresh();
            return;
          }
        } else {
          setSessionMessage("Your session has expired. Please sign in again.");
        }
        router.replace("/admin/login");
        router.refresh();
      } catch {
        setSessionMessage("Unable to verify your session. Please sign in again.");
        router.replace("/admin/login");
      } finally {
        checking = false;
      }
    };

    void checkSession();
    const timer = window.setInterval(checkSession, 60_000);
    return () => window.clearInterval(timer);
  }, [isAdmin, pathname, router]);

  const logout = async () => {
    await fetch("/admin/logout", { method: "POST" });
    router.replace("/admin/login");
    router.refresh();
  };

  if (pathname === "/admin/login") return <>{children}</>;

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800">
      <div className="flex min-h-screen">
        <aside className="hidden w-72 shrink-0 border-r border-slate-800 bg-slate-950 p-5 text-white lg:block">
          <div className="mb-8 border-b border-slate-800 pb-6">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-400">Shahzaib Royal Academy</p>
            <h1 className="mt-2 text-2xl font-bold">Control centre</h1>
            <p className="mt-2 text-sm text-slate-400">Manage learning, people, and admissions.</p>
          </div>
          <nav className="space-y-6" aria-label="Admin navigation">
            {navGroups.map((group) => (
              <section key={group.label}>
                <h2 className="mb-2 px-3 text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">{group.label}</h2>
                <div className="space-y-1">
                  {group.items.map((item) => {
                    const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
                    return (
                      <Link key={item.href} href={item.href} aria-current={active ? "page" : undefined}
                        className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${active ? "bg-teal-700 text-white" : "text-slate-400 hover:bg-slate-900 hover:text-white"}`}>
                        <Icon icon={item.icon} className="text-lg" aria-hidden="true" />{item.label}
                      </Link>
                    );
                  })}
                </div>
              </section>
            ))}
          </nav>
        </aside>

        <div className="min-w-0 flex-1">
          <header className="border-b border-slate-200 bg-white px-4 py-3 sm:px-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-700 lg:hidden">Shahzaib Royal Academy</p>
                <p className="text-sm text-slate-600"><span className="font-semibold text-slate-900">Logged in as</span> {identity}</p>
              </div>
              <button type="button" onClick={logout} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:border-rose-300 hover:text-rose-700">
                Log out
              </button>
            </div>
            {sessionMessage ? <p className="mt-2 text-sm text-rose-700" role="alert">{sessionMessage}</p> : null}
          </header>
          <nav className="border-b border-slate-200 bg-white px-3 py-2 lg:hidden" aria-label="Admin navigation">
            <div className="space-y-2">
              {navGroups.map((group) => (
                <div key={group.label}>
                  <p className="mb-1 px-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">{group.label}</p>
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {group.items.map((item) => {
                      const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
                      return <Link key={item.href} href={item.href} aria-current={active ? "page" : undefined}
                        className={`inline-flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold no-underline ${active ? "bg-teal-700 text-white" : "bg-slate-100 text-slate-700"}`}>
                        <Icon icon={item.icon} className="text-base" aria-hidden="true" />{item.label}
                      </Link>;
                    })}
                  </div>
                </div>
              ))}
            </div>
          </nav>
          <div className="min-w-0">{children}</div>
        </div>
      </div>
    </div>
  );
}
