// app/privacy/page.tsx
"use client";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import RoleShell from "@/components/RoleShell";

type IconName =
  | "file"
  | "settings"
  | "lock"
  | "eye"
  | "scale"
  | "archive"
  | "bell"
  | "mail"
  | "phone"
  | "check";

function Icon({ name, className }: { name: IconName; className?: string }) {
  const common = "fill-none stroke-current stroke-[1.8]";
  switch (name) {
    case "file":
      return (
        <svg viewBox="0 0 24 24" className={className}>
          <path className={common} d="M7 3h8l4 4v14H7z" />
          <path className={common} d="M15 3v5h5" />
        </svg>
      );
    case "settings":
      return (
        <svg viewBox="0 0 24 24" className={className}>
          <circle className={common} cx="12" cy="12" r="3" />
          <path className={common} d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1-1.7 2.9-0.2-.1a1.7 1.7 0 0 0-1.8.3l-.2.2-3.4-2a1.7 1.7 0 0 0 0-1.1l3.4-2 .2.2a1.7 1.7 0 0 0 1.8.3l.2-.1 1.7-2.9-.1-.1a1.7 1.7 0 0 0-.3-1.8l-.2-.2.6-3.9h3.4l.6 3.9-.2.2z" />
        </svg>
      );
    case "lock":
      return (
        <svg viewBox="0 0 24 24" className={className}>
          <rect className={common} x="4" y="11" width="16" height="9" rx="2" />
          <path className={common} d="M8 11V8a4 4 0 0 1 8 0v3" />
        </svg>
      );
    case "eye":
      return (
        <svg viewBox="0 0 24 24" className={className}>
          <path className={common} d="M2 12s4-6 10-6 10 6 10 6-4 6-10 6-10-6-10-6z" />
          <circle className={common} cx="12" cy="12" r="3" />
        </svg>
      );
    case "scale":
      return (
        <svg viewBox="0 0 24 24" className={className}>
          <path className={common} d="M12 3v18" />
          <path className={common} d="M4 6h16" />
          <path className={common} d="M6 6 4 12h6L6 6zM18 6l-2 6h6l-4-6z" />
        </svg>
      );
    case "archive":
      return (
        <svg viewBox="0 0 24 24" className={className}>
          <rect className={common} x="4" y="5" width="16" height="5" />
          <rect className={common} x="6" y="10" width="12" height="9" rx="2" />
          <path className={common} d="M9 14h6" />
        </svg>
      );
    case "bell":
      return (
        <svg viewBox="0 0 24 24" className={className}>
          <path className={common} d="M18 16v-5a6 6 0 0 0-12 0v5l-2 2h16l-2-2z" />
          <path className={common} d="M9 20h6" />
        </svg>
      );
    case "mail":
      return (
        <svg viewBox="0 0 24 24" className={className}>
          <path className={common} d="M4 6h16v12H4z" />
          <path className={common} d="m4 7 8 6 8-6" />
        </svg>
      );
    case "phone":
      return (
        <svg viewBox="0 0 24 24" className={className}>
          <path className={common} d="M6 4h4l2 5-3 2a12 12 0 0 0 6 6l2-3 5 2v4a2 2 0 0 1-2 2C10 22 2 14 2 4a2 2 0 0 1 2-2z" />
        </svg>
      );
    case "check":
      return (
        <svg viewBox="0 0 24 24" className={className}>
          <path className={common} d="M5 13l4 4L19 7" />
        </svg>
      );
  }
}

const sections = [
  {
    icon: "file" as IconName,
    title: "Information We Collect",
    items: [
      {
        label: "Personal Information",
        desc: "Full name, student/instructor ID, email address, academic program/department, role, and authentication credentials collected during registration.",
      },
      {
        label: "Exam and Academic Data",
        desc: "Exam responses, submission timestamps, scores, grades, attempt history, session data, and proctoring information including webcam captures for academic integrity.",
      },
      {
        label: "Technical and Usage Data",
        desc: "IP addresses, browser type, device info, operating system, login times, activity logs, and usage patterns to ensure security and improve performance.",
      },
    ],
  },
  {
    icon: "settings" as IconName,
    title: "How We Use Your Information",
    items: [
      { label: "Platform Operations", desc: "To provide, operate, and maintain the online examination platform and authenticate users." },
      { label: "Academic Administration", desc: "To administer exams, record responses, calculate scores, and generate academic records and performance reports." },
      { label: "Integrity and Security", desc: "To maintain academic integrity, detect potential cheating, and ensure platform security." },
      { label: "Communication", desc: "To notify you about exams, grades, approvals, and system updates via email and in-app notifications." },
    ],
  },
  {
    icon: "lock" as IconName,
    title: "Data Security",
    items: [
      { label: "Encryption", desc: "All data transmitted between your device and our servers is encrypted using SSL/TLS protocols." },
      { label: "Access Controls", desc: "Role-based access restrictions ensure only authorized personnel can view specific data." },
      { label: "Secure Storage", desc: "Data is stored on secure, password-protected servers with regular backups." },
      { label: "Regular Audits", desc: "Security assessments and activity monitoring are conducted on a regular basis." },
    ],
  },
  {
    icon: "eye" as IconName,
    title: "Information Sharing",
    items: [
      { label: "SCSIT Faculty and Administration", desc: "Your academic data and exam results are accessible to your instructors, department deans, and authorized academic staff." },
      { label: "Legal Requirements", desc: "We may disclose information when required by law or to protect the rights and safety of SCSIT and its users." },
      { label: "Academic Integrity", desc: "Information may be shared with integrity committees in cases of suspected violations." },
    ],
  },
];

const rights = [
  "Access and review your personal information and exam records",
  "Request corrections to inaccurate information",
  "Withdraw consent for certain data processing activities",
  "Request a copy of your data in a portable format",
  "Lodge a complaint with relevant data protection authorities",
];

export default function PrivacyPage() {
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
            Privacy <span className="text-[var(--accent)]">Policy</span>
          </h1>
          <p className="mt-4 text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            We are committed to protecting your privacy and ensuring the security of your personal information on the SCSIT Online Exam platform.
          </p>
        </section>

        <section className="py-4 px-5 sm:px-8 lg:px-12 max-w-5xl mx-auto">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center shrink-0">
                <Icon name="file" className="h-5 w-5" />
              </div>
              <p className="text-sm text-slate-600 leading-relaxed">
                At SCSIT Online Exam System, we are committed to protecting your privacy and ensuring the security of your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our online examination platform.
              </p>
            </div>
          </div>
        </section>

        <section className="py-8 px-5 sm:px-8 lg:px-12 max-w-5xl mx-auto space-y-5">
          {sections.map((s) => (
            <div key={s.title} className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
              <div className="h-px bg-[var(--accent)]" />
              <div className="p-6">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center">
                    <Icon name={s.icon} className="h-5 w-5" />
                  </div>
                  <h2 className="text-lg font-semibold text-slate-900">{s.title}</h2>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  {s.items.map((item) => (
                    <div key={item.label} className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
                      <p className="text-sm font-semibold text-slate-800 mb-1">{item.label}</p>
                      <p className="text-sm text-slate-500 leading-relaxed">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}

          <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
            <div className="h-px bg-[var(--accent)]" />
            <div className="p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center">
                  <Icon name="scale" className="h-5 w-5" />
                </div>
                <h2 className="text-lg font-semibold text-slate-900">Your Rights</h2>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {rights.map((r, i) => (
                  <div key={i} className="flex items-start gap-2.5 bg-slate-50 border border-slate-200 rounded-2xl p-3">
                    <span className="mt-0.5 text-slate-900">
                      <Icon name="check" className="h-4 w-4" />
                    </span>
                    <span className="text-sm text-slate-600 leading-relaxed">{r}</span>
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
                    <Icon name="archive" className="h-5 w-5" />
                  </div>
                  <h2 className="text-base font-semibold text-slate-900">Data Retention</h2>
                </div>
                <p className="text-sm text-slate-600 leading-relaxed">
                  We retain your personal information and exam records in accordance with SCSIT&apos;s academic record retention policies. Exam data and grades are retained for the duration of your enrollment and afterward as required by institutional and legal requirements.
                </p>
              </div>
            </div>
            <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
              <div className="h-px bg-[var(--accent)]" />
              <div className="p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 rounded-full bg-white border border-slate-200 flex items-center justify-center">
                    <Icon name="bell" className="h-5 w-5" />
                  </div>
                  <h2 className="text-base font-semibold text-slate-900">Policy Updates</h2>
                </div>
                <p className="text-sm text-slate-600 leading-relaxed">
                  We may update this Privacy Policy from time to time. We will notify you of significant changes by posting the new policy on this page and updating the &ldquo;Last updated&rdquo; date. Continued use of the platform constitutes acceptance of the updated policy.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-3xl p-6 text-center shadow-sm">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Icon name="mail" className="h-5 w-5" />
              <span className="text-sm font-semibold text-slate-700">Questions</span>
            </div>
            <p className="text-sm text-slate-600 mb-3">Contact us and we will be happy to help.</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 text-sm text-slate-600">
              <a
                href="https://mail.google.com/mail/?view=cm&to=SCSITonlineexam@gmail.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 hover:text-slate-900 transition-colors"
              >
                <Icon name="mail" className="h-4 w-4" />
                SCSITonlineexam@gmail.com
              </a>
              <a href="tel:+639515837769" className="flex items-center gap-2 hover:text-slate-900 transition-colors">
                <Icon name="phone" className="h-4 w-4" />
                +63 951 583 7769
              </a>
            </div>
          </div>
        </section>

        </RoleShell>
        <Footer />
      </div>
    </div>
  );
}

