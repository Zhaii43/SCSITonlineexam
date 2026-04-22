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
  | "shuffle"
  | "refresh"
  | "building"
  | "bell"
  | "shield";

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
    case "shuffle":
      return (
        <svg viewBox="0 0 24 24" className={className}>
          <path className={common} d="M16 3h5v5M4 20 21 3M21 16v5h-5M15 15l6 6M4 4l5 5" />
        </svg>
      );
    case "refresh":
      return (
        <svg viewBox="0 0 24 24" className={className}>
          <path className={common} d="M23 4v6h-6" />
          <path className={common} d="M1 20v-6h6" />
          <path className={common} d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
        </svg>
      );
    case "building":
      return (
        <svg viewBox="0 0 24 24" className={className}>
          <rect className={common} x="5" y="3" width="14" height="18" rx="2" />
          <path className={common} d="M9 7h.01M9 11h.01M9 15h.01M15 7h.01M15 11h.01M15 15h.01" />
        </svg>
      );
    case "bell":
      return (
        <svg viewBox="0 0 24 24" className={className}>
          <path className={common} d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
          <path className={common} d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
      );
    case "shield":
      return (
        <svg viewBox="0 0 24 24" className={className}>
          <path className={common} d="M12 3 4 6v6c0 5 3.5 7.5 8 9 4.5-1.5 8-4 8-9V6l-8-3z" />
        </svg>
      );
  }
}

const features = [
  {
    icon: "users" as IconName,
    title: "Role-Based Access Control",
    desc: "Four distinct roles — Student, Instructor, Dean, and EDP — each with tailored dashboards and scoped permissions.",
    highlights: ["Student exam dashboard", "Instructor exam authoring", "Dean approval & reports", "EDP enrollment management"],
  },
  {
    icon: "scan" as IconName,
    title: "Photo Proctoring",
    desc: "Periodic photo captures during exams log start, routine checks, and violation events with optional text summaries.",
    highlights: ["Start & periodic captures", "Violation photo logging", "Suspicious activity flags", "Text summary per capture"],
  },
  {
    icon: "zap" as IconName,
    title: "Auto-Grading & Manual Review",
    desc: "MCQ and identification answers are graded instantly on submission. Essay and enumeration questions support instructor manual grading.",
    highlights: ["MCQ & identification auto-grade", "Manual essay grading", "Philippine grading scale (1.00–5.00)", "One-click result publish"],
  },
  {
    icon: "lock" as IconName,
    title: "Anti-Cheating Suite",
    desc: "Multi-layered enforcement including tab-switch detection, copy-paste blocking, fullscreen lock, and a 3-strike termination system.",
    highlights: ["Tab-switch detection", "Copy-paste blocking", "Fullscreen enforcement", "3-strike auto-termination"],
  },
  {
    icon: "bar-chart" as IconName,
    title: "Analytics & Reports",
    desc: "Grade distributions, per-question analysis, pass/fail breakdowns, and violation logs — all exportable as CSV.",
    highlights: ["Grade distribution charts", "Per-question difficulty", "Violation & termination logs", "CSV export"],
  },
  {
    icon: "folder" as IconName,
    title: "Question Bank",
    desc: "Build a reusable question library per subject, import via CSV, and pull questions directly into any exam.",
    highlights: ["Reusable question library", "CSV bulk import", "Bank-to-exam import", "Tag & subject filtering"],
  },
  {
    icon: "shuffle" as IconName,
    title: "Question Pooling & Shuffling",
    desc: "Each student receives a unique randomized question set drawn from a configurable pool, with shuffled answer options.",
    highlights: ["Per-student question pool", "Shuffled answer options", "Unique exam seed per student", "Configurable pool size"],
  },
  {
    icon: "refresh" as IconName,
    title: "Retake Policies",
    desc: "Instructors configure how multiple attempts are handled — keep best score, latest score, or average all attempts.",
    highlights: ["No retake option", "Keep best score", "Keep latest score", "Average all attempts"],
  },
  {
    icon: "building" as IconName,
    title: "Department & Enrollment Management",
    desc: "EDP staff manage official enrollment records and masterlist imports; deans verify student registrations against them.",
    highlights: ["10 department categories", "Masterlist CSV import", "Enrollment record sync", "Subject assignment per instructor"],
  },
  {
    icon: "bell" as IconName,
    title: "Notifications & Announcements",
    desc: "Real-time in-app notifications and targeted announcements keep students and instructors informed at every step.",
    highlights: ["Exam scheduled & approved alerts", "Result published notifications", "Department-targeted announcements", "WebSocket real-time delivery"],
  },
  {
    icon: "shield" as IconName,
    title: "Audit Logging",
    desc: "Every significant action — logins, exam events, approvals, and account changes — is recorded with IP and timestamp.",
    highlights: ["Login & logout tracking", "Exam lifecycle events", "Student approval history", "Password & email change logs"],
  },
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

        <section className="py-8 px-5 sm:px-8 lg:px-12 max-w-7xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900">
              Everything for <span className="text-[var(--accent)]">Secure Exams</span>
            </h2>
            <p className="mt-2 text-slate-500 text-sm max-w-md mx-auto">Eleven core capabilities working together seamlessly.</p>
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
                <Link href="/login" className="inline-flex items-center gap-2 bg-slate-900 text-white font-semibold px-6 py-2.5 rounded-full hover:-translate-y-0.5 transition-all shadow-lg shadow-slate-900/15 text-sm">
                  Sign In
                </Link>
              </div>
            </div>
          </section>
        )}

        <Footer />
      </div>
    </div>
  );
}
