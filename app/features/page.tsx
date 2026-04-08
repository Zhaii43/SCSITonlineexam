// app/features/page.tsx
"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import Header from "../../components/Header";
import Footer from "../../components/Footer";

type IconName =
  | "users"
  | "scan"
  | "zap"
  | "lock"
  | "bar-chart"
  | "folder"
  | "key"
  | "check"
  | "building"
  | "clipboard"
  | "activity"
  | "life-buoy";

function Icon({ name, className }: { name: IconName; className?: string }) {
  const common = "fill-none stroke-current stroke-[1.8]";
  switch (name) {
    case "users":
      return (
        <svg viewBox="0 0 24 24" className={className}>
          <path className={common} d="M16 11a4 4 0 1 0-8 0" />
          <path className={common} d="M4 20a8 8 0 0 1 16 0" />
        </svg>
      );
    case "scan":
      return (
        <svg viewBox="0 0 24 24" className={className}>
          <path className={common} d="M4 7V5a1 1 0 0 1 1-1h2M20 7V5a1 1 0 0 0-1-1h-2M4 17v2a1 1 0 0 0 1 1h2M20 17v2a1 1 0 0 1-1 1h-2" />
          <circle className={common} cx="12" cy="12" r="3.5" />
        </svg>
      );
    case "zap":
      return (
        <svg viewBox="0 0 24 24" className={className}>
          <path className={common} d="M13 2 3 14h7l-1 8 10-12h-7l1-8z" />
        </svg>
      );
    case "lock":
      return (
        <svg viewBox="0 0 24 24" className={className}>
          <rect className={common} x="4" y="11" width="16" height="9" rx="2" />
          <path className={common} d="M8 11V8a4 4 0 0 1 8 0v3" />
        </svg>
      );
    case "bar-chart":
      return (
        <svg viewBox="0 0 24 24" className={className}>
          <path className={common} d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
        </svg>
      );
    case "folder":
      return (
        <svg viewBox="0 0 24 24" className={className}>
          <path className={common} d="M3 6h6l2 2h10v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        </svg>
      );
    case "key":
      return (
        <svg viewBox="0 0 24 24" className={className}>
          <circle className={common} cx="8" cy="12" r="3" />
          <path className={common} d="M11 12h10l-2 2 2 2" />
        </svg>
      );
    case "check":
      return (
        <svg viewBox="0 0 24 24" className={className}>
          <path className={common} d="M20 6 9 17l-5-5" />
        </svg>
      );
    case "building":
      return (
        <svg viewBox="0 0 24 24" className={className}>
          <rect className={common} x="5" y="3" width="14" height="18" rx="2" />
          <path className={common} d="M9 7h.01M9 11h.01M9 15h.01M15 7h.01M15 11h.01M15 15h.01" />
        </svg>
      );
    case "clipboard":
      return (
        <svg viewBox="0 0 24 24" className={className}>
          <rect className={common} x="6" y="4" width="12" height="16" rx="2" />
          <path className={common} d="M9 4h6v3H9z" />
        </svg>
      );
    case "activity":
      return (
        <svg viewBox="0 0 24 24" className={className}>
          <path className={common} d="M3 12h4l2-5 4 10 2-5h6" />
        </svg>
      );
    case "life-buoy":
      return (
        <svg viewBox="0 0 24 24" className={className}>
          <circle className={common} cx="12" cy="12" r="9" />
          <circle className={common} cx="12" cy="12" r="3" />
          <path className={common} d="M4 12h3M17 12h3M12 4v3M12 17v3" />
        </svg>
      );
  }
}

const features = [
  {
    icon: "users" as IconName,
    title: "Role-Based Access Control",
    desc: "Three distinct roles with tailored dashboards and permissions - students, instructors, and deans each get exactly what they need.",
    highlights: ["Student exam dashboard", "Instructor exam creation", "Dean approval workflow", "Department-based filtering"],
  },
  {
    icon: "scan" as IconName,
    title: "Live AI Proctoring",
    desc: "Real-time face detection monitors students throughout the exam, capturing photos and flagging suspicious behavior automatically.",
    highlights: ["Face detection monitoring", "Periodic photo capture", "Violation photo logging", "Identity verification"],
  },
  {
    icon: "zap" as IconName,
    title: "Instant Auto-Grading",
    desc: "MCQ and identification questions are graded the moment a student submits. Essay and enumeration support manual grading by instructors.",
    highlights: ["MCQ auto-grading", "Identification matching", "Manual essay grading", "One-click result publish"],
  },
  {
    icon: "lock" as IconName,
    title: "Anti-Cheating Suite",
    desc: "Multi-layered protection including tab-switch detection, copy-paste blocking, fullscreen enforcement, and violation logging.",
    highlights: ["Tab-switch detection", "Copy-paste blocking", "Fullscreen enforcement", "3-strike termination system"],
  },
  {
    icon: "bar-chart" as IconName,
    title: "Rich Analytics",
    desc: "Detailed grade distributions, per-question difficulty analysis, student performance trends, and exportable CSV reports.",
    highlights: ["Grade distribution charts", "Per-question analysis", "Pass/fail statistics", "CSV export"],
  },
  {
    icon: "folder" as IconName,
    title: "Question Bank",
    desc: "Build reusable question banks, import questions via CSV, randomize per session, and import directly into any exam.",
    highlights: ["Reusable question library", "CSV bulk import", "Bank-to-exam import", "Search & filter questions"],
  },
  {
    icon: "key" as IconName,
    title: "OTP Verification",
    desc: "Secure email-based credential flows help approved users activate access and recover passwords safely.",
    highlights: ["Password setup email", "Password reset OTP", "Secure token handling", "Approved-user access only"],
  },
  {
    icon: "check" as IconName,
    title: "Dean Approval Workflow",
    desc: "All exams go through a dean approval process before students can access them, ensuring quality and academic integrity.",
    highlights: ["Pending exam review queue", "Approve or reject exams", "Eligible student preview", "Approval notifications"],
  },
  {
    icon: "building" as IconName,
    title: "Department Management",
    desc: "Organize users and exams by department and year level, with support for 8 departments and cross-department subjects.",
    highlights: ["8 department categories", "Year level targeting", "ALL year level option", "Department-scoped analytics"],
  },
];

const highlights = [
  { icon: "clipboard" as IconName, value: "5,000+", label: "Exams Conducted" },
  { icon: "users" as IconName, value: "100+", label: "Active Users" },
  { icon: "activity" as IconName, value: "90%", label: "Uptime" },
  { icon: "life-buoy" as IconName, value: "24/7", label: "Support" },
];

export default function Features() {
  const isLoggedIn = useSyncExternalStore(
    () => () => {},
    () => !!window.localStorage.getItem("access_token"),
    () => false
  );

  return (
    <div
      className="min-h-screen bg-[var(--paper)] text-[var(--ink)] overflow-x-hidden"
      style={{
        "--paper": "#c7def6",
        "--ink": "#0f172a",
        "--accent": "#0ea5a0",
        "--accent-soft": "#d9f5f3",
      } as React.CSSProperties}
    >
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(transparent_23px,rgba(15,23,42,0.05)_24px),linear-gradient(90deg,transparent_23px,rgba(15,23,42,0.05)_24px)] bg-[size:24px_24px]" />
        <div className="absolute -top-40 left-1/2 h-[480px] w-[480px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle_at_center,rgba(14,165,160,0.16),transparent_65%)]" />
      </div>

      <div className="relative">
        <Header />

        <section className="pt-10 pb-8 px-5 sm:px-8 lg:px-12 max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-1.5 text-[11px] uppercase tracking-[0.3em] text-slate-500 mb-4">
            Everything you need in one platform
          </div>
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-semibold tracking-tight leading-tight text-slate-900">
            Powerful Features <span className="text-[var(--accent)]">Built for Success</span>
          </h1>
          <p className="mt-4 text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            A complete examination ecosystem - from creation to results - with security, intelligence, and simplicity at every step.
          </p>
        </section>

        <section className="py-6 px-5 sm:px-8 lg:px-12 max-w-5xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {highlights.map((s) => (
              <div key={s.label} className="bg-white border border-slate-200 rounded-2xl p-4 text-center shadow-sm transition-all hover:-translate-y-0.5">
                <div className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-white text-slate-900 mb-2 border border-slate-200">
                  <Icon name={s.icon} className="h-5 w-5" />
                </div>
                <div className="text-3xl font-semibold text-slate-900">{s.value}</div>
                <p className="text-sm text-slate-500 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="py-8 px-5 sm:px-8 lg:px-12 max-w-7xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900">
              Everything for <span className="text-[var(--accent)]">Secure Exams</span>
            </h2>
            <p className="mt-2 text-slate-500 text-sm max-w-md mx-auto">Nine core capabilities working together seamlessly.</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f) => (
              <div key={f.title} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm transition-all hover:-translate-y-0.5">
                <div className="inline-flex items-center justify-center w-11 h-11 rounded-full bg-white text-slate-900 text-xs font-semibold mb-3 border border-slate-200">
                  <Icon name={f.icon} className="h-5 w-5" />
                </div>
                <h3 className="text-base font-semibold text-slate-900 mb-1.5">{f.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed mb-3">{f.desc}</p>
                <ul className="space-y-1.5 border-t border-slate-200 pt-3">
                  {f.highlights.map((h) => (
                    <li key={h} className="flex items-center gap-2 text-sm text-slate-600">
                      <span className="inline-flex h-2 w-2 rounded-full bg-[var(--accent)]" />
                      {h}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {!isLoggedIn && (
          <section className="py-10 px-5 sm:px-8 lg:px-12 max-w-4xl mx-auto">
            <div className="relative bg-white border border-slate-200 rounded-3xl p-8 text-center shadow-sm overflow-hidden">
              <div className="absolute inset-x-8 top-0 h-px bg-[var(--accent)]" />
              <div className="relative">
                <div className="text-xs uppercase tracking-[0.35em] text-slate-500 mb-3">Launch</div>
                <h2 className="text-2xl sm:text-3xl font-semibold text-slate-900 mb-2">Ready to Get Started?</h2>
                <p className="text-slate-600 mb-5 text-base max-w-md mx-auto">
                  Join the SCSIT examination portal and experience all these features today.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                  <Link href="/login" className="inline-flex items-center gap-2 bg-slate-900 text-white font-semibold px-6 py-2.5 rounded-full hover:-translate-y-0.5 transition-all shadow-lg shadow-slate-900/15 text-sm">
                    Open Login
                  </Link>
                  <Link href="/contact" className="inline-flex items-center gap-2 bg-white border border-slate-300 text-slate-700 font-semibold px-6 py-2.5 rounded-full hover:border-slate-400 transition-all text-sm">
                    Contact Sales
                  </Link>
                </div>
              </div>
            </div>
          </section>
        )}

        <Footer />
      </div>
    </div>
  );
}

