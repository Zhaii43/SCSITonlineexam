// app/terms/page.tsx
"use client";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import RoleShell from "@/components/RoleShell";

type IconName =
  | "scale"
  | "user"
  | "cap"
  | "ban"
  | "doc"
  | "laptop"
  | "copyright"
  | "alert"
  | "check";

function Icon({ name, className }: { name: IconName; className?: string }) {
  const common = "fill-none stroke-current stroke-[1.8]";
  switch (name) {
    case "scale":
      return (
        <svg viewBox="0 0 24 24" className={className}>
          <path className={common} d="M12 3v18" />
          <path className={common} d="M4 6h16" />
          <path className={common} d="M6 6 4 12h6L6 6zM18 6l-2 6h6l-4-6z" />
        </svg>
      );
    case "user":
      return (
        <svg viewBox="0 0 24 24" className={className}>
          <circle className={common} cx="12" cy="8" r="3" />
          <path className={common} d="M5 20a7 7 0 0 1 14 0" />
        </svg>
      );
    case "cap":
      return (
        <svg viewBox="0 0 24 24" className={className}>
          <path className={common} d="M22 10 12 5 2 10l10 5 10-5z" />
          <path className={common} d="M6 12v4c0 2 4 3 6 3s6-1 6-3v-4" />
        </svg>
      );
    case "ban":
      return (
        <svg viewBox="0 0 24 24" className={className}>
          <circle className={common} cx="12" cy="12" r="9" />
          <path className={common} d="M6 6l12 12" />
        </svg>
      );
    case "doc":
      return (
        <svg viewBox="0 0 24 24" className={className}>
          <path className={common} d="M7 3h8l4 4v14H7z" />
          <path className={common} d="M15 3v5h5" />
        </svg>
      );
    case "laptop":
      return (
        <svg viewBox="0 0 24 24" className={className}>
          <rect className={common} x="4" y="6" width="16" height="10" rx="1" />
          <path className={common} d="M2 20h20" />
        </svg>
      );
    case "copyright":
      return (
        <svg viewBox="0 0 24 24" className={className}>
          <circle className={common} cx="12" cy="12" r="9" />
          <path className={common} d="M15 9a4 4 0 1 0 0 6" />
        </svg>
      );
    case "alert":
      return (
        <svg viewBox="0 0 24 24" className={className}>
          <path className={common} d="M12 3 2 20h20L12 3z" />
          <path className={common} d="M12 9v5M12 17h.01" />
        </svg>
      );
    case "check":
      return (
        <svg viewBox="0 0 24 24" className={className}>
          <path className={common} d="M20 6 9 17l-5-5" />
        </svg>
      );
  }
}

const sections = [
  {
    icon: "scale" as IconName,
    title: "Acceptance of Terms",
    content:
      "By creating an account and using the SCSIT Online Exam System, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service and our Privacy Policy. These terms apply to all users - students, instructors, and administrative staff.",
  },
  {
    icon: "user" as IconName,
    title: "Account Registration and Use",
    items: [
      {
        label: "Eligibility",
        desc: "You must be a currently enrolled student, instructor, or authorized staff member of SCSIT. Accurate, complete, and current information must be provided during registration.",
      },
      {
        label: "Account Security",
        desc: "You are responsible for maintaining the confidentiality of your credentials. Never share your login information. Notify us immediately of any unauthorized account access.",
      },
      {
        label: "Account Responsibility",
        desc: "You are fully responsible for all activities that occur under your account. SCSIT is not liable for any loss arising from your failure to maintain account security.",
      },
    ],
  },
  {
    icon: "cap" as IconName,
    title: "Academic Integrity",
    rules: [
      "Complete all exams independently unless explicitly authorized to collaborate",
      "Using unauthorized materials, resources, or assistance during exams is strictly prohibited",
      "Accessing exam content before or outside of scheduled exam times is prohibited",
      "Sharing exam questions, answers, or content with others is strictly forbidden",
      "Plagiarism, cheating, or any form of academic dishonesty will result in disciplinary action",
    ],
  },
  {
    icon: "ban" as IconName,
    title: "Prohibited Activities",
    rules: [
      "Attempt to circumvent, disable, or interfere with security features of the platform",
      "Use automated tools, bots, or scripts to access or interact with the system",
      "Attempt to gain unauthorized access to other users' accounts or data",
      "Upload viruses, malware, or any malicious code to the platform",
      "Reverse engineer, decompile, or disassemble any part of the platform",
      "Use the platform for any unlawful purpose or in violation of SCSIT policies",
      "Harass, threaten, or harm other users of the platform",
    ],
  },
];

const examRules = [
  {
    label: "Before Starting",
    desc: "Ensure a stable internet connection and compatible device. Close all unauthorized applications and browser tabs. Position yourself in a well-lit area if proctoring is enabled.",
  },
  {
    label: "During the Exam",
    desc: "Remain in front of your device for the entire exam duration. Do not navigate away from the exam page unless explicitly permitted.",
  },
  {
    label: "Technical Issues",
    desc: "If you experience technical difficulties, immediately contact your instructor or support. Do not refresh or close your browser without authorization.",
  },
  {
    label: "Proctoring Consent",
    desc: "Some exams require webcam monitoring and photo captures. By taking these exams, you consent to this monitoring for academic integrity purposes.",
  },
];

const terminationReasons = [
  "Violation of these Terms of Service",
  "Academic dishonesty or integrity violations",
  "Unauthorized use of the platform",
  "End of enrollment or employment with SCSIT",
];

export default function TermsPage() {
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
        <RoleShell>

        <section className="pt-10 pb-8 px-5 sm:px-8 lg:px-12 max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-1.5 text-[11px] uppercase tracking-[0.3em] text-slate-500 mb-4">
            Last updated: {new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
          </div>
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-semibold tracking-tight leading-tight text-slate-900">
            Terms of <span className="text-[var(--accent)]">Service</span>
          </h1>
          <p className="mt-4 text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            By using the SCSIT Online Exam System, you agree to these terms. Please read them carefully before accessing the platform.
          </p>
        </section>

        <section className="py-6 px-5 sm:px-8 lg:px-12 max-w-5xl mx-auto space-y-5">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center shrink-0">
                <Icon name="doc" className="h-5 w-5" />
              </div>
              <p className="text-sm text-slate-600 leading-relaxed">
                Welcome to the SCSIT Online Exam System. By accessing or using this platform, you agree to be bound by these Terms of Service. If you do not agree with any part of these terms, you may not use the SCSIT Online Exam System.
              </p>
            </div>
          </div>

          {sections.map((s) => (
            <div key={s.title} className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
              <div className="h-px bg-[var(--accent)]" />
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center">
                    <Icon name={s.icon} className="h-5 w-5" />
                  </div>
                  <h2 className="text-lg font-semibold text-slate-900">{s.title}</h2>
                </div>
                {s.content && <p className="text-sm text-slate-600 leading-relaxed">{s.content}</p>}
                {s.items && (
                  <div className="grid sm:grid-cols-3 gap-4">
                    {s.items.map((item) => (
                      <div key={item.label} className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
                        <p className="text-sm font-semibold text-slate-800 mb-1">{item.label}</p>
                        <p className="text-sm text-slate-500 leading-relaxed">{item.desc}</p>
                      </div>
                    ))}
                  </div>
                )}
                {s.rules && (
                  <ul className="space-y-2">
                    {s.rules.map((rule, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-sm text-slate-600">
                        <span className="mt-1 w-2 h-2 shrink-0 rounded-full bg-[var(--accent)]" />
                        {rule}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          ))}

          <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
            <div className="h-px bg-[var(--accent)]" />
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center">
                  <Icon name="laptop" className="h-5 w-5" />
                </div>
                <h2 className="text-lg font-semibold text-slate-900">Exam Conduct and Rules</h2>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                {examRules.map((r) => (
                  <div key={r.label} className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
                    <p className="text-sm font-semibold text-slate-800 mb-1">{r.label}</p>
                    <p className="text-sm text-slate-500 leading-relaxed">{r.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-5">
            <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
              <div className="h-px bg-[var(--accent)]" />
              <div className="p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 rounded-full bg-white border border-slate-200 flex items-center justify-center">
                    <Icon name="copyright" className="h-5 w-5" />
                  </div>
                  <h2 className="text-base font-semibold text-slate-900">Intellectual Property</h2>
                </div>
                <p className="text-sm text-slate-600 leading-relaxed">
                  All content on the SCSIT Online Exam System - including exam questions, course materials, and platform design - is the intellectual property of SCSIT. You may not copy, reproduce, or distribute any content without explicit written permission.
                </p>
              </div>
            </div>
            <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
              <div className="h-px bg-[var(--accent)]" />
              <div className="p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 rounded-full bg-white border border-slate-200 flex items-center justify-center">
                    <Icon name="alert" className="h-5 w-5" />
                  </div>
                  <h2 className="text-base font-semibold text-slate-900">Account Termination</h2>
                </div>
                <ul className="space-y-1.5">
                  {terminationReasons.map((r, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                      <span className="mt-1 w-1.5 h-1.5 shrink-0 rounded-full bg-[var(--accent)]" />
                      {r}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-3xl p-6 text-center shadow-sm">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Icon name="check" className="h-5 w-5" />
              <span className="text-sm font-semibold text-slate-700">Acknowledgment</span>
            </div>
            <p className="text-sm text-slate-600 max-w-xl mx-auto">
              By using the SCSIT Online Exam System, you acknowledge that you have read these Terms of Service, understand them, and agree to be bound by them.
            </p>
          </div>
        </section>

        </RoleShell>
        <Footer />
      </div>
    </div>
  );
}

