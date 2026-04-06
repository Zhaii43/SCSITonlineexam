"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import InstructorShell from "@/components/InstructorShell";
import { useToast } from "@/components/ToastProvider";

interface Announcement {
  id: number;
  title: string;
  message: string;
  target_audience: string;
  department: string | null;
  year_level: string | null;
  is_active: boolean;
  created_at: string;
}

const DEPARTMENTS = [
  { value: "", label: "All Departments" },
  { value: "BSHM", label: "BSHM - Hospitality Management" },
  { value: "BSIT", label: "BSIT - Information Technology" },
  { value: "BSEE", label: "BSEE - Electrical Engineering" },
  { value: "BSBA", label: "BSBA - Business Administration" },
  { value: "BSCRIM", label: "BSCRIM - Criminology" },
  { value: "BSED", label: "BSED - Education" },
  { value: "BSCE", label: "BSCE - Civil Engineering" },
  { value: "BSChE", label: "BSChE - Chemical Engineering" },
  { value: "BSME", label: "BSME - Mechanical Engineering" },
  { value: "GENERAL", label: "GENERAL - General Education" },
];

const AUDIENCE_LABELS: Record<string, string> = {
  all: "Everyone",
  student: "Students Only",
  instructor: "Instructors Only",
};

const AUDIENCE_COLORS: Record<string, string> = {
  all: "bg-purple-100 text-purple-700",
  student: "bg-sky-100 text-sky-700",
  instructor: "bg-green-100 text-green-700",
};

const YEAR_LEVELS = [
  { value: "", label: "All Year Levels" },
  { value: "1", label: "1st Year" },
  { value: "2", label: "2nd Year" },
  { value: "3", label: "3rd Year" },
  { value: "4", label: "4th Year" },
];

export default function InstructorAnnouncementsPage() {
  const router = useRouter();
  const toast = useToast();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deletingAll, setDeletingAll] = useState(false);
  const [form, setForm] = useState({ title: "", message: "", target_audience: "all", department: "", year_level: "" });
  const [formError, setFormError] = useState<string | null>(null);
  const [pageError, setPageError] = useState<string | null>(null);

  const titleRemaining = useMemo(() => 120 - form.title.length, [form.title.length]);
  const messageRemaining = useMemo(() => 500 - form.message.length, [form.message.length]);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      router.push("/login");
      return;
    }
    fetchAnnouncements(token);
  }, [router]);

  const fetchAnnouncements = async (token?: string) => {
    const currentToken = token || localStorage.getItem("access_token");
    if (!currentToken) return;

    try {
      setPageError(null);
      const res = await fetch(`/api/notifications/announcements/mine/`, {
        headers: { Authorization: `Bearer ${currentToken}` },
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(data?.error || "Failed to load announcements.");
      }
      setAnnouncements(Array.isArray(data?.announcements) ? data.announcements : []);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load announcements.";
      setPageError(message);
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    if (!form.title.trim()) return "Title is required.";
    if (!form.message.trim()) return "Message is required.";
    if (form.title.trim().length < 6) return "Title should be at least 6 characters.";
    if (form.message.trim().length < 12) return "Message should be at least 12 characters.";
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationError = validateForm();
    setFormError(validationError);
    if (validationError) return;

    setSubmitting(true);
    const token = localStorage.getItem("access_token");
    try {
      const res = await fetch(`/api/notifications/announcements/create/`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title.trim(),
          message: form.message.trim(),
          target_audience: form.target_audience,
          department: form.department || null,
          year_level: form.target_audience !== 'instructor' ? (form.year_level || null) : null,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(data?.error || "Failed to post announcement.");
      }
      setForm({ title: "", message: "", target_audience: "all", department: "", year_level: "" });
      setFormError(null);
      toast.success("Announcement posted successfully.");
      await fetchAnnouncements(token || undefined);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to post announcement.";
      setFormError(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this announcement?")) return;
    const token = localStorage.getItem("access_token");
    try {
      const res = await fetch(`/api/notifications/announcements/${id}/delete/`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to delete announcement.");
      setAnnouncements((prev) => prev.filter((announcement) => announcement.id !== id));
      toast.success("Announcement deleted.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete announcement.");
    }
  };

  const handleDeleteAll = async () => {
    if (announcements.length === 0) return;
    if (!confirm(`Delete all ${announcements.length} announcements?`)) return;

    const token = localStorage.getItem("access_token");
    if (!token) return;

    setDeletingAll(true);
    try {
      const results = await Promise.all(
        announcements.map((announcement) =>
          fetch(`/api/notifications/announcements/${announcement.id}/delete/`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` },
          })
        )
      );

      const failedCount = results.filter((res) => !res.ok).length;
      if (failedCount > 0) {
        throw new Error(`Deleted ${announcements.length - failedCount}, but ${failedCount} failed.`);
      }

      setAnnouncements([]);
      toast.success("All announcements deleted.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete all announcements.");
      await fetchAnnouncements(token);
    } finally {
      setDeletingAll(false);
    }
  };

  const getTimeAgo = (dateString: string) => {
    const seconds = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000);
    if (seconds < 60) return "Just now";
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="min-h-screen bg-sky-200">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_10%,rgba(14,165,233,0.18),transparent_55%),radial-gradient(circle_at_90%_0%,rgba(251,146,60,0.14),transparent_40%),radial-gradient(circle_at_50%_90%,rgba(16,185,129,0.12),transparent_45%)]" />
      <div className="relative">
        <Header />
        <InstructorShell>
          <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10" style={{ fontFamily: "'Space Grotesk', 'Manrope', sans-serif" }}>
            <div className="mb-6 rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-xl shadow-slate-200/60">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <button
                    type="button"
                    onClick={() => router.back()}
                    className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-600 hover:text-slate-900"
                  >
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-100">
                      <svg className="h-4 w-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </span>
                    Back
                  </button>
                  <h1 className="mt-4 text-2xl font-semibold text-slate-900 sm:text-3xl">Instructor Announcements</h1>
                  <p className="mt-2 text-sm text-slate-600">Broadcast updates to students and keep exam communication clear.</p>
                </div>
                <div className="rounded-2xl border border-sky-100 bg-sky-50 px-4 py-3 text-sm text-sky-900">
                  <p className="text-xs font-semibold uppercase tracking-wide text-sky-700">Published</p>
                  <p className="mt-1 text-2xl font-bold">{announcements.length}</p>
                </div>
              </div>
            </div>

            <div className="mb-8 rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-lg shadow-slate-200/60">
              <h2 className="text-lg font-semibold text-slate-900">Post New Announcement</h2>
              <p className="mt-1 text-sm text-slate-500">Use short titles and clear action-oriented messages so students can scan updates quickly.</p>

              <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
                {formError && (
                  <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
                    {formError}
                  </div>
                )}

                <div>
                  <div className="mb-1 flex items-center justify-between gap-3">
                    <label htmlFor="teacher-announcement-title" className="text-sm font-medium text-slate-700">Title *</label>
                    <span className={`text-xs ${titleRemaining < 15 ? "text-amber-600" : "text-slate-400"}`}>{titleRemaining} chars left</span>
                  </div>
                  <input
                    id="teacher-announcement-title"
                    type="text"
                    maxLength={120}
                    value={form.title}
                    onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                    placeholder="Reminder: Quiz Tomorrow"
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-200"
                    aria-invalid={!!formError && !form.title.trim()}
                  />
                </div>

                <div>
                  <div className="mb-1 flex items-center justify-between gap-3">
                    <label htmlFor="teacher-announcement-message" className="text-sm font-medium text-slate-700">Message *</label>
                    <span className={`text-xs ${messageRemaining < 30 ? "text-amber-600" : "text-slate-400"}`}>{messageRemaining} chars left</span>
                  </div>
                  <textarea
                    id="teacher-announcement-message"
                    maxLength={500}
                    value={form.message}
                    onChange={(e) => setForm((prev) => ({ ...prev, message: e.target.value }))}
                    placeholder="Write your announcement here..."
                    rows={5}
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-200 resize-none"
                    aria-invalid={!!formError && !form.message.trim()}
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label htmlFor="teacher-announcement-audience" className="mb-1 block text-sm font-medium text-slate-700">Target Audience</label>
                    <select
                      id="teacher-announcement-audience"
                      value={form.target_audience}
                      onChange={(e) => setForm((prev) => ({ ...prev, target_audience: e.target.value, year_level: "" }))}
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-200"
                    >
                      <option value="all">Everyone</option>
                      <option value="student">Students Only</option>
                      <option value="instructor">Instructors Only</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="teacher-announcement-department" className="mb-1 block text-sm font-medium text-slate-700">Department</label>
                    <select
                      id="teacher-announcement-department"
                      value={form.department}
                      onChange={(e) => setForm((prev) => ({ ...prev, department: e.target.value }))}
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-200"
                    >
                      {DEPARTMENTS.map((department) => (
                        <option key={department.value} value={department.value}>{department.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {form.target_audience !== "instructor" && (
                  <div>
                    <label htmlFor="teacher-announcement-year-level" className="mb-1 block text-sm font-medium text-slate-700">Year Level <span className="text-slate-400 font-normal">(students)</span></label>
                    <select
                      id="teacher-announcement-year-level"
                      value={form.year_level}
                      onChange={(e) => setForm((prev) => ({ ...prev, year_level: e.target.value }))}
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-200"
                    >
                      {YEAR_LEVELS.map((yl) => (
                        <option key={yl.value} value={yl.value}>{yl.label}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setForm({ title: "", message: "", target_audience: "all", department: "", year_level: "" });
                      setFormError(null);
                    }}
                    className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Clear Form
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-900/20 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {submitting ? "Posting Announcement..." : "Post Announcement"}
                  </button>
                </div>
              </form>
            </div>

            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Your Announcements</h2>
                <p className="text-sm text-slate-500">Recent posts stay here so you can quickly review or remove them.</p>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <button
                  type="button"
                  onClick={() => fetchAnnouncements()}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Refresh
                </button>
                <button
                  type="button"
                  onClick={handleDeleteAll}
                  disabled={deletingAll || announcements.length === 0}
                  className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {deletingAll ? "Deleting..." : "Delete All"}
                </button>
              </div>
            </div>

            {loading ? (
              <div className="rounded-3xl border border-slate-200 bg-white/90 p-10 text-center shadow-lg shadow-slate-200/60" aria-busy="true">
                <div className="mx-auto mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-sm">
                  <div className="h-7 w-7 animate-spin rounded-full border-2 border-slate-200 border-t-sky-500" />
                </div>
                <p className="text-sm text-slate-500">Loading your announcements...</p>
              </div>
            ) : pageError ? (
              <div className="rounded-3xl border border-red-200 bg-white/90 p-8 shadow-lg shadow-red-100/50">
                <h3 className="text-lg font-semibold text-slate-900">Could not load announcements</h3>
                <p className="mt-2 text-sm text-red-700" role="alert">{pageError}</p>
                <button
                  type="button"
                  onClick={() => {
                    setLoading(true);
                    fetchAnnouncements();
                  }}
                  className="mt-4 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
                >
                  Try Again
                </button>
              </div>
            ) : announcements.length === 0 ? (
              <div className="rounded-3xl border border-slate-200 bg-white/90 p-12 text-center shadow-lg shadow-slate-200/60">
                <div className="mx-auto mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
                  <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 100-4H5a2 2 0 000 4m14 0v6a2 2 0 01-2 2H7a2 2 0 01-2-2v-6m10 0V7a2 2 0 10-4 0v4" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-slate-900">No announcements published yet</h3>
                <p className="mt-2 text-sm text-slate-500">Your next class reminder or exam update will appear here after you post it.</p>
              </div>
            ) : (
              <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white/90 shadow-lg shadow-slate-200/60">
                <div className="max-h-[40rem] overflow-y-auto divide-y divide-slate-200">
                  {announcements.map((announcement) => (
                    <article key={announcement.id} className="p-4 sm:p-5">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0 flex-1">
                          <div className="mb-2 flex flex-wrap items-center gap-2">
                            <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${AUDIENCE_COLORS[announcement.target_audience]}`}>
                              {AUDIENCE_LABELS[announcement.target_audience]}
                            </span>
                            {announcement.department && (
                              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                                {announcement.department}
                              </span>
                            )}
                            {announcement.year_level && (
                              <span className="rounded-full bg-indigo-100 px-2.5 py-1 text-xs font-semibold text-indigo-700">
                                {YEAR_LEVELS.find((yl) => yl.value === announcement.year_level)?.label ?? `Year ${announcement.year_level}`}
                              </span>
                            )}
                            <span className="text-xs text-slate-400">{getTimeAgo(announcement.created_at)}</span>
                          </div>
                          <h3 className="text-base font-semibold text-slate-900">{announcement.title}</h3>
                          <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-slate-600">{announcement.message}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDelete(announcement.id)}
                          className="shrink-0 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-100"
                          aria-label={`Delete announcement titled ${announcement.title}`}
                        >
                          Delete
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            )}
          </main>
        </InstructorShell>
        <Footer />
      </div>
    </div>
  );
}
