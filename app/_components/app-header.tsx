"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavLink = {
  href: string;
  label: string;
};

const adminLinks: NavLink[] = [
  { href: "/admin/dashboard", label: "Dashboard" },
  { href: "/admin/create-quiz", label: "Create Quiz" },
  { href: "/admin/manage-questions", label: "Manage" },
  { href: "/admin/results", label: "Results" },
];

const studentLinks: NavLink[] = [
  { href: "/student/dashboard", label: "Dashboard" },
  { href: "/student/dashboard#available-quizzes", label: "Available Quizzes" },
];

const publicLinks: NavLink[] = [
  { href: "/admin/login", label: "Admin Login" },
  { href: "/student/login", label: "Student Login" },
];

function getPanelLabel(pathname: string) {
  if (pathname.startsWith("/admin")) {
    return "Admin Panel";
  }

  if (pathname.startsWith("/student")) {
    return "Student Panel";
  }

  return "Department Platform";
}

function getNavLinks(pathname: string) {
  if (pathname.startsWith("/admin")) {
    return adminLinks;
  }

  if (pathname.startsWith("/student")) {
    return studentLinks;
  }

  return publicLinks;
}

function isActiveLink(pathname: string, href: string) {
  const [pathOnly] = href.split("#");

  if (pathOnly === "/") {
    return pathname === "/";
  }

  return pathname === pathOnly || pathname.startsWith(`${pathOnly}/`);
}

export function AppHeader() {
  const pathname = usePathname();
  const panelLabel = getPanelLabel(pathname);
  const navLinks = getNavLinks(pathname);

  return (
    <header className="sticky top-0 z-40 border-b border-[#dfe5ec] bg-white/95 text-[#17202a] shadow-sm backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-4 sm:px-8 lg:flex-row lg:items-center lg:justify-between lg:px-10">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
          <Link href="/" className="text-xl font-bold text-[#101828]">
            QuizGuard
          </Link>
          <div className="hidden h-5 w-px bg-[#dfe5ec] sm:block" />
          <p className="text-sm font-medium text-[#475569]">
            Electrical Department, UIT RGPV Bhopal
          </p>
          <span className="inline-flex w-fit rounded-full border border-[#cbd5e1] bg-[#f8fafc] px-3 py-1 text-xs font-semibold text-[#334155]">
            {panelLabel}
          </span>
        </div>

        <nav aria-label="Primary navigation" className="flex flex-wrap gap-2">
          {navLinks.map((link) => {
            const isActive = isActiveLink(pathname, link.href);

            return (
              <Link
                key={link.href}
                href={link.href}
                className={`inline-flex h-10 items-center justify-center rounded-lg px-4 text-sm font-semibold transition ${
                  isActive
                    ? "bg-[#101828] text-white shadow-sm"
                    : "border border-[#dfe5ec] bg-white text-[#334155] hover:border-[#94a3b8] hover:bg-[#f8fafc]"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
