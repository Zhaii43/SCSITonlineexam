"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

import { API_URL } from "@/lib/api";

interface PracticeExam {
  id: number;
  title: string;
  subject: string;
  question_count: number;
  total_points: number;
}

interface PracticeHistoryItem {
  id: number;
  exam_title: string;
  exam_subject: string;
  score: number;
  total_points: number;
  percentage: number | string;
  submitted_at: string;
}

export default function PracticeExams() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [exams, setExams] = useState<PracticeExam[]>([]);
  const [history, setHistory] = useState<PracticeHistoryItem[]>([]);

  const fetchPracticeExams = useCallback(async () => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      router.push("/login");
      return;
    }

    try {
      const [examsRes, historyRes] = await Promise.all([
        fetch(`${API_URL}/exams/practice/`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/exams/practice/results/`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      if (examsRes.ok) {
        const data = await examsRes.json();
        setExams(data);
      }
      if (historyRes.ok) {
        const data = await historyRes.json();
        setHistory(data);
      }
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void fetchPracticeExams();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [fetchPracticeExams]);

  if (loading) {
    return (
      <div className="min-h-screen bg-sky-100 bg-[radial-gradient(circle_at_20%_10%,rgba(14,165,233,0.18),transparent_55%),radial-gradient(circle_at_80%_0%,rgba(249,115,22,0.12),transparent_45%)] flex items-center justify-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white shadow-xl shadow-slate-200/70 border border-slate-200">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-slate-200 border-t-sky-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-sky-100">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_10%,rgba(14,165,233,0.18),transparent_55%),radial-gradient(circle_at_90%_0%,rgba(251,146,60,0.14),transparent_40%),radial-gradient(circle_at_50%_90%,rgba(16,185,129,0.12),transparent_45%)]" />

      <div className="relative">
        <Header />

        <main className="max-w-5xl mx-auto px-4 py-12" style={{ fontFamily: "'Space Grotesk', 'Manrope', sans-serif" }}>
          <div className="mb-4 rounded-2xl bg-white/90 backdrop-blur-xl border border-slate-200 shadow-lg shadow-slate-200/60 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Link
                href="/dashboard/student"
                className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 text-[11px] font-semibold tracking-[0.18em] uppercase"
              >
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-slate-100">
                  <svg className="h-3.5 w-3.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </span>
                Back to Dashboard
              </Link>
              <span className="inline-flex items-center gap-2 rounded-full bg-sky-100 text-sky-700 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide">
                Practice Zone
              </span>
            </div>
            <div className="mt-3">
              <h1 className="text-xl sm:text-2xl font-semibold text-slate-900">Practice Mode</h1>
              <div className="mt-2 h-1 w-10 rounded-full bg-gradient-to-r from-sky-500 to-blue-500" />
              <p className="mt-2 text-xs text-slate-600">Practice exams without grading. Learn at your own pace.</p>
            </div>
          </div>

          {history.length > 0 && (
            <div className="mb-6 rounded-3xl bg-white/90 backdrop-blur-xl border border-slate-200 shadow-lg shadow-slate-200/60 overflow-x-auto">
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/80">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.25em] text-slate-500">Practice History</p>
                  <h3 className="text-lg font-semibold text-slate-900">Your recent attempts</h3>
                </div>
                <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600 border border-slate-200">
                  {history.length} total
                </span>
              </div>
              <table className="w-full">
                <thead className="bg-white text-xs uppercase tracking-widest text-slate-500">
                  <tr>
                    <th className="px-6 py-4 text-left font-semibold">Exam</th>
                    <th className="px-6 py-4 text-left font-semibold">Subject</th>
                    <th className="px-6 py-4 text-left font-semibold">Score</th>
                    <th className="px-6 py-4 text-left font-semibold">Percentage</th>
                    <th className="px-6 py-4 text-left font-semibold">Submitted</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {history.slice(0, 10).map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-6 py-4 text-slate-900 font-medium">{item.exam_title}</td>
                      <td className="px-6 py-4 text-slate-600">{item.exam_subject}</td>
                      <td className="px-6 py-4 text-slate-600">{item.score} / {item.total_points}</td>
                      <td className="px-6 py-4 text-slate-600">{Number(item.percentage).toFixed(1)}%</td>
                      <td className="px-6 py-4 text-slate-600 text-sm">{new Date(item.submitted_at).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {exams.length === 0 ? (
            <div className="bg-white/90 backdrop-blur-xl rounded-3xl p-12 border border-slate-200 text-center shadow-lg shadow-slate-200/60">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
                <svg className="h-7 w-7 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10m-10 4h6m-9 5h12a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v11a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-2">No practice exams available</h3>
              <p className="text-slate-600">Check back later for practice exams.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {exams.map((exam) => (
                <div
                  key={exam.id}
                  className="bg-white/90 backdrop-blur-xl rounded-3xl p-6 border border-slate-200 shadow-lg shadow-slate-200/60 hover:-translate-y-1 transition-all"
                >
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <span className="px-3 py-1 rounded-full text-xs font-semibold uppercase bg-sky-100 text-sky-700">
                          Practice Mode
                        </span>
                        <span className="px-3 py-1 rounded-full text-xs font-semibold uppercase bg-blue-100 text-blue-700">
                          {exam.subject}
                        </span>
                      </div>
                      <h3 className="text-xl font-semibold text-slate-900 mb-2">{exam.title}</h3>
                      <div className="flex flex-wrap gap-6 text-sm text-slate-600">
                        <div>
                          <span className="font-medium">Questions:</span> {exam.question_count}
                        </div>
                        <div>
                          <span className="font-medium">Total Points:</span> {exam.total_points}
                        </div>
                      </div>
                    </div>
                    <Link
                      href={`/practice/${exam.id}`}
                      className="px-5 py-3 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-all font-semibold shadow-lg shadow-slate-900/20"
                    >
                      Start Practice
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>

        <Footer />
      </div>
    </div>
  );
}
