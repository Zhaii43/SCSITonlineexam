"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Download, Filter, Trash2 } from "lucide-react";
import Header from "@/components/Header";

import { API_URL } from "@/lib/api";
interface AuditLog {
  id: number;
  user: string;
  action: string;
  description: string;
  ip_address: string;
  timestamp: string;
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [userRole, setUserRole] = useState("");
  const [selected, setSelected] = useState<number[]>([]);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchLogs();
  }, []);

  useEffect(() => {
    const role = localStorage.getItem("user_role");
    if (role) setUserRole(role);
  }, []);

  const fetchLogs = async () => {
    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch(`${API_URL}/audit/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setLogs(data.logs || []);
    } catch (error) {
      console.error("Error fetching logs:", error);
    } finally {
      setLoading(false);
    }
  };

  const exportLogs = async () => {
    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch(`${API_URL}/audit/export/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "audit_logs.csv";
      a.click();
    } catch (error) {
      console.error("Error exporting logs:", error);
    }
  };

  const token = () => localStorage.getItem("access_token");

  const deleteOne = async (id: number) => {
    if (!confirm("Delete this log entry?")) return;
    await fetch(`${API_URL}/audit/${id}/delete/`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token()}` },
    });
    setLogs((prev) => prev.filter((l) => l.id !== id));
    setSelected((prev) => prev.filter((s) => s !== id));
  };

  const bulkDelete = async (ids?: number[]) => {
    const label = ids ? `Delete ${ids.length} selected log(s)?` : "Delete ALL audit logs in your department?";
    if (!confirm(label)) return;
    setDeleting(true);
    await fetch(`${API_URL}/audit/bulk-delete/`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token()}`, "Content-Type": "application/json" },
      body: JSON.stringify(ids ? { ids } : {}),
    });
    if (ids) {
      setLogs((prev) => prev.filter((l) => !ids.includes(l.id)));
      setSelected([]);
    } else {
      setLogs([]);
      setSelected([]);
    }
    setDeleting(false);
  };

  const toggleSelect = (id: number) =>
    setSelected((prev) => prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]);

  const toggleAll = () =>
    setSelected(selected.length === filteredLogs.length ? [] : filteredLogs.map((l) => l.id));

  const filteredLogs = filter === "all" ? logs : logs.filter(log => log.action === filter);
  const backHref =
    userRole === "student"
      ? "/dashboard/student"
      : userRole === "instructor"
        ? "/dashboard/teacher"
        : userRole === "dean"
          ? "/dashboard/dean"
          : "/dashboard";

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-blue-50 to-indigo-50">
      <Header />
      <div className="max-w-7xl mx-auto p-8">
        <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
          <div className="flex items-center gap-3">
            <Link
              href={backHref}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </Link>
            <h1 className="text-3xl font-bold text-slate-900">Audit Logs</h1>
          </div>
          <div className="flex items-center gap-2">
            {selected.length > 0 && (
              <button
                onClick={() => bulkDelete(selected)}
                disabled={deleting}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                <Trash2 size={16} />
                Delete Selected ({selected.length})
              </button>
            )}
            {userRole === "dean" && (
              <button
                onClick={() => bulkDelete()}
                disabled={deleting}
                className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 border border-red-300 rounded-lg hover:bg-red-200 disabled:opacity-50"
              >
                <Trash2 size={16} />
                Delete All
              </button>
            )}
            <button
              onClick={exportLogs}
              className="flex items-center gap-2 px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700"
            >
              <Download size={20} />
              Export CSV
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center gap-4">
            <Filter size={20} className="text-slate-600" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-4 py-2 border border-slate-300 rounded-lg text-black"
            >
              <option value="all">All Actions</option>
              <option value="login">Login</option>
              <option value="exam_created">Exam Created</option>
              <option value="exam_approved">Exam Approved</option>
              <option value="exam_taken">Exam Taken</option>
              <option value="exam_submitted">Exam Submitted</option>
              <option value="student_approved">Student Approved</option>
            </select>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-slate-600">Loading...</div>
          ) : filteredLogs.length === 0 ? (
            <div className="p-8 text-center text-slate-600">No audit logs found</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3">
                      <input type="checkbox" checked={selected.length === filteredLogs.length && filteredLogs.length > 0} onChange={toggleAll} />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase">User</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase">Action</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase">Description</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase">IP Address</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase">Timestamp</th>
                    <th className="px-6 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredLogs.map((log) => (
                    <tr key={log.id} className={`hover:bg-slate-50 ${selected.includes(log.id) ? "bg-red-50" : ""}`}>
                      <td className="px-4 py-4">
                        <input type="checkbox" checked={selected.includes(log.id)} onChange={() => toggleSelect(log.id)} />
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-900">{log.user}</td>
                      <td className="px-6 py-4 text-sm">
                        <span className="px-2 py-1 bg-sky-100 text-sky-700 rounded-full text-xs">
                          {log.action}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">{log.description}</td>
                      <td className="px-6 py-4 text-sm text-slate-600">{log.ip_address || "N/A"}</td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td className="px-4 py-4">
                        <button onClick={() => deleteOne(log.id)} className="text-red-500 hover:text-red-700" title="Delete">
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
