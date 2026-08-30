"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { HeaderItem } from "../../../../types/menu";
import { usePathname } from "next/navigation";

const HeaderLink: React.FC<{ item: HeaderItem }> = ({ item }) => {
  const [submenuOpen, setSubmenuOpen] = useState(false);
  const path = usePathname();
  const [isActive, setIsActive] = useState(false);
  const resolvedHref = item.href.startsWith("/") || item.href.startsWith("#") ? item.href : `/${item.href}`;

  useEffect(() => {
    const isLinkActive =
      path === resolvedHref ||
      (resolvedHref !== "/" && path.startsWith(`${resolvedHref}/`)) ||
      (item.submenu && item.submenu.some((subItem) => path === subItem.href)) ||
      (resolvedHref.startsWith("/#") && path === "/");

    setIsActive(Boolean(isLinkActive));
  }, [path, resolvedHref, item.submenu]);

  const handleMouseEnter = () => {
    if (item.submenu) {
      setSubmenuOpen(true);
    }
  };

  const handleMouseLeave = () => {
    setSubmenuOpen(false);
  };

  return (
    <div
      className="relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <Link
        href={resolvedHref}
        className={`no-underline relative flex items-center gap-1 rounded-lg px-2 py-2 text-sm font-medium transition-all duration-200 ${
          isActive
            ? "text-primary bg-slate-100 shadow-sm after:absolute after:-bottom-1 after:left-3 after:right-3 after:h-0.5 after:rounded-full after:bg-gradient-to-r after:from-primary after:to-secondary"
            : "text-slate-700 hover:text-primary hover:bg-slate-100 dark:hover:bg-slate-800"
        }`}
      >
        {item.label}
        {item.submenu && (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="1em"
            height="1em"
            viewBox="0 0 24 24"
          >
            <path
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.5"
              d="m7 10l5 5l5-5"
            />
          </svg>
        )}
      </Link>

      {submenuOpen && (
        <div
          className="absolute left-0 top-full z-20 mt-2 w-60 rounded-xl bg-white py-2 shadow-xl ring-1 ring-slate-200"
          data-aos="fade-up"
          data-aos-duration="500"
        >
          {item.submenu?.map((subItem, index) => {
            const isSubItemActive = path === subItem.href;
            return (
              <Link
                key={index}
                href={subItem.href}
                className={`no-underline block px-4 py-2.5 text-sm transition duration-200 ${isSubItemActive
                    ? "bg-primary text-white"
                    : "text-slate-700 hover:bg-slate-100 hover:text-primary dark:text-slate-200 dark:hover:bg-slate-900"
                  }`}
              >
                {subItem.label}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default HeaderLink;
