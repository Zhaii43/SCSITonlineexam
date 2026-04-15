"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

type NavItem = { label: string; href: string };
type NavSection = { title: string; items: NavItem[] };

function SidebarNav({ sections, isActive, onNavigate, storageKey }: {
  sections: NavSection[];
  isActive: (href: string) => boolean;
  onNavigate?: () => void;
  storageKey: string;
}) {
  const [open, setOpen] = useState<Record<string, boolean>>(() => {
    if (typeof window === "undefined")
      return Object.fromEntries(sections.map((s) => [s.title, true]));
    try {
      const saved = localStorage.getItem(`sidebar_sections_${storageKey}`);
      if (saved) return { ...Object.fromEntries(sections.map((s) => [s.title, true])), ...JSON.parse(saved) };
    } catch {}
    return Object.fromEntries(sections.map((s) => [s.title, true]));
  });

  const toggle = (title: string) => {
    setOpen((p) => {
      const next = { ...p, [title]: !p[title] };
      try { localStorage.setItem(`sidebar_sections_${storageKey}`, JSON.stringify(next)); } catch {}
      return next;
    });
  };

  return (
    <nav className="space-y-1 text-sm">
      {sections.map((section) => (
        <div key={section.title}>
          <button
            type="button"
            onClick={() => toggle(section.title)}
            className="flex w-full items-center justify-between px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-sky-200/90 hover:text-white transition-colors"
          >
            {section.title}
            <svg
              className={`h-3 w-3 transition-transform duration-200 ${open[section.title] ? "rotate-180" : ""}`}
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {open[section.title] && (
            <div className="mb-1 space-y-0.5">
              {section.items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onNavigate}
                  className={`flex items-center gap-2.5 rounded-lg px-3 py-2 transition-all ${
                    isActive(item.href)
                      ? "bg-sky-800 text-white font-semibold"
                      : "text-sky-100/80 hover:bg-sky-800/60 hover:text-white"
                  }`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${isActive(item.href) ? "bg-white" : "bg-sky-400/50"}`} />
                  {item.label}
                </Link>
              ))}
            </div>
          )}
        </div>
      ))}
    </nav>
  );
}

function SidebarHeader({ role, onClose }: { role: string; onClose?: () => void }) {
  return (
    <div className="shrink-0 border-b border-sky-800/60 px-5 py-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative h-11 w-11 rounded-xl bg-white/10 p-1.5">
            <Image src="/logo.png" alt="SCSIT Logo" fill className="object-contain" priority />
          </div>
          <div>
            <p className="text-base font-bold text-white">Online Exam</p>
            <p className="text-xs text-sky-300/70">{role}</p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-sky-800 text-sky-300 hover:bg-sky-800"
            aria-label="Close"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
}

function SidebarTip({ text }: { text: string }) {
  return (
    <div className="mt-4 rounded-xl border border-sky-800/60 bg-sky-800/40 px-3 py-3">
      <p className="text-[10px] uppercase tracking-[0.25em] text-sky-400/60">Tip</p>
      <p className="mt-1.5 text-xs leading-relaxed text-sky-100/60">{text}</p>
    </div>
  );
}

function useSidebarLogic(roleKey: string, isRole: boolean) {
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(`sidebar_collapsed_${roleKey}`) === "true";
  });
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const [hash, setHash] = useState("");

  const setCollapsedPersist = (val: boolean | ((p: boolean) => boolean)) => {
    setCollapsed((prev) => {
      const next = typeof val === "function" ? val(prev) : val;
      localStorage.setItem(`sidebar_collapsed_${roleKey}`, String(next));
      return next;
    });
  };

  useEffect(() => {
    const handleToggle = () => {
      if (window.innerWidth < 1024) setMobileOpen((p) => !p);
      else setCollapsedPersist((p) => !p);
    };
    window.addEventListener("toggle-instructor-sidebar", handleToggle as EventListener);
    return () => window.removeEventListener("toggle-instructor-sidebar", handleToggle as EventListener);
  }, []);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setMobileOpen(false));
    return () => window.cancelAnimationFrame(frame);
  }, [pathname]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const w = window.innerWidth >= 1024 && !collapsed && isRole ? 240 : 0;
    window.dispatchEvent(new CustomEvent("instructor-sidebar-width", { detail: { width: w } }));
  }, [collapsed, isRole]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const onResize = () => {
      const w = window.innerWidth >= 1024 && !collapsed && isRole ? 240 : 0;
      window.dispatchEvent(new CustomEvent("instructor-sidebar-width", { detail: { width: w } }));
      if (window.innerWidth >= 1024) setMobileOpen(false);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [collapsed, isRole]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const update = () => setHash(window.location.hash || "");
    update();
    window.addEventListener("hashchange", update);
    return () => window.removeEventListener("hashchange", update);
  }, []);

  const isActive = (href: string) => {
    if (href.startsWith("#")) return hash === href;
    if (href.includes("#")) {
      const [p, h] = href.split("#");
      return pathname === p && hash === `#${h}`;
    }
    return pathname === href && hash === "";
  };

  return { collapsed, mobileOpen, setMobileOpen, isActive };
}

function SidebarShell({
  children, role, sections, tip, collapsed, mobileOpen, onCloseMobile, isActive, storageKey,
}: {
  children: React.ReactNode;
  role: string;
  sections: NavSection[];
  tip: string;
  collapsed: boolean;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  isActive: (href: string) => boolean;
  storageKey: string;
}) {
  return (
    <div className="flex gap-0">
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={onCloseMobile} />
          <aside className="absolute left-0 top-0 flex h-full w-64 flex-col bg-sky-900 text-sky-100 shadow-2xl">
            <SidebarHeader role={role} onClose={onCloseMobile} />
            <div className="ghost-scrollbar flex-1 overflow-y-auto px-3 py-3">
              <SidebarNav sections={sections} isActive={isActive} onNavigate={onCloseMobile} storageKey={storageKey} />
            </div>
          </aside>
        </div>
      )}

      <aside className="hidden shrink-0 lg:block">
        <div className={`fixed left-0 top-0 z-50 flex h-screen flex-col bg-sky-900 text-sky-100 shadow-xl transition-all duration-300 ${collapsed ? "pointer-events-none w-0 opacity-0" : "w-64 opacity-100"}`}>
          <SidebarHeader role={role} />
          <div className="ghost-scrollbar flex-1 overflow-y-auto px-3 py-3">
            <SidebarNav sections={sections} isActive={isActive} storageKey={storageKey} />
            <SidebarTip text={tip} />
          </div>
        </div>
      </aside>

      <div className={`flex-1 min-w-0 transition-[margin] duration-300 ${collapsed ? "lg:ml-0" : "lg:ml-[256px]"}`}>
        {children}
      </div>
    </div>
  );
}

// ─── EDP Shell ────────────────────────────────────────────────────────────────

export function EdpShell({ children }: { children: React.ReactNode }) {
  const isEdp = useSyncExternalStore(
    () => () => {},
    () => window.localStorage.getItem("user_role") === "edp",
    () => false
  );
  const { collapsed, mobileOpen, setMobileOpen, isActive } = useSidebarLogic("edp", isEdp);

  if (!isEdp) return <>{children}</>;

  const sections: NavSection[] = [
    { title: "Overview", items: [{ label: "Dashboard", href: "/dashboard/edp" }] },
    { title: "Masterlist", items: [{ label: "Import CSV", href: "/dashboard/edp#masterlist-import" }] },
    { title: "Account", items: [{ label: "Profile Settings", href: "/profile/settings" }] },
    { title: "Support", items: [
      { label: "Help Center", href: "/help" },
      { label: "Contact", href: "/contact" },
      { label: "Privacy", href: "/privacy" },
      { label: "Terms", href: "/terms" },
    ]},
  ];

  return (
    <SidebarShell
      role="EDP" sections={sections} tip="Use the official CSV format: school_id, email, first_name, last_name, year_level, course, subjects, contact_number."
      collapsed={collapsed} mobileOpen={mobileOpen} onCloseMobile={() => setMobileOpen(false)} isActive={isActive}
      storageKey="edp"
    >
      {children}
    </SidebarShell>
  );
}

// ─── Dean Shell ───────────────────────────────────────────────────────────────

export function DeanShell({ children }: { children: React.ReactNode }) {
  const isDean = useSyncExternalStore(
    () => () => {},
    () => window.localStorage.getItem("user_role") === "dean",
    () => false
  );
  const { collapsed, mobileOpen, setMobileOpen, isActive } = useSidebarLogic("dean", isDean);

  if (!isDean) return <>{children}</>;

  const sections: NavSection[] = [
    { title: "Overview", items: [{ label: "Dashboard", href: "/dashboard/dean" }] },
    { title: "Students", items: [
      { label: "Pending Review", href: "/dashboard/dean#pending-students" },
      { label: "Rejected Students", href: "/dashboard/dean#rejected-students" },
      { label: "Department Users", href: "/dashboard/dean#department-users" },
    ]},
    { title: "Exams", items: [
      { label: "Create Exam", href: "/exam/create" },
      { label: "Exam Statistics", href: "/dashboard/dean/exam-stats" },
    ]},
    { title: "Communication", items: [
      { label: "Announcements", href: "/dashboard/dean/announcements" },
      { label: "Issue Reports", href: "/dashboard/dean/reports" },
    ]},
    { title: "Account", items: [{ label: "Profile Settings", href: "/profile/settings" }] },
    { title: "Support", items: [
      { label: "Help Center", href: "/help" },
      { label: "Contact", href: "/contact" },
      { label: "Privacy", href: "/privacy" },
      { label: "Terms", href: "/terms" },
    ]},
  ];

  return (
    <SidebarShell
      role="Dean" sections={sections} tip="Approve students, then assign subjects to instructors from Department Users."
      collapsed={collapsed} mobileOpen={mobileOpen} onCloseMobile={() => setMobileOpen(false)} isActive={isActive}
      storageKey="dean"
    >
      {children}
    </SidebarShell>
  );
}

// ─── Instructor Shell ─────────────────────────────────────────────────────────

export function InstructorShell({ children }: { children: React.ReactNode }) {
  const [isInstructor, setIsInstructor] = useState(false);
  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setIsInstructor(localStorage.getItem("user_role") === "instructor"));
    return () => window.cancelAnimationFrame(frame);
  }, []);

  const { collapsed, mobileOpen, setMobileOpen, isActive } = useSidebarLogic("instructor", isInstructor);

  if (!isInstructor) return <>{children}</>;

  const sections: NavSection[] = [
    { title: "Overview", items: [{ label: "Dashboard", href: "/dashboard/teacher" }] },
    { title: "Exams", items: [
      { label: "Create Exam", href: "/exam/create" },
      { label: "Published Exams", href: "/dashboard/teacher#my-exams" },
      { label: "Active Sessions", href: "/dashboard/teacher#active-sessions" },
    ]},
    { title: "Communication", items: [
      { label: "Announcements", href: "/dashboard/teacher/announcements" },
      { label: "Issue Reports", href: "/dashboard/teacher/reports" },
    ]},
    { title: "Account", items: [{ label: "Profile Settings", href: "/profile/settings" }] },
    { title: "Support", items: [
      { label: "Help Center", href: "/help" },
      { label: "Contact", href: "/contact" },
      { label: "Privacy", href: "/privacy" },
      { label: "Terms", href: "/terms" },
    ]},
  ];

  return (
    <SidebarShell
      role="Instructor" sections={sections} tip='You can only create exams for subjects assigned by your dean. Use "Eligible Students" to review who can take each exam.'
      collapsed={collapsed} mobileOpen={mobileOpen} onCloseMobile={() => setMobileOpen(false)} isActive={isActive}
      storageKey="instructor"
    >
      {children}
    </SidebarShell>
  );
}

export default InstructorShell;
