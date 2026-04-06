// app/exam/questions/[id]/page.tsx
"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import RoleShell from "@/components/RoleShell";

import { API_URL } from "@/lib/api";
interface Question {
  question: string;
  type: string;
  options?: string[];
  correct_answer: string;
  points: number;
}

interface ExamDetail {
  title: string;
  subject: string;
  question_type: string;
  total_points: number;
}

const QUESTION_TYPES = [
  { value: "multiple_choice", label: "Multiple Choice" },
  { value: "identification", label: "Identification" },
  { value: "enumeration", label: "Enumeration" },
  { value: "essay", label: "Essay" },
];

export default function AddQuestions() {
  const router = useRouter();
  const params = useParams();
  const examIdParam = params.id;
  const examId = Array.isArray(examIdParam) ? examIdParam[0] : examIdParam;
  const [role, setRole] = useState<"" | "instructor" | "dean">("");
  
  const [exam, setExam] = useState<ExamDetail | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<Question>({
    question: "",
    type: "multiple_choice",
    options: ["", "", "", ""],
    correct_answer: "",
    points: 1,
  });
  const [selectedQuestionType, setSelectedQuestionType] = useState("multiple_choice");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [questionsSaved, setQuestionsSaved] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedRole = window.localStorage.getItem("user_role");
      if (storedRole === "instructor" || storedRole === "dean") {
        setRole(storedRole);
      }
    }
  }, []);

  const dashboardHref = role === "dean" ? "/dashboard/dean" : "/dashboard/teacher";
  const examDetailsHref = `/exam/create?examId=${examId}`;

  const fetchExam = useCallback(async () => {
    const token = localStorage.getItem("access_token");
    try {
      const res = await fetch(`${API_URL}/exams/${examId}/detail/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setExam(data);
        const initialType = data.question_type === "mixed" ? "multiple_choice" : data.question_type;
        setCurrentQuestion(prev => ({ ...prev, type: initialType }));
        setSelectedQuestionType(initialType);
      }
      setLoading(false);
    } catch {
      setError("Failed to load exam");
      setLoading(false);
    }
  }, [examId]);

  useEffect(() => {
    fetchExam();
  }, [fetchExam]);

  const addQuestion = () => {
    if (!currentQuestion.question || !currentQuestion.correct_answer) {
      alert("Please fill in question and correct answer");
      return;
    }

    if (!exam) {
      alert("Exam details are still loading. Please try again.");
      return;
    }

    const totalPoints = questions.reduce((sum, q) => sum + q.points, 0) + currentQuestion.points;
    if (totalPoints > exam.total_points) {
      alert(`Total points cannot exceed ${exam.total_points}`);
      return;
    }

    setQuestions([...questions, currentQuestion]);
    const resetType = exam.question_type === "mixed" ? "multiple_choice" : exam.question_type;
    setCurrentQuestion({
      question: "",
      type: resetType,
      options: ["", "", "", ""],
      correct_answer: "",
      points: 1,
    });
    setSelectedQuestionType(resetType);
  };

  const removeQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (questions.length === 0) {
      alert("Please add at least one question");
      return;
    }

    setSaving(true);
    const token = localStorage.getItem("access_token");
    
    try {
      const res = await fetch(`/api/exams/${examId}/questions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ questions }),
      });

      if (!res.ok) throw new Error("Failed to save questions");

      setQuestionsSaved(true);
      router.push(dashboardHref);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save questions");
    } finally {
      setSaving(false);
    }
  };

  const handleImportCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      alert('Please upload a CSV file');
      return;
    }

    setImporting(true);
    const token = localStorage.getItem("access_token");
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch(`${API_URL}/exams/${examId}/questions/import/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        // Show mismatched department rows clearly
        if (data.mismatched_rows?.length) {
          const details = data.mismatched_rows
            .slice(0, 5)
            .map((r: any) => `Row ${r.row}: "${r.question}..." (department: ${r.department})`)
            .join('\n');
          throw new Error(`${data.error}\n\n${details}`);
        }
        throw new Error(data.error || 'Failed to import questions');
      }

      alert(`Successfully imported ${data.count} questions!`);
      setQuestionsSaved(true);
      router.push(dashboardHref);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to import questions";
      setError(message);
      alert(message);
    } finally {
      setImporting(false);
      setShowImportModal(false);
    }
  };

  const discardDraft = async () => {
    const token = localStorage.getItem("access_token");
    if (!token || !examId) return;
    try {
      await fetch(`${API_URL}/exams/${examId}/discard-draft/`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch {}
  };

  const totalPoints = questions.reduce((sum, q) => sum + q.points, 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-50 via-blue-50 to-cyan-50 flex items-center justify-center">
        <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-2 border-sky-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-blue-50 to-cyan-50">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(56,189,248,0.15),transparent_50%)]" />
      
      <div className="relative">
        <Header />
        <RoleShell>

        <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="mb-8">
            <div className="flex items-center gap-3 flex-wrap">
              <Link
                href={examDetailsHref}
                className="inline-flex items-center gap-1 text-sky-600 hover:text-sky-700 font-medium text-sm"
              >
                ← Back to Exam Details
              </Link>
              <span className="text-slate-300">|</span>
              <Link
                href={dashboardHref}
                className="inline-flex items-center gap-1 text-slate-500 hover:text-slate-700 font-medium text-sm"
              >
                Dashboard
              </Link>
            </div>
            <div className="flex justify-between items-center mt-4">
              <div>
                <h1 className="text-3xl font-bold text-slate-900 mb-2">Add Questions</h1>
                <p className="text-slate-600">{exam?.title} - {exam?.subject}</p>
              </div>
              <div className="flex items-center gap-3">
                <a
                  href="/sample_questions_template.csv"
                  download="questions_template.csv"
                  className="px-5 py-3 bg-white border border-sky-300 text-sky-700 rounded-xl hover:bg-sky-50 transition-all font-medium flex items-center gap-2 text-sm"
                >
                  ⬇️ Download CSV Template
                </a>
                <button
                  onClick={() => setShowImportModal(true)}
                  className="px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all font-medium flex items-center gap-2"
                >
                  📄 Import from CSV
                </button>
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6">
              <p>{error}</p>
              <div className="mt-3 flex flex-wrap gap-3">
                <Link
                  href={examDetailsHref}
                  className="inline-flex items-center justify-center rounded-lg bg-red-700 px-4 py-2 text-sm font-semibold text-white hover:bg-red-800 transition-all"
                >
                  Back to Exam Details
                </Link>
                <button
                  type="button"
                  onClick={() => setError(null)}
                  className="inline-flex items-center justify-center rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-100 transition-all"
                >
                  Stay Here
                </button>
              </div>
            </div>
          )}

          <div className="bg-white/60 backdrop-blur-xl rounded-2xl shadow-xl border border-sky-200/50 p-6 mb-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-slate-600">Total Points Used</p>
                <p className="text-2xl font-bold text-sky-600">{totalPoints} / {exam?.total_points}</p>
              </div>
              <div>
                <p className="text-sm text-slate-600">Questions Added</p>
                <p className="text-2xl font-bold text-green-600">{questions.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white/60 backdrop-blur-xl rounded-2xl shadow-xl border border-sky-200/50 p-6 mb-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Add New Question</h3>
            
            <div className="space-y-4">
              {exam?.question_type === "mixed" && (
                <div>
                  <label className="block text-sm font-medium text-slate-900 mb-2">Question Type *</label>
                  <select
                    value={selectedQuestionType}
                    onChange={(e) => {
                      const newType = e.target.value;
                      setSelectedQuestionType(newType);
                      setCurrentQuestion({
                        ...currentQuestion,
                        type: newType,
                        options: newType === "multiple_choice" ? ["", "", "", ""] : undefined,
                      });
                    }}
                    className="w-full px-4 py-3 border border-sky-200 rounded-xl bg-white/80 focus:ring-2 focus:ring-sky-500 text-slate-900"
                  >
                    {QUESTION_TYPES.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-900 mb-2">Question *</label>
                <textarea
                  value={currentQuestion.question}
                  onChange={(e) => setCurrentQuestion({...currentQuestion, question: e.target.value})}
                  rows={3}
                  className="w-full px-4 py-3 border border-sky-200 rounded-xl bg-white/80 focus:ring-2 focus:ring-sky-500 text-slate-900"
                  placeholder="Enter your question..."
                />
              </div>

              {(exam?.question_type === "multiple_choice" || (exam?.question_type === "mixed" && selectedQuestionType === "multiple_choice")) && (
                <div>
                  <label className="block text-sm font-medium text-slate-900 mb-2">Options *</label>
                  {currentQuestion.options?.map((opt, i) => (
                    <input
                      key={i}
                      value={opt}
                      onChange={(e) => {
                        const newOpts = [...(currentQuestion.options || [])];
                        newOpts[i] = e.target.value;
                        setCurrentQuestion({...currentQuestion, options: newOpts});
                      }}
                      className="w-full px-4 py-3 border border-sky-200 rounded-xl bg-white/80 mb-2 focus:ring-2 focus:ring-sky-500 text-slate-900"
                      placeholder={`Option ${i + 1}`}
                    />
                  ))}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-900 mb-2">Correct Answer *</label>
                  <input
                    value={currentQuestion.correct_answer}
                    onChange={(e) => setCurrentQuestion({...currentQuestion, correct_answer: e.target.value})}
                    className="w-full px-4 py-3 border border-sky-200 rounded-xl bg-white/80 focus:ring-2 focus:ring-sky-500 text-slate-900"
                    placeholder="Enter correct answer"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-900 mb-2">Points *</label>
                  <input
                    type="number"
                    value={currentQuestion.points}
                    onChange={(e) => setCurrentQuestion({...currentQuestion, points: parseInt(e.target.value) || 0})}
                    min="1"
                    className="w-full px-4 py-3 border border-sky-200 rounded-xl bg-white/80 focus:ring-2 focus:ring-sky-500 text-slate-900"
                  />
                </div>
              </div>

              <button
                onClick={addQuestion}
                className="w-full bg-sky-600 text-white py-3 rounded-xl hover:bg-sky-700 transition-all font-medium"
              >
                + Add Question
              </button>
            </div>
          </div>

          {questions.length > 0 && (
            <div className="space-y-4 mb-6">
              <h3 className="text-lg font-semibold text-slate-900">Questions ({questions.length})</h3>
              {questions.map((q, i) => (
                <div key={i} className="bg-white/60 backdrop-blur-xl rounded-2xl border border-sky-200/50 p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="font-semibold text-slate-900">{i + 1}. {q.question}</p>
                      <p className="text-sm text-slate-600 mt-1">Type: {QUESTION_TYPES.find(t => t.value === q.type)?.label || q.type}</p>
                      <p className="text-sm text-slate-600 mt-1">Answer: {q.correct_answer}</p>
                      <p className="text-sm text-sky-600 mt-1">{q.points} points</p>
                    </div>
                    <button
                      onClick={() => removeQuestion(i)}
                      className="text-red-600 hover:text-red-700 font-medium"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-4">
            <Link
              href={dashboardHref}
              className="flex-1 px-6 py-3 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 transition-all font-medium text-center"
            >
              Save as Draft & Exit
            </Link>
            <button
              onClick={handleSave}
              disabled={saving || questions.length === 0}
              className="flex-1 bg-gradient-to-r from-sky-500 to-blue-500 text-white py-3 rounded-xl hover:shadow-xl transition-all font-medium disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Questions"}
            </button>
          </div>

          {/* CSV Import Modal */}
          {showImportModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4">
                <h3 className="text-2xl font-bold text-slate-900 mb-4">Import Questions from CSV</h3>
                
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-4 text-sm text-slate-700 space-y-1">
                  <p className="font-semibold text-slate-900 mb-2">Required columns:</p>
                  <p><span className="font-mono bg-white border border-slate-200 px-1 rounded">question</span> — the question text</p>
                  <p><span className="font-mono bg-white border border-slate-200 px-1 rounded">type</span> — <span className="font-mono">multiple_choice</span> | <span className="font-mono">identification</span> | <span className="font-mono">enumeration</span> | <span className="font-mono">essay</span></p>
                  <p><span className="font-mono bg-white border border-slate-200 px-1 rounded">options</span> — for multiple choice only, separate with <span className="font-mono">|</span> e.g. <span className="font-mono">A|B|C|D</span></p>
                  <p><span className="font-mono bg-white border border-slate-200 px-1 rounded">correct_answer</span> — exact answer text</p>
                  <p><span className="font-mono bg-white border border-slate-200 px-1 rounded">points</span> — numeric value e.g. <span className="font-mono">2</span></p>
                  <p><span className="font-mono bg-white border border-slate-200 px-1 rounded">department</span> — must match this exam&apos;s department (e.g. <span className="font-mono">BSIT</span>, <span className="font-mono">BSED</span>). Rows with a different department will be <span className="text-red-600 font-semibold">rejected</span>. Leave blank to skip the check.</p>
                  <p className="pt-1 text-amber-700 font-medium">⚠️ Importing replaces all existing questions for this exam.</p>
                </div>

                <a
                  href="/sample_questions_template.csv"
                  download="questions_template.csv"
                  className="flex items-center justify-center gap-2 w-full px-4 py-2.5 mb-4 bg-sky-50 border border-sky-300 text-sky-700 rounded-xl hover:bg-sky-100 transition-all font-semibold text-sm"
                >
                  ⬇️ Download CSV Template
                </a>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-700 mb-2">Select CSV File</label>
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleImportCSV}
                    disabled={importing}
                    className="w-full px-4 py-3 border border-sky-200 rounded-xl bg-white focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowImportModal(false)}
                    disabled={importing}
                    className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
        </RoleShell>
        <Footer />
      </div>
    </div>
  );
}
