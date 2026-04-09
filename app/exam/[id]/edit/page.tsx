// app/exam/[id]/edit/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import InstructorShell from "@/components/InstructorShell";

import { API_URL } from "@/lib/api";
interface Question {
  id?: number;
  question: string;
  type: string;
  options?: string[];
  correct_answer: string;
  points: number;
  order?: number;
}

interface MonitoringSession {
  exam_id: number;
  exam_title: string;
  student_id: number;
  student_username: string;
  started_at: string;
  last_heartbeat: string;
  seconds_since_heartbeat: number;
}

interface MonitoringTermination {
  id: number;
  exam_id: number;
  student_id: number;
  termination_count?: number;
  description: string;
  timestamp: string;
}

interface MonitoringLog {
  id: number;
  action: string;
  description: string;
  exam_id?: number;
  student_id?: number;
  timestamp: string;
}

const QUESTION_TYPES = [
  { value: "multiple_choice", label: "Multiple Choice" },
  { value: "identification", label: "Identification" },
  { value: "enumeration", label: "Enumeration" },
  { value: "essay", label: "Essay" },
];

export default function EditExam() {
  const router = useRouter();
  const params = useParams();
  const examId = params.id;
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exam, setExam] = useState<any>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedQuestionType, setSelectedQuestionType] = useState("multiple_choice");
  const [currentQuestion, setCurrentQuestion] = useState<Question>({
    question: "",
    type: "multiple_choice",
    options: ["", "", "", ""],
    correct_answer: "",
    points: 1,
  });
  
  const [formData, setFormData] = useState({
    title: "",
    subject: "",
    department: "",
    exam_type: "quiz",
    question_type: "multiple_choice",
    scheduled_date: "",
    scheduled_time: "",
    duration_minutes: "",
    total_points: "",
    passing_score: "",
    instructions: "",
    preview_rules: "",
    sample_questions_text: "",
    year_level: "",
    max_attempts: "1",
    retake_policy: "none",
    question_pool_size: "0",
    shuffle_options: true,
  });
  const [monitoring, setMonitoring] = useState<{
    active_sessions: MonitoringSession[];
    latest_terminations: MonitoringTermination[];
    activity_logs: MonitoringLog[];
  }>({ active_sessions: [], latest_terminations: [], activity_logs: [] });
  const [monitoringError, setMonitoringError] = useState<string | null>(null);
  const [monitoringUpdatedAt, setMonitoringUpdatedAt] = useState<string | null>(null);

  const departments = [
    { value: "BSHM", label: "Hospitality Management" },
    { value: "BSIT", label: "Information Technology" },
    { value: "BSEE", label: "Electrical Engineering" },
    { value: "BSBA", label: "Business Administration" },
    { value: "BSCRIM", label: "Criminology" },
    { value: "BSED", label: "Education" },
    { value: "BSCE", label: "Civil Engineering" },
    { value: "BSChE", label: "Chemical Engineering" },
    { value: "BSME", label: "Mechanical Engineering" },
  ];

  const yearLevels = [
    { value: "1", label: "1st Year" },
    { value: "2", label: "2nd Year" },
    { value: "3", label: "3rd Year" },
    { value: "4", label: "4th Year" },
    { value: "5", label: "5th Year" },
  ];

  useEffect(() => {
    fetchExam();
  }, [examId]);

  useEffect(() => {
    fetchMonitoring();
    const interval = setInterval(fetchMonitoring, 5000);
    const handleFocus = () => fetchMonitoring();
    const handleVisibility = () => {
      if (document.visibilityState === "visible") fetchMonitoring();
    };
    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [examId]);

  const fetchExam = async () => {
    const token = localStorage.getItem("access_token");
    try {
      const res = await fetch(`${API_URL}/exams/${examId}/detail/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (!res.ok) throw new Error("Failed to load exam");
      
      const data = await res.json();
      
      setExam(data);
      
      const dateTime = new Date(data.scheduled_date);
      const date = dateTime.toISOString().split('T')[0];
      const time = dateTime.toTimeString().slice(0, 5);
      
      setFormData({
        title: data.title,
        subject: data.subject,
        department: data.department,
        exam_type: data.exam_type,
        question_type: data.question_type,
        scheduled_date: date,
        scheduled_time: time,
        duration_minutes: data.duration_minutes.toString(),
        total_points: data.total_points.toString(),
        passing_score: data.passing_score.toString(),
        instructions: data.instructions,
        preview_rules: data.preview_rules || "",
        sample_questions_text: (data.sample_questions || []).join("\n"),
        year_level: data.year_level,
        max_attempts: String(data.max_attempts ?? 1),
        retake_policy: data.retake_policy || "none",
        question_pool_size: String(data.question_pool_size ?? 0),
        shuffle_options: Boolean(data.shuffle_options ?? true),
      });
      
      if (data.questions && data.questions.length > 0) {
        setQuestions(data.questions);
      }
      
      const initialType = data.question_type === "mixed" ? "multiple_choice" : data.question_type;
      setSelectedQuestionType(initialType);
      setCurrentQuestion(prev => ({ ...prev, type: initialType }));
      
      setLoading(false);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  const fetchMonitoring = async () => {
    const token = localStorage.getItem("access_token");
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/exams/monitoring/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setMonitoringError(data.error || "Failed to load monitoring");
        return;
      }
      const data = await res.json();
      const idNum = parseInt(String(examId));
      setMonitoring({
        active_sessions: (data.active_sessions || []).filter((s: MonitoringSession) => s.exam_id === idNum),
        latest_terminations: (data.latest_terminations || []).filter((t: MonitoringTermination) => t.exam_id === idNum),
        activity_logs: (data.activity_logs || []).filter((l: MonitoringLog) => l.exam_id === idNum),
      });
      setMonitoringUpdatedAt(new Date().toLocaleTimeString());
      setMonitoringError(null);
    } catch {
      setMonitoringError("Failed to load monitoring");
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const addQuestion = () => {
    if (!currentQuestion.question || !currentQuestion.correct_answer) {
      alert("Please fill in question and correct answer");
      return;
    }

    const totalPoints = questions.reduce((sum, q) => sum + q.points, 0) + currentQuestion.points;
    if (totalPoints > parseInt(formData.total_points)) {
      alert(`Total points cannot exceed ${formData.total_points}`);
      return;
    }

    setQuestions([...questions, currentQuestion]);
    const resetType = formData.question_type === "mixed" ? "multiple_choice" : formData.question_type;
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (questions.length === 0) {
      alert("Please add at least one question");
      return;
    }
    
    setSaving(true);
    setError(null);

    const token = localStorage.getItem("access_token");
    
    try {
      const scheduledDateTime = `${formData.scheduled_date}T${formData.scheduled_time}:00`;
      
      const { sample_questions_text, ...baseData } = formData;
      const sampleQuestions = sample_questions_text
        .split("\n")
        .map(line => line.trim())
        .filter(Boolean);

      const examData = {
        ...baseData,
        scheduled_date: scheduledDateTime,
        duration_minutes: parseInt(formData.duration_minutes),
        total_points: parseInt(formData.total_points),
        passing_score: parseInt(formData.passing_score),
        max_attempts: parseInt(formData.max_attempts) || 1,
        retake_policy: formData.retake_policy,
        question_pool_size: parseInt(formData.question_pool_size) || 0,
        shuffle_options: formData.shuffle_options,
        sample_questions: sampleQuestions.length ? sampleQuestions : null,
        questions: questions,
      };

      const res = await fetch(`${API_URL}/exams/${examId}/update/`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(examData),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update exam");
      }

      router.push("/dashboard/teacher");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const totalPoints = questions.reduce((sum, q) => sum + q.points, 0);

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

  if (error && !exam) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-50 via-blue-50 to-cyan-50 flex items-center justify-center">
        <div className="relative w-full">
          <Header />
          <InstructorShell>
          <div className="flex items-center justify-center py-20 px-4">
            <div className="bg-white/60 backdrop-blur-xl rounded-2xl shadow-xl border border-red-200/50 p-8 text-center max-w-md">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-100 text-red-700">
                <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 4h.01M10.29 3.86l-7.5 13A1.5 1.5 0 004.09 19h15.82a1.5 1.5 0 001.3-2.14l-7.5-13a1.5 1.5 0 00-2.62 0z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">Cannot Load Exam</h2>
              <p className="text-slate-600 mb-6">{error}</p>
              <Link href="/dashboard/teacher" className="inline-block bg-gradient-to-r from-sky-500 to-blue-500 text-white px-6 py-3 rounded-xl hover:shadow-xl transition-all">
                Back to Dashboard
              </Link>
            </div>
          </div>
          </InstructorShell>
          <Footer />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-sky-100">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_10%,rgba(14,165,233,0.18),transparent_55%),radial-gradient(circle_at_90%_0%,rgba(251,146,60,0.14),transparent_40%),radial-gradient(circle_at_50%_90%,rgba(16,185,129,0.12),transparent_45%)]" />
      
      <div className="relative">
        <Header />
        <InstructorShell>
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12" style={{ fontFamily: "'Space Grotesk', 'Manrope', sans-serif" }}>
          <div className="mb-8">
            <Link href="/dashboard/teacher" className="text-sky-600 hover:text-sky-700 font-medium">
              Back to Dashboard
            </Link>
            <h1 className="text-3xl font-bold text-slate-900 mt-4 mb-2">Edit Exam</h1>
            <p className="text-slate-600">Update exam details and questions</p>
          </div>

          <div className="mb-6 rounded-3xl border border-slate-200 bg-white/90 backdrop-blur-xl p-6 shadow-lg shadow-slate-200/60">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Live Monitoring</p>
                <h2 className="mt-2 text-xl font-semibold text-slate-900">Exam Activity</h2>
                <p className="mt-1 text-sm text-slate-600">
                  Auto-refreshing every 5 seconds{monitoringUpdatedAt ? ` · Updated ${monitoringUpdatedAt}` : ""}
                </p>
              </div>
              <div className="flex gap-2">
                <span className="inline-flex items-center rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                  Active: {monitoring.active_sessions.length}
                </span>
                <span className="inline-flex items-center rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                  Terminations: {monitoring.latest_terminations.length}
                </span>
              </div>
            </div>

            {monitoringError && (
              <p className="mt-4 text-sm text-red-600">{monitoringError}</p>
            )}

            <div className="mt-5 grid grid-cols-1 lg:grid-cols-3 gap-5">
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Active Sessions</p>
                {monitoring.active_sessions.length === 0 ? (
                  <p className="mt-3 text-sm text-emerald-900/70">No active sessions right now.</p>
                ) : (
                  <div className="mt-3 space-y-3">
                    {monitoring.active_sessions.slice(0, 4).map((s) => (
                      <div key={`${s.exam_id}-${s.student_id}`} className="rounded-xl bg-white/80 p-3 border border-emerald-100">
                        <p className="text-sm font-semibold text-slate-900">{s.student_username}</p>
                        <p className="text-[11px] text-emerald-700 mt-1">
                          Last heartbeat {s.seconds_since_heartbeat}s ago
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="rounded-2xl border border-amber-100 bg-amber-50/60 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">Latest Terminations</p>
                {monitoring.latest_terminations.length === 0 ? (
                  <p className="mt-3 text-sm text-amber-900/70">No recent terminations.</p>
                ) : (
                  <div className="mt-3 space-y-3">
                    {monitoring.latest_terminations.slice(0, 4).map((t) => (
                      <div key={t.id} className="rounded-xl bg-white/80 p-3 border border-amber-100">
                        <p className="text-sm font-semibold text-slate-900">{t.description}</p>
                        <p className="text-[11px] text-amber-700 mt-1">
                          {new Date(t.timestamp).toLocaleString()}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">Activity Logs</p>
                {monitoring.activity_logs.length === 0 ? (
                  <p className="mt-3 text-sm text-slate-600">No activity yet.</p>
                ) : (
                  <div className="mt-3 space-y-3">
                    {monitoring.activity_logs.slice(0, 4).map((l) => (
                      <div key={l.id} className="rounded-xl bg-white/80 p-3 border border-slate-200">
                        <p className="text-sm font-semibold text-slate-900">{l.description}</p>
                        <p className="text-[11px] text-slate-500 mt-1">
                          {new Date(l.timestamp).toLocaleString()}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-xl border border-slate-200 p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Exam Information</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-900 mb-2">Exam Title *</label>
                  <input
                    name="title"
                    type="text"
                    value={formData.title}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-white text-slate-900 focus:ring-2 focus:ring-slate-200"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-900 mb-2">Subject *</label>
                    <input
                      name="subject"
                      type="text"
                      value={formData.subject}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-white text-slate-900 focus:ring-2 focus:ring-slate-200"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-900 mb-2">Exam Type *</label>
                    <select
                      name="exam_type"
                      value={formData.exam_type}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-white text-slate-900 focus:ring-2 focus:ring-slate-200"
                    >
                      <option value="quiz">Quiz</option>
                      <option value="prelim">Prelim</option>
                      <option value="midterm">Midterm</option>
                      <option value="final">Final</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-900 mb-2">Question Type *</label>
                  <select
                    name="question_type"
                    value={formData.question_type}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-white text-slate-900 focus:ring-2 focus:ring-slate-200"
                  >
                    <option value="multiple_choice">Multiple Choice</option>
                    <option value="identification">Identification</option>
                    <option value="enumeration">Enumeration</option>
                    <option value="essay">Essay</option>
                    <option value="mixed">Mixed (Multiple Types)</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-900 mb-2">Department *</label>
                    <select
                      name="department"
                      value={formData.department}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-white text-slate-900 focus:ring-2 focus:ring-slate-200"
                    >
                      {departments.map(dept => (
                        <option key={dept.value} value={dept.value}>{dept.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-900 mb-2">Year Level *</label>
                    <select
                      name="year_level"
                      value={formData.year_level}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-white text-slate-900 focus:ring-2 focus:ring-slate-200"
                    >
                      {yearLevels.map(year => (
                        <option key={year.value} value={year.value}>{year.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-900 mb-2">Date *</label>
                    <input
                      name="scheduled_date"
                      type="date"
                      value={formData.scheduled_date}
                      onChange={handleChange}
                      required
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-white text-slate-900 focus:ring-2 focus:ring-slate-200"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-900 mb-2">Time *</label>
                    <input
                      name="scheduled_time"
                      type="time"
                      value={formData.scheduled_time}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-white text-slate-900 focus:ring-2 focus:ring-slate-200"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-900 mb-2">Duration (min) *</label>
                    <input
                      name="duration_minutes"
                      type="number"
                      value={formData.duration_minutes}
                      onChange={handleChange}
                      required
                      min="1"
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-white text-slate-900 focus:ring-2 focus:ring-slate-200"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-900 mb-2">Total Points *</label>
                    <input
                      name="total_points"
                      type="number"
                      value={formData.total_points}
                      onChange={handleChange}
                      required
                      min="1"
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-white text-slate-900 focus:ring-2 focus:ring-slate-200"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-900 mb-2">Passing Score *</label>
                    <input
                      name="passing_score"
                      type="number"
                      value={formData.passing_score}
                      onChange={handleChange}
                      required
                      min="1"
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-white text-slate-900 focus:ring-2 focus:ring-slate-200"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-900 mb-2">Instructions</label>
                  <textarea
                    name="instructions"
                    value={formData.instructions}
                    onChange={handleChange}
                    rows={3}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-white text-slate-900 focus:ring-2 focus:ring-slate-200"
                  />
                </div>

                <div className="space-y-3">
                  <h4 className="text-md font-semibold text-slate-900 border-b border-slate-200 pb-2">Shuffle</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                      Questions are automatically shuffled per student.
                    </div>
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="shuffle_options"
                        checked={formData.shuffle_options}
                        onChange={(e) => setFormData(prev => ({ ...prev, shuffle_options: e.target.checked }))}
                        className="h-5 w-5 text-sky-600 border-gray-300 rounded"
                      />
                      <label htmlFor="shuffle_options" className="text-sm font-medium text-slate-700">
                        Shuffle multiple choice options per student
                      </label>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="text-md font-semibold text-slate-900 border-b border-slate-200 pb-2">Exam Preview</h4>
                  <div>
                    <label className="block text-sm font-medium text-slate-900 mb-2">Rules & Requirements (Preview)</label>
                    <textarea
                      name="preview_rules"
                      value={formData.preview_rules}
                      onChange={handleChange}
                      rows={3}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-white text-slate-900 focus:ring-2 focus:ring-slate-200"
                      placeholder="e.g., No calculators, webcam must stay on, do not leave fullscreen..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-900 mb-2">Sample Questions (Optional)</label>
                    <textarea
                      name="sample_questions_text"
                      value={formData.sample_questions_text}
                      onChange={handleChange}
                      rows={4}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-white text-slate-900 focus:ring-2 focus:ring-slate-200"
                      placeholder="Add one sample question per line..."
                    />
                    <p className="text-xs text-slate-500 mt-2">These will appear in the student exam preview.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-xl border border-slate-200 p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-slate-900">Questions</h3>
                <div className="text-sm text-slate-600">
                  Points: <span className="font-bold text-sky-600">{totalPoints} / {formData.total_points}</span>
                </div>
              </div>

              <div className="space-y-4 mb-6">
                {formData.question_type === "mixed" && (
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
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-slate-200 text-slate-900"
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
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-slate-200 text-slate-900"
                    placeholder="Enter your question..."
                  />
                </div>

                {(formData.question_type === "multiple_choice" || (formData.question_type === "mixed" && selectedQuestionType === "multiple_choice")) && (
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
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-slate-200 text-slate-900"
                      placeholder="Enter correct answer"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-900 mb-2">Points *</label>
                    <input
                      type="number"
                      value={currentQuestion.points}
                      onChange={(e) => setCurrentQuestion({...currentQuestion, points: parseInt(e.target.value)})}
                      min="1"
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-slate-200 text-slate-900"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={addQuestion}
                  className="w-full bg-slate-900 text-white py-3 rounded-xl hover:bg-slate-800 transition-all font-semibold shadow-lg shadow-slate-900/20"
                >
                  + Add Question
                </button>
              </div>

              {questions.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-semibold text-slate-900">Questions ({questions.length})</h4>
                  {questions.map((q, i) => (
                    <div key={i} className="bg-white/90 backdrop-blur-xl rounded-2xl border border-slate-200 p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <p className="font-semibold text-slate-900">{i + 1}. {q.question}</p>
                          <p className="text-sm text-slate-600 mt-1">Type: {QUESTION_TYPES.find(t => t.value === q.type)?.label || q.type}</p>
                          <p className="text-sm text-slate-600 mt-1">Answer: {q.correct_answer}</p>
                          <p className="text-sm text-sky-600 mt-1">{q.points} points</p>
                        </div>
                        <button
                          type="button"
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
            </div>

            <div className="flex gap-4">
              <Link
                href="/dashboard/teacher"
                className="flex-1 px-6 py-3 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 transition-all font-medium text-center"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={saving || questions.length === 0}
                className="flex-1 bg-slate-900 text-white py-3 rounded-xl hover:bg-slate-800 transition-all font-semibold disabled:opacity-50 shadow-lg shadow-slate-900/20"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </main>
        </InstructorShell>
        <Footer />
      </div>
    </div>
  );
}

