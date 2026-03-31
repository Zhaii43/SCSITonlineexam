"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import InstructorShell from "@/components/InstructorShell";
import { useToast } from "@/components/ToastProvider";
import { API_URL } from "@/lib/api";

type QuestionWithAnswer = {
  id: number;
  question: string;
  type: string;
  points: number;
  student_answer?: string | null;
  correct_answer?: string | null;
};

type SubmissionResult = {
  id: number;
  student_name: string;
  student_id: string;
  score: number;
  score_before_penalty?: number;
  total_points: number;
  penalty_percent?: number;
  is_graded: boolean;
  submitted_at: string;
  questions_with_answers?: QuestionWithAnswer[];
};

type ExamData = {
  id: number;
  title: string;
  subject?: string;
};

type ResultsResponse = {
  exam: ExamData;
  results: SubmissionResult[];
};

export default function GradeExam() {
  const router = useRouter();
  const params = useParams();
  const toast = useToast();
  const examIdParam = params?.id;
  const examId = Array.isArray(examIdParam) ? examIdParam[0] : examIdParam;

  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [exam, setExam] = useState<ExamData | null>(null);
  const [results, setResults] = useState<SubmissionResult[]>([]);
  const [selectedResultId, setSelectedResultId] = useState<number | null>(null);
  const [manualScores, setManualScores] = useState<Record<number, number>>({});
  const [grading, setGrading] = useState(false);
  const [gradingMessage, setGradingMessage] = useState<string | null>(null);
  const [gradingError, setGradingError] = useState<string | null>(null);

  const fetchResults = useCallback(async () => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      router.push("/login");
      return;
    }

    if (!examId) {
      setFetchError("Missing exam ID.");
      setLoading(false);
      return;
    }

    try {
      setFetchError(null);
      const res = await fetch(`${API_URL}/exams/${examId}/results/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = (await res.json().catch(() => null)) as ResultsResponse | { error?: string } | null;
      if (!res.ok) {
        throw new Error((data && "error" in data && data.error) || "Failed to load results.");
      }
      setExam(data && "exam" in data ? data.exam : null);
      setResults(data && "results" in data ? data.results : []);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load results.";
      setFetchError(message);
    } finally {
      setLoading(false);
    }
  }, [examId, router]);

  useEffect(() => {
    fetchResults();
  }, [fetchResults]);

  const pendingResults = useMemo(
    () => results.filter((result) => !result.is_graded),
    [results]
  );

  const selectedResult =
    pendingResults.find((result) => result.id === selectedResultId) ?? null;

  const handleSelectResult = (result: SubmissionResult) => {
    setSelectedResultId(result.id);
    setManualScores({});
    setGradingMessage(null);
    setGradingError(null);
  };

  const handleManualScoreChange = (questionId: number, maxPoints: number, rawValue: string) => {
    const parsed = Number.parseInt(rawValue, 10);
    const nextValue = Number.isNaN(parsed) ? 0 : Math.min(Math.max(parsed, 0), maxPoints);
    setManualScores((prev) => ({ ...prev, [questionId]: nextValue }));
  };

  const handleGrade = async () => {
    if (!selectedResult) return;

    const token = localStorage.getItem("access_token");
    if (!token) {
      router.push("/login");
      return;
    }

    setGrading(true);
    setGradingError(null);
    setGradingMessage(null);

    try {
      const res = await fetch(`${API_URL}/exams/result/${selectedResult.id}/grade/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ manual_scores: manualScores }),
      });

      const data = (await res.json().catch(() => null)) as { error?: string; message?: string } | null;
      if (!res.ok) {
        throw new Error(data?.error || "Failed to submit grade.");
      }

      const successMessage = data?.message || "Submission graded successfully.";
      setGradingMessage(successMessage);
      toast.success(successMessage);
      setSelectedResultId(null);
      setManualScores({});
      await fetchResults();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to submit grade.";
      setGradingError(message);
      toast.error(message);
    } finally {
      setGrading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-50 via-blue-50 to-cyan-50">
        <div className="relative">
          <Header />
          <InstructorShell>
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16" style={{ fontFamily: "'Space Grotesk', 'Manrope', sans-serif" }}>
              <div className="rounded-3xl border border-slate-200 bg-white/90 p-10 shadow-xl shadow-slate-200/60" aria-busy="true">
                <div className="flex flex-col items-center justify-center gap-4 py-12 text-center">
                  <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-lg">
                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-sky-500" />
                  </div>
                  <div>
                    <h1 className="text-xl font-semibold text-slate-900">Loading grading workspace</h1>
                    <p className="mt-1 text-sm text-slate-500">Pulling student submissions and exam details.</p>
                  </div>
                </div>
              </div>
            </main>
          </InstructorShell>
          <Footer />
        </div>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-50 via-blue-50 to-cyan-50">
        <div className="relative">
          <Header />
          <InstructorShell>
            <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16" style={{ fontFamily: "'Space Grotesk', 'Manrope', sans-serif" }}>
              <div className="rounded-3xl border border-red-200 bg-white/90 p-8 shadow-xl shadow-red-100/60">
                <div className="flex items-start gap-4">
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-600">
                    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 4h.01M10.29 3.86l-7.5 13A1.5 1.5 0 004.09 19h15.82a1.5 1.5 0 001.3-2.14l-7.5-13a1.5 1.5 0 00-2.62 0z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h1 className="text-2xl font-semibold text-slate-900">Unable to load grading page</h1>
                    <p className="mt-2 text-sm text-slate-600" role="alert">{fetchError}</p>
                    <div className="mt-6 flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          setLoading(true);
                          fetchResults();
                        }}
                        className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800"
                      >
                        Try Again
                      </button>
                      <Link
                        href="/dashboard/teacher"
                        className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        Back to Dashboard
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </main>
          </InstructorShell>
          <Footer />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-blue-50 to-cyan-50">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_10%,rgba(14,165,233,0.18),transparent_55%),radial-gradient(circle_at_90%_0%,rgba(251,146,60,0.14),transparent_40%),radial-gradient(circle_at_50%_90%,rgba(16,185,129,0.12),transparent_45%)]" />
      <div className="relative">
        <Header />
        <InstructorShell>
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10" style={{ fontFamily: "'Space Grotesk', 'Manrope', sans-serif" }}>
            <div className="mb-6 rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-xl shadow-slate-200/60">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <Link
                    href={`/exam/${examId}/results`}
                    className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-600 hover:text-slate-900"
                  >
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-100">
                      <svg className="h-4 w-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </span>
                    Back to Results
                  </Link>
                  <h1 className="mt-4 text-2xl font-semibold text-slate-900 sm:text-3xl">Grade Exam Submissions</h1>
                  <p className="mt-2 text-sm text-slate-600">{exam?.title}{exam?.subject ? ` • ${exam.subject}` : ""}</p>
                </div>
                <div className="rounded-2xl border border-sky-100 bg-sky-50 px-4 py-3 text-sm text-sky-900">
                  <p className="text-xs font-semibold uppercase tracking-wide text-sky-700">Pending Queue</p>
                  <p className="mt-1 text-2xl font-bold">{pendingResults.length}</p>
                </div>
              </div>
            </div>

            {(gradingMessage || gradingError) && (
              <div
                className={`mb-6 rounded-2xl border px-4 py-3 text-sm ${
                  gradingError
                    ? "border-red-200 bg-red-50 text-red-700"
                    : "border-emerald-200 bg-emerald-50 text-emerald-700"
                }`}
                role={gradingError ? "alert" : "status"}
              >
                {gradingError || gradingMessage}
              </div>
            )}

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
              <aside className="rounded-3xl border border-slate-200 bg-white/90 p-5 shadow-xl shadow-slate-200/60">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">Pending Grading</h2>
                    <p className="text-sm text-slate-500">Choose a student to review answers and submit scores.</p>
                  </div>
                  <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-700">
                    {pendingResults.length}
                  </span>
                </div>

                {pendingResults.length === 0 ? (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-8 text-center">
                    <div className="mx-auto mb-3 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-slate-500 shadow-sm">
                      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <h3 className="text-base font-semibold text-slate-900">Everything is graded</h3>
                    <p className="mt-1 text-sm text-slate-500">New submissions will appear here automatically.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {pendingResults.map((result) => {
                      const isActive = selectedResultId === result.id;
                      return (
                        <button
                          key={result.id}
                          type="button"
                          onClick={() => handleSelectResult(result)}
                          className={`w-full rounded-2xl border p-4 text-left transition-all focus:outline-none focus:ring-2 focus:ring-sky-400 ${
                            isActive
                              ? "border-sky-300 bg-sky-50 shadow-md shadow-sky-100"
                              : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                          }`}
                          aria-pressed={isActive}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="font-semibold text-slate-900">{result.student_name}</p>
                              <p className="mt-1 text-sm text-slate-600">{result.student_id}</p>
                            </div>
                            {isActive && (
                              <span className="rounded-full bg-sky-600 px-2.5 py-1 text-[11px] font-semibold uppercase text-white">
                                Active
                              </span>
                            )}
                          </div>
                          <p className="mt-3 text-xs text-slate-500">
                            Submitted {new Date(result.submitted_at).toLocaleString()}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                )}
              </aside>

              <section className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-xl shadow-slate-200/60">
                {!selectedResult ? (
                  <div className="flex min-h-[420px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-6 py-12 text-center">
                    <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-slate-500 shadow-sm">
                      <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-semibold text-slate-900">Select a submission</h3>
                    <p className="mt-2 max-w-md text-sm text-slate-500">
                      Pick a student from the queue on the left to review answers, apply manual scores, and finalize grading.
                    </p>
                  </div>
                ) : (
                  <div>
                    <div className="mb-6 flex flex-col gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <h2 className="text-2xl font-semibold text-slate-900">{selectedResult.student_name}</h2>
                        <p className="mt-1 text-sm text-slate-600">{selectedResult.student_id}</p>
                        <p className="mt-2 text-xs uppercase tracking-wide text-slate-500">
                          Submitted {new Date(selectedResult.submitted_at).toLocaleString()}
                        </p>
                      </div>
                      <div className="grid grid-cols-2 gap-3 sm:min-w-[240px]">
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Current Score</p>
                          <p className="mt-1 text-xl font-bold text-sky-700">
                            {selectedResult.score} / {selectedResult.total_points}
                          </p>
                        </div>
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Penalty</p>
                          <p className="mt-1 text-xl font-bold text-slate-900">
                            {selectedResult.penalty_percent ? `${selectedResult.penalty_percent}%` : "None"}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-5">
                      {selectedResult.questions_with_answers?.map((question, index) => {
                        const autoCorrect =
                          (question.type === "multiple_choice" || question.type === "identification") &&
                          (question.student_answer || "").trim().toLowerCase() === (question.correct_answer || "").trim().toLowerCase();

                        return (
                          <article key={question.id} className="rounded-2xl border border-sky-100 bg-sky-50/50 p-5">
                            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                              <div>
                                <h3 className="text-lg font-semibold text-slate-900">Question {index + 1}</h3>
                                <p className="mt-2 text-sm leading-relaxed text-slate-700">{question.question}</p>
                              </div>
                              <span className="inline-flex w-fit rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-wide text-sky-700 ring-1 ring-sky-200">
                                {question.type} • {question.points} pts
                              </span>
                            </div>

                            {(question.type === "multiple_choice" || question.type === "identification") ? (
                              <div className="space-y-3">
                                <div className="rounded-xl border border-slate-200 bg-white p-4">
                                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Student Answer</p>
                                  <p className="mt-2 text-sm font-medium text-slate-900">{question.student_answer || "No answer provided"}</p>
                                </div>
                                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                                  <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Correct Answer</p>
                                  <p className="mt-2 text-sm font-medium text-emerald-900">{question.correct_answer || "No answer set"}</p>
                                </div>
                                <p className={`text-sm font-semibold ${autoCorrect ? "text-emerald-700" : "text-red-600"}`}>
                                  {autoCorrect ? `Correct (+${question.points} pts)` : "Incorrect (0 pts)"}
                                </p>
                              </div>
                            ) : (
                              <div className="space-y-4">
                                <div className="rounded-xl border border-slate-200 bg-white p-4">
                                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Student Answer</p>
                                  <p className="mt-2 whitespace-pre-wrap text-sm text-slate-900">
                                    {question.student_answer || "No answer provided"}
                                  </p>
                                </div>
                                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                                  <label htmlFor={`score-${question.id}`} className="text-sm font-semibold text-slate-900">
                                    Award Points
                                  </label>
                                  <div className="flex items-center gap-3">
                                    <input
                                      id={`score-${question.id}`}
                                      type="number"
                                      min="0"
                                      max={question.points}
                                      value={manualScores[question.id] ?? 0}
                                      onChange={(e) => handleManualScoreChange(question.id, question.points, e.target.value)}
                                      className="w-24 rounded-xl border border-sky-300 px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                                      aria-describedby={`score-help-${question.id}`}
                                    />
                                    <span id={`score-help-${question.id}`} className="text-sm text-slate-500">
                                      Max {question.points} points
                                    </span>
                                  </div>
                                </div>
                              </div>
                            )}
                          </article>
                        );
                      })}
                    </div>

                    <div className="mt-6 flex flex-col gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:justify-end">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedResultId(null);
                          setManualScores({});
                          setGradingError(null);
                          setGradingMessage(null);
                        }}
                        className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        Clear Selection
                      </button>
                      <button
                        type="button"
                        onClick={handleGrade}
                        disabled={grading}
                        className="rounded-xl bg-gradient-to-r from-emerald-500 to-green-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-500/25 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {grading ? "Submitting Grade..." : "Submit Grade"}
                      </button>
                    </div>
                  </div>
                )}
              </section>
            </div>
          </main>
        </InstructorShell>
        <Footer />
      </div>
    </div>
  );
}
