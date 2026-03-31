// app/about/page.tsx
"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import Image from "next/image";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

type IconName =
  | "shield"
  | "teacher"
  | "rocket"
  | "globe"
  | "target"
  | "book"
  | "flag"
  | "spark"
  | "clipboard"
  | "users"
  | "activity"
  | "life-buoy";

function Icon({ name, className }: { name: IconName; className?: string }) {
  const common = "fill-none stroke-current stroke-[1.8]";
  switch (name) {
    case "shield":
      return (
        <svg viewBox="0 0 24 24" className={className}>
          <path className={common} d="M12 3 4 6v6c0 5 3.5 7.5 8 9 4.5-1.5 8-4 8-9V6l-8-3z" />
        </svg>
      );
    case "teacher":
      return (
        <svg viewBox="0 0 24 24" className={className}>
          <circle className={common} cx="8" cy="8" r="3" />
          <path className={common} d="M2 20a6 6 0 0 1 12 0" />
          <path className={common} d="M14 6h8M14 10h6" />
        </svg>
      );
    case "rocket":
      return (
        <svg viewBox="0 0 24 24" className={className}>
          <path className={common} d="M12 2c3 1 6 4 7 7l-6 6-5-5 4-8z" />
          <path className={common} d="M7 14l-3 6 6-3" />
        </svg>
      );
    case "globe":
      return (
        <svg viewBox="0 0 24 24" className={className}>
          <circle className={common} cx="12" cy="12" r="9" />
          <path className={common} d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18" />
        </svg>
      );
    case "target":
      return (
        <svg viewBox="0 0 24 24" className={className}>
          <circle className={common} cx="12" cy="12" r="9" />
          <circle className={common} cx="12" cy="12" r="4" />
          <path className={common} d="M12 8v-5" />
        </svg>
      );
    case "book":
      return (
        <svg viewBox="0 0 24 24" className={className}>
          <path className={common} d="M4 5h12a3 3 0 0 1 3 3v11H7a3 3 0 0 0-3 3V5z" />
          <path className={common} d="M7 19h12" />
        </svg>
      );
    case "flag":
      return (
        <svg viewBox="0 0 24 24" className={className}>
          <path className={common} d="M4 3v18" />
          <path className={common} d="M4 4h10l-2 3 2 3H4" />
        </svg>
      );
    case "spark":
      return (
        <svg viewBox="0 0 24 24" className={className}>
          <path className={common} d="M12 2l2.5 6L21 10l-6.5 2L12 22l-2.5-10L3 10l6.5-2L12 2z" />
        </svg>
      );
    case "clipboard":
      return (
        <svg viewBox="0 0 24 24" className={className}>
          <rect className={common} x="6" y="4" width="12" height="16" rx="2" />
          <path className={common} d="M9 4h6v3H9z" />
        </svg>
      );
    case "users":
      return (
        <svg viewBox="0 0 24 24" className={className}>
          <path className={common} d="M16 11a4 4 0 1 0-8 0" />
          <path className={common} d="M4 20a8 8 0 0 1 16 0" />
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

const values = [
  { icon: "shield" as IconName, title: "Integrity First", desc: "Advanced anti-cheating tools that respect privacy and promote genuine academic fairness." },
  { icon: "teacher" as IconName, title: "Educator-Centric", desc: "Designed by teachers, for teachers - reducing workload and amplifying impact." },
  { icon: "spark" as IconName, title: "Innovation Driven", desc: "Constantly evolving with AI-powered grading, proctoring, and predictive analytics." },
  { icon: "globe" as IconName, title: "Inclusive and Accessible", desc: "Mobile-first, affordable, and built to work for every student, everywhere." },
];

const mission = [
  { title: "Quality Education", desc: "Provide outstanding, affordable education enabling students to excel in the professional job market." },
  { title: "Strategic Growth", desc: "Deliver strategic programs that enhance the competencies of SCSIT graduates." },
  { title: "Development and Innovation", desc: "Foster creativity, innovation, and a love for learning in service to the country." },
  { title: "Global Competitiveness", desc: "Prepare students for global opportunities through modern, specialized training." },
  { title: "Continuous Improvement", desc: "Meet regulatory requirements and continually improve the institution's quality management system." },
];

const stats = [
  { value: "5,000+", label: "Exams Conducted", icon: "clipboard" as IconName },
  { value: "100+", label: "Active Users", icon: "users" as IconName },
  { value: "90%", label: "Uptime", icon: "activity" as IconName },
  { value: "24/7", label: "Support", icon: "life-buoy" as IconName },
];

export default function About() {
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
            SCSIT Secure Examination Portal
          </div>
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-semibold tracking-tight leading-tight text-slate-900">
            About <span className="text-[var(--accent)]">SCSIT Online Exam</span>
          </h1>
          <p className="mt-4 text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Building the future of fair, secure, and intelligent assessments - empowering educators to focus on teaching, not policing.
          </p>
        </section>

        <section className="py-6 px-5 sm:px-8 lg:px-12 max-w-5xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {stats.map((s) => (
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

        <section className="py-10 px-5 sm:px-8 lg:px-12 max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-10 items-center">
            <div className="space-y-8">
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 rounded-full bg-white border border-slate-200 flex items-center justify-center">
                    <Icon name="target" className="h-5 w-5" />
                  </div>
                  <h2 className="text-xl font-semibold text-slate-900">Our Vision</h2>
                </div>
                <p className="text-sm text-slate-600 leading-relaxed">
                  To provide opportunities for the professional growth and development of world-class graduates who are equipped to lead in a rapidly evolving global landscape.
                </p>
              </div>

              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-9 h-9 rounded-full bg-white border border-slate-200 flex items-center justify-center">
                    <Icon name="flag" className="h-5 w-5" />
                  </div>
                  <h2 className="text-xl font-semibold text-slate-900">Our Mission</h2>
                </div>
                <ul className="space-y-3">
                  {mission.map((item) => (
                    <li key={item.title} className="flex items-start gap-3">
                      <span className="mt-1.5 inline-flex h-2 w-2 rounded-full bg-[var(--accent)]" />
                      <span className="text-sm text-slate-600"><span className="font-semibold text-slate-800">{item.title}:</span> {item.desc}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="relative">
              <div className="relative rounded-3xl overflow-hidden shadow-sm border border-slate-200 bg-white">
                <Image
                  src="/logo1.jpg"
                  alt="SCSIT Campus"
                  width={1200}
                  height={800}
                  className="w-full h-auto object-cover"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/35 via-transparent to-transparent" />
                <div className="absolute bottom-4 left-4 right-4">
                  <div className="bg-white/70 backdrop-blur-md border border-white/60 rounded-xl px-4 py-2 text-slate-900 text-sm font-medium text-center">
                    Salazar College of Science and Information Technology
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-10 px-5 sm:px-8 lg:px-12 max-w-7xl mx-auto">
          <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-9 h-9 rounded-full bg-white border border-slate-200 flex items-center justify-center">
                <Icon name="book" className="h-5 w-5" />
              </div>
              <h2 className="text-2xl font-semibold text-slate-900">Our Story</h2>
            </div>
            <div className="grid md:grid-cols-3 gap-6 text-sm text-slate-600 leading-relaxed">
              <p>SCSIT Online Exam was born out of real frustration - outdated, insecure, and overly complex exam systems that placed heavy burdens on educators and often failed to truly protect academic integrity.</p>
              <p>A passionate team of computer science instructors, assessment experts, and developers at SCSIT came together to build something fundamentally better: a modern platform combining robust proctoring, intelligent auto-grading, and real-time analytics.</p>
              <p>Today, we proudly support our institution, facilitate secure exams, and continue to innovate so that assessments truly enhance - rather than hinder - the learning journey for every student and educator.</p>
            </div>
          </div>
        </section>

        <section className="py-10 px-5 sm:px-8 lg:px-12 max-w-7xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900">
              What We <span className="text-[var(--accent)]">Stand For</span>
            </h2>
            <p className="mt-2 text-slate-500 text-sm max-w-md mx-auto">The principles that guide every decision we make.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {values.map((v) => (
              <div key={v.title} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm transition-all hover:-translate-y-0.5">
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-white text-slate-900 mb-3 border border-slate-200">
                  <Icon name={v.icon} className="h-5 w-5" />
                </div>
                <h3 className="text-base font-semibold text-slate-900 mb-1.5">{v.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{v.desc}</p>
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
                <h2 className="text-2xl sm:text-3xl font-semibold text-slate-900 mb-2">Ready to Transform Your Assessments?</h2>
                <p className="text-slate-600 mb-5 text-base max-w-md mx-auto">
                  Join the SCSIT examination portal and experience secure, smart, and seamless online exams.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                  <Link href="/register" className="inline-flex items-center gap-2 bg-slate-900 text-white font-semibold px-6 py-2.5 rounded-full hover:-translate-y-0.5 transition-all shadow-lg shadow-slate-900/15 text-sm">
                    Get Started Free
                  </Link>
                  <Link href="/contact" className="inline-flex items-center gap-2 bg-white border border-slate-300 text-slate-700 font-semibold px-6 py-2.5 rounded-full hover:border-slate-400 transition-all text-sm">
                    Talk to Our Team
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

