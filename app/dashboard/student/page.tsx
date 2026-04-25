// app/dashboard/student/page.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AnnouncementsBanner from "@/components/AnnouncementsBanner";

import { API_URL, WS_URL } from "@/lib/api";
import { useToast } from "@/components/ToastProvider";
interface StudentProfile {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  department: string;
  school_id: string;
  year_level: string;
  contact_number: string;
  is_approved: boolean;
  profile_picture?: string | null;
  enrolled_subjects?: string[];
}

interface Exam {
  id: number;
  title: string;
  subject: string;
  department: string;
  exam_type: "prelim" | "midterm" | "final" | "quiz";
  scheduled_date: string;
  expiration_time: string | null;
  duration_minutes: number;
  total_points: number;
  status: "upcoming" | "ongoing" | "completed" | "missed";
  instructions: string;
  passing_score: number;
  year_level: string;
  is_expired: boolean;
}

interface ExamResult {
  id: number;
  exam_id: number;
  exam_title: string;
  score: number;
  total_points: number;
  percentage: number;
  grade: string;
  submitted_at: string;
  remarks: string;
}

interface PendingResult {
  id: number;
  exam_id: number;
  exam_title: string;
  exam_subject: string;
  submitted_at: string;
  status: string;
}

export default function StudentDashboard() {
  const router = useRouter();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [exams, setExams] = useState<Exam[]>([]);
  const [results, setResults] = useState<ExamResult[]>([]);
  const [pendingResults, setPendingResults] = useState<PendingResult[]>([]);
  const [activeTab, setActiveTab] = useState<"upcoming" | "completed">("upcoming");
  const [error, setError] = useState<string | null>(null);
  const [showAnnouncementsModal, setShowAnnouncementsModal] = useState(false);
  const [announcementsCount, setAnnouncementsCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterSubject, setFilterSubject] = useState<string>("all");
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [conflictIds, setConflictIds] = useState<number[]>([]);
  const examSocketRef = useRef<WebSocket | null>(null);
  const reconnectRef = useRef<number | null>(null);

  useEffect(() => {
    checkAuthAndFetchData();
    const interval = setInterval(fetchLiveData, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let active = true;
    const connectSocket = () => {
      const token = localStorage.getItem("access_token");
      if (!token) return;

      const wsUrl = `${WS_URL}/ws/exams/?token=${token}`;
      const ws = new WebSocket(wsUrl);
      examSocketRef.current = ws;

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data?.type === "exam_update") {
            fetchLiveData();
          }
        } catch {}
      };

      ws.onclose = () => {
        if (!active) return;
        reconnectRef.current = window.setTimeout(connectSocket, 3000);
      };

      ws.onerror = () => {
        ws.close();
      };
    };

    connectSocket();

    return () => {
      active = false;
      if (reconnectRef.current) clearTimeout(reconnectRef.current);
      if (examSocketRef.current) examSocketRef.current.close();
    };
  }, []);

  useEffect(() => {
    const onScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleScrollTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  useEffect(() => {
    const fetchAnnouncementsCount = () => {
      const token = localStorage.getItem("access_token");
      if (!token) return;
      fetch(`${API_URL}/notifications/announcements/`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((r) => r.json())
        .then((data) => {
          if (data.announcements) {
            const lastReadAt = localStorage.getItem("announcements_read_all_at");
            const unread = lastReadAt
              ? data.announcements.filter((a: { created_at: string }) => new Date(a.created_at).getTime() > new Date(lastReadAt).getTime())
              : data.announcements;
            setAnnouncementsCount(unread.length);
          }
        })
        .catch(() => {});
    };
    fetchAnnouncementsCount();
    const interval = setInterval(fetchAnnouncementsCount, 15000);
    return () => clearInterval(interval);
  }, []);

  const fetchLiveData = async () => {
    const token = localStorage.getItem("access_token");
    if (!token) return;
    try {
      const [examsRes, resultsRes, pendingRes, conflictsRes] = await Promise.all([
        fetch(`${API_URL}/exams/available/`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/exams/results/`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/exams/results/pending/`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/exams/conflicts/`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      if (examsRes.ok) setExams(await examsRes.json());
      if (resultsRes.ok) setResults(await resultsRes.json());
      if (pendingRes.ok) setPendingResults(await pendingRes.json());
      if (conflictsRes.ok) {
        const data = await conflictsRes.json();
        setConflictIds(Array.isArray(data.conflict_ids) ? data.conflict_ids : []);
      }
    } catch {}
  };

  const checkAuthAndFetchData = async () => {
    const token = localStorage.getItem("access_token");

    if (!token) {
      router.push("/login");
      return;
    }

    try {
      const profileRes = await fetch(`${API_URL}/profile/`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!profileRes.ok) throw new Error("Failed to fetch profile");

      const profileData = await profileRes.json();

      if (profileData.role !== "student") {
        router.push("/dashboard");
        return;
      }

      if (!profileData.is_approved) {
        if (profileData.is_rejected) {
          router.push("/dashboard/student/rejected");
        } else {
          router.push("/profile/settings");
        }
        return;
      }

      setProfile(profileData);

      const examsRes = await fetch(`${API_URL}/exams/available/`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (examsRes.ok) setExams(await examsRes.json());

      const resultsRes = await fetch(`${API_URL}/exams/results/`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (resultsRes.ok) setResults(await resultsRes.json());

      const pendingRes = await fetch(`${API_URL}/exams/results/pending/`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (pendingRes.ok) setPendingResults(await pendingRes.json());

      const conflictsRes = await fetch(`${API_URL}/exams/conflicts/`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (conflictsRes.ok) {
        const data = await conflictsRes.json();
        setConflictIds(Array.isArray(data.conflict_ids) ? data.conflict_ids : []);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user_name");
    localStorage.removeItem("user_role");
    toast.success("Logged out successfully.");
    router.push("/login");
  };

  const getExamTypeColor = (type: string) => {
    const colors = {
      prelim: "bg-blue-100 text-blue-700",
      midterm: "bg-purple-100 text-purple-700",
      final: "bg-red-100 text-red-700",
      quiz: "bg-green-100 text-green-700",
    };
    return colors[type as keyof typeof colors] || colors.quiz;
  };

  const getStatusColor = (status: string) => {
    const colors = {
      upcoming: "bg-yellow-100 text-yellow-700",
      ongoing: "bg-green-100 text-green-700",
      completed: "bg-slate-100 text-slate-700",
      missed: "bg-red-100 text-red-700",
    };
    return colors[status as keyof typeof colors] || colors.upcoming;
  };

  const getGradeColor = (grade: string) => {
    const gradeValue = parseFloat(grade);
    if (gradeValue <= 1.5) return "text-green-600";
    if (gradeValue <= 2.5) return "text-blue-600";
    if (gradeValue <= 3.0) return "text-yellow-600";
    return "text-red-600";
  };

  const formatDate = (dateString: string) => {
    const [datePart, timePart] = dateString.split("T");
    const [year, month, day] = datePart.split("-");
    const [hour, minute] = timePart.split(":");
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hour), parseInt(minute));
    return date.toLocaleDateString("en-PH", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const upcomingExams = exams.filter(e => e.status === "upcoming" || e.status === "ongoing");
  const uniqueSubjects = Array.from(new Set(exams.map(e => e.subject))).filter(Boolean);

  const filteredExams = upcomingExams.filter(exam => {
    const matchesSearch =
      exam.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      exam.subject.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === "all" || exam.exam_type === filterType;
    const matchesSubject = filterSubject === "all" || exam.subject === filterSubject;
    return matchesSearch && matchesType && matchesSubject;
  });

  const filteredResults = results.filter(result =>
    result.exam_title.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const tabItems = [
    { key: "upcoming" as const, label: "Upcoming Exams", count: upcomingExams.length },
    { key: "completed" as const, label: "Exam Results", count: results.length },
  ];
  const activeTabIndex = tabItems.findIndex((t) => t.key === activeTab);

  if (loading) {
    return (
      <div className="min-h-screen bg-sky-200 bg-[radial-gradient(circle_at_20%_10%,rgba(14,165,233,0.18),transparent_55%),radial-gradient(circle_at_80%_0%,rgba(249,115,22,0.12),transparent_45%)] flex items-center justify-center">
        <div className="relative text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white shadow-xl shadow-slate-200/70 border border-slate-200">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-slate-200 border-t-sky-500"></div>
          </div>
          <p className="mt-5 text-slate-600 text-sm tracking-wide">Preparing your dashboard</p>
        </div>
      </div>
    );
  }

  if (error && !profile) {
    return (
      <div className="min-h-screen bg-sky-200 bg-[radial-gradient(circle_at_20%_10%,rgba(14,165,233,0.18),transparent_55%),radial-gradient(circle_at_80%_0%,rgba(249,115,22,0.12),transparent_45%)]">
        <div className="relative">
          <Header />
          <div className="flex items-center justify-center py-20 px-4">
            <div className="max-w-md w-full bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl shadow-slate-200/60 border border-slate-200 p-8 text-center">
              <div className="mx-auto mb-4 w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center">
                <svg className="w-7 h-7 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-2xl font-semibold text-slate-900 mb-2">Account Pending Approval</h2>
              <p className="text-slate-600 mb-6">{error}</p>
              <button
                onClick={handleLogout}
                className="bg-slate-900 text-white px-6 py-3 rounded-xl hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/15"
              >
                Back to Login
              </button>
            </div>
          </div>
          <Footer />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-sky-200">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_10%,rgba(14,165,233,0.18),transparent_55%),radial-gradient(circle_at_90%_0%,rgba(251,146,60,0.14),transparent_40%),radial-gradient(circle_at_50%_90%,rgba(16,185,129,0.12),transparent_45%)]" />

      <div className="relative">
        <Header />

        <main
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12"
          style={{ fontFamily: "'Space Grotesk', 'Manrope', sans-serif" }}
        >

          <section className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="rounded-3xl bg-white/85 backdrop-blur-xl border border-slate-200 shadow-2xl shadow-slate-200/70 p-8 relative overflow-hidden">
              <div className="absolute -top-20 -right-10 h-40 w-40 rounded-full bg-sky-100/70 blur-2xl" />
              <div className="absolute -bottom-16 -left-8 h-36 w-36 rounded-full bg-amber-100/70 blur-2xl" />

              <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Student Dashboard</p>
                  <h1 className="mt-2 text-3xl sm:text-4xl font-semibold text-slate-900">
                    Welcome back, {profile?.first_name}
                  </h1>
                  <p className="mt-2 text-slate-600">
                    {profile?.department} | {profile?.year_level && `${profile.year_level}${["st", "nd", "rd", "th"][parseInt(profile.year_level) - 1] || "th"} Year`} | {profile?.school_id}
                  </p>

                  <div className="mt-6 flex flex-wrap gap-3">
                    <Link
                      href="/practice"
                      className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-slate-900 text-white font-medium shadow-lg shadow-slate-900/20 hover:-translate-y-0.5 transition-all"
                    >
                      <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-white/10">
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L8 21l-1.75-4L2 15.25 6.25 13 8 9l1.75 4 4.25 2.25L9.75 17z" />
                        </svg>
                      </span>
                      Practice Mode
                    </Link>
                    <Link
                      href="/profile/settings"
                      className="inline-flex items-center gap-2 px-5 py-3 rounded-xl border border-slate-300 bg-white text-slate-700 font-medium hover:border-slate-400 hover:-translate-y-0.5 transition-all"
                    >
                      <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100">
                        <svg className="h-5 w-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6l4 2M4 6l4-2 4 2 4-2 4 2v6l-4 2-4-2-4 2-4-2z" />
                        </svg>
                      </span>
                      Profile Settings
                    </Link>
                    <Link
                      href="/dashboard/student/reports"
                      className="inline-flex items-center gap-2 px-5 py-3 rounded-xl border border-amber-300 bg-amber-50 text-amber-800 font-medium hover:border-amber-400 hover:-translate-y-0.5 transition-all"
                    >
                      <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-white/70">
                        <svg className="h-5 w-5 text-amber-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h8m-8 4h5m-7 6h12a2 2 0 002-2V6a2 2 0 00-2-2H8l-4 4v10a2 2 0 002 2z" />
                        </svg>
                      </span>
                      My Issue Reports
                    </Link>
                  </div>
                </div>
                <div className="relative">
                  <div className="h-28 w-28 rounded-full bg-white shadow-lg shadow-slate-900/10">
                    {profile?.profile_picture ? (
                      <img
                        src={profile.profile_picture}
                        alt={`${profile.first_name} ${profile.last_name}`}
                        className="h-full w-full rounded-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center rounded-full bg-sky-50 text-2xl font-bold text-blue-700">
                        {profile?.first_name?.[0]}{profile?.last_name?.[0]}
                      </div>
                    )}
                  </div>
                  <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-blue-100 px-3 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-blue-700 ring-1 ring-blue-200">
                    Student
                  </span>
                </div>
              </div>
            </div>

            <div className="rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-8 relative overflow-hidden">
              <div className="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_10%_20%,rgba(59,130,246,0.5),transparent_55%),radial-gradient(circle_at_90%_10%,rgba(251,146,60,0.35),transparent_45%)]" />
              <div className="relative">
                <p className="text-xs uppercase tracking-[0.3em] text-white/60">Snapshot</p>
                <h2 className="mt-2 text-2xl font-semibold">Today at a glance</h2>
                <div className="mt-6 grid gap-4">
                  <div className="flex items-center justify-between rounded-2xl bg-white/10 px-4 py-3">
                    <span className="text-sm text-white/80">Upcoming exams</span>
                    <span className="text-xl font-semibold">{upcomingExams.length}</span>
                  </div>
                  <div className="flex items-center justify-between rounded-2xl bg-white/10 px-4 py-3">
                    <span className="text-sm text-white/80">Completed results</span>
                    <span className="text-xl font-semibold">{results.length}</span>
                  </div>
                  <button
                    onClick={() => setShowAnnouncementsModal(true)}
                    className="group flex items-center justify-between rounded-2xl bg-white/10 px-4 py-3 hover:bg-white/15 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 text-white">
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h6m8-4v9a2 2 0 01-2 2H5a2 2 0 01-2-2V8" />
                        </svg>
                      </span>
                      <div>
                        <span className="text-sm text-white/85">Announcements</span>
                        <p className="text-xs text-white/60">Latest updates</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-white/90">
                      {announcementsCount > 0 && (
                        <span className="inline-flex h-6 min-w-[1.5rem] items-center justify-center rounded-full bg-white/90 px-2 text-xs font-bold text-slate-900">
                          {announcementsCount}
                        </span>
                      )}
                      <span className="text-sm font-semibold tracking-wide">View</span>
                      <span className="text-base font-semibold transition-transform group-hover:translate-x-0.5">-&gt;</span>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </section>

          {profile?.enrolled_subjects && profile.enrolled_subjects.length > 0 && (
            <section className="mt-8 rounded-3xl bg-white/90 border border-slate-200 shadow-lg shadow-slate-200/60 overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/80">
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-sky-100 text-sky-700">
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </span>
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Masterlist</p>
                    <h2 className="text-base font-semibold text-slate-900">Enrolled Subjects</h2>
                  </div>
                </div>
                <span className="inline-flex items-center justify-center rounded-full bg-sky-100 text-sky-700 text-xs font-bold px-2.5 py-0.5">
                  {profile.enrolled_subjects.length}
                </span>
              </div>
              <div className="flex flex-wrap gap-2 px-6 py-4">
                {profile.enrolled_subjects.map((subject, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-sm font-medium text-sky-800"
                  >
                    {subject}
                  </span>
                ))}
              </div>
            </section>
          )}

          <section className="mt-10 grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="rounded-2xl bg-white/90 backdrop-blur-xl border border-slate-200 p-6 shadow-lg shadow-slate-200/60">
              <div className="flex items-center justify-between">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Upcoming</p>
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-sky-100 text-sky-700">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10m-10 4h6m-9 5h12a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v11a2 2 0 002 2z" />
                  </svg>
                </span>
              </div>
              <p className="mt-4 text-4xl font-semibold text-slate-900">{upcomingExams.length}</p>
              <p className="mt-1 text-sm text-slate-500">Scheduled exams ahead</p>
            </div>
            <div className="rounded-2xl bg-white/90 backdrop-blur-xl border border-slate-200 p-6 shadow-lg shadow-slate-200/60">
              <div className="flex items-center justify-between">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Completed</p>
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </span>
              </div>
              <p className="mt-4 text-4xl font-semibold text-slate-900">{results.length}</p>
              <p className="mt-1 text-sm text-slate-500">Exams already taken</p>
            </div>
            <div className="rounded-2xl bg-white/90 backdrop-blur-xl border border-slate-200 p-6 shadow-lg shadow-slate-200/60">
              <div className="flex items-center justify-between">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Average</p>
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5h2m-1 0v14m-7-7h14" />
                  </svg>
                </span>
              </div>
              <p className="mt-4 text-4xl font-semibold text-slate-900">
                {results.length > 0
                  ? (results.reduce((sum, r) => sum + parseFloat(r.grade), 0) / results.length).toFixed(2)
                  : "N/A"}
              </p>
              <p className="mt-1 text-sm text-slate-500">Overall performance</p>
            </div>
            <div className="rounded-2xl bg-white/90 backdrop-blur-xl border border-slate-200 p-6 shadow-lg shadow-slate-200/60">
              <div className="flex items-center justify-between">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Year Level</p>
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100 text-purple-700">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6l7 4-7 4-7-4 7-4zm0 8l7 4-7 4-7-4 7-4z" />
                  </svg>
                </span>
              </div>
              <p className="mt-4 text-4xl font-semibold text-slate-900">
                {profile?.year_level && `${profile.year_level}${["st", "nd", "rd", "th"][parseInt(profile.year_level) - 1] || "th"}`}
              </p>
              <p className="mt-1 text-sm text-slate-500">Academic standing</p>
            </div>
          </section>

          <section className="mt-10">
            <div className="relative overflow-hidden rounded-2xl border border-slate-200/70 bg-gradient-to-r from-white via-slate-50 to-white p-3 shadow-lg shadow-slate-200/60">
              <div className="pointer-events-none absolute -left-16 -top-12 h-28 w-28 rounded-full bg-sky-200/40 blur-2xl" />
              <div className="pointer-events-none absolute -right-10 -bottom-10 h-28 w-28 rounded-full bg-blue-200/40 blur-2xl" />

              <div className="md:hidden">
                <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">Select Section</label>
                <select
                  value={activeTab}
                  onChange={(e) => setActiveTab(e.target.value as typeof activeTab)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm"
                >
                  {tabItems.map((tab) => (
                    <option key={tab.key} value={tab.key}>
                      {tab.label} ({tab.count})
                    </option>
                  ))}
                </select>
              </div>

              <div className="relative hidden md:block">
                <div className="grid grid-cols-2 gap-2">
                  {tabItems.map((tab) => {
                    const isActive = activeTab === tab.key;
                    return (
                      <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={`group relative rounded-xl px-4 py-3 text-xs font-semibold uppercase tracking-wide transition-all ${
                          isActive ? "text-blue-700" : "text-slate-600 hover:text-slate-900"
                        }`}
                      >
                        <span className="flex items-center justify-center gap-2">
                          <span className={`inline-flex h-8 w-8 items-center justify-center rounded-lg border ${
                            isActive ? "border-blue-200 bg-blue-100 text-blue-700" : "border-slate-200 bg-white text-slate-500"
                          }`}>
                            {tab.key === "upcoming" && (
                              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 11h14M5 7h14a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V9a2 2 0 012-2z" />
                              </svg>
                            )}
                            {tab.key === "completed" && (
                              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            )}
                          </span>
                          <span>{tab.label}</span>
                          <span className={`inline-flex items-center justify-center rounded-full px-2 py-0.5 text-[11px] font-bold ${
                            isActive ? "bg-blue-100 text-blue-700" : "bg-slate-200/70 text-slate-600"
                          }`}>
                            {tab.count}
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>
                <div className="relative mt-3 h-1.5 rounded-full bg-slate-200/70">
                  <span
                    className="absolute top-0 h-1.5 w-1/2 rounded-full bg-gradient-to-r from-blue-500 to-sky-400 transition-transform duration-300"
                    style={{ transform: `translateX(${Math.max(0, activeTabIndex) * 100}%)` }}
                  />
                </div>
              </div>
            </div>
          </section>

          <section className="mt-6 rounded-3xl bg-white/90 border border-slate-200 p-6 shadow-xl shadow-slate-200/60">
            <div className="flex flex-col gap-4 md:flex-row md:items-center">
              <div className="flex-1">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search by exam or subject"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 pl-10 text-slate-900 shadow-sm focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                  />
                  <svg className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
              {activeTab === "upcoming" && (
                <>
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 shadow-sm focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                  >
                    <option value="all">All Types</option>
                    <option value="prelim">Prelim</option>
                    <option value="midterm">Midterm</option>
                    <option value="final">Final</option>
                    <option value="quiz">Quiz</option>
                  </select>
                  <select
                    value={filterSubject}
                    onChange={(e) => setFilterSubject(e.target.value)}
                    className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 shadow-sm focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                  >
                    <option value="all">All Subjects</option>
                    {uniqueSubjects.map(subject => (
                      <option key={subject} value={subject}>{subject}</option>
                    ))}
                  </select>
                </>
              )}
            </div>
          </section>

          {activeTab === "upcoming" && (
            <section className="mt-6 space-y-5">
              {conflictIds.length > 0 && (
                <div className="rounded-3xl border border-amber-200 bg-amber-50/80 p-5 shadow-lg shadow-amber-200/40">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86l-7.1 12.27A2 2 0 005.92 19h12.16a2 2 0 001.73-2.87l-7.1-12.27a2 2 0 00-3.44 0z" />
                        </svg>
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-amber-900">Schedule conflict detected</p>
                        <p className="text-xs text-amber-700">Some exams overlap in time. Please review before starting.</p>
                      </div>
                    </div>
                    <span className="inline-flex items-center rounded-full bg-white px-3 py-1 text-xs font-semibold text-amber-700 border border-amber-200">
                      {conflictIds.length} exam{conflictIds.length > 1 ? "s" : ""} affected
                    </span>
                  </div>
                </div>
              )}

              {filteredExams.length === 0 ? (
                <div className="rounded-3xl bg-white/90 border border-slate-200 p-12 text-center shadow-lg shadow-slate-200/60">
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
                    <svg className="h-7 w-7 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10m-10 4h6m-9 5h12a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v11a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-slate-900 mb-2">No upcoming exams</h3>
                  <p className="text-slate-600">
                    {searchQuery || filterType !== "all" || filterSubject !== "all"
                      ? "No exams match your search criteria."
                      : "You are all caught up. Check back later for new exams."}
                  </p>
                </div>
              ) : (
                filteredExams.map((exam) => {
                  const hasConflict = conflictIds.includes(exam.id);
                  return (
                  <div
                    key={exam.id}
                    className={`rounded-3xl bg-white/90 border p-6 shadow-lg hover:-translate-y-1 transition-all ${
                      hasConflict ? "border-amber-300 shadow-amber-200/60 bg-amber-50/40" : "border-slate-200 shadow-slate-200/60"
                    }`}
                  >
                    <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-3 mb-3">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase ${getExamTypeColor(exam.exam_type)}`}>
                            {exam.exam_type}
                          </span>
                          {hasConflict && (
                            <span className="px-3 py-1 rounded-full text-xs font-semibold uppercase bg-amber-100 text-amber-700">
                              Schedule conflict
                            </span>
                          )}
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase ${getStatusColor(exam.status)}`}>
                            {exam.status}
                          </span>
                          <span className="px-3 py-1 rounded-full text-xs font-semibold uppercase bg-purple-100 text-purple-700">
                            {exam.department}
                          </span>
                        </div>
                        <h3 className="text-xl font-semibold text-slate-900 mb-2">{exam.title}</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-slate-600">
                          <div>
                            <span className="block text-xs uppercase tracking-wide text-slate-400">Subject</span>
                            <span className="font-medium text-slate-700">{exam.subject}</span>
                          </div>
                          <div>
                            <span className="block text-xs uppercase tracking-wide text-slate-400">Schedule</span>
                            <span className="font-medium text-slate-700">{formatDate(exam.scheduled_date)}</span>
                          </div>
                          <div>
                            <span className="block text-xs uppercase tracking-wide text-slate-400">Duration</span>
                            <span className="font-medium text-slate-700">{exam.duration_minutes} minutes</span>
                          </div>
                          <div>
                            <span className="block text-xs uppercase tracking-wide text-slate-400">Total Points</span>
                            <span className="font-medium text-slate-700">{exam.total_points} pts</span>
                          </div>
                        </div>
                        {exam.expiration_time && (
                          <div className="mt-3 flex items-center gap-2 text-sm">
                            <svg className="h-4 w-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6l4 2m6-2a10 10 0 11-20 0 10 10 0 0120 0z" />
                            </svg>
                            <span className={exam.is_expired ? "text-red-600 font-semibold" : "text-slate-600"}>
                              Expires {formatDate(exam.expiration_time)}
                              {exam.is_expired && " (EXPIRED)"}
                            </span>
                          </div>
                        )}
                        {hasConflict && (
                          <div className="mt-3 flex items-center gap-2 text-sm text-amber-700">
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86l-7.1 12.27A2 2 0 005.92 19h12.16a2 2 0 001.73-2.87l-7.1-12.27a2 2 0 00-3.44 0z" />
                            </svg>
                            <span>This exam overlaps with another scheduled exam.</span>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-3">
                        <Link
                          href={`/exam/${exam.id}/instructions`}
                          className="px-5 py-3 rounded-xl border border-slate-300 bg-white text-slate-700 font-semibold hover:border-slate-400 hover:-translate-y-0.5 transition-all"
                        >
                          View details
                        </Link>
                        {exam.status === "ongoing" && (
                          <Link
                            href={`/exam/take/${exam.id}`}
                            className="px-5 py-3 rounded-xl bg-emerald-500 text-white font-semibold shadow-lg shadow-emerald-500/30 hover:-translate-y-0.5 transition-all"
                          >
                            Take exam
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                );
                })
              )}
            </section>
          )}

          {activeTab === "completed" && (
            <section className="mt-6 space-y-4">
              {pendingResults.length > 0 && (
                <div className="rounded-3xl bg-white/90 border border-amber-200 shadow-lg shadow-amber-200/40 overflow-hidden">
                  <div className="flex items-center justify-between px-6 py-4 border-b border-amber-200 bg-amber-50/80">
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.25em] text-amber-600">Pending Grading</p>
                      <h3 className="text-lg font-semibold text-slate-900">Waiting for results</h3>
                    </div>
                    <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-semibold text-amber-700 border border-amber-200">
                      {pendingResults.length} pending
                    </span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-white text-xs uppercase tracking-widest text-slate-500">
                        <tr>
                          <th className="px-6 py-4 text-left font-semibold">Exam Title</th>
                          <th className="px-6 py-4 text-left font-semibold">Subject</th>
                          <th className="px-6 py-4 text-left font-semibold">Submitted</th>
                          <th className="px-6 py-4 text-left font-semibold">Status</th>
                          <th className="px-6 py-4 text-left font-semibold">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-amber-100">
                        {pendingResults.map((result) => (
                          <tr key={result.id} className="hover:bg-amber-50/60 transition-colors">
                            <td className="px-6 py-4 text-slate-900 font-medium">{result.exam_title}</td>
                            <td className="px-6 py-4 text-slate-600">{result.exam_subject}</td>
                            <td className="px-6 py-4 text-slate-600 text-sm">{formatDate(result.submitted_at)}</td>
                            <td className="px-6 py-4">
                              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">
                                {result.status || "Pending Grading"}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <Link
                                href={`/exam/result/${result.id}`}
                                className="px-4 py-2 rounded-lg bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 transition-all"
                              >
                                View My Results
                              </Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {filteredResults.length === 0 ? (
                <div className="rounded-3xl bg-white/90 border border-slate-200 p-12 text-center shadow-lg shadow-slate-200/60">
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
                    <svg className="h-7 w-7 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-slate-900 mb-2">No results yet</h3>
                  <p className="text-slate-600">{searchQuery ? "No results match your search." : "Complete your first exam to see results here."}</p>
                </div>
              ) : (
                <div className="rounded-3xl bg-white/90 border border-slate-200 shadow-lg shadow-slate-200/60 overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50 text-xs uppercase tracking-widest text-slate-500">
                      <tr>
                        <th className="px-6 py-4 text-left font-semibold">Exam Title</th>
                        <th className="px-6 py-4 text-left font-semibold">Score</th>
                        <th className="px-6 py-4 text-left font-semibold">Percentage</th>
                        <th className="px-6 py-4 text-left font-semibold">Grade</th>
                        <th className="px-6 py-4 text-left font-semibold">Remarks</th>
                        <th className="px-6 py-4 text-left font-semibold">Submitted</th>
                        <th className="px-6 py-4 text-left font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {filteredResults.map((result) => (
                        <tr key={result.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="px-6 py-4 text-slate-900 font-medium">{result.exam_title}</td>
                          <td className="px-6 py-4 text-slate-600">{result.score} / {result.total_points}</td>
                          <td className="px-6 py-4 text-slate-600">{result.percentage.toFixed(1)}%</td>
                          <td className={`px-6 py-4 font-semibold ${getGradeColor(result.grade)}`}>{result.grade}</td>
                          <td className="px-6 py-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              result.remarks === "Passed"
                                ? "bg-green-100 text-green-700"
                                : "bg-red-100 text-red-700"
                            }`}>
                              {result.remarks}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-slate-600 text-sm">{formatDate(result.submitted_at)}</td>
                          <td className="px-6 py-4">
                            <Link
                              href={`/exam/result/${result.id}`}
                              className="px-4 py-2 rounded-lg bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 transition-all"
                            >
                              Review answers
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          )}
        </main>

        {showAnnouncementsModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4">
            <div className="w-full max-w-4xl overflow-hidden rounded-[28px] border border-slate-200/70 bg-white shadow-[0_35px_90px_-45px_rgba(15,23,42,0.6)]">
              <div className="relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_10%_20%,rgba(59,130,246,0.2),transparent_50%),radial-gradient(circle_at_90%_0%,rgba(251,146,60,0.18),transparent_45%)]" />
                <div className="relative flex flex-col gap-4 px-7 py-6 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.35em] text-slate-500">Student Updates</p>
                    <h2 className="mt-2 text-2xl md:text-3xl font-semibold text-slate-900">Announcements Hub</h2>
                    <p className="mt-1 text-sm text-slate-600">Everything your department wants you to see, in one place.</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="hidden sm:flex items-center gap-2 rounded-full bg-white/80 px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm ring-1 ring-slate-200">
                      <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                      Live updates
                    </div>
                    <button
                      onClick={() => setShowAnnouncementsModal(false)}
                      className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-white text-slate-600 shadow-md shadow-slate-200/70 ring-1 ring-slate-200 hover:bg-slate-50 transition-colors"
                      aria-label="Close announcements"
                    >
                      ×
                    </button>
                  </div>
                </div>
              </div>
              <div className="bg-slate-50/70 px-7 py-6">
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <AnnouncementsBanner onMarkAllAsRead={() => setAnnouncementsCount(0)} />
                </div>
              </div>
            </div>
          </div>
        )}

        {showScrollTop && (
          <button
            onClick={handleScrollTop}
            className="fixed bottom-6 right-6 z-40 inline-flex h-12 w-12 items-center justify-center rounded-full bg-sky-600 text-white shadow-xl shadow-sky-500/30 hover:bg-sky-500 transition-all hover:-translate-y-0.5"
            aria-label="Back to top"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
          </button>
        )}

        <Footer />
      </div>
    </div>
  );
}

