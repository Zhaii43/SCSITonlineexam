"use client";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import RoleShell from "@/components/RoleShell";

const SCHOOL_ADDRESS = "Salazar Colleges of Science and Institute Of Technology";
const MAP_EMBED_URL = `https://www.google.com/maps?output=embed&q=${encodeURIComponent(SCHOOL_ADDRESS)}`;

type IconName =
  | "map-pin"
  | "mail"
  | "phone"
  | "clock"
  | "graduation-cap"
  | "chalkboard"
  | "building"
  | "map"
  | "life-buoy"
  | "alert"
  | "lightbulb";

function Icon({ name, className }: { name: IconName; className?: string }) {
  const common = "fill-none stroke-current stroke-[1.8]";
  switch (name) {
    case "map-pin":
      return (
        <svg viewBox="0 0 24 24" className={className}>
          <path className={common} d="M12 21s-6-6.5-6-11a6 6 0 1 1 12 0c0 4.5-6 11-6 11z" />
          <circle className={common} cx="12" cy="10" r="2.5" />
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
    case "clock":
      return (
        <svg viewBox="0 0 24 24" className={className}>
          <circle className={common} cx="12" cy="12" r="9" />
          <path className={common} d="M12 7v5l3 2" />
        </svg>
      );
    case "graduation-cap":
      return (
        <svg viewBox="0 0 24 24" className={className}>
          <path className={common} d="M22 10 12 5 2 10l10 5 10-5z" />
          <path className={common} d="M6 12v4c0 2 4 3 6 3s6-1 6-3v-4" />
        </svg>
      );
    case "chalkboard":
      return (
        <svg viewBox="0 0 24 24" className={className}>
          <rect className={common} x="3" y="4" width="18" height="14" rx="2" />
          <path className={common} d="M7 20h10" />
        </svg>
      );
    case "building":
      return (
        <svg viewBox="0 0 24 24" className={className}>
          <rect className={common} x="5" y="3" width="14" height="18" rx="2" />
          <path className={common} d="M9 7h.01M9 11h.01M9 15h.01M15 7h.01M15 11h.01M15 15h.01" />
        </svg>
      );
    case "map":
      return (
        <svg viewBox="0 0 24 24" className={className}>
          <path className={common} d="M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2V6z" />
          <path className={common} d="M9 4v14M15 6v14" />
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
    case "alert":
      return (
        <svg viewBox="0 0 24 24" className={className}>
          <path className={common} d="M12 3 2 20h20L12 3z" />
          <path className={common} d="M12 9v5M12 17h.01" />
        </svg>
      );
    case "lightbulb":
      return (
        <svg viewBox="0 0 24 24" className={className}>
          <path className={common} d="M9 18h6M10 22h4" />
          <path className={common} d="M12 2a7 7 0 0 0-4 12c.7.6 1 1.4 1 2h6c0-.6.3-1.4 1-2a7 7 0 0 0-4-12z" />
        </svg>
      );
  }
}

const contactCards = [
  {
    icon: "map-pin" as IconName,
    title: "Address",
    content: "211 Natalio B. Bacalso Ave, Cebu City, 6000",
    sub: "Salazar Colleges of Science and Institute of Technology",
  },
  {
    icon: "mail" as IconName,
    title: "Email",
    content: "SCSITonlineexam@gmail.com",
    sub: "System support email",
    href: "https://mail.google.com/mail/?view=cm&to=SCSITonlineexam@gmail.com&su=SCSIT+Online+Exam+Inquiry",
  },
  {
    icon: "phone" as IconName,
    title: "Phone",
    content: "+63 951 583 7769",
    sub: "Available during office hours",
    href: "tel:+639515837769",
  },
  {
    icon: "clock" as IconName,
    title: "Office Hours",
    content: "Mon - Sat: 8:00 AM - 5:00 PM",
    sub: "Philippine Standard Time (PST)",
  },
];

const supportRoles = [
  { icon: "graduation-cap" as IconName, role: "For Students", desc: "Contact your instructor or IT support for exam or account issues." },
  { icon: "chalkboard" as IconName, role: "For Instructors", desc: "Reach out to your department dean or system administrator." },
  { icon: "building" as IconName, role: "For Deans", desc: "Contact the IT department for administrative or system-level issues." },
];

export default function Contact() {
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
            Contact the team
          </div>
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-semibold tracking-tight leading-tight text-slate-900">
            Contact <span className="text-[var(--accent)]">Us</span>
          </h1>
          <p className="mt-4 text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Get in touch with the SCSIT Online Exam System team for support, inquiries, or feedback.
          </p>
        </section>

        <section className="py-6 px-5 sm:px-8 lg:px-12 max-w-7xl mx-auto">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {contactCards.map((c) => (
              <div key={c.title} className="group bg-white border border-slate-200 rounded-2xl p-5 shadow-sm transition-all hover:-translate-y-0.5">
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-white text-slate-900 mb-3 border border-slate-200">
                  <Icon name={c.icon} className="h-5 w-5" />
                </div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-[0.3em] mb-1">{c.title}</p>
                {c.href ? (
                  <a
                    href={c.href}
                    target={c.href.startsWith("http") ? "_blank" : undefined}
                    rel="noopener noreferrer"
                    className="text-base font-semibold text-slate-900 hover:text-[var(--accent)] transition-colors block mb-1"
                  >
                    {c.content}
                  </a>
                ) : (
                  <p className="text-base font-semibold text-slate-900 mb-1">{c.content}</p>
                )}
                <p className="text-sm text-slate-500">{c.sub}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="py-6 px-5 sm:px-8 lg:px-12 max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-6">
            <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
              <div className="h-px bg-[var(--accent)]" />
              <div className="p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-9 h-9 bg-white rounded-full flex items-center justify-center border border-slate-200">
                    <Icon name="map" className="h-5 w-5" />
                  </div>
                  <h2 className="text-base font-semibold text-slate-900">Location Map</h2>
                </div>
                <div className="rounded-2xl overflow-hidden border border-slate-200">
                  <iframe
                    src={MAP_EMBED_URL}
                    width="100%"
                    height="380"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
                <div className="h-px bg-[var(--accent)]" />
                <div className="p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-9 h-9 bg-white rounded-full flex items-center justify-center border border-slate-200">
                      <Icon name="life-buoy" className="h-5 w-5" />
                    </div>
                    <h2 className="text-base font-semibold text-slate-900">Technical Support</h2>
                  </div>
                  <div className="space-y-3">
                    {supportRoles.map((r) => (
                      <div key={r.role} className="flex items-start gap-3 bg-slate-50 border border-slate-200 rounded-2xl p-3">
                        <span className="text-slate-900">
                          <Icon name={r.icon} className="h-5 w-5" />
                        </span>
                        <div>
                          <p className="text-sm font-semibold text-slate-800">{r.role}</p>
                          <p className="text-sm text-slate-500 mt-0.5">{r.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <Icon name="alert" className="h-4 w-4" />
                  <span className="text-xs font-semibold text-slate-700">Urgent</span>
                  <div className="h-px flex-1 bg-slate-200" />
                </div>
                <h3 className="text-base font-semibold text-slate-900 mb-1">Emergency Support</h3>
                <p className="text-sm text-slate-500 mb-3">For urgent issues during exams, contact us immediately:</p>
                <div className="space-y-2">
                  <a href="tel:+639515837769" className="flex items-center gap-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-2xl px-4 py-2.5 text-slate-800 text-sm font-semibold transition-all">
                    +63 951 583 7769
                  </a>
                  <a
                    href="https://mail.google.com/mail/?view=cm&to=SCSITonlineexam@gmail.com&su=SCSIT+Online+Exam+Emergency+Support"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-2xl px-4 py-2.5 text-slate-800 text-sm font-semibold transition-all"
                  >
                    SCSITonlineexam@gmail.com
                  </a>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm">
                <div className="flex items-start gap-3">
                  <Icon name="lightbulb" className="h-5 w-5" />
                  <div>
                    <p className="text-sm font-semibold text-slate-800 mb-1">Before Contacting Support</p>
                    <p className="text-sm text-slate-500 leading-relaxed">
                      Check the <a href="/help" className="text-[var(--accent)] hover:underline font-semibold">Help Center</a> first - most common issues are answered there with step-by-step guides for students, instructors, and deans.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="pb-8" />
        </RoleShell>
        <Footer />
      </div>
    </div>
  );
}

