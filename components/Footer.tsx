// components/Footer.tsx
"use client";

import { useState, useEffect, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

export default function Footer() {
  const isLoggedIn = useSyncExternalStore(
    () => () => {},
    () => !!window.localStorage.getItem("access_token"),
    () => false
  );
  const userRole = useSyncExternalStore(
    () => () => {},
    () => window.localStorage.getItem("user_role") || "",
    () => ""
  );
  const usesSidebarChromeRole = userRole === "instructor" || userRole === "dean" || userRole === "edp";
  const [sidebarWidth, setSidebarWidth] = useState(() =>
    typeof window !== "undefined" &&
    window.innerWidth >= 1024 &&
    ["instructor", "dean", "edp"].includes(window.localStorage.getItem("user_role") || "")
      ? 240
      : 0
  );
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.innerWidth < 1024 || !usesSidebarChromeRole) {
      setSidebarWidth(0);
      return;
    }
    setSidebarWidth(240);
  }, [usesSidebarChromeRole]);

  useEffect(() => {
    const handleWidth = (event: Event) => {
      const detail = (event as CustomEvent).detail;
      if (detail && typeof detail.width === "number") {
        setSidebarWidth(detail.width);
      }
    };
    window.addEventListener("instructor-sidebar-width", handleWidth as EventListener);
    const handleResize = () => {
      if (window.innerWidth < 1024) setSidebarWidth(0);
    };
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("instructor-sidebar-width", handleWidth as EventListener);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const getDashboardLink = () => {
    if (userRole === "student") return "/dashboard/student";
    if (userRole === "instructor") return "/dashboard/teacher";
    if (userRole === "dean") return "/dashboard/dean";
    if (userRole === "edp") return "/dashboard/edp";
    return "/dashboard";
  };
  const dashboardChromeRoutes = [
    "/dashboard/teacher",
    "/exam/create",
    "/exam/questions",
    "/exam/",
    "/profile/settings",
    "/help",
    "/privacy",
    "/terms",
    "/contact",
    "/dashboard/dean",
    "/dashboard/dean/students",
    "/dashboard/dean/announcements",
    "/dashboard/edp",
  ];
  const useDashboardChrome =
    usesSidebarChromeRole &&
    pathname &&
    dashboardChromeRoutes.some((route) => pathname.startsWith(route));

  return (
    <footer
      className="relative overflow-hidden border-t border-slate-200 bg-white transition-[padding] duration-300"
      style={{
        paddingLeft: useDashboardChrome ? sidebarWidth : 0,
      }}
    >
      <div className="absolute inset-0 bg-[linear-gradient(transparent_23px,rgba(15,23,42,0.04)_24px),linear-gradient(90deg,transparent_23px,rgba(15,23,42,0.04)_24px)] bg-[size:24px_24px]" />
      <div className="absolute -top-24 right-10 h-44 w-44 rounded-full bg-[radial-gradient(circle_at_center,rgba(14,165,160,0.18),transparent_65%)]" />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-10 py-7 sm:py-9">
        <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_auto] gap-6 items-center">
          <div className="min-w-0 flex flex-col items-center lg:items-start text-center lg:text-left gap-3">
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 min-w-0">
              <div className="relative h-10 w-10 rounded-full border border-slate-200 bg-white p-2 shadow-sm">
                <Image
                  src="/logo.png"
                  alt="SCSIT Logo"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
              <div>
                <p className="text-base sm:text-lg font-semibold text-slate-900 tracking-tight break-words">SCSIT Online Exam</p>
                <p className="text-xs sm:text-sm text-slate-500 break-words">Secure. Simple. Scalable.</p>
              </div>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 font-medium">
              (c) {new Date().getFullYear()} SCSIT. All rights reserved.
            </p>
          </div>

          <div className="flex flex-wrap justify-center lg:justify-end gap-x-5 gap-y-2 text-xs sm:text-sm font-semibold text-slate-600">
            {isLoggedIn && (
              <Link href={getDashboardLink()} className="hover:text-slate-900 transition-colors">
                Dashboard
              </Link>
            )}
            <Link href="/privacy" className="hover:text-slate-900 transition-colors">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-slate-900 transition-colors">
              Terms
            </Link>
            <Link href="/contact" className="hover:text-slate-900 transition-colors">
              Contact
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

