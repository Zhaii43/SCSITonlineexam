"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

import { API_URL } from "@/lib/api";
export default function TakePracticeExam() {
  const router = useRouter();
  const params = useParams();
  const examId = params.id;
  const [loading, setLoading] = useState(true);
  const [exam, setExam] = useState<any>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [showResults, setShowResults] = useState(false);
  const [results, setResults] = useState<any>(null);

  useEffect(() => {
    fetchExam();
  }, [examId]);

  const fetchExam = async () => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      router.push("/login");
      return;
    }

    try {
      const res = await fetch(`${API_URL}/exams/practice/${examId}/`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        setExam(data);
      }
      setLoading(false);
    } catch (err) {
      console.error(err);
      router.push("/practice");
    }
  };

  const handleSubmit = async () => {
    const token = localStorage.getItem("access_token");

    try {
      const res = await fetch(`${API_URL}/exams/practice/${examId}/submit/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ answers }),
      });

      if (res.ok) {
        const data = await res.json();
        setResults(data);
        setShowResults(true);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRetry = () => {
    setAnswers({});
    setShowResults(false);
    setResults(null);
    window.scrollTo(0, 0);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-50 via-blue-50 to-cyan-50 flex items-center justify-center">
        <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-2 border-sky-600"></div>
      </div>
    );
  }

  if (!exam) return null;

  if (showResults && results) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-50 via-blue-50 to-cyan-50">
        <Header />
        <main className="max-w-5xl mx-auto px-4 py-12">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900">{exam.title} - Results</h1>
            <p className="text-slate-600">Practice Mode - Results saved to your practice history</p>
          </div>

          <div className="bg-white/60 backdrop-blur-xl rounded-2xl p-6 mb-8 border border-sky-200/50">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Your Score</h2>
            <div className="flex items-center gap-8">
              <div>
                <p className="text-sm text-slate-600">Score</p>
                <p className="text-3xl font-bold text-sky-600">{results.score}/{results.total_points}</p>
              </div>
              <div>
                <p className="text-sm text-slate-600">Percentage</p>
                <p className="text-3xl font-bold text-blue-600">{results.percentage}%</p>
              </div>
            </div>
          </div>

          <div className="space-y-6 mb-8">
            {results.results.map((q: any, index: number) => (
              <div
                key={q.question_id}
                className={`bg-white/60 backdrop-blur-xl rounded-2xl p-6 border ${
                  q.is_correct ? "border-green-200" : "border-red-200"
                }`}
              >
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-bold text-slate-900">Question {index + 1}</h3>
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                    q.is_correct ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                  }`}>
                    {q.is_correct ? "✓ Correct" : "✗ Incorrect"}
                  </span>
                </div>
                <p className="text-slate-900 mb-4">{q.question}</p>

                {q.type === "multiple_choice" && Array.isArray(q.options) && (
                  <div className="space-y-2 mb-4">
                    {q.options.map((option: string) => (
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
                        {option === q.correct_answer && <span className="ml-2 text-green-600 font-semibold">✓</span>}
                        {option === q.student_answer && !q.is_correct && <span className="ml-2 text-red-600 font-semibold">✗</span>}
                      </div>
                    ))}
                  </div>
                )}

                {q.type !== "multiple_choice" && (
                  <div className="space-y-3">
                    <div className={`p-4 rounded-lg ${q.is_correct ? "bg-green-50" : "bg-red-50"}`}>
                      <p className="text-sm font-medium mb-1">Your Answer:</p>
                      <p>{q.student_answer || "(No answer)"}</p>
                    </div>
                    <div className="p-4 rounded-lg bg-green-50">
                      <p className="text-sm font-medium mb-1">Correct Answer:</p>
                      <p>{q.correct_answer}</p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="flex gap-4">
            <button
              onClick={handleRetry}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-sky-500 to-blue-500 text-white rounded-lg hover:shadow-xl hover:shadow-sky-500/30 transition-all font-medium"
            >
              Try Again
            </button>
            <Link
              href="/practice"
              className="flex-1 px-6 py-3 bg-white border border-sky-200 text-sky-600 rounded-lg hover:bg-sky-50 transition-all font-medium text-center"
            >
              Back to Practice Exams
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-blue-50 to-cyan-50">
      <Header />
      <main className="max-w-5xl mx-auto px-4 py-12">
        <div className="mb-8">
          <Link href="/practice" className="text-sky-600 hover:text-sky-700 font-medium">
            ← Back to Practice Exams
          </Link>
          <h1 className="text-3xl font-bold text-slate-900 mt-4">{exam.title}</h1>
          <p className="text-slate-600">Practice Mode - No grades will be recorded</p>
        </div>

        <div className="bg-sky-50 border border-sky-200 rounded-xl p-4 mb-8">
          <p className="text-sky-900 font-medium">💡 Practice Mode: Take your time and learn! You can retry as many times as you want.</p>
        </div>

        <div className="space-y-6 mb-8">
          {exam.questions.map((q: any, index: number) => (
            <div key={q.id} className="bg-white/60 backdrop-blur-xl rounded-2xl p-6 border border-sky-200/50">
              <h3 className="text-lg font-bold text-slate-900 mb-4">Question {index + 1}</h3>
              <p className="text-slate-900 mb-4">{q.question}</p>

              {q.type === "multiple_choice" && Array.isArray(q.options) && (
                <div className="space-y-2">
                  {q.options.map((option: string) => (
                    <label
                      key={option}
                      className="flex items-center p-3 border border-slate-200 rounded-lg hover:bg-sky-50 cursor-pointer transition-colors"
                    >
                      <input
                        type="radio"
                        name={`question-${q.id}`}
                        value={option}
                        checked={answers[q.id] === option}
                        onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                        className="mr-3"
                      />
                      <span>{option}</span>
                    </label>
                  ))}
                </div>
              )}

              {q.type === "identification" && (
                <input
                  type="text"
                  value={answers[q.id] || ""}
                  onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                  className="w-full px-4 py-3 border border-sky-200 rounded-xl focus:ring-2 focus:ring-sky-500"
                  placeholder="Type your answer here..."
                />
              )}

              {(q.type === "essay" || q.type === "enumeration") && (
                <textarea
                  value={answers[q.id] || ""}
                  onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                  className="w-full px-4 py-3 border border-sky-200 rounded-xl focus:ring-2 focus:ring-sky-500"
                  rows={4}
                  placeholder="Type your answer here..."
                />
              )}
            </div>
          ))}
        </div>

        <button
          onClick={handleSubmit}
          className="w-full px-6 py-4 bg-gradient-to-r from-sky-500 to-blue-500 text-white rounded-xl hover:shadow-xl hover:shadow-sky-500/30 transition-all font-bold text-lg"
        >
          Check Answers
        </button>
      </main>
      <Footer />
    </div>
  );
}
