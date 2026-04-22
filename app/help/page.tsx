// app/help/page.tsx
"use client";

import { useState, useEffect } from "react";
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
          "Check your email following confirmation. following your initial login, a temporary password will need to be changed.",
          "Set your password, then log in using your Student ID and new password",
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
          "An email with a link to a temporary password is sent to approved students prior to their initial login.",
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
    a: "Wait for your department dean to approve your masterlist-based account. Once approved, check your email for the reset-password link, set your password, then log in using your Student ID and that password. If it has been more than 2 business days, contact your dean or EDP office directly.",
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

function getRoleId(role: string) {
  if (role === "instructor") return "instructors";
  if (role === "dean") return "deans";
  return "students";
}

function getRoleLabel(roleId: string) {
  if (roleId === "instructors") return "an instructor";
  if (roleId === "deans") return "a dean";
  return "a student";
}

export default function Help() {
  const [activeRole, setActiveRole] = useState("students");
  const [loggedInRoleId, setLoggedInRoleId] = useState<string | null>(null);
  const [isRoleResolved, setIsRoleResolved] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [openGuideSection, setOpenGuideSection] = useState(-1);

  useEffect(() => {
    const role = localStorage.getItem("user_role");
    if (role) {
      const id = getRoleId(role);
      setLoggedInRoleId(id);
      setActiveRole(id);
    }
    setIsRoleResolved(true);
  }, []);

  useEffect(() => {
    setOpenGuideSection(-1);
  }, [activeRole]);

  const visibleRoles = loggedInRoleId ? roles.filter((r) => r.id === loggedInRoleId) : roles;
  const activeRoleData = roles.find((r) => r.id === activeRole)!;
  const roleLabel = loggedInRoleId ? getRoleLabel(loggedInRoleId) : null;
  const heroDescription = !isRoleResolved
    ? "Loading help content..."
    : roleLabel
      ? `Common problems faced as ${roleLabel} when using this system.`
      : "Browse guides and answers for every role in the SCSIT Online Exam system.";
  const faqDescription = !isRoleResolved
    ? "Loading common issues..."
    : roleLabel
      ? `Common problems faced as ${roleLabel} when using this system.`
      : "Quick fixes for the most frequently asked questions.";

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
      {/* Background decorations */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(transparent_23px,rgba(15,23,42,0.05)_24px),linear-gradient(90deg,transparent_23px,rgba(15,23,42,0.05)_24px)] bg-[size:24px_24px]" />
        <div className="absolute -top-40 left-1/2 h-[480px] w-[480px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle_at_center,rgba(14,165,160,0.16),transparent_65%)]" />
      </div>

      <div className="relative">
        <Header />
        <RoleShell>

        {/* Hero */}
        <section className="px-5 sm:px-8 lg:px-12 pt-10 pb-6">
          <div className="max-w-4xl mx-auto text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-1.5 text-[11px] uppercase tracking-[0.3em] text-slate-500">
              We&apos;re here to help
            </div>
            <h1 className="mb-3 text-4xl font-semibold leading-tight tracking-tight text-slate-900 sm:text-5xl">
              Help <span className="text-[var(--accent)]">Center</span>
            </h1>
            <p className="mx-auto max-w-2xl text-base text-slate-600">
              {heroDescription}
            </p>
          </div>
        </section>

        {/* Main content */}
        <div className="mx-auto max-w-6xl space-y-6 px-5 pb-12 sm:px-8 lg:px-12">

          <div className="grid gap-6 lg:grid-cols-2 lg:items-start">

            {/* Common Issues */}
            <section className="rounded-2xl border border-slate-200 bg-white/85 p-4 shadow-sm sm:p-6">
              <h2 className="mb-1 flex items-center gap-2 text-lg font-bold text-slate-900">
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[var(--accent-soft)] text-[var(--accent)]">
                  <Icon name="question" className="h-3.5 w-3.5" />
                </span>
                Common Issues
              </h2>
              <p className="mb-4 text-xs text-slate-500">
                {faqDescription}
              </p>
              <div className="space-y-2.5 lg:max-h-[620px] lg:overflow-y-auto lg:pr-1">
                {faqs.map((faq, i) => (
                  <div key={i} className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                    <button
                      onClick={() => setOpenFaq(openFaq === i ? null : i)}
                      className="flex w-full items-center justify-between px-5 py-4 text-left transition-colors hover:bg-slate-50"
                    >
                      <span className="text-sm font-semibold text-slate-800">{faq.q}</span>
                      <span className={`ml-4 flex-shrink-0 text-slate-400 transition-transform duration-200 ${openFaq === i ? "rotate-180" : ""}`}>
                        <Icon name="chevron" className="h-4 w-4" />
                      </span>
                    </button>
                    {openFaq === i && (
                      <div className="px-5 pb-4 pt-1 text-sm text-slate-600 leading-relaxed border-t border-slate-100">
                        {faq.a}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>

            {/* Role Guide */}
            <section className="rounded-2xl border border-slate-200 bg-white/85 p-4 shadow-sm sm:p-6">
              {!loggedInRoleId && isRoleResolved && (
                <div className="mb-6 flex flex-wrap gap-2">
                  {visibleRoles.map((r) => (
                    <button
                      key={r.id}
                      onClick={() => setActiveRole(r.id)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-sm font-semibold border transition-all ${
                        activeRole === r.id
                          ? "bg-slate-900 text-white border-transparent shadow-lg shadow-slate-900/20"
                          : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
                      }`}
                    >
                      <Icon name={r.icon} className="h-4 w-4" />
                      {r.title}
                    </button>
                  ))}
                </div>
              )}

              <div className="mb-1 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white shadow-sm">
                  <Icon name={activeRoleData.icon} className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">{activeRoleData.title}</h2>
                  <p className="text-xs text-slate-500">{activeRoleData.subtitle}</p>
                </div>
              </div>
              <p className="mb-4 text-xs text-slate-500">Open one topic at a time for a shorter, cleaner guide.</p>

              <div className="space-y-2.5 lg:max-h-[620px] lg:overflow-y-auto lg:pr-1">
                {activeRoleData.sections.map((section, sectionIndex) => (
                  <div key={section.title} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <button
                      onClick={() => setOpenGuideSection(openGuideSection === sectionIndex ? -1 : sectionIndex)}
                      className="flex w-full items-center justify-between px-5 py-4 text-left transition-colors hover:bg-slate-50"
                    >
                      <span className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                        <span className="inline-flex h-2 w-2 rounded-full bg-[var(--accent)]" />
                        {section.title}
                      </span>
                      <span className={`ml-4 flex-shrink-0 text-slate-400 transition-transform duration-200 ${openGuideSection === sectionIndex ? "rotate-180" : ""}`}>
                        <Icon name="chevron" className="h-4 w-4" />
                      </span>
                    </button>
                    {openGuideSection === sectionIndex && (
                      <div className="border-t border-slate-100 px-5 pb-4 pt-3">
                        <ol className="space-y-2.5">
                          {section.steps.map((step, i) => (
                            <li key={i} className="flex items-start gap-3 text-sm text-slate-600">
                              <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-[var(--accent)] text-[10px] font-bold text-white">
                                {i + 1}
                              </span>
                              {step}
                            </li>
                          ))}
                        </ol>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Support */}
          <div className="bg-white/90 border border-slate-200 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-[var(--accent-soft)] flex items-center justify-center">
                <Icon name="lifebuoy" className="h-5 w-5 text-[var(--accent)]" />
              </div>
              <div>
                <p className="font-semibold text-slate-900">Still need help?</p>
                <p className="text-sm text-slate-500 mt-0.5">Our support team is ready to assist you.</p>
                <div className="flex flex-wrap gap-4 mt-3 text-sm text-slate-600">
                  <a
                    href="https://mail.google.com/mail/?view=cm&to=SCSITonlineexam@gmail.com&su=SCSIT+Online+Exam+Help+Request"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 hover:text-slate-900 transition-colors"
                  >
                    <Icon name="mail" className="h-4 w-4" />
                    SCSITonlineexam@gmail.com
                  </a>
                  <a href="tel:+639515837769" className="flex items-center gap-1.5 hover:text-slate-900 transition-colors">
                    <Icon name="phone" className="h-4 w-4" />
                    +63 951 583 7769
                  </a>
                </div>
              </div>
            </div>
            <a
              href="mailto:SCSITonlineexam@gmail.com?subject=SCSIT%20Online%20Exam%20Help%20Request"
              className="flex-shrink-0 inline-flex items-center gap-2 bg-slate-900 text-white font-semibold px-5 py-2.5 rounded-full hover:-translate-y-0.5 transition-all shadow-lg shadow-slate-900/15 text-sm"
            >
              Contact Support
            </a>
          </div>

        </div>
        </RoleShell>
        <Footer />
      </div>
    </div>
  );
}
