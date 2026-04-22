// app/page.tsx
"use client";

import { useState, useEffect, useSyncExternalStore } from "react";
import Link from "next/link";
import Header from "../components/Header";
import Footer from "../components/Footer";

const features = [
  { icon: "🎥", title: "Live Proctoring", desc: "AI face detection monitors students in real-time, capturing photos and flagging violations.", color: "from-sky-500 to-blue-500" },
  { icon: "⚡", title: "Auto-Grading", desc: "MCQ and identification questions graded instantly. Publish results with one click.", color: "from-violet-500 to-purple-500" },
  { icon: "📊", title: "Rich Analytics", desc: "Grade distributions, per-question analysis, and student performance trends.", color: "from-emerald-500 to-teal-500" },
  { icon: "🛡️", title: "Anti-Cheating", desc: "Tab-switch detection, copy-paste blocking, and violation logging.", color: "from-rose-500 to-pink-500" },
  { icon: "📁", title: "Question Bank", desc: "Build reusable banks, import via CSV, and randomize questions per session.", color: "from-cyan-500 to-sky-500" },
  { icon: "🔐", title: "OTP Verification", desc: "Two-factor auth via email OTP ensures only verified users access exams.", color: "from-fuchsia-500 to-pink-500" },
];

const roles = [
  {
    role: "Student", icon: "🎓", color: "from-sky-500 to-blue-600",
    points: ["Take scheduled & practice exams", "View instant results & feedback", "Access study materials", "Track performance history"],
  },
  {
    role: "Instructor", icon: "👨‍🏫", color: "from-violet-500 to-purple-600",
    points: ["Create & schedule exams", "Manage question banks", "Monitor live proctoring", "Publish & export results"],
  },
  {
    role: "Dean", icon: "🏛️", color: "from-emerald-500 to-teal-600",
    points: ["Oversee all department exams", "Approve exam schedules", "View institution-wide analytics", "Manage user accounts"],
  },
];

export default function Home() {
  const isLoggedIn = useSyncExternalStore(
    () => () => {},
    () => !!window.localStorage.getItem("access_token"),
    () => false
  );
  const userRole = useSyncExternalStore(
    () => () => {},
    () => window.localStorage.getItem("user_role"),
    () => null
  );
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [stats, setStats] = useState<{
    active_exams: number;
    total_exams: number;
    total_users: number;
    violations_today: number;
    live_exam: {
      title: string;
      subject: string;
      submitted: number;
      total: number;
      progress: number;
      remaining_minutes: number;
    } | null;
    activity: { dot: string; msg: string; time: string }[];
  } | null>(null);

  useEffect(() => {
    fetch("/api/stats")
      .then((r) => r.json())
      .then((data) => setStats(data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const onScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleScrollTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const getDashboardUrl = () => {
    if (userRole === "student") return "/dashboard/student";
    if (userRole === "instructor") return "/dashboard/teacher";
    if (userRole === "dean") return "/dashboard/dean";
    return "/dashboard";
  };

  const activityFallback = [
    { dot: "bg-slate-300", msg: "Loading activity...", time: "" },
    { dot: "bg-slate-300", msg: "Loading activity...", time: "" },
    { dot: "bg-slate-300", msg: "Loading activity...", time: "" },
  ];
  const activityList = stats?.activity?.length ? stats.activity : activityFallback;
  const activityPreview = activityList.slice(0, 5);
  const hasMoreActivity = activityList.length > 5;

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
      {/* Minimal grid + halo */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(transparent_23px,rgba(15,23,42,0.05)_24px),linear-gradient(90deg,transparent_23px,rgba(15,23,42,0.05)_24px)] bg-[size:24px_24px]" />
        <div className="absolute -top-40 left-1/2 h-[480px] w-[480px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle_at_center,rgba(14,165,160,0.16),transparent_65%)]" />
      </div>

      <div className="relative">
        <Header />

        {/* ── HERO ── */}
        <section className="pt-10 pb-12 px-5 sm:px-8 lg:px-12 max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-[1.05fr_0.95fr] gap-10 items-center">
            {/* Left: text */}
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-3.5 py-1 text-[11px] uppercase tracking-[0.3em] text-slate-500">
                Secure Examination Portal
              </div>

              <h1 className="mt-4 text-5xl sm:text-6xl lg:text-7xl font-semibold tracking-tight leading-[1.05] text-slate-900">
                SCSIT
                <span className="block mt-2 text-[var(--accent)]">Online Exam</span>
              </h1>

              <p className="mt-4 text-lg text-slate-600 max-w-xl leading-relaxed">
                A minimalist platform with powerful tools: live proctoring, instant grading, analytics, and anti-cheating - built for clarity and confidence.
              </p>

              <div className="mt-5 flex flex-wrap gap-3">
                {mounted && !isLoggedIn ? (
                  <Link href="/login" className="inline-flex items-center gap-2 bg-white border border-slate-300 text-slate-700 font-semibold px-6 py-2.5 rounded-full hover:border-slate-400 transition-all hover:-translate-y-0.5 text-sm">
                    Sign In
                  </Link>
                ) : mounted ? (
                  <Link href={getDashboardUrl()} className="group inline-flex items-center gap-2 bg-slate-900 text-white font-semibold px-6 py-2.5 rounded-full shadow-lg shadow-slate-900/15 transition-all hover:-translate-y-0.5 text-sm">
                    Go to Dashboard
                    
                  </Link>
                ) : null}
              </div>

              {/* Trust badges */}
              <div className="mt-6 flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-slate-500">
                {["Live Proctoring", "AI Auto-Grading", "OTP Auth", "CSV Export"].map((f) => (
                  <span key={f} className="flex items-center gap-1.5">
                    <svg className="w-3 h-3 text-[var(--accent)]" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    {f}
                  </span>
                ))}
              </div>
            </div>

            {/* Right: live dashboard card */}
            <div className="relative">
              <div className="absolute -inset-1 rounded-3xl bg-[radial-gradient(circle_at_top,rgba(14,165,160,0.25),transparent_65%)] blur-2xl" />
              <div className="relative bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xl shadow-slate-200/50">
                {/* Browser bar */}
                <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-200 bg-slate-50">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-slate-300" />
                    <div className="w-2.5 h-2.5 rounded-full bg-slate-200" />
                    <div className="w-2.5 h-2.5 rounded-full bg-slate-100" />
                  </div>
                  <span className="text-sm text-slate-500 font-mono">scsit-online.exam.edu</span>
                  <span className="flex items-center gap-1 text-xs text-slate-700 font-semibold">
                    <span className="w-1.5 h-1.5 bg-[var(--accent)] rounded-full animate-ping" />
                    LIVE
                  </span>
                </div>

                <div className="p-4 space-y-3">
                  {/* Stat cards */}
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: "Active Exams", val: stats?.active_exams ?? "—", icon: "📋", color: "text-slate-700" },
                      { label: "Students", val: stats?.total_users ?? "—", icon: "👥", color: "text-slate-700" },
                      { label: "Violations", val: stats?.violations_today ?? "—", icon: "🚨", color: "text-slate-700" },
                    ].map((item) => (
                      <div key={item.label} className="bg-white border border-slate-200 rounded-2xl p-3 text-center transition-all hover:-translate-y-0.5 shadow-sm">
                        <div className="text-xl mb-0.5">{item.icon}</div>
                        <div className={`text-2xl font-semibold tabular-nums ${item.color}`}>{item.val}</div>
                        <div className="text-sm text-slate-500 mt-0.5">{item.label}</div>
                      </div>
                    ))}
                  </div>

                  {/* Live exam progress */}
                  {stats?.live_exam ? (
                    <div className="bg-white border border-slate-200 rounded-2xl p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="text-sm font-semibold text-slate-800">{stats.live_exam.title}</p>
                          <p className="text-sm text-slate-500">{stats.live_exam.subject}</p>
                        </div>
                        <span className="flex items-center gap-1 text-xs bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full border border-slate-200 font-semibold">
                          <span className="w-1.5 h-1.5 bg-[var(--accent)] rounded-full animate-pulse" />
                          In Progress
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-[var(--accent)] h-2 rounded-full transition-all duration-700"
                          style={{ width: `${stats.live_exam.progress}%` }}
                        />
                      </div>
                      <div className="flex justify-between mt-1.5 text-xs">
                        <span className="text-slate-700">{stats.live_exam.submitted}/{stats.live_exam.total} submitted</span>
                        <span className="text-slate-400">⏱ {stats.live_exam.remaining_minutes} min left</span>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-white border border-slate-200 rounded-2xl p-3 text-center">
                      <p className="text-sm text-slate-400">No exams currently in progress</p>
                    </div>
                  )}

                  {/* Activity feed */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-3 space-y-2">
                    <p className="text-sm font-semibold text-[var(--accent)] uppercase tracking-[0.3em]">Recent Activity</p>
                    {activityPreview.map((a, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${a.dot}`} />
                          <span className="text-base text-slate-600">{a.msg}</span>
                        </div>
                        <span className="text-sm text-slate-400 shrink-0 ml-2">{a.time}</span>
                      </div>
                    ))}
                    {hasMoreActivity && (
                      <button
                        onClick={() => setShowActivityModal(true)}
                        className="w-full text-sm font-semibold text-slate-700 hover:text-slate-700 mt-1"
                      >
                        See more
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>



        {/* ── FEATURES ── */}
        <section className="py-8 px-5 sm:px-8 lg:px-12 max-w-7xl mx-auto">
          <div className="text-center mb-6">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900">
              Everything for{" "}
              <span className="text-[var(--accent)]">Secure Exams</span>
            </h2>
            <p className="mt-2 text-slate-500 text-base max-w-md mx-auto">
              A complete examination ecosystem — from creation to results — with security at every step.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((f) => (
              <div key={f.title} className="group bg-white border border-slate-200 rounded-2xl p-4 shadow-sm transition-all hover:-translate-y-0.5">
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-[var(--accent-soft)] text-slate-900 text-xl mb-3 border border-slate-200">
                  {f.icon}
                </div>
                <h3 className="text-base font-semibold text-slate-900 mb-1">{f.title}</h3>
                <p className="text-slate-500 text-xs leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── ROLES ── */}
        <section className="py-8 px-5 sm:px-8 lg:px-12 max-w-6xl mx-auto">
          <div className="text-center mb-6">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900">
              Built for{" "}
              <span className="text-[var(--accent)]">Every Role</span>
            </h2>
            <p className="mt-2 text-slate-500 text-sm">Tailored dashboards for students, instructors, and deans.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            {roles.map((r) => (
              <div key={r.role} className="relative bg-white border border-slate-200 rounded-2xl p-4 shadow-sm transition-all hover:-translate-y-0.5 border-l-2 border-[var(--accent)]">
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-[var(--accent-soft)] text-xl mb-2 border border-slate-200">
                  {r.icon}
                </div>
                <h3 className="text-base font-semibold text-slate-900 mb-2">{r.role}</h3>
                <ul className="space-y-2">
                  {r.points.map((p) => (
                    <li key={p} className="flex items-start gap-2 text-base text-slate-600">
                      <svg className="w-3.5 h-3.5 text-[var(--accent)] mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* ── HOW IT WORKS ── */}
        <section className="py-8 px-5 sm:px-8 lg:px-12 max-w-5xl mx-auto">
          <div className="text-center mb-6">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900">
              How It{" "}
              <span className="text-[var(--accent)]">Works</span>
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { step: "01", title: "Register", desc: "Create your account and get approved by your dean.", icon: "✍️" },
              { step: "02", title: "Schedule", desc: "Instructors create and schedule exams for their classes.", icon: "📅" },
              { step: "03", title: "Take Exam", desc: "Students take exams with live proctoring active.", icon: "💻" },
              { step: "04", title: "Get Results", desc: "Auto-graded results published instantly after submission.", icon: "🏆" },
            ].map((item, i) => (
              <div key={item.step} className="relative text-center">
                {i < 3 && (
                  <div className="hidden lg:block absolute top-6 left-[calc(50%+2rem)] w-[calc(100%-4rem)] h-px bg-gradient-to-r from-slate-200 to-transparent" />
                )}
                <div className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-white border border-slate-200 shadow-sm text-xl mb-2">
                  {item.icon}
                </div>
                <div className="text-sm font-bold text-[var(--accent)] mb-0.5">{item.step}</div>
                <h3 className="text-sm font-bold text-slate-900 mb-1">{item.title}</h3>
                <p className="text-slate-500 text-xs">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="py-8 px-5 sm:px-8 lg:px-12 max-w-4xl mx-auto">
          <div className="relative bg-white border border-slate-200 rounded-3xl p-8 text-center shadow-sm overflow-hidden">
            <div className="absolute inset-x-8 top-0 h-px bg-[var(--accent)]" />
            <div className="relative">
              <div className="text-xs uppercase tracking-[0.35em] text-slate-500 mb-3">Launch</div>
              <h2 className="text-xl sm:text-3xl font-semibold text-slate-900 mb-2">
                Ready to Transform Your Exams?
              </h2>
              <p className="text-slate-600 mb-5 text-base max-w-md mx-auto">
                Join the SCSIT examination portal and experience secure, smart, and seamless online exams.
              </p>
              {mounted && (
                isLoggedIn ? (
                  <Link href={getDashboardUrl()} className="inline-flex items-center gap-2 bg-slate-900 text-white font-semibold px-6 py-2.5 rounded-full hover:-translate-y-0.5 transition-all shadow-lg shadow-slate-900/15 text-sm">
                    Go to Dashboard
                  </Link>
                ) : (
                  <Link href="/login" className="inline-flex items-center gap-2 bg-white border border-slate-300 text-slate-700 font-semibold px-6 py-2.5 rounded-full hover:border-slate-400 transition-all hover:-translate-y-0.5 text-sm">
                    Sign In
                  </Link>
                )
              )}
            </div>
          </div>
        </section>

        {showActivityModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Recent Activity</h3>
                  <p className="text-sm text-slate-500">Showing latest {Math.min(activityList.length, 15)} records</p>
                </div>
                <button
                  onClick={() => setShowActivityModal(false)}
                  className="text-slate-400 hover:text-slate-600 text-2xl"
                  aria-label="Close"
                >
                  ×
                </button>
              </div>
              <div className="p-6 space-y-3 max-h-[60vh] overflow-y-auto">
                {activityList.slice(0, 15).map((a, i) => (
                  <div key={i} className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span className={`w-2 h-2 rounded-full ${a.dot}`} />
                      <span className="text-sm text-slate-700">{a.msg}</span>
                    </div>
                    <span className="text-sm text-slate-400">{a.time}</span>
                  </div>
                ))}
              </div>
              <div className="px-6 pb-6">
                <button
                  onClick={() => setShowActivityModal(false)}
                  className="w-full rounded-xl bg-slate-900 text-white py-3 font-semibold hover:bg-slate-800 transition-all"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {showScrollTop && (
          <button
            onClick={handleScrollTop}
            className="fixed bottom-6 right-6 z-40 inline-flex h-12 w-12 items-center justify-center rounded-full bg-[var(--accent)] text-white shadow-lg shadow-slate-900/20 hover:-translate-y-0.5 transition-all"
            aria-label="Back to top"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
          </button>
        )}

        <Footer />
      </div>
    </div>
  );
}


