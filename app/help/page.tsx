// app/help/page.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import RoleShell from "@/components/RoleShell";

type IconName =
  | "student"
  | "instructor"
  | "dean"
  | "question"
  | "chevron"
  | "lifebuoy"
  | "mail"
  | "phone";

function Icon({ name, className }: { name: IconName; className?: string }) {
  const common = "fill-none stroke-current stroke-[1.8]";
  switch (name) {
    case "student":
      return (
        <svg viewBox="0 0 24 24" className={className}>
          <path className={common} d="M22 10 12 5 2 10l10 5 10-5z" />
          <path className={common} d="M6 12v4c0 2 4 3 6 3s6-1 6-3v-4" />
        </svg>
      );
    case "instructor":
      return (
        <svg viewBox="0 0 24 24" className={className}>
          <circle className={common} cx="7" cy="8" r="3" />
          <path className={common} d="M2 20a6 6 0 0 1 12 0" />
          <path className={common} d="M14 6h8M14 10h6" />
        </svg>
      );
    case "dean":
      return (
        <svg viewBox="0 0 24 24" className={className}>
          <rect className={common} x="4" y="3" width="16" height="18" rx="2" />
          <path className={common} d="M8 7h.01M8 11h.01M8 15h.01M14 7h.01M14 11h.01M14 15h.01" />
        </svg>
      );
    case "question":
      return (
        <svg viewBox="0 0 24 24" className={className}>
          <path className={common} d="M9.5 8a2.5 2.5 0 0 1 5 0c0 2-2.5 2-2.5 4" />
          <path className={common} d="M12 17h.01" />
        </svg>
      );
    case "chevron":
      return (
        <svg viewBox="0 0 24 24" className={className}>
          <path className={common} d="M6 9l6 6 6-6" />
        </svg>
      );
    case "lifebuoy":
      return (
        <svg viewBox="0 0 24 24" className={className}>
          <circle className={common} cx="12" cy="12" r="9" />
          <circle className={common} cx="12" cy="12" r="3" />
          <path className={common} d="M4 12h3M17 12h3M12 4v3M12 17v3" />
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
  }
}

const roles = [
  {
    id: "students",
    icon: "student" as IconName,
    title: "For Students",
    subtitle: "Take exams and view results",
    sections: [
      {
        title: "How Student Access Works",
        steps: [
          "Student accounts are created from the official EDP masterlist, not by self-registration",
          "Wait for your department dean to approve your imported account",
          "After approval, log in using your Student ID as your initial password",
          "Open your profile settings and change your password after your first login",
          "If you are missing from the system, contact your dean or EDP office to verify your masterlist entry",
        ],
      },
      {
        title: "How to Take an Exam",
        steps: [
          "Login and go to your student dashboard",
          "Find the exam under 'Upcoming Exams'",
          "Click 'Take Exam' and read the instructions carefully",
          "Enable your camera and enter fullscreen mode",
          "Answer all questions before the timer runs out",
          "Click 'Submit Exam' to finalize your answers",
        ],
      },
      {
        title: "Notifications",
        steps: [
          "Use the notification bell in the header to see approvals, schedules, and results",
          "Click a notification to open the related page",
          "Mark notifications as read to clear the badge",
        ],
      },
      {
        title: "Anti-Cheating Rules",
        steps: [
          "Camera must remain on throughout the exam",
          "Stay in fullscreen mode at all times",
          "Do not switch tabs or open other windows",
          "Copy and paste are disabled during exams",
          "5 violations result in automatic exam termination",
          "3 terminations result in a permanent block from that exam",
        ],
      },
      {
        title: "Viewing Your Results",
        steps: [
          "Go to your dashboard after submitting",
          "MCQ and identification results are shown instantly",
          "Essay/enumeration questions require manual grading by your instructor",
          "You will receive an email notification when results are published",
          "Use 'Review answers' to view your exam breakdown",
        ],
      },
    ],
  },
  {
    id: "instructors",
    icon: "instructor" as IconName,
    title: "For Instructors",
    subtitle: "Create and manage exams",
    sections: [
      {
        title: "Creating an Exam",
        steps: [
          "Go to your dashboard and click 'Create New Exam'",
          "Fill in exam details: title, subject, date, duration, year level",
          "Add questions manually or import from a CSV file",
          "Questions are automatically shuffled per student",
          "Submit for dean approval",
        ],
      },
      {
        title: "Managing Exams",
        steps: [
          "Edit pending exams before they are approved",
          "View submitted results and grade essay questions manually",
          "Use the analytics page for grade distributions and question difficulty",
          "Export results to CSV for record-keeping",
          "Review student exam photos for identity verification",
          "Extend exam time for specific students when needed",
        ],
      },
      {
        title: "CSV Import Format",
        steps: [
          "Columns required: question, type, options, correct_answer, points",
          "Supported types: multiple_choice, identification, essay, enumeration",
          "For multiple choice, separate options with | (pipe character)",
          "Download the sample template from the dashboard for reference",
        ],
      },
    ],
  },
  {
    id: "deans",
    icon: "dean" as IconName,
    title: "For Deans",
    subtitle: "Approve and monitor",
    sections: [
      {
        title: "Approving Students",
        steps: [
          "Go to the 'Pending Students' tab on your dashboard",
          "Review each imported masterlist account and confirm the Student ID, course, and subject load",
          "Approve individually or use bulk approve for multiple students",
          "Approved students can log in using their Student ID as the initial password",
        ],
      },
      {
        title: "Approving Exams",
        steps: [
          "Go to the 'Pending Exams' tab",
          "Click 'View Details' to review the exam content and questions",
          "Check the list of eligible students for that exam",
          "Approve to publish the exam or reject with a reason",
        ],
      },
      {
        title: "Department Announcements",
        steps: [
          "Create announcements for students and instructors",
          "Manage and delete old announcements from your announcements page",
          "Announcements appear in the student dashboard modal",
        ],
      },
      {
        title: "Monitoring and Analytics",
        steps: [
          "View all approved exams and their current status",
          "Access department-wide exam statistics and pass rates",
          "Review student exam photos for identity verification",
          "Monitor audit logs for security and activity tracking",
        ],
      },
    ],
  },
];

const faqs = [
  {
    q: "Camera not working during exam?",
    a: "Allow camera permissions in your browser settings (click the lock icon in the address bar), then refresh the page. Make sure no other app is using your camera.",
  },
  {
    q: "Forgot your password?",
    a: "Click 'Forgot password?' on the login page, enter your registered email, then verify the OTP code sent to your inbox to reset your password.",
  },
  {
    q: "Account not approved yet?",
    a: "Wait for your department dean to approve your masterlist-based account. Once approved, log in using your Student ID as your initial password, then change it from your profile settings. If it has been more than 2 business days, contact your dean or EDP office directly.",
  },
  {
    q: "Exam terminated unfairly?",
    a: "Contact your instructor immediately with details of what happened. They can review your exam photos and activity log to assess the situation.",
  },
  {
    q: "Can I retake an exam?",
    a: "Retake availability depends on the exam's retake policy set by your instructor. Check the exam details page or contact your instructor.",
  },
  {
    q: "Results not showing after submission?",
    a: "MCQ and identification results appear instantly. Essay or enumeration questions require manual grading by your instructor - you'll be notified by email when done.",
  },
];

export default function Help() {
  const [activeRole, setActiveRole] = useState("students");
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const activeRoleData = roles.find((r) => r.id === activeRole)!;

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
            We're here to help
          </div>
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-semibold tracking-tight leading-tight text-slate-900">
            Help <span className="text-[var(--accent)]">Center</span>
          </h1>
          <p className="mt-4 text-lg text-slate-600 max-w-xl mx-auto leading-relaxed">
            Find step-by-step guides and answers for every role in the SCSIT Online Exam system.
          </p>
        </section>

        <section className="py-8 px-5 sm:px-8 lg:px-12 max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row gap-3 mb-8 justify-center">
            {roles.map((r) => (
              <button
                key={r.id}
                onClick={() => setActiveRole(r.id)}
                className={`flex items-center gap-3 px-5 py-3 rounded-2xl font-semibold text-sm transition-all border ${
                  activeRole === r.id
                    ? "bg-slate-900 text-white border-transparent shadow-lg shadow-slate-900/20"
                    : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
                }`}
              >
                <span className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-white border border-slate-200 text-slate-900">
                  <Icon name={r.icon} className="h-4 w-4" />
                </span>
                <div className="text-left">
                  <div>{r.title}</div>
                  <div className={`text-xs font-normal ${activeRole === r.id ? "text-white/70" : "text-slate-400"}`}>{r.subtitle}</div>
                </div>
              </button>
            ))}
          </div>

          <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
            <div className="h-px bg-[var(--accent)]" />
            <div className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-11 h-11 rounded-full bg-white border border-slate-200 flex items-center justify-center">
                  <Icon name={activeRoleData.icon} className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">{activeRoleData.title}</h2>
                  <p className="text-sm text-slate-500">{activeRoleData.subtitle}</p>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-5">
                {activeRoleData.sections.map((section) => (
                  <div key={section.title} className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
                    <h3 className="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-2">
                      <span className="inline-flex h-2 w-2 rounded-full bg-[var(--accent)]" />
                      {section.title}
                    </h3>
                    <ol className="space-y-2">
                      {section.steps.map((step, i) => (
                        <li key={i} className="flex items-start gap-2.5 text-sm text-slate-600">
                          <span className="mt-0.5 flex-shrink-0 w-5 h-5 rounded-full bg-[var(--accent)] text-white flex items-center justify-center text-[10px] font-bold">
                            {i + 1}
                          </span>
                          {step}
                        </li>
                      ))}
                    </ol>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="py-8 px-5 sm:px-8 lg:px-12 max-w-4xl mx-auto">
          <div className="text-center mb-6">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900">
              Common <span className="text-[var(--accent)]">Issues</span>
            </h2>
            <p className="mt-2 text-slate-500 text-sm">Quick answers to the most frequently asked questions.</p>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <div key={i} className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-slate-50 transition-colors"
                >
                  <span className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                    <Icon name="question" className="h-4 w-4" />
                    {faq.q}
                  </span>
                  <span className={`text-slate-600 transition-transform duration-200 ${openFaq === i ? "rotate-180" : ""}`}>
                    <Icon name="chevron" className="h-4 w-4" />
                  </span>
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-4 text-sm text-slate-600 leading-relaxed border-t border-slate-200 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        <section className="py-8 px-5 sm:px-8 lg:px-12 max-w-4xl mx-auto">
          <div className="bg-white border border-slate-200 rounded-3xl p-8 text-center shadow-sm">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Icon name="lifebuoy" className="h-5 w-5" />
              <span className="text-sm font-semibold text-slate-700">Support</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-semibold text-slate-900 mb-2">Still Need Help?</h2>
            <p className="text-slate-600 mb-5 text-base max-w-md mx-auto">
              Our support team is ready to assist you with any issue.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-5 text-sm text-slate-600">
              <a
                href="https://mail.google.com/mail/?view=cm&to=SCSITonlineexam@gmail.com&su=SCSIT+Online+Exam+Help+Request"
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
            <a
              href="mailto:SCSITonlineexam@gmail.com?subject=SCSIT%20Online%20Exam%20Help%20Request"
              className="inline-flex items-center gap-2 bg-slate-900 text-white font-semibold px-6 py-2.5 rounded-full hover:-translate-y-0.5 transition-all shadow-lg shadow-slate-900/15 text-sm"
            >
              Contact Support
            </a>
          </div>
        </section>

        </RoleShell>
        <Footer />
      </div>
    </div>
  );
}

