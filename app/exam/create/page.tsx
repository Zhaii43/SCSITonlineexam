// app/exam/create/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import RoleShell from "@/components/RoleShell";

import { API_URL, apiFetch } from "@/lib/api";

type AssignedSubject = {
  id: number;
  subject_name: string;
  department: string;
  is_active: boolean;
  year_levels?: string[];
};

const normalizeYearLevels = (values: unknown) => {
  if (!Array.isArray(values)) return [];
  return Array.from(
    new Set(
      values
        .map((value) => String(value).trim())
        .filter(Boolean)
    )
  ).sort();
};

const resolveSelectedYearLevels = (selectedLevels: string[], availableLevels: string[]) => {
  const nextSelectedLevels = selectedLevels.filter((level) => availableLevels.includes(level));
  if (nextSelectedLevels.length > 0) return nextSelectedLevels;
  if (availableLevels.length === 1) return [availableLevels[0]];
  return [];
};

export default function CreateExam() {
  const router = useRouter();
  const [editingExamId, setEditingExamId] = useState<number | null>(null);
  const [role, setRole] = useState<"" | "instructor" | "dean">("");
  const [initialLoading, setInitialLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [examId, setExamId] = useState<number | null>(null);
  const [assignedSubjects, setAssignedSubjects] = useState<AssignedSubject[]>([]);
  const [availableYearLevels, setAvailableYearLevels] = useState<string[]>([])
  
  const [formData, setFormData] = useState({
    title: "",
    subject: "",
    department: "",
    exam_type: "quiz",
    question_type: "multiple_choice",
    scheduled_date: "",
    scheduled_time: "",
    end_date: "",
    end_time: "",
    total_points: "",
    passing_score: "",
    instructions: "",
    year_level: [] as string[],
    is_practice: false,
    max_attempts: "1",
    retake_policy: "none",
    question_pool_size: "0",
    shuffle_options: true,
  });

  // Draft key scoped per user so instructor and dean never share the same draft
  const getDraftKey = () => {
    const uid = typeof window !== "undefined" ? localStorage.getItem("user_id") ?? "unknown" : "unknown";
    return `exam_create_draft_${uid}`;
  };

  // Restore draft from localStorage on mount (only for new exams, not editing)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const storedRole = window.localStorage.getItem("user_role");
    if (storedRole === "instructor" || storedRole === "dean") setRole(storedRole);

    const examIdValue = new URLSearchParams(window.location.search).get("examId");
    const parsedExamId = examIdValue ? Number(examIdValue) : null;
    const resolvedId = parsedExamId && Number.isFinite(parsedExamId) ? parsedExamId : null;
    setEditingExamId(resolvedId);

    // Only restore draft when creating a new exam
    if (!resolvedId) {
      try {
        const saved = localStorage.getItem(getDraftKey());
        if (saved) {
          const parsed = JSON.parse(saved);
          setFormData(parsed);
        }
      } catch {}
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) return;

    const loadProfile = async () => {
      try {
        const res = await apiFetch(`${API_URL}/profile/`);
        const data = await res.json().catch(() => null);
        if (!res.ok || !data) return;

        if (data.role === "instructor") {
          const subjects: AssignedSubject[] = Array.isArray(data.assigned_subjects) ? data.assigned_subjects : [];
          setAssignedSubjects(subjects);

          if (!editingExamId) {
            const firstActive = subjects.find((assignment) => assignment.is_active);
            if (firstActive) {
              setFormData((prev) => ({
                ...prev,
                subject: prev.subject || firstActive.subject_name,
                department: prev.department || firstActive.department,
              }));
            }
          }
        }
      } catch {}
    };

    loadProfile();
  }, [editingExamId]);

  // Auto-save form to localStorage on every change (only for new exams)
  useEffect(() => {
    if (editingExamId) return;
    try {
      localStorage.setItem(getDraftKey(), JSON.stringify(formData));
    } catch {}
  }, [formData, editingExamId]);

  useEffect(() => {
    if (!editingExamId) return;

    const token = localStorage.getItem("access_token");
    if (!token) return;

    const loadExam = async () => {
      setInitialLoading(true);
      try {
        const res = await apiFetch(`${API_URL}/exams/${editingExamId}/detail/`);
        const data = await res.json().catch(() => null);
        if (!res.ok || !data) {
          throw new Error(data?.error || data?.detail || "Failed to load exam details");
        }

        const scheduled = data.scheduled_date ? new Date(data.scheduled_date) : null;
        const expiration = data.expiration_time ? new Date(data.expiration_time) : null;
        const yearLevels = typeof data.year_level === "string"
          ? data.year_level.split(",").map((value: string) => value.trim()).filter(Boolean)
          : [];

        setExamId(data.id);
        setFormData({
          title: data.title || "",
          subject: data.subject || "",
          department: data.department || "",
          exam_type: data.exam_type || "quiz",
          question_type: data.question_type || "multiple_choice",
          scheduled_date: scheduled ? scheduled.toISOString().slice(0, 10) : "",
          scheduled_time: scheduled ? scheduled.toTimeString().slice(0, 5) : "",
          end_date: expiration ? expiration.toISOString().slice(0, 10) : "",
          end_time: expiration ? expiration.toTimeString().slice(0, 5) : "",
          total_points: String(data.total_points ?? ""),
          passing_score: String(data.passing_score ?? ""),
          instructions: data.instructions || "",
          year_level: yearLevels,
          is_practice: data.exam_type === "practice",
          max_attempts: String(data.max_attempts ?? 1),
          retake_policy: data.retake_policy || "none",
          question_pool_size: String(data.question_pool_size ?? 0),
          shuffle_options: Boolean(data.shuffle_options),
        });
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to load exam details");
      } finally {
        setInitialLoading(false);
      }
    };

    loadExam();
  }, [editingExamId]);

  const dashboardHref = role === "dean" ? "/dashboard/dean" : "/dashboard/teacher";
  const isDean = role === "dean";
  const activeAssignedSubjects = assignedSubjects.filter((assignment) => assignment.is_active);
  const selectedAssignedSubject = assignedSubjects.find(
    (assignment) => assignment.subject_name === formData.subject && assignment.department === formData.department
  );

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
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleInstructorSubjectChange = (value: string) => {
    const assignment = assignedSubjects.find((item) => String(item.id) === value);
    if (!assignment) return;
    const assignmentYearLevels = normalizeYearLevels(assignment.year_levels);
    setAvailableYearLevels(assignmentYearLevels);
    setFormData((prev) => ({
      ...prev,
      subject: assignment.subject_name,
      department: assignment.department,
      year_level: resolveSelectedYearLevels([], assignmentYearLevels),
    }));
  };

  useEffect(() => {
    if (isDean) return;
    if (!formData.subject || !formData.department) {
      setAvailableYearLevels([]);
      return;
    }

    const selectedAssignment = assignedSubjects.find(
      (assignment) => assignment.subject_name === formData.subject && assignment.department === formData.department
    );
    const embeddedLevels = normalizeYearLevels(selectedAssignment?.year_levels);
    const applyLevels = (levels: string[]) => {
      setAvailableYearLevels(levels);
      setFormData((prev) => {
        const nextYearLevels = resolveSelectedYearLevels(prev.year_level, levels);
        const isSameSelection =
          nextYearLevels.length === prev.year_level.length &&
          nextYearLevels.every((level, index) => level === prev.year_level[index]);
        if (isSameSelection) return prev;
        return { ...prev, year_level: nextYearLevels };
      });
    };

    if (embeddedLevels.length > 0) {
      applyLevels(embeddedLevels);
      return;
    }

    let cancelled = false;
    const fetchYearLevels = async () => {
      try {
        const params = new URLSearchParams({ subject: formData.subject, department: formData.department });
        const res = await apiFetch(`${API_URL}/subject-year-levels/?${params}`);
        const data = await res.json().catch(() => ({}));
        if (cancelled) return;
        applyLevels(normalizeYearLevels(data.year_levels));
      } catch {
        if (cancelled) return;
        applyLevels([]);
      }
    };

    void fetchYearLevels();
    return () => {
      cancelled = true;
    };
  }, [assignedSubjects, formData.department, formData.subject, isDean]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const token = localStorage.getItem("access_token");
    if (!token) {
      router.push("/login");
      return;
    }

    try {
      const scheduledDateTime = `${formData.scheduled_date}T${formData.scheduled_time}:00`;
      const endDateTime = `${formData.end_date}T${formData.end_time}:00`;

      const duration_minutes = Math.round((new Date(endDateTime).getTime() - new Date(scheduledDateTime).getTime()) / 60000);

      if (duration_minutes <= 0) {
        setError("End time must be after the start time.");
        setLoading(false);
        return;
      }

      const examData = {
        ...formData,
        scheduled_date: scheduledDateTime,
        expiration_time: endDateTime,
        year_level: formData.year_level.join(','),
        duration_minutes,
        total_points: parseInt(formData.total_points),
        passing_score: parseInt(formData.passing_score),
        max_attempts: parseInt(formData.max_attempts) || 1,
        retake_policy: formData.retake_policy,
        question_pool_size: parseInt(formData.question_pool_size) || 0,
        shuffle_options: formData.shuffle_options,
        is_approved: false,
        is_practice: formData.is_practice,
        exam_type: formData.is_practice ? 'practice' : formData.exam_type,
        preview_rules: null,
        sample_questions: null,
      };

      const targetUrl = editingExamId
        ? `${API_URL}/exams/${editingExamId}/update/`
        : `${API_URL}/exams/create/`;
      const res = await apiFetch(targetUrl, {
        method: editingExamId ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(examData),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(
          data?.error ||
          data?.detail ||
          data?.message ||
          `Failed to ${editingExamId ? "update" : "create"} exam (${res.status})`
        );
      }

      const data = await res.json();
      setExamId(editingExamId ?? data.exam_id);
      // Clear the form draft now that the exam was successfully created
      try { localStorage.removeItem(getDraftKey()); } catch {}

      // Block proceeding to questions if the scheduled time has already passed
      const now = new Date();
      const scheduledPassed = new Date(scheduledDateTime) <= now;
      const endPassed = new Date(endDateTime) <= now;
      if (scheduledPassed || endPassed) {
        setError(
          endPassed
            ? "The end time you set has already passed. Please choose a future end time."
            : "The start time you set has already passed. Please choose a future start time."
        );
        return;
      }

      setSuccess(true);
    } catch (err: unknown) {
      if (err instanceof TypeError) {
        setError("Failed to reach the server. Please check your connection and API configuration.");
      } else {
        setError(err instanceof Error ? err.message : `Failed to ${editingExamId ? "update" : "create"} exam`);
      }
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="min-h-screen bg-sky-100 bg-[radial-gradient(circle_at_20%_10%,rgba(14,165,233,0.18),transparent_55%),radial-gradient(circle_at_80%_0%,rgba(249,115,22,0.12),transparent_45%)] flex items-center justify-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white shadow-xl shadow-slate-200/70 border border-slate-200">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-slate-200 border-t-sky-500"></div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-sky-100 bg-[radial-gradient(circle_at_20%_10%,rgba(14,165,233,0.18),transparent_55%),radial-gradient(circle_at_80%_0%,rgba(249,115,22,0.12),transparent_45%)] flex items-center justify-center">
        <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-xl border border-slate-200 p-8 text-center max-w-md">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
            <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-semibold text-slate-900 mb-2">
            {editingExamId ? "Exam Updated Successfully" : "Exam Created Successfully"}
          </h2>
          <p className="text-slate-600 mb-6">
            {isDean ? "Your exam is already approved. Now add questions to publish it to students." : "Your exam is approved automatically. Now add questions to publish it to students."}
          </p>
          <Link href={`/exam/questions/${examId}`} className="inline-block bg-slate-900 text-white px-6 py-3 rounded-xl hover:bg-slate-800 transition-all font-semibold shadow-lg shadow-slate-900/20">
            Add Questions
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-sky-100">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_10%,rgba(14,165,233,0.18),transparent_55%),radial-gradient(circle_at_90%_0%,rgba(251,146,60,0.14),transparent_40%),radial-gradient(circle_at_50%_90%,rgba(16,185,129,0.12),transparent_45%)]" />
      
      <div className="relative">
        <Header />
        <RoleShell>

        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12" style={{ fontFamily: "'Space Grotesk', 'Manrope', sans-serif" }}>
          <div className="mb-6 rounded-2xl bg-white/90 backdrop-blur-xl border border-slate-200 shadow-xl shadow-slate-200/60 p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Link href={dashboardHref} className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 text-xs font-semibold tracking-[0.2em] uppercase">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-100">
                  <svg className="h-4 w-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </span>
                Back to Dashboard
              </Link>
              <span className="inline-flex items-center gap-2 rounded-full bg-sky-100 text-sky-700 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide">
                Create Exam
              </span>
            </div>
            <div className="mt-4">
              <h1 className="text-2xl sm:text-3xl font-semibold text-slate-900">
                {editingExamId ? "Update Exam Details" : "Create New Exam"}
              </h1>
              <div className="mt-2 h-1 w-12 rounded-full bg-gradient-to-r from-sky-500 to-blue-500" />
              <p className="mt-2 text-sm text-slate-600">
                {isDean ? "Fill in the exam details. Dean-created exams approve automatically and can be shown to students as soon as questions are added." : "Fill in the exam details. Instructor-created exams are approved automatically and can be shown to students as soon as questions are added."}
              </p>
              {!isDean && (
                <div className="mt-3 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-800">
                  You can only create exams for the active subjects assigned by your dean.
                </div>
              )}
              {!editingExamId && formData.title && (
                <div className="mt-3 flex items-center justify-between rounded-lg bg-amber-50 border border-amber-200 px-4 py-2">
                  <p className="text-xs text-amber-800 font-medium">📝 Draft restored — your previous progress was saved.</p>
                  <button
                    type="button"
                    onClick={() => { try { localStorage.removeItem(getDraftKey()); } catch {} setFormData({ title: "", subject: "", department: "", exam_type: "quiz", question_type: "multiple_choice", scheduled_date: "", scheduled_time: "", end_date: "", end_time: "", total_points: "", passing_score: "", instructions: "", year_level: [], is_practice: false, max_attempts: "1", retake_policy: "none", question_pool_size: "0", shuffle_options: true }); }}
                    className="text-xs font-semibold text-amber-700 hover:text-red-600 underline ml-4 shrink-0"
                  >
                    Clear Draft
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-xl border border-slate-200 p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl">
                  {error}
                </div>
              )}

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-900 border-b border-slate-200 pb-2">Exam Information</h3>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Exam Title *</label>
                  <input
                    name="title"
                    type="text"
                    value={formData.title}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-white text-slate-900 focus:ring-2 focus:ring-slate-200 transition-all"
                    placeholder="Midterm Exam - Data Structures"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Subject *</label>
                    {isDean ? (
                      <input
                        name="subject"
                        type="text"
                        value={formData.subject}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-white text-slate-900 focus:ring-2 focus:ring-slate-200 transition-all"
                        placeholder="Data Structures"
                      />
                    ) : (
                      <select
                        name="assigned_subject"
                        value={selectedAssignedSubject ? String(selectedAssignedSubject.id) : ""}
                        onChange={(e) => handleInstructorSubjectChange(e.target.value)}
                        required
                        className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-white text-slate-900 focus:ring-2 focus:ring-slate-200 transition-all"
                      >
                        <option value="">Select Assigned Subject</option>
                        {assignedSubjects.map((assignment) => (
                          <option
                            key={assignment.id}
                            value={assignment.id}
                            disabled={!assignment.is_active}
                          >
                            {assignment.subject_name} ({assignment.department}){assignment.is_active ? "" : " - inactive"}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Quarter Type *</label>
                    <select
                      name="exam_type"
                      value={formData.exam_type}
                      onChange={handleChange}
                      required
                      disabled={formData.is_practice}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-white text-slate-900 focus:ring-2 focus:ring-slate-200 transition-all disabled:opacity-50"
                    >
                      <option value="quiz">Quiz</option>
                      <option value="prelim">Prelim</option>
                      <option value="midterm">Midterm</option>
                      <option value="semifinal">Semi-Final</option>
                      <option value="final">Final</option>
                    </select>
                  </div>
                </div>

                <div className="bg-sky-50 border border-sky-200 rounded-xl p-4">
                  <label className="flex items-start cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.is_practice}
                      onChange={(e) => setFormData(prev => ({ ...prev, is_practice: e.target.checked }))}
                      className="mt-1 mr-3 h-5 w-5 text-sky-600 focus:ring-sky-500 border-gray-300 rounded"
                    />
                    <div>
                      <span className="text-sm font-semibold text-sky-900">Practice Mode</span>
                      <p className="text-xs text-sky-700 mt-1">Enable this to create a practice exam (no grading, unlimited retries for students).</p>
                    </div>
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Question Type *</label>
                  <select
                    name="question_type"
                    value={formData.question_type}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-white text-slate-900 focus:ring-2 focus:ring-slate-200 transition-all"
                  >
                    <option value="multiple_choice">Multiple Choice</option>
                    <option value="identification">Identification</option>
                    <option value="enumeration">Enumeration</option>
                    <option value="essay">Essay</option>
                    <option value="mixed">Mixed (Multiple Types)</option>
                  </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Department *</label>
                    {isDean ? (
                      <select
                        name="department"
                        value={formData.department}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-white text-slate-900 focus:ring-2 focus:ring-slate-200 transition-all"
                      >
                        <option value="">Select Department</option>
                        {departments.map(dept => (
                          <option key={dept.value} value={dept.value}>{dept.label}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        value={departments.find((dept) => dept.value === formData.department)?.label || formData.department || ""}
                        readOnly
                        className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-slate-50 text-slate-700"
                        placeholder={activeAssignedSubjects.length === 0 ? "No active assigned subjects" : "Department is set from the selected subject"}
                      />
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Year Level *</label>
                    {isDean ? (
                      <select
                        name="year_level"
                        value={formData.year_level[0] || ""}
                        onChange={(e) => setFormData(prev => ({ ...prev, year_level: [e.target.value] }))}
                        required
                        className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-white text-slate-900 focus:ring-2 focus:ring-slate-200 transition-all"
                      >
                        <option value="">Select Year Level</option>
                        {yearLevels.map(year => (
                          <option key={year.value} value={year.value}>{year.label}</option>
                        ))}
                      </select>
                    ) : availableYearLevels.length > 0 ? (
                      <select
                        name="year_level"
                        value={formData.year_level[0] || ""}
                        onChange={(e) => setFormData(prev => ({ ...prev, year_level: [e.target.value] }))}
                        required
                        className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-white text-slate-900 focus:ring-2 focus:ring-slate-200 transition-all"
                      >
                        <option value="">Select Year Level</option>
                        {availableYearLevels.map(v => (
                          <option key={v} value={v}>{yearLevels.find(y => y.value === v)?.label ?? v}</option>
                        ))}
                      </select>
                    ) : (
                      <div className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-slate-50 text-slate-500 text-sm">
                        {formData.subject ? 'No year levels found in masterlist for this subject' : 'Select a subject first'}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-900 border-b border-slate-200 pb-2">Schedule</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Start Date *</label>
                    <input
                      name="scheduled_date"
                      type="date"
                      value={formData.scheduled_date}
                      onChange={handleChange}
                      required
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-white text-slate-900 focus:ring-2 focus:ring-slate-200 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Start Time *</label>
                    <input
                      name="scheduled_time"
                      type="time"
                      value={formData.scheduled_time}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-white text-slate-900 focus:ring-2 focus:ring-slate-200 transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">End Date *</label>
                    <input
                      name="end_date"
                      type="date"
                      value={formData.end_date}
                      onChange={handleChange}
                      required
                      min={formData.scheduled_date || new Date().toISOString().split('T')[0]}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-white text-slate-900 focus:ring-2 focus:ring-slate-200 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">End Time *</label>
                    <input
                      name="end_time"
                      type="time"
                      value={formData.end_time}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-white text-slate-900 focus:ring-2 focus:ring-slate-200 transition-all"
                    />
                  </div>
                </div>

                {formData.scheduled_date && formData.scheduled_time && formData.end_date && formData.end_time && (() => {
                  const mins = Math.round((new Date(`${formData.end_date}T${formData.end_time}`).getTime() - new Date(`${formData.scheduled_date}T${formData.scheduled_time}`).getTime()) / 60000);
                  if (mins <= 0) return (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                      <p className="text-sm text-red-700">End time must be after start time.</p>
                    </div>
                  );
                  const h = Math.floor(mins / 60), m = mins % 60;
                  return (
                    <div className="bg-sky-50 border border-sky-200 rounded-xl p-3">
                      <p className="text-sm text-sky-800">Duration: <strong>{h > 0 ? `${h}h ` : ""}{m > 0 ? `${m}m` : ""}</strong> ({mins} minutes)</p>
                    </div>
                  );
                })()}
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-900 border-b border-slate-200 pb-2">Scoring</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Total Points *</label>
                    <input
                      name="total_points"
                      type="number"
                      value={formData.total_points}
                      onChange={handleChange}
                      required
                      min="1"
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-white text-slate-900 focus:ring-2 focus:ring-slate-200 transition-all"
                      placeholder="100"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Passing Score *</label>
                    <input
                      name="passing_score"
                      type="number"
                      value={formData.passing_score}
                      onChange={handleChange}
                      required
                      min="1"
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-white text-slate-900 focus:ring-2 focus:ring-slate-200 transition-all"
                      placeholder="60"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-900 border-b border-slate-200 pb-2">Shuffle</h3>
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

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Instructions and Rules</label>
                <textarea
                  name="instructions"
                  value={formData.instructions}
                  onChange={handleChange}
                  rows={6}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-white text-slate-900 focus:ring-2 focus:ring-slate-200 transition-all"
                  placeholder="Enter exam instructions, rules, and requirements for students."
                />
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <p className="text-sm text-amber-800">
                  {isDean ? "Because this is a dean account, this exam will approve automatically after creation." : "Because this is an instructor account, this exam will approve automatically after creation and publish once questions are added."}
                </p>
              </div>

              <div className="flex gap-4">
                <Link
                  href={dashboardHref}
                  className="flex-1 px-6 py-3 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 transition-all font-medium text-center"
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={loading || formData.year_level.length === 0 || !formData.end_date || !formData.end_time}
                  className="flex-1 bg-slate-900 text-white py-3 px-6 rounded-xl hover:bg-slate-800 transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-slate-900/20"
                >
                  {loading ? (editingExamId ? "Updating..." : "Creating...") : (editingExamId ? "Update Exam" : "Create Exam")}
                </button>
              </div>
            </form>
          </div>
        </main>

        </RoleShell>
        <Footer />
      </div>
    </div>
  );
}
