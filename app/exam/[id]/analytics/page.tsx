"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import InstructorShell from "@/components/InstructorShell";

import { API_URL } from "@/lib/api";
export default function ExamAnalytics() {
  const router = useRouter();
  const params = useParams();
  const examId = params.id;
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<any>(null);

  useEffect(() => {
    fetchAnalytics();
  }, [examId]);

  const fetchAnalytics = async () => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      router.push("/login");
      return;
    }

    try {
      const res = await fetch(`${API_URL}/exams/${examId}/analytics/`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Failed to fetch analytics");

      const data = await res.json();
      setAnalytics(data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    const token = localStorage.getItem("access_token");
    if (!analytics) return;
    fetch(`${API_URL}/exams/${examId}/results/export/`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    .then(res => res.blob())
    .then(blob => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const safeTitle = analytics?.exam?.title ? analytics.exam.title.replace(/ /g, '_') : `exam_${examId}`;
      a.download = `${safeTitle}_results.csv`;
      a.click();
    })
    .catch(err => console.error('Export failed:', err));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-sky-100 bg-[radial-gradient(circle_at_20%_10%,rgba(14,165,233,0.18),transparent_55%),radial-gradient(circle_at_80%_0%,rgba(249,115,22,0.12),transparent_45%)] flex items-center justify-center">
        <div className="relative w-full">
          <Header />
          <InstructorShell>
          <div className="flex items-center justify-center py-20">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white shadow-xl shadow-slate-200/70 border border-slate-200">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-slate-200 border-t-sky-500"></div>
            </div>
          </div>
          </InstructorShell>
          <Footer />
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="min-h-screen bg-sky-100">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_10%,rgba(14,165,233,0.18),transparent_55%),radial-gradient(circle_at_90%_0%,rgba(251,146,60,0.14),transparent_40%),radial-gradient(circle_at_50%_90%,rgba(16,185,129,0.12),transparent_45%)]" />
        <div className="relative">
          <Header />
          <InstructorShell>
          <main className="max-w-5xl mx-auto px-4 py-12" style={{ fontFamily: "'Space Grotesk', 'Manrope', sans-serif" }}>
            <div className="bg-white/90 backdrop-blur-xl rounded-3xl p-10 border border-slate-200 text-center shadow-lg shadow-slate-200/60">
              <p className="text-slate-600">No analytics data available.</p>
            </div>
          </main>
          </InstructorShell>
          <Footer />
        </div>
      </div>
    );
  }

  const exam = analytics?.exam ?? {};
  const statistics = analytics?.statistics ?? {};
  const grade_distribution = analytics?.grade_distribution ?? [];
  const score_distribution = analytics?.score_distribution ?? [];
  const question_analysis = analytics?.question_analysis ?? [];
  const top_performers = analytics?.top_performers ?? [];

  return (
    <div className="min-h-screen bg-sky-100">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_10%,rgba(14,165,233,0.18),transparent_55%),radial-gradient(circle_at_90%_0%,rgba(251,146,60,0.14),transparent_40%),radial-gradient(circle_at_50%_90%,rgba(16,185,129,0.12),transparent_45%)]" />
      <div className="relative">
        <Header />
        <InstructorShell>
        <main className="max-w-7xl mx-auto px-4 py-12" style={{ fontFamily: "'Space Grotesk', 'Manrope', sans-serif" }}>
          <div className="mb-6 rounded-2xl bg-white/90 backdrop-blur-xl border border-slate-200 shadow-xl shadow-slate-200/60 p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Link href="/dashboard/teacher" className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 text-xs font-semibold tracking-[0.2em] uppercase">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-100">
                  <svg className="h-4 w-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </span>
                Back to Dashboard
              </Link>
              <span className="inline-flex items-center gap-2 rounded-full bg-sky-100 text-sky-700 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide">
                Analytics
              </span>
            </div>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-semibold text-slate-900">{exam.title || "Exam"} - Analytics</h1>
                <div className="mt-2 h-1 w-12 rounded-full bg-gradient-to-r from-sky-500 to-blue-500" />
                <p className="mt-2 text-sm text-slate-600">{exam.subject || ""}</p>
              </div>
              <button
                onClick={exportToCSV}
                className="px-5 py-3 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-all font-semibold shadow-lg shadow-slate-900/20"
              >
                Export CSV
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-lg shadow-slate-200/60 border border-slate-200 p-6">
              <p className="text-slate-600 text-sm mb-2">Total Students</p>
              <p className="text-3xl font-bold text-sky-600">{statistics.total_students ?? 0}</p>
            </div>
            <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-lg shadow-slate-200/60 border border-emerald-200 p-6">
              <p className="text-slate-600 text-sm mb-2">Passed</p>
              <p className="text-3xl font-bold text-green-600">{statistics.passed ?? 0}</p>
              <p className="text-sm text-slate-500">{statistics.pass_rate ?? 0}% pass rate</p>
            </div>
            <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-lg shadow-slate-200/60 border border-red-200 p-6">
              <p className="text-slate-600 text-sm mb-2">Failed</p>
              <p className="text-3xl font-bold text-red-600">{statistics.failed ?? 0}</p>
            </div>
            <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-lg shadow-slate-200/60 border border-blue-200 p-6">
              <p className="text-slate-600 text-sm mb-2">Average Score</p>
              <p className="text-3xl font-bold text-blue-600">{statistics.average_score ?? 0}</p>
              <p className="text-sm text-slate-500">out of {exam.total_points ?? 0}</p>
            </div>
          </div>

          <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-lg shadow-slate-200/60 border border-slate-200 p-6 mb-8">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">Score Range</h2>
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-slate-600">Lowest Score</p>
                <p className="text-2xl font-bold text-red-600">{statistics.lowest_score ?? 0}</p>
              </div>
              <div className="flex-1 mx-8">
                <div className="h-2 bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 rounded-full"></div>
              </div>
              <div>
                <p className="text-sm text-slate-600">Highest Score</p>
                <p className="text-2xl font-bold text-green-600">{statistics.highest_score ?? 0}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-lg shadow-slate-200/60 border border-slate-200 p-6">
              <h2 className="text-xl font-semibold text-slate-900 mb-4">Grade Distribution</h2>
              <div className="space-y-3">
                {grade_distribution.map((item: any) => (
                  <div key={item.grade}>
                    <div className="flex justify-between mb-1">
                      <span className="text-slate-700 font-medium">{item.grade}</span>
                      <span className="text-slate-600">{item.count} students ({item.percentage.toFixed(1)}%)</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2">
                      <div className="bg-sky-600 h-2 rounded-full" style={{ width: `${item.percentage}%` }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-lg shadow-slate-200/60 border border-slate-200 p-6">
              <h2 className="text-xl font-semibold text-slate-900 mb-4">Score Distribution</h2>
              <div className="space-y-3">
                {score_distribution.map((item: any) => (
                  <div key={item.range}>
                    <div className="flex justify-between mb-1">
                      <span className="text-slate-700 font-medium">{item.range}%</span>
                      <span className="text-slate-600">{item.count} students</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${statistics.total_students ? (item.count / statistics.total_students) * 100 : 0}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-lg shadow-slate-200/60 border border-slate-200 p-6 mb-8">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">Question Analysis</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-3 px-4 text-slate-700">Q#</th>
                    <th className="text-left py-3 px-4 text-slate-700">Question</th>
                    <th className="text-left py-3 px-4 text-slate-700">Type</th>
                    <th className="text-left py-3 px-4 text-slate-700">Success Rate</th>
                    <th className="text-left py-3 px-4 text-slate-700">Difficulty</th>
                  </tr>
                </thead>
                <tbody>
                  {question_analysis.map((q: any) => (
                    <tr key={q.question_number} className="border-b border-slate-100">
                      <td className="py-3 px-4">{q.question_number}</td>
                      <td className="py-3 px-4 text-slate-600">{q.question_text}</td>
                      <td className="py-3 px-4 text-slate-600">{q.type}</td>
                      <td className="py-3 px-4">
                        <span className={`font-medium ${q.success_rate >= 80 ? 'text-green-600' : q.success_rate >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                          {q.success_rate}%
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-3 py-1 rounded-full text-sm ${
                          q.difficulty === 'Easy' ? 'bg-green-100 text-green-700' :
                          q.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {q.difficulty}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-lg shadow-slate-200/60 border border-slate-200 p-6">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">Top Performers</h2>
            <div className="space-y-3">
              {top_performers.length > 0 ? (
                top_performers.map((student: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${
                        index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-slate-400' : index === 2 ? 'bg-orange-600' : 'bg-sky-500'
                      }`}>
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">{student.student_name}</p>
                        <p className="text-sm text-slate-600">{student.student_id}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-slate-900">{student.score}/{exam.total_points ?? 0}</p>
                      <p className="text-sm text-slate-600">{student.percentage}% - Grade {student.grade}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-slate-600 py-8">No student data available yet</p>
              )}
            </div>
          </div>
        </main>
        </InstructorShell>
        <Footer />
      </div>
    </div>
  );
}
