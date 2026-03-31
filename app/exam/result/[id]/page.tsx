"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ReportIssueModal from "@/components/ReportIssueModal";

import { API_URL } from "@/lib/api";

export default function ExamReview() {
  const router = useRouter();
  const params = useParams();
  const resultIdParam = params?.id;
  const resultId = Array.isArray(resultIdParam) ? resultIdParam[0] : resultIdParam;
  const [loading, setLoading] = useState(true);
  const [review, setReview] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [questionToReport, setQuestionToReport] = useState<any>(null);

  useEffect(() => {
    if (!resultId) {
      setError("Missing result id.");
      setLoading(false);
      return;
    }
    fetchReview();
  }, [resultId]);

  const fetchReview = async () => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      router.push("/login");
      return;
    }

    try {
      const res = await fetch(`${API_URL}/exams/result/${resultId}/review/`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        if (res.status === 403 && (data.error || "").toLowerCase().includes("not yet graded")) {
          setReview({ pending: true });
          return;
        }
        throw new Error(data.error || "Failed to fetch review");
      }

      const data = await res.json();
      setReview(data);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Failed to load exam result.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-50 via-blue-50 to-cyan-50 flex items-center justify-center">
        <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-2 border-sky-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-50 via-blue-50 to-cyan-50">
        <Header />
        <div className="max-w-md mx-auto px-4 py-16">
          <div className="bg-white/70 backdrop-blur-xl rounded-2xl border border-sky-200/60 shadow-xl p-8 text-center">
            <div className="text-4xl mb-3">!</div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">Unable to Load Result</h2>
            <p className="text-slate-600 mb-6">{error}</p>
            <Link
              href="/dashboard/student"
              className="inline-flex bg-slate-900 text-white px-5 py-3 rounded-xl hover:bg-slate-800 transition-all font-semibold"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!review) return null;

  if ((review as any).pending) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-50 via-blue-50 to-cyan-50">
        <Header />
        <div className="max-w-md mx-auto px-4 py-16">
          <div className="bg-white/70 backdrop-blur-xl rounded-2xl border border-amber-200 shadow-xl p-8 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
              <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">Result Pending</h2>
            <p className="text-slate-600 mb-6">Your exam has been submitted and is waiting to be graded by your instructor. Check back later.</p>
            <Link href="/dashboard/student" className="inline-flex bg-slate-900 text-white px-5 py-3 rounded-xl hover:bg-slate-800 transition-all font-semibold">
              Back to Dashboard
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const { exam, result } = review;
  const questions = Array.isArray(review?.questions) ? review.questions : [];
  const correctCount = questions.filter((q: any) => q.is_correct).length;
  const gradeValue = Number.parseFloat(String(result?.grade ?? "0"));

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-blue-50 to-cyan-50">
      <Header />

      <main className="max-w-5xl mx-auto px-4 py-12">
        <div className="mb-8">
          <Link href="/dashboard/student" className="text-sky-600 hover:text-sky-700 font-medium">
            Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-slate-900 mt-4">{exam.title} - Review</h1>
          <p className="text-slate-600">{exam.subject}</p>
        </div>

        <div className="bg-white/60 backdrop-blur-xl rounded-2xl shadow-xl border border-sky-200/50 p-6 mb-8">
          <h2 className="text-xl font-bold text-slate-900 mb-4">Your Result</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-slate-600">Score</p>
              <p className="text-2xl font-bold text-sky-600">{result.score}/{result.total_points}</p>
              {result.penalty_percent > 0 && (
                <p className="text-xs text-red-500 mt-1">Before penalty: {result.score_before_penalty} pts (-{result.penalty_percent}%)</p>
              )}
            </div>
            <div>
              <p className="text-sm text-slate-600">Percentage</p>
              <p className="text-2xl font-bold text-blue-600">{result.percentage.toFixed(1)}%</p>
            </div>
            <div>
              <p className="text-sm text-slate-600">Grade</p>
              <p className={`text-2xl font-bold ${gradeValue <= 3.0 ? "text-green-600" : "text-red-600"}`}>
                {result?.grade}
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-600">Remarks</p>
              <p className={`text-2xl font-bold ${result.remarks === "Passed" ? "text-green-600" : "text-red-600"}`}>
                {result.remarks}
              </p>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-slate-200">
            <p className="text-sm text-slate-600">
              Correct Answers: <span className="font-bold text-green-600">{correctCount}</span> / {questions.length}
            </p>
          </div>
        </div>

        <div className="space-y-6">
          {questions.map((q: any, index: number) => (
            <div
              key={q.id}
              className={`bg-white/60 backdrop-blur-xl rounded-2xl shadow-xl border p-6 ${
                q.is_correct ? "border-green-200" : "border-red-200"
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-lg font-bold text-slate-900">Question {index + 1}</h3>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setQuestionToReport({ ...q, order: index + 1 })}
                    className="rounded-full border border-amber-200 bg-white px-3 py-1 text-xs font-semibold text-amber-700 hover:bg-amber-50"
                  >
                    Report Issue
                  </button>
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                    q.is_correct ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                  }`}>
                    {q.is_correct ? "Correct" : "Incorrect"}
                  </span>
                </div>
              </div>

              <p className="text-slate-900 mb-4">{q.question}</p>

              {q.type === "multiple_choice" && q.options && (
                <div className="space-y-2 mb-4">
                  {(q.options as string[]).map((option: string) => (
                    <div
                      key={option}
                      className={`p-3 rounded-lg border ${
                        option === q.correct_answer
                          ? "bg-green-50 border-green-300"
                          : option === q.student_answer && !q.is_correct
                          ? "bg-red-50 border-red-300"
                          : "bg-slate-50 border-slate-200"
                      }`}
                    >
                      {option}
                      {option === q.correct_answer && (
                        <span className="ml-2 text-green-600 font-semibold">Correct Answer</span>
                      )}
                      {option === q.student_answer && !q.is_correct && (
                        <span className="ml-2 text-red-600 font-semibold">Your Answer</span>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {q.type !== "multiple_choice" && (
                <div className="space-y-3">
                  <div className={`p-4 rounded-lg ${
                    q.is_correct ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"
                  }`}>
                    <p className="text-sm font-medium text-slate-700 mb-1">Your Answer:</p>
                    <p className="text-slate-900">{q.student_answer || "(No answer provided)"}</p>
                  </div>
                  <div className="p-4 rounded-lg bg-green-50 border border-green-200">
                    <p className="text-sm font-medium text-slate-700 mb-1">Correct Answer:</p>
                    <p className="text-slate-900">{q.correct_answer}</p>
                  </div>
                </div>
              )}

              <div className="mt-4 pt-4 border-t border-slate-200">
                <p className="text-sm text-slate-600">
                  Points: <span className="font-bold">{q.points}</span>
                </p>
              </div>
            </div>
          ))}
        </div>
      </main>

      {questionToReport && (
        <ReportIssueModal
          examId={exam.id}
          question={questionToReport}
          reportedAnswer={questionToReport.student_answer || ""}
          onClose={() => setQuestionToReport(null)}
        />
      )}

      <Footer />
    </div>
  );
}
