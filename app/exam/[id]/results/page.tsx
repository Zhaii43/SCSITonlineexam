// app/exam/[id]/results/page.tsx
"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import RoleShell from "@/components/RoleShell";

import { API_URL } from "@/lib/api";
interface ExamResult {
  id: number;
  student_name: string;
  student_id: string;
  score: number;
  total_points: number;
  percentage: number;
  grade: string;
  remarks: string;
  submitted_at: string;
}

interface ExamData {
  id: number;
  title: string;
  subject: string;
  total_points: number;
  passing_score: number;
}

export default function ExamResults() {
  const params = useParams();
  const examIdParam = params.id;
  const examId = Array.isArray(examIdParam) ? examIdParam[0] : examIdParam;
  const [role, setRole] = useState<"" | "instructor" | "dean">("");
  
  const [loading, setLoading] = useState(true);
  const [exam, setExam] = useState<ExamData | null>(null);
  const [results, setResults] = useState<ExamResult[]>([]);
  const [stats, setStats] = useState({ total_students: 0, passed: 0, failed: 0 });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedRole = window.localStorage.getItem("user_role");
      if (storedRole === "instructor" || storedRole === "dean") {
        setRole(storedRole);
      }
    }
  }, []);

  const dashboardHref = role === "dean" ? "/dashboard/dean" : "/dashboard/teacher";

  const fetchResults = useCallback(async () => {
    const token = localStorage.getItem("access_token");
    try {
      const res = await fetch(`${API_URL}/exams/${examId}/results/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (!res.ok) throw new Error("Failed to load results");
      
      const data = await res.json();
      setExam(data.exam);
      setResults(data.results);
      setStats({
        total_students: data.total_students,
        passed: data.passed,
        failed: data.failed,
      });
      setLoading(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load results");
      setLoading(false);
    }
  }, [examId]);

  useEffect(() => {
    fetchResults();
  }, [fetchResults]);

  if (loading) {
    return (
      <div className="min-h-screen bg-sky-100 bg-[radial-gradient(circle_at_20%_10%,rgba(14,165,233,0.18),transparent_55%),radial-gradient(circle_at_80%_0%,rgba(249,115,22,0.12),transparent_45%)] flex items-center justify-center">
        <div className="relative w-full">
          <Header />
          <RoleShell>
          <div className="flex items-center justify-center py-20">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white shadow-xl shadow-slate-200/70 border border-slate-200">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-slate-200 border-t-sky-500"></div>
            </div>
          </div>
          </RoleShell>
          <Footer />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-sky-100 bg-[radial-gradient(circle_at_20%_10%,rgba(14,165,233,0.18),transparent_55%),radial-gradient(circle_at_80%_0%,rgba(249,115,22,0.12),transparent_45%)] flex items-center justify-center">
        <div className="relative w-full">
          <Header />
          <RoleShell>
          <div className="flex items-center justify-center py-20 px-4">
            <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-xl border border-red-200 p-8 text-center max-w-md">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-100 text-red-700">
                <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 4h.01M10.29 3.86l-7.5 13A1.5 1.5 0 004.09 19h15.82a1.5 1.5 0 001.3-2.14l-7.5-13a1.5 1.5 0 00-2.62 0z" />
                </svg>
              </div>
              <h2 className="text-2xl font-semibold text-slate-900 mb-2">Error</h2>
              <p className="text-slate-600 mb-6">{error}</p>
              <Link href={dashboardHref} className="inline-block bg-slate-900 text-white px-6 py-3 rounded-xl hover:bg-slate-800 transition-all font-semibold shadow-lg shadow-slate-900/20">
                Back to Dashboard
              </Link>
            </div>
          </div>
          </RoleShell>
          <Footer />
        </div>
      </div>
    );
  }

  const passRate = stats.total_students > 0 ? ((stats.passed / stats.total_students) * 100).toFixed(1) : 0;

  return (
    <div className="min-h-screen bg-sky-100">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_10%,rgba(14,165,233,0.18),transparent_55%),radial-gradient(circle_at_90%_0%,rgba(251,146,60,0.14),transparent_40%),radial-gradient(circle_at_50%_90%,rgba(16,185,129,0.12),transparent_45%)]" />
      
      <div className="relative">
        <Header />
        <RoleShell>
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12" style={{ fontFamily: "'Space Grotesk', 'Manrope', sans-serif" }}>
          <div className="mb-6 rounded-2xl bg-white/90 backdrop-blur-xl border border-slate-200 shadow-xl shadow-slate-200/60 p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Link href={dashboardHref} className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 text-xs font-semibold tracking-[0.2em] uppercase">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-100">
                  <svg className="h-4 w-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </span>
                Back to Dashboard
              </Link>
              <span className="inline-flex items-center gap-2 rounded-full bg-sky-100 text-sky-700 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide">
                Results
              </span>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-4 mt-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-semibold text-slate-900 mb-1">Exam Results</h1>
                <div className="mt-2 h-1 w-12 rounded-full bg-gradient-to-r from-sky-500 to-blue-500" />
                <p className="mt-2 text-sm text-slate-600">{exam?.title} - {exam?.subject}</p>
              </div>
              {stats.total_students > 0 && (
                <Link
                  href={`/exam/${examId}/grade`}
                  className="bg-slate-900 text-white px-5 py-3 rounded-xl hover:bg-slate-800 transition-all font-semibold shadow-lg shadow-slate-900/20"
                >
                  Grade Submissions
                </Link>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white/90 backdrop-blur-xl rounded-2xl p-6 border border-slate-200 shadow-lg shadow-slate-200/60">
              <p className="text-slate-600 text-sm font-medium uppercase tracking-wide">Total Students</p>
              <p className="text-4xl font-bold text-sky-600 mt-3">{stats.total_students}</p>
            </div>

            <div className="bg-white/90 backdrop-blur-xl rounded-2xl p-6 border border-slate-200 shadow-lg shadow-slate-200/60">
              <p className="text-slate-600 text-sm font-medium uppercase tracking-wide">Passed</p>
              <p className="text-4xl font-bold text-green-600 mt-3">{stats.passed}</p>
            </div>

            <div className="bg-white/90 backdrop-blur-xl rounded-2xl p-6 border border-slate-200 shadow-lg shadow-slate-200/60">
              <p className="text-slate-600 text-sm font-medium uppercase tracking-wide">Failed</p>
              <p className="text-4xl font-bold text-red-600 mt-3">{stats.failed}</p>
            </div>

            <div className="bg-white/90 backdrop-blur-xl rounded-2xl p-6 border border-slate-200 shadow-lg shadow-slate-200/60">
              <p className="text-slate-600 text-sm font-medium uppercase tracking-wide">Pass Rate</p>
              <p className="text-4xl font-bold text-purple-600 mt-3">{passRate}%</p>
            </div>
          </div>

          <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-200">
              <h2 className="text-xl font-semibold text-slate-900">Student Results</h2>
            </div>

            {results.length === 0 ? (
              <div className="p-12 text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
                  <svg className="h-7 w-7 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10m-10 4h6m-9 5h12a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v11a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-2">No Submissions Yet</h3>
                <p className="text-slate-600">Students haven&apos;t taken this exam yet.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Student Name</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Student ID</th>
                      <th className="px-6 py-4 text-center text-sm font-semibold text-slate-900">Score</th>
                      <th className="px-6 py-4 text-center text-sm font-semibold text-slate-900">Percentage</th>
                      <th className="px-6 py-4 text-center text-sm font-semibold text-slate-900">Grade</th>
                      <th className="px-6 py-4 text-center text-sm font-semibold text-slate-900">Remarks</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Submitted</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {results.map((result) => (
                      <tr key={result.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="px-6 py-4 text-slate-900 font-medium">{result.student_name}</td>
                        <td className="px-6 py-4 text-slate-600">{result.student_id}</td>
                        <td className="px-6 py-4 text-center text-slate-900 font-semibold">
                          {result.score} / {result.total_points}
                        </td>
                        <td className="px-6 py-4 text-center text-slate-900 font-semibold">
                          {result.percentage.toFixed(1)}%
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                            parseFloat(result.grade) <= 3.0 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-red-100 text-red-700'
                          }`}>
                            {result.grade}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold uppercase ${
                            result.remarks === 'Passed' 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-red-100 text-red-700'
                          }`}>
                            {result.remarks}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-600 text-sm">
                          {new Date(result.submitted_at).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
        </RoleShell>
        <Footer />
      </div>
    </div>
  );
}
