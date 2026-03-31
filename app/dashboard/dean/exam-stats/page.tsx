"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import DeanShell from "@/components/DeanShell";
import { API_URL } from "@/lib/api";

interface ExamStat {
  exam_id: number;
  title: string;
  subject: string;
  exam_type: string;
  scheduled_date: string;
  year_level: string;
  created_by: string;
  total_submissions: number;
  passed: number;
  failed: number;
  pending: number;
  pass_rate: number;
  avg_percentage: number;
  status: string;
}

export default function DeanExamStatsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<ExamStat[]>([]);
  const [department, setDepartment] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) { router.push("/login"); return; }
    fetch(`${API_URL}/profile/`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : Promise.reject("auth"))
      .then(p => {
        if (p.role !== "dean") { router.push("/dashboard"); return; }
        return fetch(`${API_URL}/exams/department/exam-stats/`, { headers: { Authorization: `Bearer ${token}` } });
      })
      .then(r => r ? (r.ok ? r.json() : Promise.reject("fetch")) : null)
      .then(data => {
        if (!data) return;
        setDepartment(data.department);
        setStats(data.exams);
        setLoading(false);
      })
      .catch(() => { setError("Failed to load exam statistics."); setLoading(false); });
  }, []);

  const filtered = stats.filter(e => {
    const q = search.toLowerCase();
    const matchSearch = !q || e.title.toLowerCase().includes(q) || e.subject.toLowerCase().includes(q) || e.created_by.toLowerCase().includes(q);
    const matchType = filterType === "all" || e.exam_type === filterType;
    const matchStatus = filterStatus === "all" || e.status === filterStatus;
    return matchSearch && matchType && matchStatus;
  });

  const totalPassed = filtered.reduce((s, e) => s + e.passed, 0);
  const totalFailed = filtered.reduce((s, e) => s + e.failed, 0);
  const totalPending = filtered.reduce((s, e) => s + e.pending, 0);
  const avgPassRate = filtered.length > 0 ? (filtered.reduce((s, e) => s + e.pass_rate, 0) / filtered.length).toFixed(1) : "0";

  if (loading) return (
    <div className="min-h-screen bg-sky-200 flex items-center justify-center">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white shadow-xl border border-slate-200">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-slate-200 border-t-sky-500" />
      </div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-sky-200">
      <Header />
      <div className="flex items-center justify-center py-20 px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Link href="/dashboard/dean" className="bg-slate-900 text-white px-6 py-3 rounded-xl font-semibold">Back to Dashboard</Link>
        </div>
      </div>
      <Footer />
    </div>
  );

  return (
    <div className="min-h-screen bg-sky-200">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_10%,rgba(14,165,233,0.18),transparent_55%),radial-gradient(circle_at_90%_0%,rgba(251,146,60,0.14),transparent_40%)]" />
      <div className="relative">
        <Header />
        <main className="w-full py-4" style={{ fontFamily: "'Space Grotesk','Manrope',sans-serif" }}>
          <DeanShell>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

              <div className="mb-8 rounded-3xl bg-white/90 backdrop-blur-xl border border-slate-200 shadow-xl p-6 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Dean Dashboard</p>
                  <h1 className="mt-1 text-2xl font-semibold text-slate-900">Exam Performance Statistics</h1>
                  <p className="text-sm text-slate-500 mt-0.5">{department} Department — {stats.length} approved exam{stats.length !== 1 ? "s" : ""}</p>
                </div>
                <Link href="/dashboard/dean" className="px-5 py-3 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-all font-semibold shadow-lg shadow-slate-900/20 text-sm">
                  ← Back to Dashboard
                </Link>
              </div>

              {/* Summary cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                {[
                  { label: "Avg Pass Rate", value: `${avgPassRate}%`, color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-200" },
                  { label: "Total Passed", value: totalPassed, color: "text-sky-600", bg: "bg-sky-50 border-sky-200" },
                  { label: "Total Failed", value: totalFailed, color: "text-red-600", bg: "bg-red-50 border-red-200" },
                  { label: "Pending Grading", value: totalPending, color: "text-amber-600", bg: "bg-amber-50 border-amber-200" },
                ].map(card => (
                  <div key={card.label} className={`rounded-2xl border p-5 ${card.bg}`}>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{card.label}</p>
                    <p className={`mt-2 text-3xl font-bold ${card.color}`}>{card.value}</p>
                  </div>
                ))}
              </div>

              {/* Filters */}
              <div className="mb-6 flex flex-col md:flex-row gap-3">
                <input
                  type="text"
                  placeholder="Search by title, subject, or instructor..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="flex-1 px-4 py-3 rounded-xl border border-slate-200 bg-white/90 text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
                />
                <select value={filterType} onChange={e => setFilterType(e.target.value)} className="px-4 py-3 rounded-xl border border-slate-200 bg-white/90 text-slate-900 shadow-sm">
                  <option value="all">All Types</option>
                  <option value="prelim">Prelim</option>
                  <option value="midterm">Midterm</option>
                  <option value="final">Final</option>
                  <option value="quiz">Quiz</option>
                </select>
                <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="px-4 py-3 rounded-xl border border-slate-200 bg-white/90 text-slate-900 shadow-sm">
                  <option value="all">All Status</option>
                  <option value="upcoming">Upcoming</option>
                  <option value="ongoing">Ongoing</option>
                  <option value="completed">Completed</option>
                </select>
              </div>

              {filtered.length === 0 ? (
                <div className="bg-white/90 rounded-3xl p-12 border border-slate-200 shadow-lg text-center">
                  <p className="text-slate-500">No exams match your filters.</p>
                </div>
              ) : (
                <div className="rounded-2xl border border-slate-200 bg-white/90 shadow-xl overflow-hidden">
                  <div className="hidden md:grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr_1fr] gap-3 px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-slate-500 bg-slate-50 border-b border-slate-200">
                    <span>Exam</span>
                    <span>Instructor</span>
                    <span className="text-center">Submissions</span>
                    <span className="text-center">Passed</span>
                    <span className="text-center">Failed</span>
                    <span className="text-center">Pass Rate</span>
                    <span className="text-center">Avg %</span>
                  </div>
                  <div className="divide-y divide-slate-100">
                    {filtered.map(exam => (
                      <div key={exam.exam_id} className="grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr_1fr] gap-3 px-5 py-4 items-center hover:bg-slate-50 transition-colors">
                        <div>
                          <p className="font-semibold text-slate-900 text-sm">{exam.title}</p>
                          <p className="text-xs text-slate-500 mt-0.5">{exam.subject}</p>
                          <div className="flex flex-wrap gap-1.5 mt-1.5">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase bg-blue-100 text-blue-700">{exam.exam_type}</span>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
                              exam.status === "ongoing" ? "bg-green-100 text-green-700" :
                              exam.status === "upcoming" ? "bg-yellow-100 text-yellow-700" :
                              "bg-slate-100 text-slate-600"
                            }`}>{exam.status}</span>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase bg-purple-100 text-purple-700">Yr {exam.year_level}</span>
                          </div>
                        </div>
                        <p className="text-sm text-slate-600">{exam.created_by}</p>
                        <p className="text-sm font-semibold text-slate-900 text-center">{exam.total_submissions}</p>
                        <p className="text-sm font-semibold text-emerald-600 text-center">{exam.passed}</p>
                        <p className="text-sm font-semibold text-red-500 text-center">{exam.failed}</p>
                        <div className="text-center">
                          <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold ${
                            exam.pass_rate >= 75 ? "bg-emerald-100 text-emerald-700" :
                            exam.pass_rate >= 50 ? "bg-amber-100 text-amber-700" :
                            "bg-red-100 text-red-700"
                          }`}>
                            {exam.pass_rate}%
                          </span>
                        </div>
                        <p className="text-sm font-semibold text-slate-700 text-center">{exam.avg_percentage}%</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </DeanShell>
        </main>
        <Footer />
      </div>
    </div>
  );
}
