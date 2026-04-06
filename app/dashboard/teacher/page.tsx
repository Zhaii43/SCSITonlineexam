// app/dashboard/teacher/page.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

import { API_URL, WS_URL } from "@/lib/api";
import { useToast } from "@/components/ToastProvider";
interface InstructorProfile {
 id: number;
 username: string;
 email: string;
 first_name: string;
 last_name: string;
 profile_picture?: string | null;
 role: string;
 department: string;
 school_id: string;
 contact_number: string;
 is_approved: boolean;
}

interface Exam {
 id: number;
 title: string;
 subject: string;
 department: string;
 exam_type: "prelim" | "midterm" | "final" | "quiz";
 scheduled_date: string;
 duration_minutes: number;
 total_points: number;
 status: "upcoming" | "ongoing" | "completed" | "pending_approval";
 total_students: number;
 submitted_count: number;
 is_approved: boolean;
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
 student_name?: string;
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

export default function InstructorDashboard() {
 const router = useRouter();
 const pathname = usePathname();
 const toast = useToast();
 const [loading, setLoading] = useState(true);
 const [profile, setProfile] = useState<InstructorProfile | null>(null);
 const [exams, setExams] = useState<Exam[]>([]);
 const [activeTab, setActiveTab] = useState<"pending" | "approved">("pending");
 const [error, setError] = useState<string | null>(null);
 const [searchQuery, setSearchQuery] = useState("");
 const [filterType, setFilterType] = useState<string>("all");
 const [filterStatus, setFilterStatus] = useState<string>("all");
 const [showPhotoReviewModal, setShowPhotoReviewModal] = useState(false);
 const [photoReviewCompact, setPhotoReviewCompact] = useState(false);
 const [collapsedStudentPhotos, setCollapsedStudentPhotos] = useState<Record<string, boolean>>({});
 const [photoSearchQuery, setPhotoSearchQuery] = useState("");
 const [examPhotos, setExamPhotos] = useState<any[]>([]);
 const [examPhotoStats, setExamPhotoStats] = useState<{ total_photos: number; total_images: number; total_text: number } | null>(null);
 const [selectedPhotoExam, setSelectedPhotoExam] = useState<number | null>(null);
 const [showExtendModal, setShowExtendModal] = useState(false);
 const [extendExam, setExtendExam] = useState<Exam | null>(null);
 const [extendMinutes, setExtendMinutes] = useState("");
 const [extendReason, setExtendReason] = useState("");
 const [extendStudentId, setExtendStudentId] = useState("");
 const [extendLoading, setExtendLoading] = useState(false);
 const [extendError, setExtendError] = useState<string | null>(null);
 const [extendSuccess, setExtendSuccess] = useState<string | null>(null);
 const [showScrollTop, setShowScrollTop] = useState(false);
 const [announcementsCount, setAnnouncementsCount] = useState(0);
 const [draftExams, setDraftExams] = useState<any[]>([]);
 const [discardingDraft, setDiscardingDraft] = useState<number | null>(null);
 const examSocketRef = useRef<WebSocket | null>(null);
 const reconnectRef = useRef<number | null>(null);
 const [monitoring, setMonitoring] = useState<{
  active_sessions: MonitoringSession[];
  latest_terminations: MonitoringTermination[];
  activity_logs: MonitoringLog[];
 }>({ active_sessions: [], latest_terminations: [], activity_logs: [] });
 const [monitoringError, setMonitoringError] = useState<string | null>(null);
 const [monitoringUpdatedAt, setMonitoringUpdatedAt] = useState<string | null>(null);
 const [showAllLogsModal, setShowAllLogsModal] = useState(false);
 const [showAllSessionsModal, setShowAllSessionsModal] = useState(false);
 const [showAllTerminationsModal, setShowAllTerminationsModal] = useState(false);
 const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
 const [sidebarMobileOpen, setSidebarMobileOpen] = useState(false);
 const [hash, setHash] = useState("");
 const btnPrimary = "inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-slate-900/20 hover:bg-sky-800 transition-all";
 const btnAccent = "inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-indigo-600/25 hover:bg-indigo-700 transition-all";
 const btnOutline = "inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:border-slate-300 hover:bg-slate-50 transition-all";
 const btnTint = "inline-flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold transition-all";

 useEffect(() => {
  checkAuthAndFetchData();
  const interval = setInterval(() => {
   fetchLiveData();
   fetchMonitoring();
  }, 5000);
  const handleFocus = () => {
   fetchLiveData();
   fetchMonitoring();
  };
  const handleVisibility = () => {
   if (document.visibilityState === "visible") {
    fetchLiveData();
    fetchMonitoring();
   }
  };
  window.addEventListener("focus", handleFocus);
  document.addEventListener("visibilitychange", handleVisibility);
  return () => {
   clearInterval(interval);
   window.removeEventListener("focus", handleFocus);
   document.removeEventListener("visibilitychange", handleVisibility);
  };
 }, []);

 useEffect(() => {
  if (typeof window === "undefined") return;
  const updateHash = () => setHash(window.location.hash || "");
  updateHash();
  window.addEventListener("hashchange", updateHash);
  return () => window.removeEventListener("hashchange", updateHash);
 }, []);

 useEffect(() => {
  if (!hash) return;
  const id = hash.replace("#", "");
  const el = document.getElementById(id);
  if (el) {
   el.scrollIntoView({ behavior: "smooth", block: "start" });
  }
 }, [hash]);

 const isActive = (href: string) => {
  if (href.startsWith("#")) return hash === href;
  if (href.includes("#")) {
   const [path, h] = href.split("#");
   return pathname === path && hash === `#${h}`;
  }
  if (pathname === href) {
   return hash === "";
  }
  return false;
 };
 const itemClass = (href: string, base = "") =>
  `flex items-center gap-2 rounded-lg px-3 py-2 transition-all ${
   isActive(href) ? "bg-sky-800 text-white font-semibold" : "text-sky-100/80 hover:bg-sky-800 hover:text-white"
  } ${base}`;


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

  useEffect(() => {
   const handleResponsiveToggle = () => {
    if (window.innerWidth < 1024) {
     setSidebarMobileOpen((prev) => !prev);
    } else {
     setSidebarCollapsed((prev) => !prev);
    }
   };
   window.addEventListener("toggle-instructor-sidebar", handleResponsiveToggle as EventListener);
   return () => window.removeEventListener("toggle-instructor-sidebar", handleResponsiveToggle as EventListener);
  }, []);

  useEffect(() => {
   if (typeof window === "undefined") return;
   const isDesktop = window.innerWidth >= 1024;
   const width = isDesktop && !sidebarCollapsed ? 240 : 0;
   window.dispatchEvent(new CustomEvent("instructor-sidebar-width", { detail: { width } }));
  }, [sidebarCollapsed]);

 const handleScrollTop = () => {
  window.scrollTo({ top: 0, behavior: "smooth" });
 };

 const fetchLiveData = async () => {
  const token = localStorage.getItem("access_token");
  if (!token) return;
  try {
   const [examsRes, announcementsRes, draftsRes] = await Promise.all([
    fetch(`${API_URL}/exams/instructor/`, {
     headers: { Authorization: `Bearer ${token}` },
    }),
    fetch(`${API_URL}/notifications/announcements/mine/`, {
     headers: { Authorization: `Bearer ${token}` },
    }),
    fetch(`${API_URL}/exams/drafts/`, {
     headers: { Authorization: `Bearer ${token}` },
    }),
   ]);
   if (examsRes.ok) setExams(await examsRes.json());
   if (announcementsRes.ok) {
    const data = await announcementsRes.json();
    setAnnouncementsCount(Array.isArray(data.announcements) ? data.announcements.length : 0);
   }
   if (draftsRes.ok) setDraftExams(await draftsRes.json());
  } catch {}
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
   setMonitoring(data);
   setMonitoringUpdatedAt(new Date().toLocaleTimeString());
   setMonitoringError(null);
  } catch {
   setMonitoringError("Failed to load monitoring");
  }
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
   
   if (profileData.role !== "instructor") {
    router.push("/dashboard");
    return;
   }

   if (!profileData.is_approved) {
    setError("Your account is pending approval. Please wait for admin approval.");
    setLoading(false);
    return;
   }

   setProfile(profileData);

   const examsRes = await fetch(`${API_URL}/exams/instructor/`, {
    headers: { Authorization: `Bearer ${token}` },
   });

   if (examsRes.ok) {
    const examsData = await examsRes.json();
    setExams(examsData);
   }
   const announcementsRes = await fetch(`${API_URL}/notifications/announcements/mine/`, {
    headers: { Authorization: `Bearer ${token}` },
   });
   if (announcementsRes.ok) {
    const data = await announcementsRes.json();
    setAnnouncementsCount(Array.isArray(data.announcements) ? data.announcements.length : 0);
   }
   const draftsRes = await fetch(`${API_URL}/exams/drafts/`, {
    headers: { Authorization: `Bearer ${token}` },
   });
   if (draftsRes.ok) setDraftExams(await draftsRes.json());
   fetchMonitoring();

   setLoading(false);
  } catch (err: any) {
   setError(err.message || "Failed to load dashboard");
   setLoading(false);
  }
 };

 const handleDiscardDraft = async (draftId: number) => {
  if (!confirm("Delete this draft exam? This cannot be undone.")) return;
  setDiscardingDraft(draftId);
  const token = localStorage.getItem("access_token");
  try {
   await fetch(`${API_URL}/exams/${draftId}/discard-draft/`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
   });
   setDraftExams((prev) => prev.filter((d) => d.id !== draftId));
   toast.success("Draft exam deleted.");
  } catch {
   toast.error("Failed to delete draft.");
  } finally {
   setDiscardingDraft(null);
  }
 };

 const handleLogout = () => {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
  localStorage.removeItem("user_name");
  localStorage.removeItem("user_role");
  localStorage.removeItem("user_id");
  toast.success("Logged out successfully.");
  router.push("/login");
 };

 const handleOpenExtendModal = (exam: Exam) => {
  setExtendExam(exam);
  setExtendMinutes("");
  setExtendReason("");
  setExtendStudentId("");
  setExtendError(null);
  setExtendSuccess(null);
  setShowExtendModal(true);
 };

 const handleExtendTime = async (bulk: boolean) => {
  const token = localStorage.getItem("access_token");
  if (!extendExam) return;
  const mins = parseInt(extendMinutes);
  if (!mins || mins <= 0) { setExtendError("Enter a valid number of minutes."); return; }
  setExtendLoading(true);
  setExtendError(null);
  setExtendSuccess(null);
  try {
   const body: any = { extra_minutes: mins, reason: extendReason };
   if (!bulk && extendStudentId) body.student_id = extendStudentId;
   const res = await fetch(`/api/exams/${extendExam.id}/extend-time`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
   });
   const data = await res.json();
   if (!res.ok) { setExtendError(data.error || "Failed to extend time."); return; }
   setExtendSuccess(data.message);
  } catch { setExtendError("Network error."); }
  finally { setExtendLoading(false); }
 };

 const handleViewExamPhotos = async (examId: number) => {
  const token = localStorage.getItem("access_token");
  try {
   const res = await fetch(`${API_URL}/exams/${examId}/photos/`, {
    headers: { Authorization: `Bearer ${token}` },
   });

   if (res.ok) {
    const data = await res.json();
    setExamPhotos(data.photos);
    setExamPhotoStats({
     total_photos: data.total_photos ?? data.photos.length,
     total_images: data.total_images ?? data.photos.filter((p: any) => p.photo_url).length,
     total_text: data.total_text ?? data.photos.filter((p: any) => p.is_text_only || !p.photo_url).length,
    });
    setSelectedPhotoExam(examId);
    setShowPhotoReviewModal(true);
   }
  } catch (err) {
   console.error("Failed to fetch exam photos");
  }
 };

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
        className="bg-slate-900 text-white px-6 py-3 rounded-xl hover:bg-sky-800 transition-all shadow-lg shadow-slate-900/15"
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

 const pendingExams = exams.filter(e => !e.is_approved);
 const approvedExams = exams.filter(e => e.is_approved);
 const upcomingExams = approvedExams.filter(e => e.status === "upcoming" || e.status === "ongoing");
 const completedExams = approvedExams.filter(e => e.status === "completed");
 const totalSubmissions = exams.reduce((sum, e) => sum + (e.submitted_count || 0), 0);
 const tabItems = [
  { key: "pending" as const, label: "Pending Approval", count: pendingExams.length },
  { key: "approved" as const, label: "Approved Exams", count: approvedExams.length },
 ];
 const activeTabIndex = tabItems.findIndex((t) => t.key === activeTab);

 // Filter and search logic
 const filteredPendingExams = pendingExams.filter(exam => {
  const matchesSearch = exam.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
             exam.subject.toLowerCase().includes(searchQuery.toLowerCase());
  const matchesType = filterType === "all" || exam.exam_type === filterType;
  return matchesSearch && matchesType;
 });

 const filteredApprovedExams = approvedExams.filter(exam => {
  const matchesSearch = exam.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
             exam.subject.toLowerCase().includes(searchQuery.toLowerCase());
  const matchesType = filterType === "all" || exam.exam_type === filterType;
  const matchesStatus = filterStatus === "all" || exam.status === filterStatus;
  return matchesSearch && matchesType && matchesStatus;
 });

 return (
  <div className="min-h-screen bg-sky-200 relative">
   <div className="absolute inset-0 pointer-events-none -z-10 bg-[radial-gradient(circle_at_15%_10%,rgba(14,165,233,0.18),transparent_55%),radial-gradient(circle_at_90%_0%,rgba(251,146,60,0.14),transparent_40%),radial-gradient(circle_at_50%_90%,rgba(16,185,129,0.12),transparent_45%)]" />
   
   <div className="relative">
    <Header />

    <main className="w-full py-4" style={{ fontFamily: "'Space Grotesk', 'Manrope', sans-serif" }}>
     <div className="flex gap-0">
      {sidebarMobileOpen && (
       <div className="fixed inset-0 z-50 lg:hidden">
        <div
         className="absolute inset-0 bg-black/40"
         onClick={() => setSidebarMobileOpen(false)}
        />
        <aside className="absolute left-0 top-0 h-full w-72 bg-sky-900 text-sky-100 shadow-2xl">
         <div className="p-4 border-b border-sky-800/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
           <div className="relative h-9 w-9 rounded-lg bg-white/10 p-1">
            <Image
             src="/logo.png"
             alt="SCSIT Logo"
             fill
             className="object-contain"
             priority
            />
           </div>
           <div>
            <p className="text-sm font-semibold text-white">Online Exam</p>
            <p className="text-xs text-sky-200/70 mt-1">Instructor</p>
           </div>
          </div>
          <button
           className="h-9 w-9 inline-flex items-center justify-center rounded-lg border border-sky-800 text-sky-200 hover:bg-sky-800"
           onClick={() => setSidebarMobileOpen(false)}
           aria-label="Close sidebar"
          >
           ✕
          </button>
         </div>
        <nav className="mt-3 space-y-1 text-sm px-4">
          <Link href="/dashboard/teacher" onClick={() => setSidebarMobileOpen(false)} className={itemClass("/dashboard/teacher")}>
           <span className="h-2 w-2 rounded-full bg-sky-400" />
           Dashboard
          </Link>
          <Link href="/dashboard/teacher#my-exams" onClick={() => setSidebarMobileOpen(false)} className={itemClass("/dashboard/teacher#my-exams", "mt-3")}>
           <span className="h-2 w-2 rounded-full bg-sky-400" />
           My Exams
          </Link>
          <Link href="/dashboard/teacher#active-sessions" onClick={() => setSidebarMobileOpen(false)} className={itemClass("/dashboard/teacher#active-sessions")}>
           <span className="h-2 w-2 rounded-full bg-sky-400" />
           Active Sessions & Activity
          </Link>
          <Link href="/exam/create" onClick={() => setSidebarMobileOpen(false)} className={itemClass("/exam/create")}>
           Create Exam
          </Link>
          <Link href="/dashboard/teacher/announcements" onClick={() => setSidebarMobileOpen(false)} className={itemClass("/dashboard/teacher/announcements")}>
           Announcements
          </Link>
          <Link href="/dashboard/teacher/reports" onClick={() => setSidebarMobileOpen(false)} className={itemClass("/dashboard/teacher/reports")}>
           Issue Reports
          </Link>
          <Link href="/profile/settings" onClick={() => setSidebarMobileOpen(false)} className={itemClass("/profile/settings")}>
           Profile Settings
          </Link>
          <Link href="/help" onClick={() => setSidebarMobileOpen(false)} className={itemClass("/help")}>
           Help Center
          </Link>
         </nav>
        </aside>
       </div>
      )}

      <aside className="hidden lg:block shrink-0">
       <div className={`fixed left-0 top-0 h-screen bg-sky-900 text-sky-100 shadow-xl shadow-sky-900/30 z-50 p-4 transition-all duration-300 ${sidebarCollapsed ? "w-0 opacity-0 pointer-events-none" : "w-64 opacity-100"}`}>
        <div className={`px-3 pb-4 border-b border-sky-800/60 ${sidebarCollapsed ? "text-center" : ""}`}>
         <div className="flex items-center gap-3">
          <div className="relative h-9 w-9 rounded-lg bg-white/10 p-1">
           <Image
            src="/logo.png"
            alt="SCSIT Logo"
            fill
            className="object-contain"
            priority
           />
          </div>
          {!sidebarCollapsed && (
           <div>
            <p className="text-sm font-semibold text-white">Online Exam</p>
            <p className="text-xs text-sky-200/70 mt-1">Instructor</p>
           </div>
          )}
         </div>
        </div>
        <nav className="mt-3 space-y-1 text-sm">
         <Link href="/dashboard/teacher" className={itemClass("/dashboard/teacher")}>
          <span className="h-2 w-2 rounded-full bg-sky-400" />
          {!sidebarCollapsed && "Dashboard"}
         </Link>
         <Link href="/dashboard/teacher#my-exams" className={itemClass("/dashboard/teacher#my-exams", "mt-3")}>
          <span className="h-2 w-2 rounded-full bg-sky-400" />
          {!sidebarCollapsed && "My Exams"}
         </Link>
         <Link href="/dashboard/teacher#active-sessions" className={itemClass("/dashboard/teacher#active-sessions")}>
          <span className="h-2 w-2 rounded-full bg-sky-400" />
          {!sidebarCollapsed && "Active Sessions & Activity"}
         </Link>
         <Link href="/exam/create" className={itemClass("/exam/create")}>
          <span className="h-2 w-2 rounded-full bg-sky-400" />
          {!sidebarCollapsed && "Create Exam"}
         </Link>
         <Link href="/dashboard/teacher/announcements" className={itemClass("/dashboard/teacher/announcements")}>
          <span className="h-2 w-2 rounded-full bg-sky-400" />
          {!sidebarCollapsed && "Announcements"}
         </Link>
         <Link href="/dashboard/teacher/reports" className={itemClass("/dashboard/teacher/reports")}>
          <span className="h-2 w-2 rounded-full bg-sky-400" />
          {!sidebarCollapsed && "Issue Reports"}
         </Link>
         <Link href="/profile/settings" className={itemClass("/profile/settings")}>
          <span className="h-2 w-2 rounded-full bg-sky-400" />
          {!sidebarCollapsed && "Profile Settings"}
         </Link>
         <Link href="/help" className={itemClass("/help")}>
          <span className="h-2 w-2 rounded-full bg-sky-400" />
          {!sidebarCollapsed && "Help Center"}
         </Link>
        </nav>
        {!sidebarCollapsed && (
         <div className="mt-4 rounded-xl border border-sky-800/60 bg-sky-800 px-3 py-3">
          <p className="text-[11px] uppercase tracking-[0.3em] text-sky-200/70">Quick Tip</p>
          <p className="text-xs text-sky-100/80 mt-2">Approved exams are read-only. Use “Create Exam” to post a new one.</p>
         </div>
        )}
       </div>
      </aside>

      <div className={`flex-1 min-w-0 px-4 sm:px-6 lg:px-6 transition-[margin] duration-300 ${sidebarCollapsed ? "lg:ml-0" : "lg:ml-[240px]"}`}>
       <div className="mb-4 flex items-center justify-between">
        <div>
         <h1 className="text-3xl font-semibold text-slate-900">Dashboard</h1>
         <p className="text-sm text-slate-500">Overview of exams, submissions, and approvals.</p>
        </div>
        <div className="text-xs text-slate-500">
         <span className="text-sky-600 font-semibold">Home</span>
         <span className="mx-2">/</span>
         <span>Dashboard</span>
        </div>
       </div>

     <div className="mb-8 rounded-3xl bg-white/90 backdrop-blur-xl border border-slate-200 shadow-xl shadow-slate-200/60 p-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
       <div>
        <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Instructor Dashboard</p>
        <h1 className="mt-2 text-3xl sm:text-4xl font-semibold text-slate-900">Welcome back, {profile?.first_name}</h1>
        <p className="mt-2 text-slate-600">{profile?.department} | {profile?.school_id}</p>
        <div className="mt-5 flex flex-wrap gap-3">
         <Link
          href="/exam/create"
          className={btnPrimary}
         >
          Create New Exam
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
         Instructor
        </span>
       </div>
       </div>
     </div>

     <div className="mb-8 rounded-3xl border border-slate-200/80 bg-white/90 backdrop-blur-xl shadow-lg shadow-slate-200/60">
      <div className="grid grid-cols-1 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-slate-200/70">
       <div className="p-6 flex items-center gap-4">
        <div className="h-11 w-11 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700">
         <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
         </svg>
        </div>
        <div>
         <p className="text-[11px] uppercase tracking-[0.25em] text-slate-500">Pending</p>
         <p className="text-2xl font-semibold text-slate-900">{pendingExams.length}</p>
         <p className="text-xs text-slate-500">Awaiting dean review</p>
        </div>
       </div>
       <div className="p-6 flex items-center gap-4">
        <div className="h-11 w-11 rounded-2xl bg-sky-50 border border-sky-200 flex items-center justify-center text-sky-700">
         <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5 2a9 9 0 11-18 0 9 9 0 0118 0z" />
         </svg>
        </div>
        <div>
         <p className="text-[11px] uppercase tracking-[0.25em] text-slate-500">Approved</p>
         <p className="text-2xl font-semibold text-slate-900">{approvedExams.length}</p>
         <p className="text-xs text-slate-500">Ready to run</p>
        </div>
       </div>
       <div className="p-6 flex items-center gap-4">
        <div className="h-11 w-11 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
         <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h6m8-4v9a2 2 0 01-2 2H5a2 2 0 01-2-2V8" />
         </svg>
        </div>
        <div>
         <p className="text-[11px] uppercase tracking-[0.25em] text-slate-500">Submissions</p>
         <p className="text-2xl font-semibold text-slate-900">{totalSubmissions}</p>
         <p className="text-xs text-slate-500">Student attempts</p>
        </div>
       </div>
       <Link
        href="/dashboard/teacher/announcements"
        className="p-6 flex items-center gap-4 hover:bg-slate-50 transition-all"
       >
        <div className="h-11 w-11 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700">
         <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h6m8-4v9a2 2 0 01-2 2H5a2 2 0 01-2-2V8" />
         </svg>
        </div>
        <div>
         <p className="text-[11px] uppercase tracking-[0.25em] text-slate-500">Announcements</p>
         <p className="text-2xl font-semibold text-slate-900">{announcementsCount}</p>
         <p className="text-xs text-slate-500">Total posts</p>
        </div>
       </Link>
      </div>
     </div>
     <div id="active-sessions" className="mb-8 relative overflow-hidden rounded-3xl border border-slate-200/80 bg-gradient-to-br from-white/95 via-white to-sky-50/80 backdrop-blur-xl p-6 shadow-[0_18px_40px_-28px_rgba(15,23,42,0.45)]">
      <div className="pointer-events-none absolute -right-16 -top-12 h-40 w-40 rounded-full bg-sky-200/50 blur-3xl" />
      <div className="pointer-events-none absolute -left-12 -bottom-16 h-40 w-40 rounded-full bg-emerald-200/40 blur-3xl" />

      <div className="relative flex flex-wrap items-center justify-between gap-4">
       <div>
        <div className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.25em] text-white shadow-lg shadow-slate-900/20">
         <span className="relative flex h-2.5 w-2.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-300 opacity-75"></span>
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400"></span>
         </span>
         Live Monitoring
        </div>
        <h2 className="mt-3 text-2xl font-semibold text-slate-900">Active Sessions & Activity</h2>
        <p className="mt-1 text-sm text-slate-600">
         Auto-refreshing every 5 seconds{monitoringUpdatedAt ? ` · Updated ${monitoringUpdatedAt}` : ""}
        </p>
       </div>
       <div className="flex flex-wrap gap-2">
        <span className="inline-flex items-center rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200/70">
         Active: {monitoring.active_sessions.length}
        </span>
        <span className="inline-flex items-center rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700 ring-1 ring-amber-200/70">
         Terminations: {monitoring.latest_terminations.length}
        </span>
        <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 ring-1 ring-slate-200/70">
         Logs: {monitoring.activity_logs.length}
        </span>
       </div>
      </div>

      {monitoringError && (
       <p className="relative mt-4 text-sm text-red-600">{monitoringError}</p>
      )}

      <div className="relative mt-6 grid grid-cols-1 lg:grid-cols-3 gap-5">
       <div
        className={`flex flex-col rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4 max-h-[420px] overflow-hidden ${
         monitoring.active_sessions.length === 0 ? "min-h-[140px]" : "min-h-[280px]"
        }`}
       >
        <div className="flex items-center justify-between gap-2">
         <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Active Sessions</p>
         <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold text-emerald-700/80">{monitoring.active_sessions.length} total</span>
          <button
           type="button"
           onClick={() => setShowAllSessionsModal(true)}
           className="inline-flex items-center rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-emerald-700 ring-1 ring-emerald-200/70 hover:bg-emerald-50 transition-all"
          >
           View All
          </button>
         </div>
        </div>
        {monitoring.active_sessions.length === 0 ? (
         <p className="mt-3 text-sm text-emerald-900/70">No active sessions right now.</p>
        ) : (
         <div className="mt-3 flex-1 min-h-0 space-y-3 overflow-y-auto pr-1">
          {monitoring.active_sessions.slice(0, 10).map((s) => (
           <div key={`${s.exam_id}-${s.student_id}`} className="rounded-xl bg-white/90 p-3 border border-emerald-100 shadow-sm">
            <p className="text-sm font-semibold text-slate-900 truncate">{s.student_username}</p>
            <p className="text-xs text-slate-600 truncate">{s.exam_title}</p>
            <p className="text-[11px] text-emerald-700 mt-1">
             Last heartbeat {s.seconds_since_heartbeat}s ago
            </p>
           </div>
          ))}
         </div>
        )}
       </div>

       <div
        className={`flex flex-col rounded-2xl border border-amber-100 bg-amber-50/60 p-4 max-h-[420px] overflow-hidden ${
         monitoring.latest_terminations.length === 0 ? "min-h-[140px]" : "min-h-[280px]"
        }`}
       >
        <div className="flex items-center justify-between gap-2">
         <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">Latest Terminations</p>
         <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold text-amber-700/80">{monitoring.latest_terminations.length} total</span>
          <button
           type="button"
           onClick={() => setShowAllTerminationsModal(true)}
           className="inline-flex items-center rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-amber-700 ring-1 ring-amber-200/70 hover:bg-amber-50 transition-all"
          >
           View All
          </button>
         </div>
        </div>
        {monitoring.latest_terminations.length === 0 ? (
         <p className="mt-3 text-sm text-amber-900/70">No recent terminations.</p>
        ) : (
         <div className="mt-3 flex-1 min-h-0 space-y-3 overflow-y-auto pr-1">
          {monitoring.latest_terminations.slice(0, 10).map((t) => (
           <div key={t.id} className="rounded-xl bg-white/90 p-3 border border-amber-100 shadow-sm">
            <div className="flex items-center justify-between gap-2">
             <p className="text-sm font-semibold text-slate-900 truncate">{t.student_name || "Student"}</p>
             <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-700 ring-1 ring-amber-200/70">
              Terminated
             </span>
            </div>
            <p className="text-xs text-slate-600 mt-1 line-clamp-2">{t.description}</p>
            <p className="text-[11px] text-amber-700 mt-1">
             {new Date(t.timestamp).toLocaleString()}
            </p>
           </div>
          ))}
         </div>
        )}
       </div>

       <div
        className={`flex flex-col rounded-2xl border border-slate-200 bg-slate-50/60 p-4 max-h-[420px] overflow-hidden ${
         monitoring.activity_logs.length === 0 ? "min-h-[140px]" : "min-h-[280px]"
        }`}
       >
        <div className="flex items-center justify-between gap-2">
         <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">Activity Logs</p>
         <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold text-slate-500">{monitoring.activity_logs.length} total</span>
          <button
           type="button"
           onClick={() => setShowAllLogsModal(true)}
           className="inline-flex items-center rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-100 transition-all"
          >
           View All
          </button>
         </div>
        </div>
        {monitoring.activity_logs.length === 0 ? (
         <p className="mt-3 text-sm text-slate-600">No activity yet.</p>
        ) : (
         <div className="mt-3 flex-1 min-h-0 space-y-3 overflow-y-auto pr-1">
          {monitoring.activity_logs.slice(0, 10).map((l) => (
           <div key={l.id} className="rounded-xl bg-white/90 p-3 border border-slate-200 shadow-sm">
            <p className="text-sm font-semibold text-slate-900 line-clamp-2">{l.description}</p>
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

    {showAllLogsModal && (
     <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-3xl rounded-2xl bg-white shadow-2xl shadow-slate-900/20">
       <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
        <div>
         <h3 className="text-lg font-semibold text-slate-900">All Activity Logs</h3>
         <p className="text-xs text-slate-500 mt-1">{monitoring.activity_logs.length} total record(s)</p>
        </div>
        <button
         type="button"
         onClick={() => setShowAllLogsModal(false)}
         className="text-slate-400 hover:text-slate-600 text-2xl leading-none"
         aria-label="Close logs"
        >
         ×
        </button>
       </div>
       <div className="max-h-[70vh] overflow-y-auto p-6 space-y-3">
        {monitoring.activity_logs.length === 0 ? (
         <div className="text-center py-12">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100">
           <svg className="h-6 w-6 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10m-10 4h6m-9 5h12a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v11a2 2 0 002 2z" />
           </svg>
          </div>
          <p className="text-sm text-slate-600">No activity yet.</p>
         </div>
        ) : (
         monitoring.activity_logs.map((l) => (
          <div key={`modal-${l.id}`} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
           <p className="text-sm font-semibold text-slate-900">{l.description}</p>
           <p className="text-[11px] text-slate-500 mt-1">{new Date(l.timestamp).toLocaleString()}</p>
          </div>
         ))
        )}
       </div>
       <div className="border-t border-slate-200 px-6 py-4 flex justify-end">
        <button
         type="button"
         onClick={() => setShowAllLogsModal(false)}
         className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-800 transition-all"
        >
         Close
        </button>
       </div>
      </div>
     </div>
    )}

    {showAllSessionsModal && (
     <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-3xl rounded-2xl bg-white shadow-2xl shadow-slate-900/20">
       <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
        <div>
         <h3 className="text-lg font-semibold text-slate-900">All Active Sessions</h3>
         <p className="text-xs text-slate-500 mt-1">{monitoring.active_sessions.length} total record(s)</p>
        </div>
        <button
         type="button"
         onClick={() => setShowAllSessionsModal(false)}
         className="text-slate-400 hover:text-slate-600 text-2xl leading-none"
         aria-label="Close sessions"
        >
         ×
        </button>
       </div>
       <div className="max-h-[70vh] overflow-y-auto p-6 space-y-3">
        {monitoring.active_sessions.length === 0 ? (
         <div className="text-center py-12">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50">
           <svg className="h-6 w-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6l4 2m6-2a9 9 0 11-18 0 9 9 0 0118 0z" />
           </svg>
          </div>
          <p className="text-sm text-slate-600">No active sessions right now.</p>
         </div>
        ) : (
         monitoring.active_sessions.map((s) => (
          <div key={`modal-session-${s.exam_id}-${s.student_id}`} className="rounded-xl border border-emerald-100 bg-white p-4 shadow-sm">
           <p className="text-sm font-semibold text-slate-900">{s.student_username}</p>
           <p className="text-xs text-slate-600">{s.exam_title}</p>
           <p className="text-[11px] text-emerald-700 mt-1">Last heartbeat {s.seconds_since_heartbeat}s ago</p>
          </div>
         ))
        )}
       </div>
       <div className="border-t border-slate-200 px-6 py-4 flex justify-end">
        <button
         type="button"
         onClick={() => setShowAllSessionsModal(false)}
         className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-800 transition-all"
        >
         Close
        </button>
       </div>
      </div>
     </div>
    )}

    {showAllTerminationsModal && (
     <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-3xl rounded-2xl bg-white shadow-2xl shadow-slate-900/20">
       <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
        <div>
         <h3 className="text-lg font-semibold text-slate-900">All Terminations</h3>
         <p className="text-xs text-slate-500 mt-1">{monitoring.latest_terminations.length} total record(s)</p>
        </div>
        <button
         type="button"
         onClick={() => setShowAllTerminationsModal(false)}
         className="text-slate-400 hover:text-slate-600 text-2xl leading-none"
         aria-label="Close terminations"
        >
         ×
        </button>
       </div>
       <div className="max-h-[70vh] overflow-y-auto p-6 space-y-3">
        {monitoring.latest_terminations.length === 0 ? (
         <div className="text-center py-12">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50">
           <svg className="h-6 w-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
           </svg>
          </div>
          <p className="text-sm text-slate-600">No recent terminations.</p>
         </div>
        ) : (
         monitoring.latest_terminations.map((t) => (
          <div key={`modal-term-${t.id}`} className="rounded-xl border border-amber-100 bg-white p-4 shadow-sm">
           <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-semibold text-slate-900 truncate">{t.student_name || "Student"}</p>
            <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-700 ring-1 ring-amber-200/70">
             Terminated
            </span>
           </div>
           <p className="text-xs text-slate-600 mt-1">{t.description}</p>
           <p className="text-[11px] text-amber-700 mt-1">{new Date(t.timestamp).toLocaleString()}</p>
          </div>
         ))
        )}
       </div>
       <div className="border-t border-slate-200 px-6 py-4 flex justify-end">
        <button
         type="button"
         onClick={() => setShowAllTerminationsModal(false)}
         className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-800 transition-all"
        >
         Close
        </button>
       </div>
      </div>
     </div>
    )}


     {draftExams.length > 0 && (
      <div className="mb-8 rounded-3xl border border-amber-200/80 bg-amber-50/60 backdrop-blur-xl shadow-lg shadow-amber-200/40 overflow-hidden">
       <div className="flex items-center justify-between px-6 py-4 border-b border-amber-200/70 bg-amber-100/60">
        <div className="flex items-center gap-3">
         <div className="h-9 w-9 rounded-xl bg-amber-200 text-amber-800 flex items-center justify-center">
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
         </div>
         <div>
          <h3 className="text-base font-semibold text-amber-900">Draft Exams</h3>
          <p className="text-xs text-amber-700">These exams were created but questions were never saved. Continue or delete them.</p>
         </div>
        </div>
        <span className="inline-flex items-center justify-center rounded-full bg-amber-200 text-amber-800 text-xs font-bold px-2.5 py-0.5">{draftExams.length}</span>
       </div>
       <div className="divide-y divide-amber-200/60">
        {draftExams.map((draft) => (
         <div key={draft.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-6 py-4 bg-white/70 hover:bg-white transition-all">
          <div>
           <p className="font-semibold text-slate-900">{draft.title}</p>
           <p className="text-xs text-slate-500 mt-0.5">{draft.subject} · {draft.exam_type} · {draft.total_points} pts</p>
           <p className="text-xs text-slate-400 mt-0.5">Created {new Date(draft.created_at).toLocaleString()}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
           <Link
            href={`/exam/questions/${draft.id}`}
            className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-sky-800 transition-all"
           >
            Continue
           </Link>
           <button
            onClick={() => handleDiscardDraft(draft.id)}
            disabled={discardingDraft === draft.id}
            className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-4 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 transition-all disabled:opacity-50"
           >
            {discardingDraft === draft.id ? "Deleting..." : "Delete"}
           </button>
          </div>
         </div>
        ))}
       </div>
      </div>
     )}

    <div id="my-exams" className="mb-6 flex items-center justify-between">
     <div className="flex items-center gap-3">
      <div className="h-10 w-10 rounded-2xl bg-slate-900 text-white flex items-center justify-center">
       <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5h6m2 0h2a2 2 0 012 2v11a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2" />
       </svg>
      </div>
      <div>
       <h2 className="text-2xl font-semibold text-slate-900">My Exams</h2>
       <p className="text-sm text-slate-600 mt-1">Track approvals, monitor progress, and manage student submissions.</p>
      </div>
     </div>
     <div className="hidden md:flex items-center gap-2 text-xs text-slate-500 uppercase tracking-[0.2em]">
      <span className="h-2 w-2 rounded-full bg-emerald-400" />
      Live Updates
     </div>
    </div>

     <div className="mb-6">
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
              {tab.key === "pending" && (
               <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 11h14M5 7h14a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V9a2 2 0 012-2z" />
               </svg>
              )}
              {tab.key === "approved" && (
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
     </div>


     {/* Search and Filters */}
     <div className="bg-white/90 backdrop-blur-xl rounded-3xl p-6 border border-slate-200 shadow-lg shadow-slate-200/60 mb-6">
      <div className="flex flex-col md:flex-row gap-4">
       <div className="flex-1">
        <div className="relative">
         <input
          type="text"
          placeholder="Search exams by title or subject..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-4 py-3 pl-10 border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-slate-200 text-slate-900"
         />
         <svg className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
         </svg>
        </div>
       </div>
       <select
        value={filterType}
        onChange={(e) => setFilterType(e.target.value)}
        className="px-4 py-3 border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-slate-200 text-slate-900"
       >
        <option value="all">All Types</option>
        <option value="prelim">Prelim</option>
        <option value="midterm">Midterm</option>
        <option value="final">Final</option>
        <option value="quiz">Quiz</option>
       </select>
       {activeTab === "approved" && (
        <select
         value={filterStatus}
         onChange={(e) => setFilterStatus(e.target.value)}
         className="px-4 py-3 border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-slate-200 text-slate-900"
        >
         <option value="all">All Status</option>
         <option value="upcoming">Upcoming</option>
         <option value="ongoing">Ongoing</option>
         <option value="completed">Completed</option>
        </select>
       )}
      </div>
     </div>

     {activeTab === "pending" && (
      <div className="space-y-4">
       {filteredPendingExams.length === 0 ? (
        <div className="bg-white/90 backdrop-blur-xl rounded-3xl p-12 border border-slate-200 shadow-lg shadow-slate-200/60 text-center">
         <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
          <svg className="h-7 w-7 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10m-10 4h6m-9 5h12a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v11a2 2 0 002 2z" />
          </svg>
         </div>
         <h3 className="text-xl font-bold text-slate-900 mb-2">No Pending Exams</h3>
         <p className="text-slate-600">{searchQuery || filterType !== "all" ? "No exams match your search criteria." : "All your exams have been approved by the dean."}</p>
        </div>
       ) : (
        <div className="rounded-2xl border border-amber-200/70 bg-white/95 shadow-md shadow-amber-200/35 overflow-hidden">
         <div className="hidden md:grid grid-cols-[2fr_1.2fr_1fr_1fr] gap-4 px-6 py-3 text-[11px] uppercase tracking-[0.25em] text-slate-500 bg-amber-50 border-b border-amber-200/70">
          <div>Exam</div>
          <div>Schedule</div>
          <div>Status</div>
          <div>Actions</div>
         </div>
         <div className="divide-y divide-amber-200/60">
          {filteredPendingExams.map((exam) => (
           <div key={exam.id} className="grid grid-cols-1 md:grid-cols-[2fr_1.2fr_1fr_1fr] gap-4 px-6 py-4 items-start md:items-center">
            <div>
             <Link href={`/exam/${exam.id}/edit`} className="text-base font-semibold text-slate-900 hover:text-amber-700 transition-colors">
              {exam.title}
             </Link>
             <p className="text-xs text-slate-500 mt-1">{exam.subject}</p>
             <div className="mt-2 flex flex-wrap gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wide bg-blue-100 text-blue-700">
               {exam.exam_type}
              </span>
              <span className="text-[11px] text-slate-500">Points: {exam.total_points} pts</span>
             </div>
            </div>
            <div className="text-sm text-slate-700">
             <p className="font-medium">{new Date(exam.scheduled_date).toLocaleDateString()}</p>
             <p className="text-xs text-slate-500">{exam.duration_minutes} mins</p>
            </div>
            <div>
             <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wide bg-yellow-100 text-yellow-700">
              Pending
             </span>
            </div>
            <div className="flex flex-wrap gap-2">
             <Link href={`/exam/${exam.id}/edit`} className={btnPrimary}>
              Edit
             </Link>
            </div>
           </div>
          ))}
         </div>
        </div>
       )}
      </div>
     )}

     {activeTab === "approved" && (
      <div className="space-y-4 overflow-visible">
       {filteredApprovedExams.length === 0 ? (
       <div className="bg-white/90 backdrop-blur-xl rounded-3xl p-12 border border-slate-200 shadow-lg shadow-slate-200/60 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
                  <svg className="h-7 w-7 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10m-10 4h6m-9 5h12a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v11a2 2 0 002 2z" />
                  </svg>
                </div>
        <h3 className="text-xl font-bold text-slate-900 mb-2">No Exams Yet</h3>
        <p className="text-slate-600 mb-6">{searchQuery || filterType !== "all" || filterStatus !== "all" ? "No exams match your search criteria." : "Create your first exam to get started."}</p>
       <Link
        href="/exam/create"
        className={btnPrimary}
       >
        Create Exam
       </Link>
       </div>
      ) : (
       <div className="rounded-2xl border border-slate-200/80 bg-white/95 shadow-md shadow-slate-200/40 overflow-hidden">
        <div className="hidden md:grid grid-cols-[2fr_1.2fr_1fr_2fr] gap-4 px-6 py-3 text-[11px] uppercase tracking-[0.25em] text-slate-500 bg-slate-50 border-b border-slate-200/70">
         <div>Exam</div>
         <div>Schedule</div>
         <div>Status</div>
         <div>Actions</div>
        </div>
        <div className="divide-y divide-slate-200/70">
         {filteredApprovedExams.map((exam) => (
          <div key={exam.id} className="grid grid-cols-1 md:grid-cols-[2fr_1.2fr_1fr_2fr] gap-4 px-6 py-4 items-start md:items-center">
           <div>
            <Link href={`/exam/${exam.id}/edit`} className="text-base font-semibold text-slate-900 hover:text-sky-700 transition-colors">
             {exam.title}
            </Link>
            <p className="text-xs text-slate-500 mt-1">{exam.subject}</p>
            <div className="mt-2 flex flex-wrap gap-2">
             <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wide bg-blue-100 text-blue-700">
              {exam.exam_type}
             </span>
             <span className="text-[11px] text-slate-500">Submissions: {exam.submitted_count || 0}</span>
            </div>
           </div>
           <div className="text-sm text-slate-700">
            <p className="font-medium">{new Date(exam.scheduled_date).toLocaleDateString()}</p>
            <p className="text-xs text-slate-500">{exam.duration_minutes} mins</p>
           </div>
           <div>
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wide ${
             exam.status === "upcoming" ? "bg-yellow-100 text-yellow-700" :
             exam.status === "ongoing" ? "bg-green-100 text-green-700" :
             "bg-slate-100 text-slate-700"
            }`}>
             {exam.status}
            </span>
           </div>
           <div className="flex flex-wrap gap-2">
            <Link href={`/exam/${exam.id}/edit`} className={btnPrimary}>
             View Details
            </Link>
            <Link href={`/exam/${exam.id}/analytics`} className={btnAccent}>
             Analytics
            </Link>
            <Link href={`/exam/${exam.id}/results`} className={btnPrimary}>
             View Results
            </Link>
            <button onClick={() => handleViewExamPhotos(exam.id)} className={btnOutline}>
             Photos
            </button>
            {(exam.status === "ongoing" || exam.status === "upcoming") && (
             <button onClick={() => handleOpenExtendModal(exam)} className={`${btnTint} border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100`}>
              Extend Time
             </button>
            )}
            <a
             href={`${API_URL}/exams/${exam.id}/results/export/`}
             target="_blank"
             className={`${btnTint} border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100`}
             onClick={(e) => {
              const token = localStorage.getItem("access_token");
              e.preventDefault();
              fetch(`${API_URL}/exams/${exam.id}/results/export/`, {
               headers: { Authorization: `Bearer ${token}` },
              })
              .then(res => res.blob())
              .then(blob => {
               const url = window.URL.createObjectURL(blob);
               const a = document.createElement('a');
               a.href = url;
               a.download = `${exam.title.replace(/ /g, '_')}_results.csv`;
               a.click();
              });
             }}
            >
             Export CSV
            </a>
            <Link href={`/exam/${exam.id}/grade`} className={`${btnTint} border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100`}>
             Grade Exams
            </Link>
           </div>
          </div>
         ))}
        </div>
       </div>
      )}
     </div>
      )}
      </div>
     </div>
    </main>

    {/* Extend Time Modal */}
    {showExtendModal && extendExam && (
     <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6">
       <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-slate-900"> Extend Exam Time</h2>
        <button onClick={() => setShowExtendModal(false)} className="text-slate-400 hover:text-slate-600 text-2xl">x</button>
       </div>
       <p className="text-sm text-slate-600 mb-4">Exam: <span className="font-semibold">{extendExam.title}</span></p>

       {extendError && <div className="bg-red-50 text-red-700 rounded-lg px-4 py-2 text-sm mb-3">{extendError}</div>}
       {extendSuccess && <div className="bg-green-50 text-green-700 rounded-lg px-4 py-2 text-sm mb-3">{extendSuccess}</div>}

       <div className="space-y-3">
        <div>
         <label className="block text-sm font-medium text-slate-700 mb-1">Extra Minutes *</label>
         <input
          type="number" min="1"
          value={extendMinutes}
          onChange={(e) => setExtendMinutes(e.target.value)}
          placeholder="e.g. 15"
          className="w-full px-4 py-2 border border-sky-200 rounded-lg focus:ring-2 focus:ring-sky-500 text-slate-900"
         />
        </div>
        <div>
         <label className="block text-sm font-medium text-slate-700 mb-1">Reason (optional)</label>
         <input
          type="text"
          value={extendReason}
          onChange={(e) => setExtendReason(e.target.value)}
          placeholder="e.g. Technical issues"
          className="w-full px-4 py-2 border border-sky-200 rounded-lg focus:ring-2 focus:ring-sky-500 text-slate-900"
         />
        </div>
        <div>
         <label className="block text-sm font-medium text-slate-700 mb-1">Student ID (leave blank for all students)</label>
         <input
          type="text"
          value={extendStudentId}
          onChange={(e) => setExtendStudentId(e.target.value)}
          placeholder="Student user ID for individual extension"
          className="w-full px-4 py-2 border border-sky-200 rounded-lg focus:ring-2 focus:ring-sky-500 text-slate-900"
         />
        </div>
       </div>

       <div className="flex gap-3 mt-5">
        <button
         onClick={() => handleExtendTime(!!extendStudentId === false)}
         disabled={extendLoading}
         className="flex-1 bg-amber-500 text-white py-2 rounded-lg hover:bg-amber-600 transition-all font-medium disabled:opacity-50"
        >
         {extendLoading ? "Extending..." : extendStudentId ? "Extend for Student" : "Extend for All"}
        </button>
        <button
         onClick={() => setShowExtendModal(false)}
         className="flex-1 bg-slate-100 text-slate-700 py-2 rounded-lg hover:bg-slate-200 transition-all font-medium"
        >
         Close
        </button>
       </div>
      </div>
     </div>
    )}

    {/* Photo Review Modal */}
    {showPhotoReviewModal && (() => {
     // Group photos by student
     const grouped: Record<string, { name: string; id: string; id_photo: string | null; id_verified: boolean; photos: any[] }> = {};
     examPhotos.forEach(p => {
      const key = p.student_id;
      if (!grouped[key]) grouped[key] = { name: p.student_name, id: p.student_id, id_photo: p.student_id_photo, id_verified: p.student_id_verified, photos: [] };
      grouped[key].photos.push(p);
     });
     const students = Object.values(grouped);
     const q = photoSearchQuery.trim().toLowerCase();
     const filteredStudents = q
      ? students.filter((s: any) => {
        const name = (s.name || "").toLowerCase();
        const id = String(s.id || "").toLowerCase();
        return name.includes(q) || id.includes(q);
       })
      : students;
     const summary = examPhotoStats ?? {
      total_photos: examPhotos.length,
      total_images: examPhotos.filter((p: any) => p.photo_url).length,
      total_text: examPhotos.filter((p: any) => p.is_text_only || !p.photo_url).length,
     };
     return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
       <div className="bg-white rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-slate-200 p-6 flex justify-between items-center">
         <div>
          <h2 className="text-2xl font-bold text-slate-900">Exam Photo Review</h2>
          <p className="text-sm text-slate-500 mt-1">
           {students.length} student(s) · {summary.total_photos} total captures ({summary.total_images} photos, {summary.total_text} text)
          </p>
         </div>
         <div className="flex items-center gap-3">
          <button
           onClick={() => setPhotoReviewCompact((v) => !v)}
           className="text-sm font-semibold px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all"
          >
           {photoReviewCompact ? "Expand" : "Minimize"}
          </button>
          <button onClick={() => setShowPhotoReviewModal(false)} className="text-slate-400 hover:text-slate-600 text-2xl">x</button>
         </div>
        </div>

        <div className="p-6">
         <div className="mb-4">
          <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm focus-within:ring-2 focus-within:ring-sky-500/60">
           <svg className="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35m1.1-4.4a7 7 0 11-14 0 7 7 0 0114 0z" />
           </svg>
           <input
            value={photoSearchQuery}
            onChange={(e) => setPhotoSearchQuery(e.target.value)}
            placeholder="Search student name or ID..."
            className="w-full bg-transparent text-slate-900 placeholder:text-slate-400 outline-none"
           />
           {photoSearchQuery && (
            <button
             onClick={() => setPhotoSearchQuery("")}
             className="text-xs font-semibold px-2 py-1 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 transition-all"
            >
             Clear
            </button>
           )}
          </div>
          <p className="mt-1 text-xs text-slate-400">Tip: type a student name or ID number</p>
         </div>
         {examPhotos.length === 0 ? (
          <div className="text-center py-12">
           <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
            <svg className="h-7 w-7 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10m-10 4h6m-9 5h12a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v11a2 2 0 002 2z" />
            </svg>
           </div>
           <h3 className="text-xl font-bold text-slate-900 mb-2">No Photos Captured</h3>
           <p className="text-slate-600">No photos have been captured for this exam yet.</p>
          </div>
         ) : filteredStudents.length === 0 ? (
          <div className="text-center py-12">
           <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
            <svg className="h-7 w-7 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10m-10 4h6m-9 5h12a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v11a2 2 0 002 2z" />
            </svg>
           </div>
           <h3 className="text-xl font-bold text-slate-900 mb-2">No Matches</h3>
           <p className="text-slate-600">No students match your search.</p>
          </div>
         ) : (
          <div className="space-y-4">
           {filteredStudents.map(student => {
            const hasViolation = student.photos.some((p: any) => p.capture_type === 'violation' || p.violation_reason);
            const imagePhotos = student.photos.filter((p: any) => !p.is_text_only && p.photo_url);
            let imageCount = 0;
            const photosToShow = student.photos.filter((p: any) => {
              const isTextOnly = p.is_text_only || !p.photo_url;
              if (isTextOnly) return true;
              if (hasViolation) return true;
              if (imageCount < 10) {
                imageCount += 1;
                return true;
              }
              return false;
            });
            const isLimited = !hasViolation && imagePhotos.length > 10;
            const isCollapsed = !!collapsedStudentPhotos[String(student.id)];
            return (
            <div key={student.id} className="bg-white border border-slate-200 rounded-xl overflow-hidden">
             <div className="bg-slate-50 px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
               {student.id_photo && (
                <img src={student.id_photo} alt={student.name} className="w-10 h-10 rounded-full object-cover border border-slate-200" />
               )}
               <div>
                <p className="font-semibold text-slate-900">{student.name}</p>
                <p className="text-xs text-slate-500">ID: {student.id} - {student.photos.length} capture(s)</p>
                {isLimited && (
                  <p className="text-xs text-slate-400 mt-1">Showing first 10 photos. Additional captures are shown as text summaries unless a violation is detected.</p>
                )}
               </div>
              </div>
              <div className="flex items-center gap-2">
               <button
                onClick={() => setCollapsedStudentPhotos(prev => ({ ...prev, [String(student.id)]: !prev[String(student.id)] }))}
                className="text-xs font-semibold px-2 py-1 rounded-full border border-slate-200 text-slate-600 hover:bg-slate-100 transition-all"
               >
                {isCollapsed ? "Show" : "Hide"}
               </button>
               <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                student.id_verified ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
               }`}>
                {student.id_verified ? 'ID Verified' : 'ID Not Verified'}
               </span>
              </div>
             </div>
             {!isCollapsed && (
              <div className={`grid ${photoReviewCompact ? "grid-cols-3 md:grid-cols-6" : "grid-cols-2 md:grid-cols-4"} gap-3 p-4`}>
               {photosToShow.map((photo: any) => (
                <div key={photo.id} className="space-y-1">
                 {photo.photo_url ? (
                  <img src={photo.photo_url} alt={photo.capture_type} className={`w-full ${photoReviewCompact ? "h-20" : "h-32"} object-cover rounded-lg border border-slate-200`} />
                 ) : (
                  <div className={`w-full ${photoReviewCompact ? "h-20" : "h-32"} rounded-lg border border-slate-200 bg-slate-50 p-2 text-xs text-slate-700 flex items-center justify-center text-center`}>
                   {photo.text_summary || "Text summary available for this capture."}
                  </div>
                 )}
                 <span className={`block text-center text-xs font-semibold px-2 py-0.5 rounded-full ${
                  photo.capture_type === 'start' ? 'bg-green-100 text-green-700' :
                  photo.capture_type === 'violation' ? 'bg-red-100 text-red-700' :
                  'bg-blue-100 text-blue-700'
                 }`}>
                  {photo.capture_type === 'start' ? 'Start' : photo.capture_type === 'violation' ? 'Violation' : 'Periodic'}
                 </span>
                 {photo.violation_reason && (
                  <p className="text-xs text-red-600 text-center">{photo.violation_reason}</p>
                 )}
                 <p className="text-xs text-slate-400 text-center">{new Date(photo.timestamp).toLocaleTimeString()}</p>
                </div>
               ))}
              </div>
             )}
            </div>
           );
           })}
          </div>
         )}
        </div>
       </div>
      </div>
     );
    })()}

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






