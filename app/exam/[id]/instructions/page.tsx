"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

import { API_URL } from "@/lib/api";
interface ExamDetail {
  id: number;
  title: string;
  subject: string;
  department: string;
  exam_type: string;
  question_type: string;
  scheduled_date: string;
  duration_minutes: number;
  total_points: number;
  passing_score: number;
  instructions: string;
  preview_rules: string | null;
  sample_questions: any[];
  question_count: number;
  question_types: { type: string; count: number }[];
  status: string;
  attempts_used: number;
  attempts_remaining: number;
  max_attempts: number;
  retake_policy: string;
  is_retake: boolean;
  can_take: boolean;
  is_expired: boolean;
}

export default function ExamInstructions() {
  const router = useRouter();
  const params = useParams();
  const examId = params.id;
  const [loading, setLoading] = useState(true);
  const [exam, setExam] = useState<ExamDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [errorStatus, setErrorStatus] = useState<number | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    const role = localStorage.getItem("user_role");
    if (role) setUserRole(role);
    fetchExamDetails();
  }, []);

  const fetchExamDetails = async () => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      router.push("/login");
      return;
    }

    try {
      const res = await fetch(`${API_URL}/exams/${examId}/`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        let message = "Failed to fetch exam details";
        try {
          const data = await res.json();
          if (data?.error) message = data.error;
        } catch {
          // Ignore JSON parse errors
        }
        setErrorStatus(res.status);
        throw new Error(message);
      }

      const data = await res.json();
      setExam(data);
      setLoading(false);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    // Parse ISO string without timezone conversion
    const [datePart, timePart] = dateString.split('T');
    const [year, month, day] = datePart.split('-');
    const [hour, minute] = timePart.split(':');
    
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hour), parseInt(minute));
    
    return date.toLocaleDateString("en-PH", {
      month: "long",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-50 via-blue-50 to-cyan-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-2 border-sky-600"></div>
          <p className="mt-4 text-slate-600">Loading exam details...</p>
        </div>
      </div>
    );
  }

  const dashboardUrl =
    userRole === "instructor" ? "/dashboard/teacher" :
    userRole === "dean" ? "/dashboard/dean" :
    "/dashboard/student";

  if (error || !exam) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-50 via-blue-50 to-cyan-50">
        <Header />
        <div className="flex items-center justify-center py-20 px-4">
          <div className="max-w-md w-full bg-white/60 backdrop-blur-xl rounded-2xl shadow-lg p-8 text-center">
            <div className="text-5xl mb-4">X</div>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">
              {errorStatus === 403 ? "Access denied" : "Error"}
            </h2>
            <p className="text-slate-600 mb-6">
              {errorStatus === 403
                ? (error || "You are not authorized to view this exam.")
                : (error || "Exam not found")}
            </p>
            <div className="flex flex-col gap-3">
              <Link
                href={dashboardUrl}
                className="inline-block bg-gradient-to-r from-sky-500 to-blue-500 text-white px-6 py-3 rounded-lg"
              >
                Back to Dashboard
              </Link>
              {errorStatus === 403 && (
                <p className="text-xs text-slate-500">
                  If you think this is a mistake, contact your instructor or dean to confirm
                  your department and year level.
                </p>
              )}
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }
  const canTakeExam =
    typeof exam.can_take === "boolean"
      ? exam.can_take
      : exam.attempts_used < (exam.max_attempts || 1);
  const hasAttemptsLeft = canTakeExam;
  const hasTakenAtLeastOnce = (exam.attempts_used || 0) > 0;
  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-blue-50 to-cyan-50">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(56,189,248,0.15),transparent_50%)]" />
      
      <div className="relative">
        <Header />

        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="mb-8">
            <Link href={dashboardUrl} className="text-sky-600 hover:text-sky-700 font-medium">
              {"<- Back to Dashboard"}
            </Link>
          </div>

          <div className="bg-white/60 backdrop-blur-xl rounded-2xl shadow-xl border border-sky-200/50 p-8 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <span className="px-3 py-1 rounded-full text-xs font-semibold uppercase bg-blue-100 text-blue-700">
                {exam.exam_type}
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-semibold uppercase bg-purple-100 text-purple-700">
                {exam.department}
              </span>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase ${
                exam.status === "upcoming" ? "bg-yellow-100 text-yellow-700" :
                exam.status === "ongoing" ? "bg-green-100 text-green-700" :
                "bg-slate-100 text-slate-700"
              }`}>
                {exam.status}
              </span>
            </div>

            <h1 className="text-3xl font-bold text-slate-900 mb-2">{exam.title}</h1>
            <p className="text-lg text-slate-600 mb-6">{exam.subject}</p>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mb-8">
              <div>
                <p className="text-sm text-slate-600 font-medium">Scheduled Date</p>
                <p className="text-lg font-semibold text-slate-900">{formatDate(exam.scheduled_date)}</p>
              </div>
              <div>
                <p className="text-sm text-slate-600 font-medium">Duration</p>
                <p className="text-lg font-semibold text-slate-900">{exam.duration_minutes} minutes</p>
              </div>
              <div>
                <p className="text-sm text-slate-600 font-medium">Total Points</p>
                <p className="text-lg font-semibold text-slate-900">{exam.total_points} pts</p>
              </div>
              <div>
                <p className="text-sm text-slate-600 font-medium">Passing Score</p>
                <p className="text-lg font-semibold text-slate-900">{exam.passing_score} pts</p>
              </div>
              <div>
                <p className="text-sm text-slate-600 font-medium">Total Questions</p>
                <p className="text-lg font-semibold text-slate-900">{exam.question_count || 0}</p>
              </div>
              <div>
                <p className="text-sm text-slate-600 font-medium">Format</p>
                <p className="text-lg font-semibold text-slate-900">{exam.question_type}</p>
              </div>
              <div>
                <p className="text-sm text-slate-600 font-medium">Attempts</p>
                <p className="text-lg font-semibold text-slate-900">
                  {exam.attempts_used} / {exam.max_attempts} used
                </p>
              </div>
              {exam.max_attempts > 1 && (
                <div>
                  <p className="text-sm text-slate-600 font-medium">Retake Policy</p>
                  <p className="text-lg font-semibold text-slate-900 capitalize">
                    {exam.retake_policy === 'none' ? 'No retakes' :
                     exam.retake_policy === 'best_score' ? 'Best score kept' :
                     exam.retake_policy === 'average_score' ? 'Average of attempts' :
                     exam.retake_policy === 'latest_score' ? 'Latest score kept' :
                     exam.retake_policy}
                  </p>
                </div>
              )}
            </div>

            {exam.question_types?.length > 0 && (
              <div className="bg-white border border-slate-200 rounded-xl p-4 mb-6">
                <h4 className="font-bold text-slate-900 mb-2">Question Types</h4>
                <div className="flex flex-wrap gap-2">
                  {exam.question_types.map((qt) => (
                    <span key={qt.type} className="px-3 py-1 rounded-full text-xs font-semibold bg-sky-100 text-sky-700">
                      {qt.type} - {qt.count}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="border-t border-sky-200 pt-6">
              <h2 className="text-xl font-bold text-slate-900 mb-4">Instructions & Rules</h2>
              <p className="text-slate-700 whitespace-pre-wrap">{exam.instructions || 'No specific instructions provided.'}</p>
            </div>

            {exam.preview_rules && (
              <div className="border-t border-sky-200 pt-6 mt-6">
                <h2 className="text-xl font-bold text-slate-900 mb-4">Exam Rules</h2>
                <p className="text-slate-700 whitespace-pre-wrap">{exam.preview_rules}</p>
              </div>
            )}

            {exam.sample_questions && exam.sample_questions.length > 0 && (
              <div className="border-t border-sky-200 pt-6 mt-6">
                <h2 className="text-xl font-bold text-slate-900 mb-4">Sample Questions</h2>
                <ul className="space-y-2">
                  {exam.sample_questions.map((q: string, i: number) => (
                    <li key={i} className="flex gap-3 text-sm text-slate-700">
                      <span className="shrink-0 inline-flex h-6 w-6 items-center justify-center rounded-full bg-sky-100 text-sky-700 font-bold text-xs">{i + 1}</span>
                      <span>{q}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="bg-sky-50 border border-sky-200 rounded-xl p-6 mb-6">
            <h3 className="font-bold text-sky-900 mb-3">Important Reminders:</h3>
            <ul className="space-y-2 text-sm text-sky-800">
              <li>• Make sure you have a stable internet connection</li>
              <li>• Once you start the exam, the timer will begin automatically</li>
              <li>• You cannot pause or restart the exam once started</li>
              <li>• Submit your answers before the time runs out</li>
              <li>• Switching tabs or minimizing the window may trigger a violation</li>
            </ul>
          </div>

          {exam.is_retake && exam.attempts_remaining > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
              <p className="text-sm font-semibold text-amber-900">
                Retake attempt — {exam.attempts_remaining} attempt{exam.attempts_remaining !== 1 ? 's' : ''} remaining
              </p>
              <p className="text-xs text-amber-700 mt-1">
                {exam.retake_policy === 'best_score' && 'Your best score across all attempts will be recorded.'}
                {exam.retake_policy === 'average_score' && 'The average of all your attempt scores will be recorded.'}
                {exam.retake_policy === 'latest_score' && 'Your latest attempt score will replace previous scores.'}
              </p>
            </div>
          )}

          <div className="flex gap-4">
            <Link
              href={dashboardUrl}
              className="flex-1 px-6 py-3 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 transition-all font-medium text-center"
            >
              Cancel
            </Link>
            {exam.status === "ongoing" && hasAttemptsLeft && (
              <button
                onClick={() => router.push(`/exam/take/${examId}`)}
                className="flex-1 bg-gradient-to-r from-sky-500 to-blue-500 text-white py-3 px-6 rounded-xl hover:shadow-xl hover:shadow-sky-500/30 transition-all font-medium"
              >
                {exam.is_retake ? 'Retake Exam' : 'Start Exam'}
              </button>
            )}
            {exam.status === "upcoming" && (
              <button
                disabled
                className="flex-1 bg-slate-300 text-slate-500 py-3 px-6 rounded-xl font-medium cursor-not-allowed"
              >
                Exam Not Yet Available
              </button>
            )}
            {!hasAttemptsLeft && hasTakenAtLeastOnce && (
              <button
                disabled
                className="flex-1 bg-green-100 text-green-700 py-3 px-6 rounded-xl font-medium cursor-not-allowed"
              >
                Already Completed
              </button>
            )}
          </div>
        </main>

        <Footer />
      </div>
    </div>
  );
}
