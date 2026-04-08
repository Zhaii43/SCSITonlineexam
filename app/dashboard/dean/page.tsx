// app/dashboard/dean/page.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import DeanShell from "@/components/DeanShell";
import AnnouncementsBanner from "@/components/AnnouncementsBanner";
import { useToast } from "@/components/ToastProvider";

import { API_URL, WS_URL } from "@/lib/api";
interface DeanProfile {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  profile_picture?: string | null;
  role: string;
  department: string;
  school_id: string;
  is_approved: boolean;
}

interface PendingExam {
  id: number;
  title: string;
  subject: string;
  department: string;
  exam_type: string;
  scheduled_date: string;
  duration_minutes: number;
  total_points: number;
  created_by_id: number;
  created_by: string;
  year_level: string;
}

interface Student {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  school_id: string;
  year_level: string;
  course?: string;
  enrolled_subjects?: string[];
  account_source?: string;
  contact_number: string;
  profile_picture: string | null;
  id_photo: string | null;
  id_verified: boolean;
  study_load: string | null;
  approved_by: string | null;
  approved_at: string | null;
  is_approved?: boolean;
  is_transferee?: boolean;
  is_irregular?: boolean;
  declaration_verified?: boolean;
  extra_approved?: boolean;
}

interface ExamDetail {
  exam: {
    id: number;
    title: string;
    subject: string;
    department: string;
    exam_type: string;
    question_type: string;
    scheduled_date: string;
    expiration_time: string | null;
    duration_minutes: number;
    total_points: number;
    passing_score: number;
    instructions: string;
    year_level: string;
    is_approved: boolean;
    created_by: string;
    created_at: string;
    question_count: number;
  };
  eligible_students: Student[];
  total_eligible_students: number;
}

interface ApprovedExam {
  id: number;
  title: string;
  subject: string;
  department: string;
  exam_type: string;
  scheduled_date: string;
  duration_minutes: number;
  total_points: number;
  created_by_id: number;
  created_by: string;
  year_level: string;
  approved_by: string;
  approved_at: string;
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

interface TodayScheduleItem {
  exam_id: number;
  exam_title: string;
  subject: string;
  year_level: string;
  scheduled_date: string;
  instructor_id: number;
  instructor_name: string;
}

const TAB_HASH_TO_KEY = {
  "#pending-students": "pendingStudents",
  "#rejected-students": "rejectedStudents",
  "#pending-exams": "pending",
  "#approved-exams": "approved",
  "#department-users": "users",
} as const;

const TAB_KEY_TO_HASH: Record<(typeof TAB_HASH_TO_KEY)[keyof typeof TAB_HASH_TO_KEY], keyof typeof TAB_HASH_TO_KEY> = {
  pendingStudents: "#pending-students",
  rejectedStudents: "#rejected-students",
  pending: "#pending-exams",
  approved: "#approved-exams",
  users: "#department-users",
};

export default function DeanDashboard() {
  const router = useRouter();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<DeanProfile | null>(null);
  const [pendingExams, setPendingExams] = useState<PendingExam[]>([]);
  const [approvedExams, setApprovedExams] = useState<ApprovedExam[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [instructors, setInstructors] = useState<any[]>([]);
  const [pendingStudents, setPendingStudents] = useState<any[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<number[]>([]);
  const [stats, setStats] = useState({ students: 0, instructors: 0, exams: 0 });
  const [activeTab, setActiveTab] = useState<"pending" | "approved" | "users" | "pendingStudents" | "rejectedStudents">("pendingStudents");
  const [rejectedStudents, setRejectedStudents] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedExam, setSelectedExam] = useState<ExamDetail | null>(null);
  const [showExamModal, setShowExamModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [studyLoadPreviewFailed, setStudyLoadPreviewFailed] = useState(false);
  const [studyLoadSignedUrl, setStudyLoadSignedUrl] = useState<string | null>(null);
  const [studyLoadUrlLoading, setStudyLoadUrlLoading] = useState(false);
  const [studyLoadProxyUrl, setStudyLoadProxyUrl] = useState<string | null>(null);
  const [studyLoadProxyUrlAuthed, setStudyLoadProxyUrlAuthed] = useState<string | null>(null);
  const [showPhotoReviewModal, setShowPhotoReviewModal] = useState(false);
  const [photoReviewCompact, setPhotoReviewCompact] = useState(false);
  const [collapsedStudentPhotos, setCollapsedStudentPhotos] = useState<Record<string, boolean>>({});
  const [photoSearchQuery, setPhotoSearchQuery] = useState("");
  const [examPhotos, setExamPhotos] = useState<any[]>([]);
  const [examPhotoStats, setExamPhotoStats] = useState<{ total_photos: number; total_images: number; total_text: number } | null>(null);
  const [selectedPhotoExam, setSelectedPhotoExam] = useState<number | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importLoading, setImportLoading] = useState(false);
  const [importResult, setImportResult] = useState<any>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [studentToReject, setStudentToReject] = useState<number | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [auditCount, setAuditCount] = useState(0);
  const [announcementsCount, setAnnouncementsCount] = useState(0);
  const [draftExams, setDraftExams] = useState<any[]>([]);
  const [discardingDraft, setDiscardingDraft] = useState<number | null>(null);
  const [editingSchoolId, setEditingSchoolId] = useState(false);
  const [schoolIdDraft, setSchoolIdDraft] = useState('');
  const [schoolIdSaving, setSchoolIdSaving] = useState(false);
  const [userSearch, setUserSearch] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState<"all" | "instructors" | "students">("all");
  const [instructorPage, setInstructorPage] = useState(1);
  const [studentPage, setStudentPage] = useState(1);
  const usersPageSize = 12;
  const [instructorsOpen, setInstructorsOpen] = useState(true);
  const [studentsOpen, setStudentsOpen] = useState(true);
  const examSocketRef = useRef<WebSocket | null>(null);
  const reconnectRef = useRef<number | null>(null);
  const [monitoring, setMonitoring] = useState<{
    active_sessions: MonitoringSession[];
    latest_terminations: MonitoringTermination[];
    activity_logs: MonitoringLog[];
    today_schedule: TodayScheduleItem[];
  }>({ active_sessions: [], latest_terminations: [], activity_logs: [], today_schedule: [] });
  const [monitoringError, setMonitoringError] = useState<string | null>(null);
  const [monitoringUpdatedAt, setMonitoringUpdatedAt] = useState<string | null>(null);
  const [showAllLogsModal, setShowAllLogsModal] = useState(false);
  const [showAllSessionsModal, setShowAllSessionsModal] = useState(false);
  const [showAllTerminationsModal, setShowAllTerminationsModal] = useState(false);
  const [showAllTodayModal, setShowAllTodayModal] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const syncTabFromHash = () => {
      const nextTab = TAB_HASH_TO_KEY[window.location.hash as keyof typeof TAB_HASH_TO_KEY];
      if (nextTab) setActiveTab(nextTab);
    };

    syncTabFromHash();
    window.addEventListener("hashchange", syncTabFromHash);
    return () => window.removeEventListener("hashchange", syncTabFromHash);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const nextHash = TAB_KEY_TO_HASH[activeTab];
    if (window.location.hash !== nextHash) {
      window.history.replaceState(null, "", `${window.location.pathname}${nextHash}`);
    }
  }, [activeTab]);

  const tabItems = [
    { key: "pendingStudents" as const, label: "Pending Students", count: pendingStudents.length },
    { key: "rejectedStudents" as const, label: "Rejected Students", count: rejectedStudents.length },
    { key: "pending" as const, label: "Pending Exams", count: pendingExams.length },
    { key: "approved" as const, label: "Approved Exams", count: approvedExams.length },
    { key: "users" as const, label: "Department Users", count: students.length + instructors.length },
  ];
  const activeTabIndex = tabItems.findIndex((t) => t.key === activeTab);

  const normalizedUserSearch = userSearch.trim().toLowerCase();
  const matchesUserSearch = (values: Array<string | null | undefined>) => {
    if (!normalizedUserSearch) return true;
    return values.some((v) => String(v ?? "").toLowerCase().includes(normalizedUserSearch));
  };

  const filteredInstructors = instructors.filter((instructor) =>
    matchesUserSearch([
      instructor.first_name,
      instructor.last_name,
      instructor.email,
      instructor.contact_number,
      instructor.subject_type,
    ])
  );

  const filteredStudents = students.filter((student) =>
    matchesUserSearch([
      student.first_name,
      student.last_name,
      student.email,
      student.school_id,
      student.year_level,
      student.contact_number,
    ])
  );

  const visibleInstructors = userRoleFilter === "students" ? [] : filteredInstructors;
  const visibleStudents = userRoleFilter === "instructors" ? [] : filteredStudents;
  const instructorPageCount = Math.max(1, Math.ceil(visibleInstructors.length / usersPageSize));
  const studentPageCount = Math.max(1, Math.ceil(visibleStudents.length / usersPageSize));
  const pagedInstructors = visibleInstructors.slice(
    (instructorPage - 1) * usersPageSize,
    instructorPage * usersPageSize
  );
  const pagedStudents = visibleStudents.slice(
    (studentPage - 1) * usersPageSize,
    studentPage * usersPageSize
  );

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
          if (
            data?.type === "exam_update" ||
            data?.type === "student_verification_update" ||
            data?.type === "enrollment_records_update"
          ) {
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
    const storedInstructors = localStorage.getItem("dean_users_instructors_open");
    const storedStudents = localStorage.getItem("dean_users_students_open");
    if (storedInstructors !== null) setInstructorsOpen(storedInstructors === "true");
    if (storedStudents !== null) setStudentsOpen(storedStudents === "true");
  }, []);

  useEffect(() => {
    localStorage.setItem("dean_users_instructors_open", String(instructorsOpen));
  }, [instructorsOpen]);

  useEffect(() => {
    localStorage.setItem("dean_users_students_open", String(studentsOpen));
  }, [studentsOpen]);

  useEffect(() => {
    setInstructorPage(1);
    setStudentPage(1);
  }, [userRoleFilter, userSearch]);

  useEffect(() => {
    if (instructorPage > instructorPageCount) setInstructorPage(instructorPageCount);
  }, [instructorPage, instructorPageCount]);

  useEffect(() => {
    if (studentPage > studentPageCount) setStudentPage(studentPageCount);
  }, [studentPage, studentPageCount]);

  useEffect(() => {
    setStudyLoadPreviewFailed(false);
  }, [selectedStudent?.study_load]);

  useEffect(() => {
    if (!selectedStudent?.study_load || !selectedStudent?.id) {
      setStudyLoadSignedUrl(null);
      setStudyLoadProxyUrl(null);
      setStudyLoadProxyUrlAuthed(null);
      return;
    }
    const token = localStorage.getItem("access_token");
    if (!token) return;
    setStudyLoadUrlLoading(true);
    setStudyLoadProxyUrl(`${API_URL}/students/${selectedStudent.id}/study-load/`);
    setStudyLoadProxyUrlAuthed(`${API_URL}/students/${selectedStudent.id}/study-load/?token=${encodeURIComponent(token)}`);
    fetch(`${API_URL}/students/${selectedStudent.id}/study-load-url/`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.ok ? res.json() : Promise.reject())
      .then((data) => setStudyLoadSignedUrl(data.url || null))
      .catch(() => setStudyLoadSignedUrl(null))
      .finally(() => setStudyLoadUrlLoading(false));
  }, [selectedStudent?.id, selectedStudent?.study_load]);

  const handleOpenStudyLoad = () => {
    if (!selectedStudent?.id) return;
    const targetUrl = studyLoadProxyUrlAuthed || studyLoadProxyUrl || studyLoadSignedUrl;
    if (!targetUrl) {
      toast.error("Unable to open study load file.");
      return;
    }
    window.open(targetUrl, "_blank", "noopener,noreferrer");
  };

  const fetchLiveData = async () => {
    const token = localStorage.getItem("access_token");
    if (!token) return;
    try {
      const [pendingExamsRes, approvedRes, usersRes, pendingStudentsRes, rejectedStudentsRes, auditCountRes, announcementsRes, draftExamsRes] = await Promise.all([
        fetch(`${API_URL}/exams/pending/`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/exams/approved/`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/department/users/`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/students/pending/`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/students/rejected/`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/audit/count/`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/notifications/announcements/mine/`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/exams/drafts/`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      if (pendingExamsRes.ok) setPendingExams(await pendingExamsRes.json());
      if (approvedRes.ok) setApprovedExams(await approvedRes.json());
      if (usersRes.ok) {
        const d = await usersRes.json();
        setStudents(d.students);
        setInstructors(d.instructors);
        setStats(prev => ({ ...prev, students: d.students.length, instructors: d.instructors.length }));
      }
      if (pendingStudentsRes.ok) {
        const nextPendingStudents = await pendingStudentsRes.json();
        setPendingStudents(nextPendingStudents);

        if (selectedStudent) {
          const refreshedSelectedStudent = nextPendingStudents.find((student: Student) => student.id === selectedStudent.id) || null;
          setSelectedStudent(refreshedSelectedStudent);

          if (!refreshedSelectedStudent) {
            setShowStudentModal(false);
            setEditingSchoolId(false);
          }
        }
      }
      if (rejectedStudentsRes.ok) setRejectedStudents(await rejectedStudentsRes.json());
      if (draftExamsRes.ok) setDraftExams(await draftExamsRes.json());
      if (auditCountRes.ok) {
        const data = await auditCountRes.json();
        setAuditCount(data.count || 0);
      }
      if (announcementsRes.ok) {
        const data = await announcementsRes.json();
        setAnnouncementsCount(Array.isArray(data.announcements) ? data.announcements.length : 0);
      }
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
        const message = data.error || "Failed to load monitoring";
        setMonitoringError((prev) => {
          if (prev !== message) {
            toast.error(message);
          }
          return message;
        });
        return;
      }
      const data = await res.json();
      setMonitoring({
        active_sessions: data.active_sessions || [],
        latest_terminations: data.latest_terminations || [],
        activity_logs: data.activity_logs || [],
        today_schedule: data.today_schedule || [],
      });
      setMonitoringUpdatedAt(new Date().toLocaleTimeString());
      setMonitoringError(null);
    } catch {
      setMonitoringError((prev) => {
        const message = "Failed to load monitoring";
        if (prev !== message) {
          toast.error(message);
        }
        return message;
      });
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
      
      if (profileData.role !== "dean") {
        router.push("/dashboard");
        return;
      }

      if (!profileData.is_approved) {
        setError("Your account is pending approval. Please wait for admin approval.");
        toast.error("Your account is pending approval. Please wait for admin approval.");
        setLoading(false);
        return;
      }

      setProfile(profileData);

      // Fetch pending exams
      const examsRes = await fetch(`${API_URL}/exams/pending/`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (examsRes.ok) {
        const examsData = await examsRes.json();
        setPendingExams(examsData);
      }

      // Fetch approved exams
      const approvedRes = await fetch(`${API_URL}/exams/approved/`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (approvedRes.ok) {
        const approvedData = await approvedRes.json();
        setApprovedExams(approvedData);
      }

      // Fetch department users
      const usersRes = await fetch(`${API_URL}/department/users/`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (usersRes.ok) {
        const usersData = await usersRes.json();
        setStudents(usersData.students);
        setInstructors(usersData.instructors);
        
        // Update stats with actual counts
        setStats({
          students: usersData.students.length,
          instructors: usersData.instructors.length,
          exams: stats.exams
        });
      }

      // Fetch pending students
      const pendingStudentsRes = await fetch(`${API_URL}/students/pending/`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (pendingStudentsRes.ok) {
        const pendingStudentsData = await pendingStudentsRes.json();
        setPendingStudents(pendingStudentsData);
      }

      const auditCountRes = await fetch(`${API_URL}/audit/count/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (auditCountRes.ok) {
        const data = await auditCountRes.json();
        setAuditCount(data.count || 0);
      }

      const announcementsRes = await fetch(`${API_URL}/notifications/announcements/mine/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (announcementsRes.ok) {
        const data = await announcementsRes.json();
        setAnnouncementsCount(Array.isArray(data.announcements) ? data.announcements.length : 0);
      }

      fetchMonitoring();

      setLoading(false);
    } catch (err: any) {
      const message = err.message || "Failed to load dashboard";
      setError(message);
      toast.error(message);
      setLoading(false);
    }
  };

  const handleApproveExam = async (examId: number) => {
    const token = localStorage.getItem("access_token");
    try {
      const res = await fetch(`/api/exams/${examId}/approve`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        setPendingExams(prev => prev.filter(e => e.id !== examId));
        toast.success("Exam approved successfully.");
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error || "Failed to approve exam");
      }
    } catch (err) {
      toast.error("Failed to approve exam");
    }
  };

  const handleRejectExam = async (examId: number) => {
    const token = localStorage.getItem("access_token");
    try {
      const res = await fetch(`/api/exams/${examId}/reject`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        setPendingExams(prev => prev.filter(e => e.id !== examId));
        toast.success("Exam rejected and removed.");
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error || "Failed to reject exam");
      }
    } catch (err) {
      toast.error("Failed to reject exam");
    }
  };

  const canApproveStudent = (student: any) => {
    if (student.account_source === "masterlist_import") return true;
    if (!student.id_photo) return false;
    if (!student.id_verified) return false;
    if ((student.is_transferee || student.is_irregular) && !student.declaration_verified) return false;
    return true;
  };

  const handleIdPhotoVerify = async (studentId: number, nextValue: boolean) => {
    const token = localStorage.getItem("access_token");
    try {
      const res = await fetch(`${API_URL}/students/${studentId}/id-photo-verify/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id_verified: nextValue }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error || "Failed to update ID photo verification");
        return;
      }
      setPendingStudents((prev) =>
        prev.map((s) => (s.id === studentId ? { ...s, id_verified: nextValue } : s))
      );
      setSelectedStudent((prev) =>
        prev && prev.id === studentId ? { ...prev, id_verified: nextValue } : prev
      );
      toast.success(nextValue ? "ID photo verified" : "ID photo marked as pending");
    } catch {
      toast.error("Failed to update ID photo verification");
    }
  };

  const handleDeclarationVerify = async (studentId: number, nextValue: boolean) => {
    const token = localStorage.getItem("access_token");
    try {
      const res = await fetch(`${API_URL}/students/${studentId}/declaration-verify/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ declaration_verified: nextValue }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error || "Failed to update declaration verification");
        return;
      }
      setPendingStudents((prev) =>
        prev.map((s) => (s.id === studentId ? { ...s, declaration_verified: nextValue } : s))
      );
      setSelectedStudent((prev) =>
        prev && prev.id === studentId ? { ...prev, declaration_verified: nextValue } : prev
      );
      toast.success(nextValue ? "Declaration verified" : "Declaration unverified");
    } catch {
      toast.error("Failed to update declaration verification");
    }
  };

  const handleApproveStudent = async (studentId: number) => {
    const student = pendingStudents.find(s => s.id === studentId);
    if (!student || !canApproveStudent(student)) {
      toast.error("Cannot approve: required verification steps are not complete.");
      return;
    }
    const token = localStorage.getItem("access_token");
    try {
      const res = await fetch(`/api/students/${studentId}/approve`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

        const data = await res.json();
  
        if (res.ok) {
          setPendingStudents(prev => prev.filter(s => s.id !== studentId));
          setStats(prev => ({ ...prev, students: prev.students + 1 }));
          toast.success(`Approved ${student.first_name} ${student.last_name}`);
        } else {
          toast.error(data.error || "Failed to approve student");
        }
    } catch (err) {
      toast.error("Failed to approve student");
    }
  };

  const handleRejectStudent = async (studentId: number) => {
    if (!rejectionReason.trim()) {
      toast.error("Please provide a reason for rejection");
      return;
    }

    const token = localStorage.getItem("access_token");
    try {
      const res = await fetch(`/api/students/${studentId}/reject`, {
        method: "POST",
        headers: { 
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ rejection_reason: rejectionReason })
      });

        if (res.ok) {
          setPendingStudents(pendingStudents.filter(s => s.id !== studentId));
          setShowRejectModal(false);
          setStudentToReject(null);
          setRejectionReason('');
          const student = pendingStudents.find(s => s.id === studentId);
          toast.success(
            student
              ? `Rejected ${student.first_name} ${student.last_name}`
              : "Student rejected successfully"
          );
        } else {
          const data = await res.json();
          toast.error(data.error || "Failed to reject student");
      }
    } catch (err) {
      toast.error("Failed to reject student");
    }
  };

  const openRejectModal = (studentId: number) => {
    setStudentToReject(studentId);
    setShowRejectModal(true);
  };

  const handleBulkApprove = async () => {
    if (selectedStudents.length === 0) return;

    const invalid = selectedStudents
      .map(id => pendingStudents.find(s => s.id === id))
      .filter((s): s is any => !!s && !canApproveStudent(s));

    if (invalid.length > 0) {
      const names = invalid.map(s => `${s.first_name} ${s.last_name}`).join(", ");
      toast.error(`Cannot bulk approve. Required verification steps are incomplete for: ${names}`);
      return;
    }
    
    const token = localStorage.getItem("access_token");
    try {
      const res = await fetch(`/api/students/bulk-approve`, {
        method: "POST",
        headers: { 
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ student_ids: selectedStudents })
      });

      const data = await res.json();

        if (res.ok) {
          setPendingStudents(prev => prev.filter(s => !selectedStudents.includes(s.id)));
          setStats(prev => ({ ...prev, students: prev.students + selectedStudents.length }));
          setSelectedStudents([]);
          toast.success(
            selectedStudents.length === 1
              ? "1 student approved successfully"
              : `${selectedStudents.length} students approved successfully`
          );
        } else {
        toast.error(data.error || "Failed to bulk approve students");
      }
    } catch (err) {
      toast.error("Failed to bulk approve students");
    }
  };

  const toggleStudentSelection = (studentId: number) => {
    setSelectedStudents(prev =>
      prev.includes(studentId)
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedStudents.length === pendingStudents.length) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(pendingStudents.map(s => s.id));
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

  const handleViewExamDetails = async (examId: number) => {
    const token = localStorage.getItem("access_token");
    try {
      const res = await fetch(`${API_URL}/exams/${examId}/dean-detail/`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        setSelectedExam(data);
        setShowExamModal(true);
      }
    } catch (err) {
      console.error("Failed to fetch exam details");
      toast.error("Failed to fetch exam details");
    }
  };

  const handleViewStudentDetails = async (student: Student) => {
    setSelectedStudent(student);
    setShowStudentModal(true);
    setEditingSchoolId(false);
    setSchoolIdDraft(student.school_id || "");
  };

  const handleSaveSchoolId = async () => {
    if (!selectedStudent || !schoolIdDraft.trim()) return;
    setSchoolIdSaving(true);
    const token = localStorage.getItem("access_token");
    try {
      const res = await fetch(`${API_URL}/students/${selectedStudent.id}/update-school-id/`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ school_id: schoolIdDraft.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        const updated = { ...selectedStudent, school_id: data.school_id };
        setSelectedStudent(updated as Student);
        setPendingStudents(prev => prev.map(s => s.id === selectedStudent.id ? { ...s, school_id: data.school_id } : s));
        setEditingSchoolId(false);
      } else {
        toast.error(data.error || "Failed to update School ID");
      }
    } catch {
      toast.error("Failed to update School ID");
    }
    finally { setSchoolIdSaving(false); }
  };

  const handleViewExamPhotos = async (examId: number, studentId?: number) => {
    const token = localStorage.getItem("access_token");
    try {
      const url = studentId
        ? `${API_URL}/exams/${examId}/photos/?student_id=${studentId}`
        : `${API_URL}/exams/${examId}/photos/`;
      
      const res = await fetch(url, {
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
      toast.error("Failed to fetch exam photos");
    }
  };

  const handleDownloadTemplate = async () => {
    const token = localStorage.getItem("access_token");
    try {
      const res = await fetch(`${API_URL}/students/template/`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "masterlist_import_template.csv";
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch {
      console.error("Failed to download template");
      toast.error("Failed to download template");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImportFile(e.target.files[0]);
      setImportResult(null);
    }
  };

  const handleImportStudents = async () => {
    if (!importFile) return;

    setImportLoading(true);
    const token = localStorage.getItem("access_token");
    const formData = new FormData();
    formData.append("file", importFile);

    try {
      const res = await fetch(`${API_URL}/students/bulk-import/`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const data = await res.json();
      setImportResult(data);

      if (res.ok && data.success_count > 0) {
        checkAuthAndFetchData();
        setShowImportModal(false);
        setImportFile(null);
        setImportResult(null);
        toast.success(`${data.success_count} student accounts imported`);
      }
    } catch {
      setImportResult({ error: "Failed to import students" });
      toast.error("Failed to import students");
    } finally {
      setImportLoading(false);
    }
  };

  const hasPhotoViolation = examPhotos.some((p) => p.capture_type === "violation" || p.violation_reason);
  const imagePhotos = examPhotos.filter((p) => !p.is_text_only && p.photo_url);
  let imageCount = 0;
  const limitedExamPhotos = examPhotos.filter((p) => {
    const isTextOnly = p.is_text_only || !p.photo_url;
    if (isTextOnly) return true;
    if (hasPhotoViolation) return true;
    if (imageCount < 10) {
      imageCount += 1;
      return true;
    }
    return false;
  });
  const isLimited = !hasPhotoViolation && imagePhotos.length > 10;
  const examPhotoSummary = examPhotoStats ?? {
    total_photos: examPhotos.length,
    total_images: examPhotos.filter((p) => p.photo_url).length,
    total_text: examPhotos.filter((p) => p.is_text_only || !p.photo_url).length,
  };

  const handleExtraApproval = async (studentId: number, extraApproved: boolean) => {
    const token = localStorage.getItem("access_token");
    try {
      const res = await fetch(`${API_URL}/students/${studentId}/extra-approval/`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ extra_approved: extraApproved }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to update extra approval.");
        return;
      }
      setStudents(prev => prev.map(s => s.id === studentId ? { ...s, extra_approved: data.extra_approved } : s));
      if (selectedStudent && selectedStudent.id === studentId) {
        setSelectedStudent({ ...selectedStudent, extra_approved: data.extra_approved });
      }
      toast.success(data.extra_approved ? "Extra approval granted." : "Extra approval removed.");
    } catch {
      toast.error("Failed to update extra approval.");
    }
  };
  const safeToApprove = selectedStudent ? canApproveStudent(selectedStudent) : false;

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

        <main className="w-full py-4" style={{ fontFamily: "'Space Grotesk', 'Manrope', sans-serif" }}>
          <DeanShell>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
              <div className="mb-8 rounded-3xl bg-white/90 backdrop-blur-xl border border-slate-200 shadow-xl shadow-slate-200/60 p-8">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Dean Dashboard</p>
                <h1 className="mt-2 text-3xl sm:text-4xl font-semibold text-slate-900">Welcome, Dean {profile?.first_name}</h1>
                <p className="mt-2 text-slate-600">{profile?.department} Department | {profile?.school_id}</p>
                <div className="mt-5 flex flex-wrap gap-3">
                  <Link
                    href="/exam/create"
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-slate-900/20 hover:bg-sky-800 transition-all"
                  >
                    Create Department Exam
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
                  Dean
                </span>
              </div>
            </div>
          </div>

          <AnnouncementsBanner />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Link
              href="/audit"
              className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-gradient-to-br from-white via-white to-slate-50 p-6 shadow-[0_10px_30px_-18px_rgba(15,23,42,0.45)] transition-all hover:-translate-y-1 hover:shadow-[0_20px_40px_-18px_rgba(15,23,42,0.45)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60"
            >
              <div className="pointer-events-none absolute -right-12 -top-10 h-32 w-32 rounded-full bg-slate-200/50 blur-2xl transition-all group-hover:scale-110" />
              <div className="relative flex items-center justify-between">
                <p className="text-slate-600 text-sm font-semibold uppercase tracking-wide">Audit Logs</p>
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-slate-700 ring-1 ring-slate-200/70">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6M8 6h8a2 2 0 012 2v10a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2z" />
                  </svg>
                </span>
              </div>
              <p className="relative mt-4 text-3xl font-bold text-slate-900">{auditCount}</p>
              <p className="relative text-xs text-slate-500">Total Logs</p>
              <div className="relative mt-5 inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white shadow-lg shadow-slate-900/20 transition-all group-hover:-translate-y-0.5">
                Open Audit Logs
                <span className="text-sm">-&gt;</span>
              </div>
            </Link>
            <Link
              href="/dashboard/dean/exam-stats"
              className="group relative overflow-hidden rounded-2xl border border-emerald-200/70 bg-gradient-to-br from-white via-white to-emerald-50 p-6 shadow-[0_10px_30px_-18px_rgba(5,150,105,0.35)] transition-all hover:-translate-y-1 hover:shadow-[0_20px_40px_-18px_rgba(5,150,105,0.45)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60"
            >
              <div className="pointer-events-none absolute -right-12 -top-10 h-32 w-32 rounded-full bg-emerald-200/50 blur-2xl transition-all group-hover:scale-110" />
              <div className="relative flex items-center justify-between">
                <p className="text-slate-600 text-sm font-semibold uppercase tracking-wide">Exam Stats</p>
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200/80">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </span>
              </div>
              <p className="relative mt-4 text-3xl font-bold text-slate-900">{approvedExams.length}</p>
              <p className="relative text-xs text-slate-500">Approved Exams</p>
              <div className="relative mt-5 inline-flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white shadow-lg shadow-emerald-600/30 transition-all group-hover:-translate-y-0.5">
                View Stats
                <span className="text-sm">-&gt;</span>
              </div>
            </Link>
            <Link
              href="/dashboard/dean#pending-students"
              className="group relative overflow-hidden rounded-2xl border border-sky-200/70 bg-gradient-to-br from-white via-white to-sky-50 p-6 shadow-[0_10px_30px_-18px_rgba(2,132,199,0.35)] transition-all hover:-translate-y-1 hover:shadow-[0_20px_40px_-18px_rgba(2,132,199,0.45)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60"
            >
              <div className="pointer-events-none absolute -right-12 -top-10 h-32 w-32 rounded-full bg-sky-200/50 blur-2xl transition-all group-hover:scale-110" />
              <div className="relative flex items-center justify-between">
                <p className="text-slate-600 text-sm font-semibold uppercase tracking-wide">Pending Students</p>
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-sky-100 text-sky-700 ring-1 ring-sky-200/80">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-1a4 4 0 00-5-4M9 20H2v-1a4 4 0 015-4m8-5a4 4 0 11-8 0 4 4 0 018 0zm6 4a4 4 0 10-4-4 4 4 0 004 4z" />
                  </svg>
                </span>
              </div>
              <p className="relative mt-4 text-3xl font-bold text-slate-900">Manage</p>
              <p className="relative text-xs text-slate-500">Review imported student accounts</p>
              <div className="relative mt-5 inline-flex items-center gap-2 rounded-full bg-sky-600 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white shadow-lg shadow-sky-600/30 transition-all group-hover:-translate-y-0.5">
                Review Queue
                <span className="text-sm">-&gt;</span>
              </div>
            </Link>
            <Link
              href="/dashboard/dean/announcements"
              className="group relative overflow-hidden rounded-2xl border border-amber-200/70 bg-gradient-to-br from-white via-white to-amber-50 p-6 shadow-[0_10px_30px_-18px_rgba(180,83,9,0.45)] transition-all hover:-translate-y-1 hover:shadow-[0_20px_40px_-18px_rgba(180,83,9,0.45)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60"
            >
              <div className="pointer-events-none absolute -right-12 -top-10 h-32 w-32 rounded-full bg-amber-200/60 blur-2xl transition-all group-hover:scale-110" />
              <div className="relative flex items-center justify-between">
                <p className="text-slate-600 text-sm font-semibold uppercase tracking-wide">Announcements</p>
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-amber-100 text-amber-700 ring-1 ring-amber-200/80">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5h2m-1 0v14m0-14l-4 4m4-4l4 4M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H5a2 2 0 00-2 2v5a2 2 0 002 2z" />
                  </svg>
                </span>
              </div>
              <p className="relative mt-4 text-3xl font-bold text-slate-900">{announcementsCount}</p>
              <p className="relative text-xs text-slate-500">Total Posts</p>
              <div className="relative mt-5 inline-flex items-center gap-2 rounded-full bg-amber-600 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white shadow-lg shadow-amber-600/30 transition-all group-hover:-translate-y-0.5">
                Open Announcements
                <span className="text-sm">-&gt;</span>
              </div>
            </Link>

            <div className="group relative overflow-hidden rounded-2xl border border-yellow-200/70 bg-gradient-to-br from-white via-white to-yellow-50 p-6 shadow-[0_10px_30px_-18px_rgba(161,98,7,0.45)] transition-all hover:-translate-y-1 hover:shadow-[0_20px_40px_-18px_rgba(161,98,7,0.45)]">
              <div className="pointer-events-none absolute -right-12 -top-10 h-32 w-32 rounded-full bg-yellow-200/60 blur-2xl transition-all group-hover:scale-110" />
              <p className="relative text-slate-600 text-sm font-semibold uppercase tracking-wide">Pending Students</p>
              <p className="relative mt-3 text-4xl font-bold text-yellow-700">{pendingStudents.length}</p>
              <p className="relative text-xs text-slate-500">Awaiting approval</p>
            </div>

            <div className="group relative overflow-hidden rounded-2xl border border-orange-200/70 bg-gradient-to-br from-white via-white to-orange-50 p-6 shadow-[0_10px_30px_-18px_rgba(154,52,18,0.45)] transition-all hover:-translate-y-1 hover:shadow-[0_20px_40px_-18px_rgba(154,52,18,0.45)]">
              <div className="pointer-events-none absolute -right-12 -top-10 h-32 w-32 rounded-full bg-orange-200/60 blur-2xl transition-all group-hover:scale-110" />
              <p className="relative text-slate-600 text-sm font-semibold uppercase tracking-wide">Pending Exams</p>
              <p className="relative mt-3 text-4xl font-bold text-orange-700">{pendingExams.length}</p>
              <p className="relative text-xs text-slate-500">For review</p>
            </div>

          </div>

          <div className="mb-8 relative overflow-hidden rounded-3xl border border-slate-200/80 bg-gradient-to-br from-white/95 via-white to-sky-50/80 backdrop-blur-xl p-6 shadow-[0_18px_40px_-28px_rgba(15,23,42,0.45)]">
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
                  Auto-refreshing every 5 seconds{monitoringUpdatedAt ? ` - Updated ${monitoringUpdatedAt}` : ""}
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
                <span className="inline-flex items-center rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-700 ring-1 ring-sky-200/70">
                  Today: {monitoring.today_schedule.length}
                </span>
              </div>
            </div>

            {monitoringError && (
              <p className="relative mt-4 text-sm text-red-600">{monitoringError}</p>
            )}

            <div className="relative mt-6 grid grid-cols-1 lg:grid-cols-4 gap-5">
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

              <div
                className={`flex flex-col rounded-2xl border border-sky-200 bg-sky-50/60 p-4 max-h-[420px] overflow-hidden ${
                  monitoring.today_schedule.length === 0 ? "min-h-[140px]" : "min-h-[280px]"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-sky-700">Today&apos;s Schedule</p>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-semibold text-sky-700/80">{monitoring.today_schedule.length} total</span>
                    <button
                      type="button"
                      onClick={() => setShowAllTodayModal(true)}
                      className="inline-flex items-center rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-sky-700 ring-1 ring-sky-200/70 hover:bg-sky-50 transition-all"
                    >
                      View All
                    </button>
                  </div>
                </div>
                {monitoring.today_schedule.length === 0 ? (
                  <p className="mt-3 text-sm text-sky-900/70">No exams scheduled today.</p>
                ) : (
                  <div className="mt-3 flex-1 min-h-0 space-y-3 overflow-y-auto pr-1">
                    {monitoring.today_schedule.slice(0, 10).map((item) => (
                      <div key={`${item.exam_id}-${item.instructor_id}`} className="rounded-xl bg-white/90 p-3 border border-sky-100 shadow-sm">
                        <p className="text-sm font-semibold text-slate-900 truncate">{item.exam_title}</p>
                        <p className="text-xs text-slate-600 truncate">{item.instructor_name}</p>
                        <p className="text-[11px] text-sky-700 mt-1">
                          {new Date(item.scheduled_date).toLocaleTimeString()}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

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
                <div className="grid grid-cols-5 gap-2">
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
                            {tab.key === "pendingStudents" && (
                              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-1a4 4 0 00-5-4M9 20H2v-1a4 4 0 015-4m8-5a4 4 0 11-8 0 4 4 0 018 0zm6 4a4 4 0 10-4-4 4 4 0 004 4z" />
                              </svg>
                            )}
                            {tab.key === "rejectedStudents" && (
                              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                              </svg>
                            )}
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
                            {tab.key === "users" && (
                              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A8 8 0 1119 12.5M15 21v-2a4 4 0 00-4-4H6" />
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
                    className="absolute top-0 h-1.5 w-1/5 rounded-full bg-gradient-to-r from-blue-500 to-sky-400 transition-transform duration-300"
                    style={{ transform: `translateX(${Math.max(0, activeTabIndex) * 100}%)` }}
                  />
                </div>
              </div>
            </div>
          </div>


          {activeTab === "rejectedStudents" && (
            <div id="rejected-students" className="space-y-4">
              {rejectedStudents.length === 0 ? (
                <div className="bg-white/90 backdrop-blur-xl rounded-3xl p-12 border border-slate-200 shadow-lg shadow-slate-200/60 text-center">
                  <div className="text-6xl mb-4">✅</div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">No Rejected Students</h3>
                  <p className="text-slate-600">All rejected students have either appealed or none have been rejected yet.</p>
                </div>
              ) : (
                <div className="rounded-2xl border border-red-200 bg-red-50/60 overflow-hidden">
                  <div className="hidden md:grid grid-cols-[1.2fr_1.6fr_2.4fr_1fr_1fr_2fr] items-center px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-red-800 border-b border-red-200 bg-red-200/70">
                    <span>School ID</span>
                    <span>Name</span>
                    <span>Email</span>
                    <span>Year</span>
                    <span>Contact</span>
                    <span>Rejection Reason</span>
                  </div>
                  {rejectedStudents.map((student) => (
                    <div key={student.id} className="border-b border-red-200/60 last:border-b-0 bg-white/80 px-5 py-4 hover:bg-white transition-all">
                      <div className="hidden md:grid grid-cols-[1.2fr_1.6fr_2.4fr_1fr_1fr_2fr] items-center gap-3">
                        <div className="text-sm font-semibold text-slate-900">{student.school_id}</div>
                        <div className="text-sm text-slate-900">{student.first_name} {student.last_name}</div>
                        <div className="text-sm text-slate-600 break-words">{student.email}</div>
                        <div className="text-sm text-slate-700">{student.year_level}</div>
                        <div className="text-sm text-slate-700">{student.contact_number || "N/A"}</div>
                        <div className="text-sm text-red-700 font-medium">{student.rejection_reason || "—"}</div>
                      </div>
                      <div className="md:hidden space-y-1">
                        <div className="flex justify-between text-sm"><span className="text-slate-500 font-medium">School ID</span><span className="font-semibold text-slate-900">{student.school_id}</span></div>
                        <div className="flex justify-between text-sm"><span className="text-slate-500 font-medium">Name</span><span className="text-slate-900">{student.first_name} {student.last_name}</span></div>
                        <div className="flex justify-between text-sm"><span className="text-slate-500 font-medium">Email</span><span className="text-slate-600 break-all">{student.email}</span></div>
                        <div className="flex justify-between text-sm"><span className="text-slate-500 font-medium">Year</span><span>{student.year_level}</span></div>
                        <div className="mt-2 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700"><span className="font-semibold">Reason: </span>{student.rejection_reason || "—"}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "pending" && (
            <div id="pending-exams" className="space-y-4">
            {pendingExams.length === 0 ? (
              <div className="bg-white/90 backdrop-blur-xl rounded-3xl p-12 border border-slate-200 shadow-lg shadow-slate-200/60 text-center">
                <div className="text-6xl mb-4"></div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">All Caught Up!</h3>
                <p className="text-slate-600">No pending exam approvals at the moment.</p>
              </div>
            ) : (
              pendingExams.map((exam) => (
                <div
                  key={exam.id}
                  className="bg-white/90 backdrop-blur-xl rounded-3xl p-6 border border-amber-200 shadow-lg shadow-amber-200/60 hover:-translate-y-1 transition-all"
                >
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <span className="px-3 py-1 rounded-full text-xs font-semibold uppercase bg-orange-100 text-orange-700">
                          Pending Approval
                        </span>
                        <span className="px-3 py-1 rounded-full text-xs font-semibold uppercase bg-blue-100 text-blue-700">
                          {exam.exam_type}
                        </span>
                      </div>
                      <h3 className="text-xl font-bold text-slate-900 mb-2">{exam.title}</h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-slate-600">
                        <div>
                          <span className="block font-medium">Subject</span>
                          <span>{exam.subject}</span>
                        </div>
                        <div>
                          <span className="block font-medium">Instructor</span>
                          <span>{exam.created_by}</span>
                        </div>
                        <div>
                          <span className="block font-medium">Year Level</span>
                          <span>{exam.year_level}</span>
                        </div>
                        <div>
                          <span className="block font-medium">Schedule</span>
                          <span>{new Date(exam.scheduled_date).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={() => handleViewExamDetails(exam.id)}
                        className="px-5 py-3 bg-white border border-slate-300 text-slate-700 rounded-xl hover:border-slate-400 transition-all font-semibold"
                      >
                        View Details
                      </button>
                      <button
                        onClick={() => handleRejectExam(exam.id)}
                        className="px-5 py-3 bg-white border border-red-200 text-red-600 rounded-xl hover:bg-red-50 transition-all font-semibold"
                      >
                        Reject
                      </button>
                      <button
                        onClick={() => handleApproveExam(exam.id)}
                        className="px-5 py-3 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-all font-semibold shadow-lg shadow-slate-900/20"
                      >
                        Approve
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
          )}

          {activeTab === "users" && (
            <div id="department-users" className="space-y-6">
              <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white/90 shadow-xl shadow-slate-200/60">
                <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-700 px-6 py-6 text-white">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-[0.3em] text-slate-200">Department Records</p>
                      <h3 className="text-2xl font-bold">User Registry</h3>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="relative">
                        <input
                          value={userSearch}
                          onChange={(e) => setUserSearch(e.target.value)}
                          placeholder="Search name, email, ID, year level..."
                          className="w-72 rounded-xl bg-white/10 px-4 py-2.5 text-sm text-white placeholder:text-slate-300 outline-none ring-1 ring-white/20 focus:ring-2 focus:ring-white/60"
                        />
                        {userSearch && (
                          <button
                            onClick={() => setUserSearch("")}
                            className="absolute right-2 top-2 text-xs text-slate-200 hover:text-white"
                          >
                            Clear
                          </button>
                        )}
                      </div>
                      <div className="flex items-center gap-2 rounded-xl bg-white/10 p-1 ring-1 ring-white/20">
                        {(["all", "instructors", "students"] as const).map((key) => (
                          <button
                            key={key}
                            onClick={() => setUserRoleFilter(key)}
                            className={`px-3 py-1.5 text-xs font-semibold uppercase tracking-wide rounded-lg transition-all ${
                              userRoleFilter === key
                                ? "bg-white text-slate-900 shadow"
                                : "text-white/80 hover:text-white"
                            }`}
                          >
                            {key === "all" ? "All" : key === "instructors" ? "Instructors" : "Students"}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 p-6 md:grid-cols-3">
                  <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Total Users</p>
                    <p className="mt-2 text-3xl font-bold text-slate-900">{instructors.length + students.length}</p>
                    <p className="text-xs text-slate-500 mt-1">All department records</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Instructors</p>
                    <p className="mt-2 text-3xl font-bold text-indigo-600">{instructors.length}</p>
                    <p className="text-xs text-slate-500 mt-1">Faculty assignment records</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Students</p>
                    <p className="mt-2 text-3xl font-bold text-emerald-600">{students.length}</p>
                    <p className="text-xs text-slate-500 mt-1">Enrolled student records</p>
                  </div>
                </div>
              </div>

              {visibleInstructors.length + visibleStudents.length === 0 ? (
                <div className="bg-white/90 backdrop-blur-xl rounded-3xl p-10 border border-slate-200 text-center shadow-lg shadow-slate-200/60">
                  <h4 className="text-lg font-bold text-slate-900">No matching users</h4>
                  <p className="text-sm text-slate-600 mt-2">Try adjusting your search terms or filter.</p>
                </div>
              ) : (
                <>
                  {visibleInstructors.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <button
                          onClick={() => setInstructorsOpen((v) => !v)}
                          className="flex items-center gap-2 text-xl font-bold text-slate-900"
                        >
                          <span
                            className={`inline-flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 bg-slate-100 text-slate-700 shadow-sm transition-transform hover:bg-slate-200 ${
                              instructorsOpen ? "rotate-180" : ""
                            }`}
                          >
                            <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                              <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.24 4.5a.75.75 0 01-1.08 0l-4.24-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                            </svg>
                          </span>
                          Instructors
                        </button>
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Records {visibleInstructors.length}</span>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setInstructorPage((p) => Math.max(1, p - 1))}
                              disabled={instructorPage === 1}
                              className="px-2.5 py-1.5 text-[11px] font-semibold uppercase rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                              Prev
                            </button>
                            <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                              Page {instructorPage} of {instructorPageCount}
                            </span>
                            <button
                              onClick={() => setInstructorPage((p) => Math.min(instructorPageCount, p + 1))}
                              disabled={instructorPage === instructorPageCount}
                              className="px-2.5 py-1.5 text-[11px] font-semibold uppercase rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                              Next
                            </button>
                          </div>
                        </div>
                      </div>
                      {instructorsOpen && (
                        <div className="rounded-2xl border border-indigo-100 bg-indigo-50/60 overflow-hidden">
                          <div className="hidden md:grid grid-cols-[1.6fr_2.2fr_1.4fr_1fr] gap-4 px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-indigo-700 bg-indigo-100/70">
                            <span>Name</span>
                            <span>Email</span>
                            <span>Contact</span>
                            <span>Type</span>
                          </div>
                          {pagedInstructors.map((instructor, index) => (
                            <div
                              key={`${instructor.id}-${index}`}
                              className="border-t border-indigo-100/80 bg-white/80 px-5 py-4 md:grid md:grid-cols-[1.6fr_2.2fr_1.4fr_1fr] md:items-center md:gap-4 hover:bg-white transition-all"
                            >
                              <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-xl bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center">
                                  {instructor.first_name?.[0]}{instructor.last_name?.[0]}
                                </div>
                                <div>
                                  <p className="text-sm font-semibold text-slate-900">{instructor.first_name} {instructor.last_name}</p>
                                  <p className="text-xs text-slate-500 md:hidden">{instructor.email}</p>
                                </div>
                              </div>
                              <p className="hidden md:block text-sm text-slate-700">{instructor.email}</p>
                              <p className="text-sm text-slate-700">{instructor.contact_number || "N/A"}</p>
                              <span className={`inline-flex w-fit px-2.5 py-1 rounded-full text-[11px] font-semibold uppercase ${
                                instructor.subject_type === "General"
                                  ? "bg-purple-100 text-purple-700"
                                  : "bg-blue-100 text-blue-700"
                              }`}>
                                {instructor.subject_type}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {visibleStudents.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <button
                          onClick={() => setStudentsOpen((v) => !v)}
                          className="flex items-center gap-2 text-xl font-bold text-slate-900"
                        >
                          <span
                            className={`inline-flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 bg-slate-100 text-slate-700 shadow-sm transition-transform hover:bg-slate-200 ${
                              studentsOpen ? "rotate-180" : ""
                            }`}
                          >
                            <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                              <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.24 4.5a.75.75 0 01-1.08 0l-4.24-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                            </svg>
                          </span>
                          Students
                        </button>
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Records {visibleStudents.length}</span>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setStudentPage((p) => Math.max(1, p - 1))}
                              disabled={studentPage === 1}
                              className="px-2.5 py-1.5 text-[11px] font-semibold uppercase rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                              Prev
                            </button>
                            <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                              Page {studentPage} of {studentPageCount}
                            </span>
                            <button
                              onClick={() => setStudentPage((p) => Math.min(studentPageCount, p + 1))}
                              disabled={studentPage === studentPageCount}
                              className="px-2.5 py-1.5 text-[11px] font-semibold uppercase rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                              Next
                            </button>
                          </div>
                        </div>
                      </div>
                      {studentsOpen && (
                        <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 overflow-hidden">
                          <div className="hidden lg:grid grid-cols-[1.6fr_1.2fr_1fr_1.2fr_200px] gap-4 px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-emerald-700 bg-emerald-100/70">
                            <span>Name</span>
                            <span>School ID</span>
                            <span>Year Level</span>
                            <span>Contact</span>
                            <span className="text-right">Action</span>
                          </div>
                          {pagedStudents.map((student) => (
                            <div
                              key={student.id}
                              className="border-t border-emerald-100/80 bg-white/80 px-5 py-4 lg:grid lg:grid-cols-[1.6fr_1.2fr_1fr_1.2fr_200px] lg:items-center lg:gap-4 hover:bg-white transition-all"
                            >
                              <div className="flex items-center gap-3">
                                {student.profile_picture ? (
                                  <img src={student.profile_picture} alt={student.first_name} className="h-10 w-10 rounded-xl object-cover border border-emerald-100" />
                                ) : (
                                  <div className="h-10 w-10 rounded-xl bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center">
                                    {student.first_name?.[0]}{student.last_name?.[0]}
                                  </div>
                                )}
                                <div>
                                  <p className="text-sm font-semibold text-slate-900">{student.first_name} {student.last_name}</p>
                                  {(student.is_transferee || student.is_irregular) && (
                                    <div className="mt-1 flex items-center gap-1">
                                      {student.is_transferee && (
                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase bg-indigo-100 text-indigo-700">Transferee</span>
                                      )}
                                      {student.is_irregular && (
                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase bg-amber-100 text-amber-700">Irregular</span>
                                      )}
                                    </div>
                                  )}
                                  <p className="text-xs text-slate-500 lg:hidden">{student.email}</p>
                                </div>
                              </div>
                              <p className="text-sm text-slate-700">{student.school_id}</p>
                              <p className="text-sm text-slate-700">{student.year_level}</p>
                              <p className="text-sm text-slate-700">{student.contact_number || "N/A"}</p>
                              <div className="mt-3 lg:mt-0 lg:text-right">
                                <div className="flex items-center justify-end gap-2">
                                  {(student.is_transferee || student.is_irregular) && (
                                    <button
                                      onClick={() => handleExtraApproval(student.id, !student.extra_approved)}
                                      className={`inline-flex items-center justify-center rounded-xl border px-3 py-2 text-[11px] font-semibold uppercase tracking-wide transition-all ${
                                        student.extra_approved
                                          ? 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                                          : 'border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100'
                                      }`}
                                    >
                                      {student.extra_approved ? 'Extra Approved' : 'Needs Approval'}
                                    </button>
                                  )}
                                  <button
                                    onClick={() => handleViewStudentDetails(student)}
                                    className="inline-flex items-center justify-center rounded-xl border border-emerald-200 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-wide text-emerald-700 hover:bg-emerald-50 transition-all"
                                  >
                                    View Details
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {activeTab === "pendingStudents" && (
            <div id="pending-students" className="space-y-4">
              <div className="bg-white/90 backdrop-blur-xl rounded-3xl p-6 border border-slate-200 shadow-lg shadow-slate-200/60">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">Bulk Student Import</h3>
                    <p className="text-sm text-slate-600">Import multiple students at once using the official CSV masterlist.</p>
                  </div>
                  <button
                    onClick={handleDownloadTemplate}
                    className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-all font-medium text-sm"
                  >
                    Download Template
                  </button>
                </div>
                <button
                  onClick={() => setShowImportModal(true)}
                  className="w-full px-6 py-3 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-lg hover:shadow-xl hover:shadow-purple-500/30 transition-all font-medium"
                >
                  Import Masterlist CSV
                </button>
              </div>

              {pendingStudents.length === 0 ? (
                <div className="bg-white/90 backdrop-blur-xl rounded-3xl p-12 border border-slate-200 shadow-lg shadow-slate-200/60 text-center">
                  <div className="text-6xl mb-4"></div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">All Caught Up!</h3>
                  <p className="text-slate-600">No pending student approvals at the moment.</p>
                </div>
              ) : (
                <>
                  {selectedStudents.length > 0 && (
                    <div className="flex items-center justify-between rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-3">
                      <span className="text-sm font-semibold text-emerald-800">{selectedStudents.length} student{selectedStudents.length > 1 ? 's' : ''} selected</span>
                      <button
                        onClick={handleBulkApprove}
                        className="px-5 py-2 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20"
                      >
                        Bulk Approve Selected
                      </button>
                    </div>
                  )}
                  <div className="rounded-2xl border border-sky-200 bg-sky-100 text-slate-800 shadow-xl shadow-sky-200/40 overflow-hidden">
                    <div className="hidden md:grid grid-cols-[40px_1.2fr_1.6fr_2.6fr_1.2fr_1.2fr_1.2fr_120px] items-center px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-sky-800 border-b border-sky-200 bg-sky-200/70">
                      <input
                        type="checkbox"
                        checked={pendingStudents.length > 0 && selectedStudents.length === pendingStudents.length}
                        onChange={toggleSelectAll}
                        className="h-4 w-4 rounded border-sky-300 text-sky-600"
                      />
                      <span>School ID</span>
                      <span>Name</span>
                      <span>Email</span>
                      <span>Year</span>
                      <span>Contact</span>
                      <span>Status</span>
                      <span className="text-right">Actions</span>
                    </div>
                    {pendingStudents.map((student) => {
                      const importedFromCsv = student.account_source === "masterlist_import";
                      const rec = importedFromCsv ? { found: true } : null;
                      const hasMatch = importedFromCsv;
                      const needsDeclaration = (student.is_transferee || student.is_irregular) && !student.declaration_verified;
                      const canApprove = canApproveStudent(student);
                      return (
                        <div key={student.id} className="border-b border-sky-200/60 last:border-b-0">
                          <div className="hidden md:grid grid-cols-[40px_1.2fr_1.6fr_2.6fr_1.2fr_1.2fr_1.2fr_120px] items-center px-5 py-3">
                            <input
                              type="checkbox"
                              checked={selectedStudents.includes(student.id)}
                              onChange={() => toggleStudentSelection(student.id)}
                              disabled={!canApprove}
                              className="h-4 w-4 rounded border-sky-300 text-sky-600 disabled:opacity-30"
                            />
                            <div className="text-sm font-semibold text-slate-900">{student.school_id}</div>
                            <div className="text-sm">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span>{student.first_name} {student.last_name}</span>
                                {student.is_transferee && (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase bg-sky-100 text-sky-700">Transferee</span>
                                )}
                                {student.is_irregular && (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase bg-amber-100 text-amber-700">Irregular</span>
                                )}
                              </div>
                            </div>
                            <div className="text-sm text-slate-600 break-words pr-2">{student.email}</div>
                            <div className="text-sm">{student.year_level}</div>
                            <div className="text-sm">{student.contact_number || 'N/A'}</div>
                            <div className="flex items-center gap-2">
                              {!rec && <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold uppercase bg-slate-100 text-slate-500">Checking</span>}
                              {rec && !rec.found && <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold uppercase bg-red-100 text-red-700">No Record</span>}
                              {rec && rec.found && !hasMatch && <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold uppercase bg-amber-100 text-amber-700">Mismatch</span>}
                              {importedFromCsv && <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold uppercase bg-sky-100 text-sky-700">Imported</span>}
                              {!importedFromCsv && !student.id_photo && <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold uppercase bg-slate-100 text-slate-500">No ID Photo</span>}
                              {!importedFromCsv && student.id_photo && !student.id_verified && <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold uppercase bg-amber-100 text-amber-700">ID Pending</span>}
                              {rec && rec.found && hasMatch && needsDeclaration && <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold uppercase bg-amber-100 text-amber-700">Declaration</span>}
                              {rec && rec.found && hasMatch && student.id_verified && !needsDeclaration && <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold uppercase bg-emerald-100 text-emerald-700">Ready</span>}
                            </div>
                            <div className="flex items-center justify-end gap-2">
                              <button onClick={() => handleViewStudentDetails(student)} className="h-9 w-9 inline-flex items-center justify-center rounded-lg bg-white border border-sky-200 text-sky-700 hover:bg-sky-50 transition-all" title="View Details">
                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                              </button>
                              <button onClick={() => openRejectModal(student.id)} className="h-9 w-9 inline-flex items-center justify-center rounded-lg bg-white border border-red-200 text-red-600 hover:bg-red-50 transition-all" title="Reject">
                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                              </button>
                              {canApprove ? (
                                <button onClick={() => handleApproveStudent(student.id)} className="h-9 w-9 inline-flex items-center justify-center rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-all" title="Approve">
                                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                </button>
                              ) : (
                                <div className="h-9 w-9" />
                              )}
                            </div>
                          </div>
                          {/* Mobile layout */}
                          <div className="md:hidden p-4 space-y-1">
                            <div className="flex justify-between text-sm">
                              <span className="text-slate-500 font-medium">School ID</span>
                              <span className="font-semibold text-slate-900">{student.school_id}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-slate-500 font-medium">Name</span>
                              <span className="text-slate-900 text-right">{student.first_name} {student.last_name}</span>
                            </div>
                            {(student.is_transferee || student.is_irregular) && (
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-slate-500 font-medium">Status</span>
                                <span className="flex items-center gap-2">
                                  {student.is_transferee && (
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase bg-sky-100 text-sky-700">Transferee</span>
                                  )}
                                  {student.is_irregular && (
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase bg-amber-100 text-amber-700">Irregular</span>
                                  )}
                                </span>
                              </div>
                            )}
                            <div className="flex justify-between text-sm">
                              <span className="text-slate-500 font-medium">Email</span>
                              <span className="text-slate-600 break-all">{student.email}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-slate-500 font-medium">Year</span>
                              <span className="text-slate-900">{student.year_level}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-slate-500 font-medium">Contact</span>
                              <span className="text-slate-900">{student.contact_number || 'N/A'}</span>
                            </div>
                            <div className="flex items-center justify-between pt-2">
                              <div className="flex gap-2">
                                {!rec && <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold uppercase bg-slate-100 text-slate-500">Checking</span>}
                                {rec && !rec.found && <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold uppercase bg-red-100 text-red-700">No Record</span>}
                                {rec && rec.found && !hasMatch && <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold uppercase bg-amber-100 text-amber-700">Mismatch</span>}
                                {rec && rec.found && hasMatch && needsDeclaration && <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold uppercase bg-amber-100 text-amber-700">Declaration</span>}
                                {rec && rec.found && hasMatch && !needsDeclaration && <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold uppercase bg-emerald-100 text-emerald-700">Match</span>}
                              </div>
                              <div className="flex gap-2">
                                <button onClick={() => handleViewStudentDetails(student)} className="h-9 w-9 inline-flex items-center justify-center rounded-lg bg-white border border-sky-200 text-sky-700" title="View Details">
                                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                </button>
                                <button onClick={() => openRejectModal(student.id)} className="h-9 w-9 inline-flex items-center justify-center rounded-lg bg-white border border-red-200 text-red-600" title="Reject">
                                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                                {canApprove && (
                                  <button onClick={() => handleApproveStudent(student.id)} className="h-9 w-9 inline-flex items-center justify-center rounded-lg bg-emerald-600 text-white" title="Approve">
                                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          )}

          {activeTab === "approved" && (
            <div id="approved-exams" className="space-y-4">
              {approvedExams.length === 0 ? (
                <div className="bg-white/90 backdrop-blur-xl rounded-3xl p-12 border border-slate-200 shadow-lg shadow-slate-200/60 text-center">
                  <div className="text-6xl mb-4"></div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">No Approved Exams</h3>
                  <p className="text-slate-600">Approved exams will appear here.</p>
                </div>
              ) : (
                approvedExams.map((exam) => (
                  <div
                    key={exam.id}
                    className="bg-white/90 backdrop-blur-xl rounded-3xl p-6 border border-emerald-200 shadow-lg shadow-emerald-200/60 hover:-translate-y-1 transition-all"
                  >
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <span className="px-3 py-1 rounded-full text-xs font-semibold uppercase bg-green-100 text-green-700">
                            Approved
                          </span>
                          <span className="px-3 py-1 rounded-full text-xs font-semibold uppercase bg-blue-100 text-blue-700">
                            {exam.exam_type}
                          </span>
                          <span className="px-3 py-1 rounded-full text-xs font-semibold uppercase bg-purple-100 text-purple-700">
                            {exam.department}
                          </span>
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mb-2">{exam.title}</h3>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm text-slate-600">
                          <div>
                            <span className="block font-medium">Subject</span>
                            <span>{exam.subject}</span>
                          </div>
                          <div>
                            <span className="block font-medium">Created By</span>
                            <span>{exam.created_by}</span>
                          </div>
                          <div>
                            <span className="block font-medium">Year Level</span>
                            <span>{exam.year_level}</span>
                          </div>
                          <div>
                            <span className="block font-medium">Approved By</span>
                            <span>{exam.approved_by}</span>
                          </div>
                          <div>
                            <span className="block font-medium">Approved On</span>
                            <span>{new Date(exam.approved_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-3">
                        <button
                          onClick={() => handleViewExamDetails(exam.id)}
                          className="px-5 py-3 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-all font-semibold shadow-lg shadow-slate-900/20"
                        >
                          View Details
                        </button>
                        {profile?.id === exam.created_by_id && (
                          <Link
                            href={`/exam/${exam.id}/results`}
                            className="px-5 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-all font-semibold shadow-lg shadow-emerald-600/20"
                          >
                            Results & Grading
                          </Link>
                        )}
                        <button
                          onClick={() => handleViewExamPhotos(exam.id)}
                          className="px-6 py-3 bg-white border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 transition-all font-semibold"
                        >
                          Review Photos
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
            </div>
          </DeanShell>
        </main>

        {/* Exam Details Modal */}
        {showExamModal && selectedExam && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white/95 backdrop-blur-xl rounded-3xl max-w-6xl w-full max-h-[90vh] overflow-y-auto border border-slate-200 shadow-2xl shadow-slate-900/10">
              <div className="sticky top-0 bg-white/95 backdrop-blur-xl border-b border-slate-200 p-6 flex justify-between items-center">
                <h2 className="text-2xl font-bold text-slate-900">Exam Details</h2>
                <button
                  onClick={() => setShowExamModal(false)}
                  className="text-slate-400 hover:text-slate-600 text-2xl"
                >
                  x
                </button>
              </div>
              
              <div className="p-6 space-y-6">
                {/* Exam Information */}
                <div className="bg-slate-50 rounded-xl p-6">
                  <h3 className="text-xl font-bold text-slate-900 mb-4">{selectedExam.exam.title}</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="block text-slate-600 font-medium">Subject</span>
                      <span className="text-slate-900">{selectedExam.exam.subject}</span>
                    </div>
                    <div>
                      <span className="block text-slate-600 font-medium">Exam Type</span>
                      <span className="text-slate-900 capitalize">{selectedExam.exam.exam_type}</span>
                    </div>
                    <div>
                      <span className="block text-slate-600 font-medium">Question Type</span>
                      <span className="text-slate-900 capitalize">{selectedExam.exam.question_type.replace('_', ' ')}</span>
                    </div>
                    <div>
                      <span className="block text-slate-600 font-medium">Year Level</span>
                      <span className="text-slate-900">{selectedExam.exam.year_level}</span>
                    </div>
                    <div>
                      <span className="block text-slate-600 font-medium">Total Points</span>
                      <span className="text-slate-900">{selectedExam.exam.total_points}</span>
                    </div>
                    <div>
                      <span className="block text-slate-600 font-medium">Passing Score</span>
                      <span className="text-slate-900">{selectedExam.exam.passing_score}</span>
                    </div>
                    <div>
                      <span className="block text-slate-600 font-medium">Duration</span>
                      <span className="text-slate-900">{selectedExam.exam.duration_minutes} minutes</span>
                    </div>
                    <div>
                      <span className="block text-slate-600 font-medium">Questions</span>
                      <span className="text-slate-900">{selectedExam.exam.question_count}</span>
                    </div>
                    <div>
                      <span className="block text-slate-600 font-medium">Created By</span>
                      <span className="text-slate-900">{selectedExam.exam.created_by}</span>
                    </div>
                  </div>
                  <div className="mt-4">
                    <span className="block text-slate-600 font-medium mb-2">Instructions</span>
                    <p className="text-slate-900 whitespace-pre-wrap">{selectedExam.exam.instructions}</p>
                  </div>
                </div>

                {/* Eligible Students */}
                <div>
                  <h3 className="text-xl font-bold text-slate-900 mb-4">
                    Eligible Students ({selectedExam.total_eligible_students})
                  </h3>
                  <div className="space-y-3">
                    {selectedExam.eligible_students.map((student) => (
                      <div
                        key={student.id}
                        className="bg-white border border-slate-200 rounded-xl p-4 hover:shadow-md transition-all"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            {student.profile_picture ? (
                              <img
                                src={student.profile_picture}
                                alt={student.first_name}
                                className="w-12 h-12 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold">
                                {student.first_name[0]}{student.last_name[0]}
                              </div>
                            )}
                            <div>
                              <p className="font-semibold text-slate-900">
                                {student.first_name} {student.last_name}
                              </p>
                              <p className="text-sm text-slate-600">{student.school_id} | Year {student.year_level}</p>
                            </div>
                          </div>
                          <button
                            onClick={() => handleViewStudentDetails(student)}
                            className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-all text-sm font-medium"
                          >
                            View Details
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Student Details Modal */}
        {showStudentModal && selectedStudent && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl w-full max-w-5xl max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200">
              <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center z-10">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Student Verification</h2>
                  <p className="text-sm text-slate-600">Compare registration details with official enrollment record</p>
                </div>
                <button onClick={() => { setShowStudentModal(false); }} className="text-slate-500 hover:text-slate-700 text-2xl leading-none">x</button>
              </div>
              <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* LEFT - Student Registration */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-6 rounded-full bg-sky-500"></div>
                    <h3 className="font-bold text-slate-900">Account Information</h3>
                    <span className="ml-auto text-xs bg-sky-200 text-sky-900 px-2 py-0.5 rounded-full font-semibold">Pending</span>
                  </div>
                  {(selectedStudent.is_transferee || selectedStudent.is_irregular) && (
                    <div className="flex items-center gap-2 flex-wrap">
                      {selectedStudent.is_transferee && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase bg-sky-100 text-sky-700">Transferee</span>
                      )}
                      {selectedStudent.is_irregular && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase bg-amber-100 text-amber-700">Irregular</span>
                      )}
                    </div>
                  )}
                  <div className="flex justify-center">
                    {selectedStudent.profile_picture ? (
                      <img src={selectedStudent.profile_picture} alt={selectedStudent.first_name} className="w-24 h-24 rounded-full object-cover border-4 border-sky-300/40" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                    ) : (
                      <div className="w-24 h-24 rounded-full bg-sky-100 flex items-center justify-center text-sky-700 font-bold text-3xl border-4 border-sky-200">
                        {selectedStudent.first_name[0]}{selectedStudent.last_name[0]}
                      </div>
                    )}
                  </div>
                  <div className="bg-white/80 border border-sky-200 rounded-xl p-4 space-y-3 text-sm">
                    {([
                      ['Full Name', `${selectedStudent.first_name} ${selectedStudent.last_name}`],
                      ['Year Level', selectedStudent.year_level ? `${selectedStudent.year_level}${['st','nd','rd','th'][parseInt(selectedStudent.year_level)-1]||'th'} Year` : '-'],
                      ['Email', selectedStudent.email],
                      ['Contact', selectedStudent.contact_number || '-'],
                    ] as [string,string][]).map(([label, value]) => (
                      <div key={label} className="flex justify-between">
                        <span className="text-slate-600 font-medium">{label}</span>
                        <span className="text-slate-900 font-semibold text-right max-w-[60%] break-words">{value}</span>
                      </div>
                    ))}
                    {/* Editable School ID row */}
                    <div className="flex justify-between items-center gap-2">
                      <span className="text-slate-600 font-medium shrink-0">School ID</span>
                      {editingSchoolId ? (
                        <div className="flex items-center gap-2 flex-1 justify-end">
                          <input
                            autoFocus
                            value={schoolIdDraft}
                            onChange={e => setSchoolIdDraft(e.target.value)}
                            className="border border-sky-300 rounded-lg px-3 py-1.5 text-sm text-slate-900 w-40 focus:outline-none focus:ring-2 focus:ring-sky-400"
                          />
                          <button
                            onClick={handleSaveSchoolId}
                            disabled={schoolIdSaving || !schoolIdDraft.trim()}
                            className="px-3 py-1.5 bg-sky-600 text-white rounded-lg text-sm font-semibold hover:bg-sky-700 disabled:opacity-50 transition-all"
                          >
                            {schoolIdSaving ? 'Savingâ¦' : 'Save'}
                          </button>
                          <button
                            onClick={() => setEditingSchoolId(false)}
                            className="px-3 py-1.5 bg-white border border-slate-300 text-slate-600 rounded-lg text-sm font-semibold hover:bg-slate-50 transition-all"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <span className="text-slate-900 font-semibold">{selectedStudent.school_id}</span>
                      )}
                    </div>
                    {!editingSchoolId && (
                      <button
                        onClick={() => { setSchoolIdDraft(selectedStudent.school_id); setEditingSchoolId(true); }}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-sky-300 bg-sky-50 text-sky-700 hover:bg-sky-100 hover:border-sky-400 transition-all text-sm font-semibold"
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 012.828 2.828L11.828 15.828a2 2 0 01-1.414.586H9v-2a2 2 0 01.586-1.414z" />
                        </svg>
                        Edit School ID
                      </button>
                    )}
                  </div>
                  {selectedStudent.study_load && (
                    <div>
                      <p className="text-sm font-semibold text-slate-700 mb-2">Study Load Document</p>
                      {studyLoadUrlLoading ? (
                        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                          Loading file link...
                        </div>
                      ) : (
                        <div className="rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 flex items-center justify-between gap-3">
                          <span className="text-sm text-slate-700">Study load document uploaded</span>
                          <button
                            type="button"
                            onClick={handleOpenStudyLoad}
                            className="inline-flex items-center gap-2 rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700 transition-all"
                          >
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            View File
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                  {selectedStudent.account_source === "masterlist_import" ? (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 space-y-2">
                      <p className="text-sm font-semibold text-emerald-900">Imported from CSV Masterlist</p>
                      <p className="text-sm text-emerald-800">
                        This account was created from the official CSV import. Dean approval can proceed directly without document verification.
                      </p>
                    </div>
                  ) : (
                    <div className="bg-white/80 border border-sky-200 rounded-xl p-4 space-y-3">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">ID Photo Verification</p>
                          <p className="text-xs text-slate-500">Review the uploaded school ID before approving the student.</p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase ${
                          selectedStudent.id_verified
                            ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                            : 'bg-amber-100 text-amber-700 border border-amber-200'
                        }`}>
                          {selectedStudent.id_verified ? 'Verified' : 'Pending'}
                        </span>
                      </div>
                      {selectedStudent.id_photo ? (
                        <>
                          <img
                            src={selectedStudent.id_photo}
                            alt={`${selectedStudent.first_name} ${selectedStudent.last_name} ID`}
                            className="w-full max-w-sm rounded-xl border border-slate-200 object-cover"
                          />
                          <button
                            onClick={() => handleIdPhotoVerify(selectedStudent.id, !selectedStudent.id_verified)}
                            className={`w-full px-4 py-2.5 rounded-xl font-semibold text-sm transition-all ${
                              selectedStudent.id_verified
                                ? 'bg-white border border-amber-200 text-amber-700 hover:bg-amber-50'
                                : 'bg-sky-600 text-white hover:bg-sky-700'
                            }`}
                          >
                            {selectedStudent.id_verified ? 'Mark as Pending Again' : 'Approve ID Photo'}
                          </button>
                        </>
                      ) : (
                        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-sm text-slate-500 text-center">
                          No ID photo uploaded yet.
                        </div>
                      )}
                    </div>
                  )}
                  {(selectedStudent.is_transferee || selectedStudent.is_irregular) && !selectedStudent.is_approved && selectedStudent.account_source !== "masterlist_import" && (
                    <div className="bg-white/80 border border-sky-200 rounded-xl p-4 space-y-2">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">Declaration Verification</p>
                          <p className="text-xs text-slate-500">Confirm the student's transferee/irregular declaration before approval</p>
                        </div>
                        <button
                          onClick={() => handleDeclarationVerify(selectedStudent.id, !selectedStudent.declaration_verified)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase transition-all ${
                            selectedStudent.declaration_verified
                              ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                              : 'bg-amber-100 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {selectedStudent.declaration_verified ? 'Verified' : 'Not Verified'}
                        </button>
                      </div>
                    </div>
                  )}
                  {(selectedStudent.is_transferee || selectedStudent.is_irregular) && selectedStudent.is_approved && (
                    <div className="bg-white/80 border border-sky-200 rounded-xl p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">Extra Approval</p>
                          <p className="text-xs text-slate-500">Required for transferee/irregular access</p>
                        </div>
                        <button
                          onClick={() => handleExtraApproval(selectedStudent.id, !selectedStudent.extra_approved)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase transition-all ${
                            selectedStudent.extra_approved
                              ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                              : 'bg-amber-100 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {selectedStudent.extra_approved ? 'Approved' : 'Not Approved'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                {/* RIGHT - Account Summary */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-6 rounded-full bg-sky-500"></div>
                    <h3 className="font-bold text-slate-900">Account Summary</h3>
                    <span className="ml-auto text-xs bg-sky-200 text-sky-900 px-2 py-0.5 rounded-full font-semibold">System</span>
                  </div>
                  <div className="space-y-3">
                    {(() => {
                      const subjects = selectedStudent.enrolled_subjects || [];
                      return (
                        <>
                    <div className={`rounded-xl p-3 text-sm font-semibold text-center ${safeToApprove ? 'bg-sky-100 text-sky-900 border border-sky-200' : 'bg-amber-100 text-amber-900 border border-amber-200'}`}>
                      {safeToApprove ? 'Ready to approve' : 'Review required before approval'}
                    </div>
                    <div className="bg-white/80 border border-sky-200 rounded-xl p-4 space-y-3 text-sm">
                      {([
                        ['Account Source', selectedStudent.account_source === 'masterlist_import' ? 'CSV Masterlist Import' : 'Manual Verification'],
                        ['School ID Login', selectedStudent.school_id || '-'],
                        ['Course', selectedStudent.course || '-'],
                        ['Subjects', subjects.length > 0 ? subjects.join(', ') : '-'],
                      ] as [string, string][]).map(([label, value]) => (
                        <div key={label} className="flex justify-between gap-4">
                          <span className="text-slate-600 font-medium">{label}</span>
                          <span className="text-slate-900 font-semibold text-right max-w-[65%] break-words">{value}</span>
                        </div>
                      ))}
                    </div>
                    {selectedStudent.account_source === "masterlist_import" && (
                      <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                        This student came directly from the imported CSV, so dean approval can happen here without checking a separate enrollment-record table. After approval, the student receives a reset-password email link to set a password before logging in.
                      </div>
                    )}
                        </>
                      );
                    })()}
                  </div>
                  {activeTab === "pendingStudents" && !selectedStudent.is_approved && (
                    <div className="pt-2 flex gap-3">
                      <button
                        onClick={() => { setShowStudentModal(false); openRejectModal(selectedStudent.id); }}
                        className="flex-1 px-4 py-3 bg-white border border-red-200 text-red-600 rounded-xl hover:bg-red-50 transition-all font-medium text-sm"
                      >
                        Reject
                      </button>
                      {safeToApprove && (
                        <button
                          onClick={() => { handleApproveStudent(selectedStudent.id); setShowStudentModal(false); }}
                          className="flex-1 px-4 py-3 bg-sky-600 text-white rounded-xl hover:bg-sky-700 transition-all font-medium text-sm"
                        >
                          Approve Student
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
        {/* Photo Review Modal */}
        {showPhotoReviewModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white/95 backdrop-blur-xl rounded-3xl max-w-6xl w-full max-h-[90vh] overflow-y-auto border border-slate-200 shadow-2xl shadow-slate-900/10">
              <div className="sticky top-0 bg-white/95 backdrop-blur-xl border-b border-slate-200 p-6 flex justify-between items-center">
                <h2 className="text-2xl font-bold text-slate-900">Exam Photo Review</h2>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setPhotoReviewCompact((v) => !v)}
                    className="text-sm font-semibold px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all"
                  >
                    {photoReviewCompact ? "Expand" : "Minimize"}
                  </button>
                  <button
                    onClick={() => setShowPhotoReviewModal(false)}
                    className="text-slate-400 hover:text-slate-600 text-2xl"
                  >
                    x
                  </button>
                </div>
              </div>
              
              <div className="p-6">
                {examPhotos.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4"></div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">No Photos Captured</h3>
                    <p className="text-slate-600">No photos have been captured for this exam yet.</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="bg-slate-50 rounded-xl p-4">
                      <p className="text-slate-700">
                        <span className="font-bold">Total Captures:</span> {examPhotoSummary.total_photos} ({examPhotoSummary.total_images} photos, {examPhotoSummary.total_text} text)
                      </p>
                      {isLimited && (
                        <p className="text-xs text-slate-500 mt-1">Showing first 10 photos. Additional captures are shown as text summaries unless a violation is detected.</p>
                      )}
                    </div>
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
                    
                    {(() => {
                      const grouped: Record<string, { name: string; id: string; id_photo: string | null; id_verified: boolean; photos: any[] }> = {};
                      examPhotos.forEach((p) => {
                        const key = p.student_id;
                        if (!grouped[key]) {
                          grouped[key] = { name: p.student_name, id: p.student_id, id_photo: p.student_id_photo, id_verified: p.student_id_verified, photos: [] };
                        }
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
                      return (
                        <div className="space-y-4">
                          {filteredStudents.length === 0 ? (
                            <div className="text-center py-12">
                              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
                                <svg className="h-7 w-7 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10m-10 4h6m-9 5h12a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v11a2 2 0 002 2z" />
                                </svg>
                              </div>
                              <h3 className="text-xl font-bold text-slate-900 mb-2">No Matches</h3>
                              <p className="text-slate-600">No students match your search.</p>
                            </div>
                          ) : filteredStudents.map((student) => {
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
                            const isStudentLimited = !hasViolation && imagePhotos.length > 10;
                            const isCollapsed = !!collapsedStudentPhotos[String(student.id)];
                            return (
                              <div key={student.id} className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                                <div className="bg-slate-50 px-4 py-3 flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    {student.id_photo ? (
                                      <img src={student.id_photo} alt={student.name} className="w-10 h-10 rounded-full object-cover border border-slate-200" />
                                    ) : (
                                      <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 text-sm font-semibold">
                                        {student.name?.[0]?.toUpperCase() || '?'}
                                      </div>
                                    )}
                                    <div>
                                      <p className="font-semibold text-slate-900">{student.name}</p>
                                      <p className="text-xs text-slate-500">ID: {student.id} - {student.photos.length} capture(s)</p>
                                      {isStudentLimited && (
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
                                          <div className={`w-full ${photoReviewCompact ? "h-20" : "h-32"} flex items-center justify-center bg-slate-50 p-2 text-xs text-slate-700 text-center rounded-lg border border-slate-200`}>
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
                                        <p className="text-xs text-slate-400 text-center">{new Date(photo.timestamp).toLocaleString()}</p>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

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
                  x
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
                  className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 transition-all"
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
                  x
                </button>
              </div>
              <div className="max-h-[70vh] overflow-y-auto p-6 space-y-3">
                {monitoring.active_sessions.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50">
                      <svg className="h-6 w-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <p className="text-sm text-slate-600">No active sessions.</p>
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
                  className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 transition-all"
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
                  x
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
                  className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 transition-all"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {showAllTodayModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="w-full max-w-3xl rounded-2xl bg-white shadow-2xl shadow-slate-900/20">
              <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">Today&apos;s Schedule</h3>
                  <p className="text-xs text-slate-500 mt-1">{monitoring.today_schedule.length} total record(s)</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAllTodayModal(false)}
                  className="text-slate-400 hover:text-slate-600 text-2xl leading-none"
                  aria-label="Close schedule"
                >
                  x
                </button>
              </div>
              <div className="max-h-[70vh] overflow-y-auto p-6 space-y-3">
                {monitoring.today_schedule.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-50">
                      <svg className="h-6 w-6 text-sky-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10m-10 4h6m-9 5h12a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v11a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <p className="text-sm text-slate-600">No exams scheduled today.</p>
                  </div>
                ) : (
                  monitoring.today_schedule.map((item) => (
                    <div key={`modal-today-${item.exam_id}-${item.instructor_id}`} className="rounded-xl border border-sky-100 bg-white p-4 shadow-sm">
                      <p className="text-sm font-semibold text-slate-900">{item.exam_title}</p>
                      <p className="text-xs text-slate-600">{item.instructor_name}</p>
                      <p className="text-[11px] text-sky-700 mt-1">{new Date(item.scheduled_date).toLocaleString()}</p>
                    </div>
                  ))
                )}
              </div>
              <div className="border-t border-slate-200 px-6 py-4 flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowAllTodayModal(false)}
                  className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 transition-all"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Import Masterlist Modal */}
        {showImportModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white/95 backdrop-blur-xl rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-slate-200 shadow-2xl shadow-slate-900/10">
              <div className="sticky top-0 bg-white/95 backdrop-blur-xl border-b border-slate-200 p-6 flex justify-between items-center">
                <h2 className="text-2xl font-bold text-slate-900">Import Masterlist CSV</h2>
                <button
                  onClick={() => {
                    setShowImportModal(false);
                    setImportFile(null);
                    setImportResult(null);
                  }}
                  className="text-slate-400 hover:text-slate-600 text-2xl"
                >
                  x
                </button>
              </div>

              <div className="p-6 space-y-6">
                <div className="bg-slate-50 rounded-xl p-4">
                  <h3 className="font-bold text-slate-900 mb-2">Instructions</h3>
                  <ol className="text-sm text-slate-700 space-y-1 list-decimal list-inside">
                    <li>Download the masterlist template below</li>
                    <li>Fill in the official student records from EDP</li>
                    <li>Upload the completed CSV file for dean approval review</li>
                    <li>After approval, students receive an email with a reset-password link to set their own password</li>
                  </ol>
                  <p className="text-xs text-slate-500 mt-2">Required columns: school_id, email, first_name, last_name, year_level, course, subjects</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Select CSV File
                  </label>
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileChange}
                    className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200"
                  />
                  {importFile && (
                    <p className="mt-2 text-sm text-slate-600">
                      Selected: <span className="font-semibold">{importFile.name}</span>
                    </p>
                  )}
                </div>

                <button
                  onClick={handleImportStudents}
                  disabled={!importFile || importLoading}
                  className="w-full px-6 py-3 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-slate-900/20"
                >
                  {importLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Importing...
                    </span>
                  ) : (
                    "Import Masterlist"
                  )}
                </button>

                {importResult && (
                  <div className="space-y-4">
                    {importResult.error ? (
                      <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                        <h4 className="font-bold text-red-900 mb-2">Import Failed</h4>
                        <p className="text-sm text-red-700">{importResult.error}</p>
                      </div>
                    ) : (
                      <>
                        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                          <h4 className="font-bold text-green-900 mb-2">Import Summary</h4>
                          <div className="text-sm text-green-700 space-y-1">
                            <p><span className="font-semibold">Successfully imported:</span> {importResult.success_count} student accounts</p>
                            <p><span className="font-semibold">Errors:</span> {importResult.error_count}</p>
                          </div>
                        </div>

                        {importResult.errors && importResult.errors.length > 0 && (
                          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                            <h4 className="font-bold text-yellow-900 mb-3">Errors Found ({importResult.errors.length})</h4>
                            <div className="max-h-64 overflow-y-auto space-y-3">
                              {importResult.errors.map((error: any, index: number) => (
                                <div key={index} className="bg-white rounded-lg p-3 border border-yellow-200">
                                  <p className="text-sm font-semibold text-yellow-900 mb-1">
                                    Row {error.row}: {error.error}
                                  </p>
                                  {error.data && (
                                    <div className="text-xs text-slate-600 mt-2">
                                      <p><span className="font-medium">Student ID:</span> {error.data.school_id}</p>
                                      <p><span className="font-medium">Email:</span> {error.data.email}</p>
                                      <p><span className="font-medium">Course:</span> {error.data.course}</p>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {importResult.success_count > 0 && (
                          <button
                            onClick={() => {
                              setShowImportModal(false);
                              setImportFile(null);
                              setImportResult(null);
                            }}
                            className="w-full px-6 py-3 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-all font-medium"
                          >
                            Done
                          </button>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Reject Student Modal */}
        {showRejectModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white/95 backdrop-blur-xl rounded-3xl max-w-md w-full border border-slate-200 shadow-2xl shadow-slate-900/10">
              <div className="p-6 border-b border-slate-200">
                <h2 className="text-xl font-bold text-slate-900">Reject Student Registration</h2>
                <p className="text-sm text-slate-600 mt-1">Please provide a reason for rejecting this student's registration.</p>
              </div>
              
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Rejection Reason *
                  </label>
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="e.g., Invalid study load document, missing required information, etc."
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 resize-none text-black"
                    rows={4}
                    required
                  />
                </div>
                
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => {
                      setShowRejectModal(false);
                      setStudentToReject(null);
                      setRejectionReason('');
                    }}
                    className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => studentToReject && handleRejectStudent(studentToReject)}
                    disabled={!rejectionReason.trim()}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Reject Student
                  </button>
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







