"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import DeanShell from "@/components/DeanShell";
import { API_URL, WS_URL } from "@/lib/api";

interface MasterlistRecord {
  id: number;
  school_id: string;
  first_name: string;
  last_name: string;
  department: string;
  year_level: string;
  course: string;
  enrolled_subjects: string[];
  email: string | null;
  contact_number: string | null;
  added_at: string;
}

interface StudentStatusRecord {
  school_id: string | null;
  is_transferee?: boolean;
  is_irregular?: boolean;
}

interface ImportErrorItem {
  row: number;
  error: string;
}

interface ImportResult {
  error?: string;
  success_count?: number;
  error_count?: number;
  errors?: ImportErrorItem[];
}

interface SyncResult {
  message: string;
  created_count: number;
  updated_count: number;
  unchanged_count: number;
}

type AddFormState = {
  school_id: string;
  first_name: string;
  last_name: string;
  year_level: string;
  course: string;
  subjects: string;
  email: string;
  contact_number: string;
};

type AddFormFieldKey = Exclude<keyof AddFormState, "year_level">;
type AddFormField = {
  label: string;
  key: AddFormFieldKey;
  placeholder: string;
};

const YEAR_LABELS: Record<string, string> = {
  "1": "1st Year",
  "2": "2nd Year",
  "3": "3rd Year",
  "4": "4th Year",
};

const DEFAULT_ADD_FORM: AddFormState = {
  school_id: "",
  first_name: "",
  last_name: "",
  year_level: "1",
  course: "",
  subjects: "",
  email: "",
  contact_number: "",
};

const ADD_FORM_FIELDS: AddFormField[] = [
  { label: "Student ID *", key: "school_id", placeholder: "e.g. 2024-001" },
  { label: "First Name *", key: "first_name", placeholder: "Juan" },
  { label: "Last Name *", key: "last_name", placeholder: "Dela Cruz" },
  { label: "Course *", key: "course", placeholder: "BSIT" },
  { label: "Subjects *", key: "subjects", placeholder: "Math 101|Programming 1|NSTP" },
  { label: "Email", key: "email", placeholder: "juan@example.com" },
  { label: "Contact Number", key: "contact_number", placeholder: "09123456789" },
];

const subjectPreview = (subjects: string[]) => {
  if (subjects.length === 0) return "No subjects";
  if (subjects.length <= 2) return subjects.join(", ");
  return `${subjects.slice(0, 2).join(", ")} +${subjects.length - 2} more`;
};

export default function MasterlistPage() {
  const router = useRouter();
  const recordsSocketRef = useRef<WebSocket | null>(null);
  const reconnectRef = useRef<number | null>(null);
  const searchRef = useRef("");
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState<MasterlistRecord[]>([]);
  const [statusMap, setStatusMap] = useState<Record<string, { is_transferee?: boolean; is_irregular?: boolean }>>({});
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm] = useState<AddFormState>(DEFAULT_ADD_FORM);
  const [addLoading, setAddLoading] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [importLoading, setImportLoading] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [syncLoading, setSyncLoading] = useState(false);
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null);

  const showToast = (type: "success" | "error", text: string) => {
    setToast({ type, text });
    window.setTimeout(() => setToast(null), 3500);
  };

  const fetchRecords = useCallback(async (token: string, q = "") => {
    const url = q
      ? `${API_URL}/enrolled-records/?search=${encodeURIComponent(q)}`
      : `${API_URL}/enrolled-records/`;
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) {
      setRecords(await res.json());
    }
  }, []);

  const fetchStudentStatuses = useCallback(async (token: string) => {
    const res = await fetch(`${API_URL}/department/users/`, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) return;
    const data = await res.json();
    const map: Record<string, { is_transferee?: boolean; is_irregular?: boolean }> = {};
    ((data.students as StudentStatusRecord[] | undefined) || []).forEach((student) => {
      if (student.school_id) {
        map[String(student.school_id)] = {
          is_transferee: !!student.is_transferee,
          is_irregular: !!student.is_irregular,
        };
      }
    });
    setStatusMap(map);
  }, []);

  const refreshMasterlistData = useCallback(
    async (token: string, q = searchRef.current) => {
      await Promise.all([fetchRecords(token, q), fetchStudentStatuses(token)]);
    },
    [fetchRecords, fetchStudentStatuses]
  );

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      router.push("/login");
      return;
    }

    fetch(`${API_URL}/profile/`, { headers: { Authorization: `Bearer ${token}` } })
      .then((response) => (response.ok ? response.json() : Promise.reject(new Error("auth"))))
      .then((profile) => {
        if (profile.role !== "dean") {
          router.push("/dashboard");
          return null;
        }
        return refreshMasterlistData(token, "");
      })
      .then(() => setLoading(false))
      .catch(() => {
        setError("Failed to load the masterlist.");
        setLoading(false);
      });
  }, [refreshMasterlistData, router]);

  useEffect(() => {
    searchRef.current = search;
    const token = localStorage.getItem("access_token");
    if (!token) return;
    const timer = window.setTimeout(() => {
      fetchRecords(token, search);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [fetchRecords, search]);

  useEffect(() => {
    let active = true;

    const connectSocket = () => {
      const token = localStorage.getItem("access_token");
      if (!token) return;

      const ws = new WebSocket(`${WS_URL}/ws/exams/?token=${token}`);
      recordsSocketRef.current = ws;

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data?.type === "enrollment_records_update") {
            refreshMasterlistData(token);
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

    const interval = window.setInterval(() => {
      const token = localStorage.getItem("access_token");
      if (token) refreshMasterlistData(token);
    }, 15000);

    const handleFocus = () => {
      const token = localStorage.getItem("access_token");
      if (token) refreshMasterlistData(token);
    };

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        handleFocus();
      }
    };

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      active = false;
      window.clearInterval(interval);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibility);
      if (reconnectRef.current) window.clearTimeout(reconnectRef.current);
      if (recordsSocketRef.current) recordsSocketRef.current.close();
    };
  }, [refreshMasterlistData]);

  const handleAdd = async (event: React.FormEvent) => {
    event.preventDefault();
    const token = localStorage.getItem("access_token");
    if (!token) return;

    setAddLoading(true);
    try {
      const res = await fetch(`${API_URL}/enrolled-records/add/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(addForm),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast("error", data.error || "Failed to add masterlist record");
        return;
      }

      showToast("success", "Masterlist record added");
      setAddForm(DEFAULT_ADD_FORM);
      setShowAddForm(false);
      await refreshMasterlistData(token, search);
    } finally {
      setAddLoading(false);
    }
  };

  const handleDelete = async (recordId: number) => {
    if (!window.confirm("Delete this masterlist record? This cannot be undone.")) return;
    const token = localStorage.getItem("access_token");
    if (!token) return;

    const res = await fetch(`${API_URL}/enrolled-records/${recordId}/delete/`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });

    if (res.ok) {
      setRecords((previous) => previous.filter((record) => record.id !== recordId));
      showToast("success", "Masterlist record deleted");
      return;
    }

    showToast("error", "Failed to delete masterlist record");
  };

  const handleDownloadTemplate = async () => {
    const token = localStorage.getItem("access_token");
    if (!token) return;

    const res = await fetch(`${API_URL}/enrolled-records/template/`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      showToast("error", "Failed to download template");
      return;
    }

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "masterlist_template.csv";
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = async () => {
    if (!csvFile) return;
    const token = localStorage.getItem("access_token");
    if (!token) return;

    setImportLoading(true);
    setImportResult(null);
    const formData = new FormData();
    formData.append("file", csvFile);

    try {
      const res = await fetch(`${API_URL}/enrolled-records/import/`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      setImportResult(data);
      if (res.ok && (data.success_count ?? 0) > 0) {
        await refreshMasterlistData(token, search);
        showToast("success", `${data.success_count} masterlist records imported`);
      }
    } finally {
      setImportLoading(false);
    }
  };

  const handleSyncAccounts = async () => {
    const token = localStorage.getItem("access_token");
    if (!token) return;

    setSyncLoading(true);
    setSyncResult(null);
    try {
      const res = await fetch(`${API_URL}/enrolled-records/sync-accounts/`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) {
        showToast("error", data.error || "Failed to sync student accounts");
        return;
      }

      setSyncResult(data);
      showToast("success", "Student accounts synced from the masterlist");
    } finally {
      setSyncLoading(false);
    }
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

  if (error) {
    return (
      <div className="min-h-screen bg-sky-200">
        <Header />
        <div className="flex items-center justify-center py-20 px-4">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <Link
              href="/dashboard/dean"
              className="bg-slate-900 text-white px-6 py-3 rounded-xl font-semibold"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-sky-200">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_10%,rgba(14,165,233,0.18),transparent_55%),radial-gradient(circle_at_90%_0%,rgba(251,146,60,0.14),transparent_40%)]" />

      {toast && (
        <div
          className={`fixed top-5 right-5 z-50 px-5 py-3 rounded-xl shadow-xl text-sm font-semibold text-white ${
            toast.type === "success" ? "bg-emerald-600" : "bg-red-600"
          }`}
        >
          {toast.text}
        </div>
      )}

      <div className="relative">
        <Header />
        <main className="w-full py-4" style={{ fontFamily: "'Space Grotesk','Manrope',sans-serif" }}>
          <DeanShell>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
              <div className="mb-8 rounded-3xl bg-white/90 backdrop-blur-xl border border-slate-200 shadow-xl p-6 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Dean Dashboard</p>
                  <h1 className="mt-1 text-2xl font-semibold text-slate-900">Masterlist</h1>
                  <p className="mt-1 text-sm text-slate-500">
                    {records.length} official record{records.length !== 1 ? "s" : ""} used as the source of truth for student accounts and subject eligibility.
                  </p>
                </div>
                <Link
                  href="/dashboard/dean"
                  className="px-5 py-3 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-all font-semibold shadow-lg shadow-slate-900/20 text-sm"
                >
                  Back to Dashboard
                </Link>
              </div>

              <div className="mb-6 grid gap-4 xl:grid-cols-[1.6fr_1fr]">
                <div className="rounded-3xl border border-slate-200 bg-white/90 p-5 shadow-lg shadow-slate-200/60">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.28em] text-slate-500">Flow</p>
                      <h2 className="mt-1 text-lg font-bold text-slate-900">Masterlist to Student Access</h2>
                      <p className="mt-2 text-sm text-slate-600">
                        Add or import the official masterlist first, then sync student accounts for dean approval and login activation.
                      </p>
                    </div>
                    <button
                      onClick={handleSyncAccounts}
                      disabled={syncLoading || records.length === 0}
                      className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-all font-semibold text-sm shadow-lg shadow-emerald-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {syncLoading ? "Syncing..." : "Sync Student Accounts"}
                    </button>
                  </div>
                  {syncResult && (
                    <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                      <p className="font-semibold">{syncResult.message}</p>
                      <p className="mt-1">
                        Created: {syncResult.created_count} | Updated: {syncResult.updated_count} | Unchanged: {syncResult.unchanged_count}
                      </p>
                    </div>
                  )}
                </div>

                <div className="rounded-3xl border border-sky-200 bg-sky-50/90 p-5 shadow-lg shadow-sky-200/50">
                  <p className="text-xs uppercase tracking-[0.28em] text-sky-700">Template</p>
                  <h2 className="mt-1 text-lg font-bold text-slate-900">Expected CSV Columns</h2>
                  <p className="mt-2 text-sm text-slate-600">
                    `school_id`, `first_name`, `last_name`, `year_level`, `course`, `subjects`, `email`, `contact_number`
                  </p>
                  <p className="mt-2 text-xs text-slate-500">
                    Use `|` between subjects, for example: `Math 101|Programming 1|NSTP`
                  </p>
                </div>
              </div>

              <div className="mb-6 flex flex-wrap gap-3">
                <button
                  onClick={() => setShowAddForm((value) => !value)}
                  className="px-5 py-2.5 bg-sky-600 text-white rounded-xl hover:bg-sky-700 transition-all font-semibold text-sm shadow-lg shadow-sky-600/20"
                >
                  {showAddForm ? "Hide Form" : "+ Add Masterlist Record"}
                </button>
                <button
                  onClick={() => setShowImportModal(true)}
                  className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all font-semibold text-sm shadow-lg shadow-indigo-600/20"
                >
                  Import Masterlist CSV
                </button>
                <button
                  onClick={handleDownloadTemplate}
                  className="px-5 py-2.5 bg-white border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 transition-all font-semibold text-sm"
                >
                  Download Masterlist Template
                </button>
              </div>

              {showAddForm && (
                <div className="mb-6 bg-white/90 rounded-2xl border border-sky-200 shadow-lg p-6">
                  <h3 className="font-bold text-slate-900 mb-4">Add Masterlist Record</h3>
                  <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {ADD_FORM_FIELDS.map((field) => (
                      <div key={field.key}>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">{field.label}</label>
                        <input
                          type="text"
                          value={addForm[field.key]}
                          onChange={(event) =>
                            setAddForm((previous) => ({ ...previous, [field.key]: event.target.value }))
                          }
                          placeholder={field.placeholder}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-400"
                        />
                      </div>
                    ))}
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Year Level *</label>
                      <select
                        value={addForm.year_level}
                        onChange={(event) =>
                          setAddForm((previous) => ({ ...previous, year_level: event.target.value }))
                        }
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-400"
                      >
                        <option value="1">1st Year</option>
                        <option value="2">2nd Year</option>
                        <option value="3">3rd Year</option>
                        <option value="4">4th Year</option>
                      </select>
                    </div>
                    <div className="md:col-span-3 flex gap-3">
                      <button
                        type="submit"
                        disabled={addLoading}
                        className="px-6 py-2.5 bg-slate-900 text-white rounded-xl font-semibold text-sm hover:bg-slate-800 disabled:opacity-50"
                      >
                        {addLoading ? "Saving..." : "Save Record"}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowAddForm(false);
                          setAddForm(DEFAULT_ADD_FORM);
                        }}
                        className="px-6 py-2.5 bg-white border border-slate-300 text-slate-700 rounded-xl font-semibold text-sm hover:bg-slate-50"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              )}

              <div className="mb-4">
                <input
                  type="text"
                  placeholder="Search by name, course, subject, or student ID..."
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  className="w-full px-5 py-3 rounded-2xl border border-slate-200 bg-white/90 shadow-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-400"
                />
              </div>

              {records.length === 0 ? (
                <div className="bg-white/90 rounded-3xl p-12 border border-slate-200 shadow-lg text-center">
                  <p className="text-4xl mb-3">M</p>
                  <h3 className="text-lg font-bold text-slate-900 mb-1">
                    {search ? "No masterlist matches found" : "No masterlist records yet"}
                  </h3>
                  <p className="text-slate-500 text-sm">
                    {search ? "Try a different search term." : "Import the official CSV or add the first record manually."}
                  </p>
                </div>
              ) : (
                <div className="rounded-2xl border border-slate-200 bg-white/90 shadow-xl overflow-hidden">
                  <div className="hidden lg:grid grid-cols-[1fr_1.4fr_0.8fr_0.8fr_1.4fr_1.1fr_0.9fr_72px] gap-3 px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-slate-500 bg-slate-50 border-b border-slate-200">
                    <span>Student ID</span>
                    <span>Student</span>
                    <span>Year</span>
                    <span>Course</span>
                    <span>Subjects</span>
                    <span>Status</span>
                    <span>Contact</span>
                    <span className="text-right">Action</span>
                  </div>
                  <div className="divide-y divide-slate-100">
                    {records.map((record) => {
                      const status = statusMap[String(record.school_id)];
                      return (
                        <div
                          key={record.id}
                          className="grid grid-cols-1 lg:grid-cols-[1fr_1.4fr_0.8fr_0.8fr_1.4fr_1.1fr_0.9fr_72px] gap-3 px-5 py-4 items-start hover:bg-slate-50 transition-colors"
                        >
                          <div>
                            <p className="text-sm font-semibold text-slate-900 font-mono">{record.school_id}</p>
                            <p className="text-xs text-slate-400 mt-1">{record.department}</p>
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-slate-900">
                              {record.first_name} {record.last_name}
                            </p>
                            <p className="text-xs text-slate-500 mt-1">{record.email || "No email"}</p>
                          </div>
                          <div>
                            <span className="inline-flex w-fit px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-purple-100 text-purple-700">
                              {YEAR_LABELS[record.year_level] || record.year_level}
                            </span>
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-slate-800">{record.course || "-"}</p>
                          </div>
                          <div>
                            <p className="text-sm text-slate-700">{subjectPreview(record.enrolled_subjects || [])}</p>
                            <p className="text-xs text-slate-400 mt-1">
                              {(record.enrolled_subjects || []).length} subject
                              {(record.enrolled_subjects || []).length !== 1 ? "s" : ""}
                            </p>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {status?.is_transferee && (
                              <span className="inline-flex w-fit px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-sky-100 text-sky-700">
                                Transferee
                              </span>
                            )}
                            {status?.is_irregular && (
                              <span className="inline-flex w-fit px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-700">
                                Irregular
                              </span>
                            )}
                            {!status?.is_transferee && !status?.is_irregular && (
                              <span className="text-xs text-slate-400">Regular</span>
                            )}
                          </div>
                          <div>
                            <p className="text-xs text-slate-500">{record.contact_number || "-"}</p>
                          </div>
                          <div className="flex justify-end">
                            <button
                              onClick={() => handleDelete(record.id)}
                              className="h-8 w-8 inline-flex items-center justify-center rounded-lg bg-white border border-red-200 text-red-500 hover:bg-red-50 transition-all"
                              title="Delete record"
                            >
                              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                />
                              </svg>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </DeanShell>
        </main>

        {showImportModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200">
              <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center">
                <h2 className="text-lg font-bold text-slate-900">Import Masterlist CSV</h2>
                <button
                  onClick={() => {
                    setShowImportModal(false);
                    setCsvFile(null);
                    setImportResult(null);
                  }}
                  className="text-slate-400 hover:text-slate-600 text-2xl leading-none"
                >
                  x
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div className="bg-slate-50 rounded-xl p-4 text-sm text-slate-600 space-y-1">
                  <p className="font-semibold text-slate-800">Required CSV columns:</p>
                  <p className="font-mono text-xs">
                    school_id, first_name, last_name, year_level, course, subjects
                  </p>
                  <p className="font-semibold text-slate-800 mt-2">Optional columns:</p>
                  <p className="font-mono text-xs">email, contact_number</p>
                  <p className="text-xs text-slate-500 mt-1">
                    year_level accepts: 1st, 2nd, 3rd, 4th (or 1, 2, 3, 4)
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Select CSV File</label>
                  <input
                    type="file"
                    accept=".csv"
                    onChange={(event) => {
                      setCsvFile(event.target.files?.[0] || null);
                      setImportResult(null);
                    }}
                    className="block w-full text-sm text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200"
                  />
                  {csvFile && <p className="text-xs text-slate-500 mt-1">Selected: {csvFile.name}</p>}
                </div>
                <button
                  onClick={handleImport}
                  disabled={!csvFile || importLoading}
                  className="w-full py-3 bg-slate-900 text-white rounded-xl font-semibold hover:bg-slate-800 disabled:opacity-50 transition-all"
                >
                  {importLoading ? "Importing..." : "Import Records"}
                </button>
                {importResult && (
                  <div
                    className={`rounded-xl p-4 text-sm ${
                      importResult.error
                        ? "bg-red-50 border border-red-200 text-red-700"
                        : "bg-emerald-50 border border-emerald-200 text-emerald-800"
                    }`}
                  >
                    {importResult.error ? (
                      <p>{importResult.error}</p>
                    ) : (
                      <>
                        <p className="font-semibold">
                          {importResult.success_count} records imported, {importResult.error_count} errors
                        </p>
                        {(importResult.errors ?? []).length > 0 && (
                          <div className="mt-2 max-h-40 overflow-y-auto space-y-1">
                            {(importResult.errors ?? []).map((item, index) => (
                              <p key={index} className="text-xs text-red-600">
                                Row {item.row}: {item.error}
                              </p>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <Footer />
      </div>
    </div>
  );
}
