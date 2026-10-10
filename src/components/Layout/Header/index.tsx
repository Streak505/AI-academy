"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { headerData } from "../Header/Navigation/menuData";
import Logo from "./Logo";
import HeaderLink from "../Header/Navigation/HeaderLink";
import MobileHeaderLink from "../Header/Navigation/MobileHeaderLink";
import ThemeToggler from "./ThemeToggler";
import { Icon } from "@iconify/react";

type Account = {
  name: string;
  email: string;
  role: "ADMIN" | "INSTRUCTOR" | "STUDENT" | "PARENT" | "MODERATOR";
  avatar?: string;
};

const roleLinks = {
  STUDENT: [
    ["Profile", "/profile"], ["Student Dashboard", "/student/dashboard"], ["My Courses", "/student/dashboard#courses"],
    ["Settings", "/settings"],
  ],
  INSTRUCTOR: [
    ["Profile", "/profile"], ["Instructor Dashboard", "/instructor/dashboard"], ["My Courses", "/instructor/dashboard#courses"],
    ["Students", "/instructor/dashboard#students"], ["Reviews", "/instructor/dashboard#reviews"], ["Settings", "/settings"],
  ],
  PARENT: [
    ["Profile", "/profile"], ["Parent Dashboard", "/parent/dashboard"], ["Settings", "/settings"],
  ],
  MODERATOR: [
    ["Profile", "/profile"], ["Student Dashboard", "/student/dashboard"], ["Settings", "/settings"],
  ],
  ADMIN: [
    ["Profile", "/profile"], ["Admin Dashboard", "/admin/dashboard"], ["Courses", "/admin/courses"],
    ["Applications", "/admin/applications"], ["Instructors", "/admin/instructors"], ["Reviews", "/admin/reviews"],
    ["News", "/admin/news"], ["Events", "/admin/events"], ["Messages", "/admin/contact"],
  ],
} as const;

const Header: React.FC = () => {
  const [navbarOpen, setNavbarOpen] = useState(false);
  const [sticky, setSticky] = useState(false);
  const [account, setAccount] = useState<Account | null>(null);
  const [accountOpen, setAccountOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const accountMenuRef = useRef<HTMLDivElement>(null);

  const handleScroll = () => {
    setSticky(window.scrollY >= 80);
  };

  const handleClickOutside = (event: MouseEvent) => {
    if (
      mobileMenuRef.current &&
      !mobileMenuRef.current.contains(event.target as Node) &&
      navbarOpen
    ) {
      setNavbarOpen(false);
    }
  };

  useEffect(() => {
    fetch("/api/auth/session", { cache: "no-store" })
      .then((response) => response.json())
      .then((data) => setAccount(data.authenticated ? data.user : null))
      .catch(() => setAccount(null));
  }, [pathname]);

  useEffect(() => {
    window.addEventListener("scroll", handleScroll);
    const handleDocumentClick = (event: MouseEvent) => {
      handleClickOutside(event);
      if (accountMenuRef.current && !accountMenuRef.current.contains(event.target as Node)) setAccountOpen(false);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setNavbarOpen(false);
        setAccountOpen(false);
      }
    };
    document.addEventListener("mousedown", handleDocumentClick);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("scroll", handleScroll);
      document.removeEventListener("mousedown", handleDocumentClick);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [navbarOpen]);

  useEffect(() => {
    document.body.style.overflow = navbarOpen ? "hidden" : "";
  }, [navbarOpen]);

  if (pathname.startsWith("/signin") || pathname.startsWith("/signup") || pathname.startsWith("/admin")) return null;

  const initials = account?.name?.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase() || "SRA";

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setAccount(null);
    setAccountOpen(false);
    router.push("/");
    router.refresh();
  };

  return (
    <header className={`fixed top-0 z-50 w-full border-b transition-all duration-300 ${sticky ? "border-slate-200 bg-white/95 py-3 shadow-sm backdrop-blur dark:border-slate-700 dark:bg-slate-950/85" : "border-transparent bg-white/85 py-4 backdrop-blur dark:border-slate-800 dark:bg-slate-950/75"}`}>
      <div className="mx-auto flex w-full max-w-[1440px] items-center gap-6 px-4 sm:px-6 lg:px-8">
          <Logo />
          <nav className="hidden flex-1 items-center justify-center gap-0.5 2xl:flex">
            {headerData.map((item, index) => (
              <HeaderLink key={index} item={item} />
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <div className="hidden items-center gap-2 xl:flex">
              {account ? (
                <div ref={accountMenuRef} className="relative">
                  <button onClick={() => setAccountOpen((open) => !open)} aria-expanded={accountOpen} aria-haspopup="menu" className="flex items-center gap-2 rounded-full border border-slate-200 bg-white py-1.5 pl-1.5 pr-3 text-sm font-semibold text-slate-700 shadow-sm hover:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
                    {account.avatar ? <img src={account.avatar} alt="" className="h-8 w-8 rounded-full object-cover" /> : <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">{initials}</span>}
                    <span className="max-w-[100px] truncate">{account.name}</span><span aria-hidden="true">⌄</span>
                  </button>
                  {accountOpen && <div role="menu" className="absolute right-0 top-full mt-2 w-56 rounded-xl border border-slate-200 bg-white p-2 shadow-xl dark:border-slate-700 dark:bg-slate-900">
                    {roleLinks[account.role].map(([label, href]) => <Link role="menuitem" key={label} href={href} onClick={() => setAccountOpen(false)} className="no-underline block rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-primary dark:text-slate-200 dark:hover:bg-slate-800">{label}</Link>)}
                    <button onClick={logout} className="mt-1 w-full border-t border-slate-100 px-3 py-2 pt-3 text-left text-sm font-medium text-rose-600 hover:bg-rose-50">Log out</button>
                  </div>}
                </div>
              ) : <Link href="/signin" className="no-underline rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-secondary">Login</Link>}
            </div>
            <div className="hidden lg:block"><ThemeToggler /></div>
            <button
              onClick={() => setNavbarOpen(!navbarOpen)}
              className="rounded-lg p-2 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-primary/30 2xl:hidden"
              aria-label="Toggle mobile menu"
              aria-expanded={navbarOpen}
            >
              <span className="block h-0.5 w-5 bg-slate-900"></span><span className="mt-1.5 block h-0.5 w-5 bg-slate-900"></span><span className="mt-1.5 block h-0.5 w-5 bg-slate-900"></span>
            </button>
          </div>
      </div>
        {navbarOpen && <div className="fixed inset-0 z-40 bg-slate-950/30 2xl:hidden" />}
      <div
          ref={mobileMenuRef}
            className={`fixed right-0 top-0 z-50 h-full w-[min(88vw,380px)] transform bg-white p-6 shadow-2xl transition-transform duration-300 2xl:hidden dark:bg-slate-950 ${navbarOpen ? "translate-x-0" : "translate-x-full"}`}
        >
          <div className="flex items-center justify-between">
              <Logo /><button onClick={() => setNavbarOpen(false)} className="rounded-lg p-2 text-xl hover:bg-slate-100" aria-label="Close menu"><Icon icon="solar:close-circle-linear" className="text-2xl" aria-hidden="true" /></button>
          </div>
          <nav className="mt-8 flex flex-col items-start">
            {headerData.map((item, index) => (
              <MobileHeaderLink key={index} item={item} />
            ))}
            <div className="mt-6 flex w-full flex-col gap-2 border-t border-slate-200 pt-6 dark:border-slate-700">
              {account ? <>{roleLinks[account.role].slice(0, 3).map(([label, href]) => <Link key={label} href={href} onClick={() => setNavbarOpen(false)} className="no-underline rounded-lg border border-slate-200 px-4 py-3 text-center text-sm font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-200">{label}</Link>)}<button onClick={logout} className="rounded-lg bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-600">Log out</button></> : <Link href="/signin" onClick={() => setNavbarOpen(false)} className="no-underline rounded-lg bg-primary px-4 py-3 text-center text-sm font-semibold text-white">Login</Link>}
            </div>
          </nav>
      </div>
    </header>
  );
};

export default Header;
