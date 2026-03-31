"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

import { API_URL } from "@/lib/api";
import { useToast } from "@/components/ToastProvider";

interface RejectedProfile {
  role: string;
  is_approved: boolean;
  is_rejected: boolean;
  rejection_reason?: string | null;
  first_name?: string;
  last_name?: string;
  school_id?: string;
  year_level?: string;
  contact_number?: string;
  id_photo?: string | null;
  study_load?: string | null;
}

const YEAR_LEVELS = [
  { value: "1", label: "1st Year" },
  { value: "2", label: "2nd Year" },
  { value: "3", label: "3rd Year" },
  { value: "4", label: "4th Year" },
];

export default function RejectedPage() {
  const router = useRouter();
  const toast = useToast();
  const [profile, setProfile] = useState<RejectedProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [idPhoto, setIdPhoto] = useState<File | null>(null);
  const [studyLoad, setStudyLoad] = useState<File | null>(null);

  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    school_id: "",
    year_level: "",
    contact_number: "",
  });

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) { router.push("/login"); return; }

    fetch(`${API_URL}/profile/`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(data => {
        if (data.role !== "student") { router.push("/dashboard"); return; }
        if (data.is_approved) { router.push("/dashboard/student"); return; }
        if (!data.is_rejected) { router.push("/profile/settings"); return; }
        setProfile(data);
        setForm({
          first_name: data.first_name || "",
          last_name: data.last_name || "",
          school_id: data.school_id || "",
          year_level: data.year_level || "",
          contact_number: data.contact_number || "",
        });
        setLoading(false);
      })
      .catch(() => { router.push("/login"); });
  }, [router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>, field: "id_photo" | "study_load") => {
    const file = event.target.files?.[0] ?? null;
    if (field === "id_photo") {
      setIdPhoto(file);
      return;
    }
    setStudyLoad(file);
  };

  const getErrorMessage = (value: unknown, fallback: string) => {
    if (value instanceof Error && value.message) return value.message;
    return fallback;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const token = localStorage.getItem("access_token");
    try {
      if (idPhoto || studyLoad) {
        const uploadFormData = new FormData();
        if (idPhoto) uploadFormData.append("id_photo", idPhoto);
        if (studyLoad) uploadFormData.append("study_load", studyLoad);

        const uploadRes = await fetch(`${API_URL}/profile/upload-documents/`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: uploadFormData,
        });
        const uploadData = await uploadRes.json();
        if (!uploadRes.ok) {
          throw new Error(uploadData.error || "Failed to upload documents. Please try again.");
        }
      }

      const res = await fetch(`${API_URL}/students/resubmit/`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) {
        setIdPhoto(null);
        setStudyLoad(null);
        setSubmitted(true);
      } else {
        setError(data.error || "Failed to resubmit. Please try again.");
      }
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Network error. Please try again."));
    } finally {
      setSubmitting(false);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-sky-200 flex items-center justify-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white shadow-xl border border-slate-200">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-slate-200 border-t-sky-500" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-sky-200">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_10%,rgba(14,165,233,0.18),transparent_55%),radial-gradient(circle_at_90%_0%,rgba(251,146,60,0.14),transparent_40%)]" />
      <div className="relative">
        <Header />
        <main className="max-w-2xl mx-auto px-4 py-12" style={{ fontFamily: "'Space Grotesk', 'Manrope', sans-serif" }}>

          {submitted ? (
            <div className="bg-white/90 backdrop-blur-xl rounded-3xl border border-emerald-200 shadow-xl shadow-emerald-200/40 p-10 text-center">
              <div className="mx-auto mb-5 w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center">
                <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-2xl font-semibold text-slate-900 mb-2">Resubmitted Successfully</h2>
              <p className="text-slate-600 mb-8">Your updated registration has been sent to your dean for review. You will be notified once it is approved.</p>
              <button
                onClick={handleLogout}
                className="px-6 py-3 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-all font-semibold shadow-lg shadow-slate-900/20"
              >
                Back to Login
              </button>
            </div>
          ) : (
            <>
              {/* Rejection notice */}
              <div className="bg-white/90 backdrop-blur-xl rounded-3xl border border-red-200 shadow-xl shadow-red-200/30 p-8 mb-6">
                <div className="flex items-start gap-4">
                  <div className="shrink-0 w-12 h-12 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-center">
                    <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-slate-900 mb-1">Registration Rejected</h2>
                    <p className="text-sm text-slate-600 mb-3">Your registration was reviewed and rejected by your dean for the following reason:</p>
                    <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-800 font-medium">
                      &ldquo;{profile?.rejection_reason}&rdquo;
                    </div>
                  </div>
                </div>
              </div>

              {/* Edit & resubmit form */}
              <div className="bg-white/90 backdrop-blur-xl rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/40 p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-2 h-7 rounded-full bg-sky-500" />
                  <h3 className="text-lg font-semibold text-slate-900">Update Your Information</h3>
                </div>
                <p className="text-sm text-slate-600 mb-6">Correct the details below and resubmit. Your dean will be notified to review your updated registration.</p>

                {error && (
                  <div className="mb-5 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 font-medium">
                    {error}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">First Name</label>
                      <input
                        name="first_name"
                        value={form.first_name}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-sky-400"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">Last Name</label>
                      <input
                        name="last_name"
                        value={form.last_name}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-sky-400"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">School ID</label>
                    <input
                      name="school_id"
                      value={form.school_id}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-sky-400"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">Year Level</label>
                      <select
                        name="year_level"
                        value={form.year_level}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-sky-400"
                      >
                        <option value="">Select year level</option>
                        {YEAR_LEVELS.map(y => (
                          <option key={y.value} value={y.value}>{y.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">Contact Number</label>
                      <input
                        name="contact_number"
                        value={form.contact_number}
                        onChange={handleChange}
                        className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-sky-400"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div>
                          <label htmlFor="id_photo" className="block text-sm font-semibold text-slate-800">ID Photo</label>
                          <p className="text-xs text-slate-500 mt-1">Upload a clear ID photo so your dean can verify your identity.</p>
                        </div>
                        {profile?.id_photo && !idPhoto ? (
                          <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 border border-emerald-200">
                            Current file saved
                          </span>
                        ) : null}
                      </div>
                      <input
                        id="id_photo"
                        type="file"
                        accept="image/*"
                        onChange={(event) => handleFileChange(event, "id_photo")}
                        className="block w-full text-sm text-slate-700 file:mr-3 file:rounded-xl file:border-0 file:bg-sky-100 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-sky-700 hover:file:bg-sky-200"
                      />
                      <p className="mt-2 text-xs text-slate-500">
                        {idPhoto ? `Selected: ${idPhoto.name}` : "JPG or PNG works best."}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div>
                          <label htmlFor="study_load" className="block text-sm font-semibold text-slate-800">Study Load</label>
                          <p className="text-xs text-slate-500 mt-1">Attach your latest study load so your registration details can be reviewed again.</p>
                        </div>
                        {profile?.study_load && !studyLoad ? (
                          <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 border border-emerald-200">
                            Current file saved
                          </span>
                        ) : null}
                      </div>
                      <input
                        id="study_load"
                        type="file"
                        accept=".pdf,image/*"
                        onChange={(event) => handleFileChange(event, "study_load")}
                        className="block w-full text-sm text-slate-700 file:mr-3 file:rounded-xl file:border-0 file:bg-sky-100 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-sky-700 hover:file:bg-sky-200"
                      />
                      <p className="mt-2 text-xs text-slate-500">
                        {studyLoad ? `Selected: ${studyLoad.name}` : "PDF, JPG, or PNG is supported."}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="flex-1 px-4 py-3 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 transition-all font-semibold text-sm"
                    >
                      Logout
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="flex-1 px-4 py-3 bg-sky-600 text-white rounded-xl hover:bg-sky-700 transition-all font-semibold text-sm shadow-lg shadow-sky-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {submitting ? "Submitting…" : "Resubmit Registration"}
                    </button>
                  </div>
                </form>
              </div>
            </>
          )}
        </main>
        <Footer />
      </div>
    </div>
  );
}

