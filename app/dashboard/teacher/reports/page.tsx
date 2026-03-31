"use client";

import { Suspense } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import InstructorShell from "@/components/InstructorShell";
import IssueReportsPanel from "@/components/IssueReportsPanel";

export default function TeacherReportsPage() {
  return (
    <div className="min-h-screen bg-sky-200">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_10%,rgba(14,165,233,0.18),transparent_55%),radial-gradient(circle_at_90%_0%,rgba(251,146,60,0.14),transparent_40%),radial-gradient(circle_at_50%_90%,rgba(16,185,129,0.12),transparent_45%)]" />
      <div className="relative">
        <Header />
        <InstructorShell>
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12" style={{ fontFamily: "'Space Grotesk', 'Manrope', sans-serif" }}>
            <div className="mb-8 rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-lg shadow-slate-200/60">
              <p className="text-[11px] uppercase tracking-[0.3em] text-slate-500">Instructor Inbox</p>
              <h1 className="mt-2 text-3xl font-semibold text-slate-900">Question Issue Reports</h1>
              <p className="mt-2 text-sm text-slate-600">Review student-reported exam issues, respond in-thread, and update each report status.</p>
            </div>
            <Suspense
              fallback={
                <div className="rounded-3xl border border-slate-200 bg-white/90 p-6 text-sm text-slate-500 shadow-lg shadow-slate-200/60">
                  Loading reports...
                </div>
              }
            >
              <IssueReportsPanel role="instructor" />
            </Suspense>
          </main>
        </InstructorShell>
        <Footer />
      </div>
    </div>
  );
}
