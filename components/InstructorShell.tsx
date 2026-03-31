"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

export default function InstructorShell({ children }: { children: React.ReactNode }) {
  const [isInstructor, setIsInstructor] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [sidebarMobileOpen, setSidebarMobileOpen] = useState(false);
  const pathname = usePathname();
  const [hash, setHash] = useState("");

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const role = localStorage.getItem("user_role");
      setIsInstructor(role === "instructor");
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setSidebarMobileOpen(false);
    });
    return () => window.cancelAnimationFrame(frame);
  }, [pathname]);

  useEffect(() => {
    const handleToggle = () => {
      if (window.innerWidth < 1024) {
        setSidebarMobileOpen((prev) => !prev);
      } else {
        setSidebarCollapsed((prev) => !prev);
      }
    };
    window.addEventListener("toggle-instructor-sidebar", handleToggle as EventListener);
    return () => window.removeEventListener("toggle-instructor-sidebar", handleToggle as EventListener);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const isDesktop = window.innerWidth >= 1024;
    const width = isDesktop && !sidebarCollapsed && isInstructor ? 240 : 0;
    window.dispatchEvent(new CustomEvent("instructor-sidebar-width", { detail: { width } }));
  }, [sidebarCollapsed, isInstructor]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleResize = () => {
      const isDesktop = window.innerWidth >= 1024;
      const width = isDesktop && !sidebarCollapsed && isInstructor ? 240 : 0;
      window.dispatchEvent(new CustomEvent("instructor-sidebar-width", { detail: { width } }));
      if (isDesktop) setSidebarMobileOpen(false);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [sidebarCollapsed, isInstructor]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const updateHash = () => setHash(window.location.hash || "");
    updateHash();
    window.addEventListener("hashchange", updateHash);
    return () => window.removeEventListener("hashchange", updateHash);
  }, []);

  const isActive = (href: string) => {
    if (href.startsWith("#")) return hash === href;
    if (href.includes("#")) {
      const [path, h] = href.split("#");
      return pathname === path && hash === `#${h}`;
    }
    if (pathname === href) {
      return hash === "";
    }
    return false;
  };

  const itemClass = (href: string, base = "") =>
    `flex items-center gap-2 rounded-lg px-3 py-2 transition-all ${
      isActive(href) ? "bg-sky-800 text-white font-semibold" : "text-sky-100/80 hover:bg-sky-800 hover:text-white"
    } ${base}`;

  if (!isInstructor) {
    return <>{children}</>;
  }

  return (
    <div className="flex gap-0">
      {sidebarMobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setSidebarMobileOpen(false)} />
          <aside className="absolute left-0 top-0 flex h-full w-72 flex-col overflow-hidden bg-sky-900 text-sky-100 shadow-2xl">
            <div className="shrink-0 border-b border-sky-800/60 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative h-9 w-9 rounded-lg bg-white/10 p-1">
                    <Image src="/logo.png" alt="SCSIT Logo" fill className="object-contain" priority />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">Online Exam</p>
                    <p className="mt-1 text-xs text-sky-200/70">Instructor</p>
                  </div>
                </div>
                <button
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-sky-800 text-sky-200 hover:bg-sky-800"
                  onClick={() => setSidebarMobileOpen(false)}
                  aria-label="Close sidebar"
                >
                  x
                </button>
              </div>
            </div>

            <div className="ghost-scrollbar flex-1 overflow-y-auto px-4 py-3">
              <nav className="space-y-1 text-sm">
                <Link href="/dashboard/teacher" onClick={() => setSidebarMobileOpen(false)} className={itemClass("/dashboard/teacher")}>
                  <span className="h-2 w-2 rounded-full bg-sky-400" />
                  Dashboard
                </Link>
                <Link href="/dashboard/teacher#my-exams" onClick={() => setSidebarMobileOpen(false)} className={itemClass("/dashboard/teacher#my-exams", "mt-3")}>
                  <span className="h-2 w-2 rounded-full bg-sky-400" />
                  My Exams
                </Link>
                <Link href="/dashboard/teacher#active-sessions" onClick={() => setSidebarMobileOpen(false)} className={itemClass("/dashboard/teacher#active-sessions")}>
                  <span className="h-2 w-2 rounded-full bg-sky-400" />
                  Active Sessions & Activity
                </Link>
                <Link href="/exam/create" onClick={() => setSidebarMobileOpen(false)} className={itemClass("/exam/create")}>
                  Create Exam
                </Link>
                <Link href="/dashboard/teacher/announcements" onClick={() => setSidebarMobileOpen(false)} className={itemClass("/dashboard/teacher/announcements")}>
                  Announcements
                </Link>
                <Link href="/dashboard/teacher/reports" onClick={() => setSidebarMobileOpen(false)} className={itemClass("/dashboard/teacher/reports")}>
                  Issue Reports
                </Link>
                <Link href="/profile/settings" onClick={() => setSidebarMobileOpen(false)} className={itemClass("/profile/settings")}>
                  Profile Settings
                </Link>
                <Link href="/privacy" onClick={() => setSidebarMobileOpen(false)} className={itemClass("/privacy")}>
                  Privacy
                </Link>
                <Link href="/terms" onClick={() => setSidebarMobileOpen(false)} className={itemClass("/terms")}>
                  Terms
                </Link>
                <Link href="/help" onClick={() => setSidebarMobileOpen(false)} className={itemClass("/help")}>
                  Help Center
                </Link>
                <Link href="/contact" onClick={() => setSidebarMobileOpen(false)} className={itemClass("/contact")}>
                  Contact
                </Link>
              </nav>
            </div>
          </aside>
        </div>
      )}

      <aside className="hidden shrink-0 lg:block">
        <div
          className={`fixed left-0 top-0 z-50 flex h-screen flex-col overflow-hidden bg-sky-900 p-4 text-sky-100 shadow-xl shadow-sky-900/30 transition-all duration-300 ${
            sidebarCollapsed ? "pointer-events-none w-0 opacity-0" : "w-64 opacity-100"
          }`}
        >
          <div className="shrink-0 border-b border-sky-800/60 px-3 pb-4">
            <div className="flex items-center gap-3">
              <div className="relative h-9 w-9 rounded-lg bg-white/10 p-1">
                <Image src="/logo.png" alt="SCSIT Logo" fill className="object-contain" priority />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Online Exam</p>
                <p className="mt-1 text-xs text-sky-200/70">Instructor</p>
              </div>
            </div>
          </div>

          <div className="ghost-scrollbar mt-3 flex-1 overflow-y-auto pr-1">
            <nav className="space-y-1 text-sm">
              <Link href="/dashboard/teacher" className={itemClass("/dashboard/teacher")}>
                <span className="h-2 w-2 rounded-full bg-sky-400" />
                Dashboard
              </Link>
              <Link href="/dashboard/teacher#my-exams" className={itemClass("/dashboard/teacher#my-exams", "mt-3")}>
                <span className="h-2 w-2 rounded-full bg-sky-400" />
                My Exams
              </Link>
              <Link href="/dashboard/teacher#active-sessions" className={itemClass("/dashboard/teacher#active-sessions")}>
                <span className="h-2 w-2 rounded-full bg-sky-400" />
                Active Sessions & Activity
              </Link>
              <Link href="/exam/create" className={itemClass("/exam/create")}>
                <span className="h-2 w-2 rounded-full bg-sky-400" />
                Create Exam
              </Link>
              <Link href="/dashboard/teacher/announcements" className={itemClass("/dashboard/teacher/announcements")}>
                <span className="h-2 w-2 rounded-full bg-sky-400" />
                Announcements
              </Link>
              <Link href="/dashboard/teacher/reports" className={itemClass("/dashboard/teacher/reports")}>
                <span className="h-2 w-2 rounded-full bg-sky-400" />
                Issue Reports
              </Link>
              <Link href="/profile/settings" className={itemClass("/profile/settings")}>
                <span className="h-2 w-2 rounded-full bg-sky-400" />
                Profile Settings
              </Link>
              <Link href="/privacy" className={itemClass("/privacy")}>
                <span className="h-2 w-2 rounded-full bg-sky-400" />
                Privacy
              </Link>
              <Link href="/terms" className={itemClass("/terms")}>
                <span className="h-2 w-2 rounded-full bg-sky-400" />
                Terms
              </Link>
              <Link href="/help" className={itemClass("/help")}>
                <span className="h-2 w-2 rounded-full bg-sky-400" />
                Help Center
              </Link>
              <Link href="/contact" className={itemClass("/contact")}>
                <span className="h-2 w-2 rounded-full bg-sky-400" />
                Contact
              </Link>
            </nav>

            <div className="mt-4 rounded-xl border border-sky-800/60 bg-sky-800 px-3 py-3">
              <p className="text-[11px] uppercase tracking-[0.3em] text-sky-200/70">Quick Tip</p>
              <p className="mt-2 text-xs text-sky-100/80">Approved exams are read-only. Use &quot;Create Exam&quot; to post a new one.</p>
            </div>
          </div>
        </div>
      </aside>

      <div className={`flex-1 min-w-0 transition-[margin] duration-300 ${sidebarCollapsed ? "lg:ml-0" : "lg:ml-[240px]"}`}>
        {children}
      </div>
    </div>
  );
}
