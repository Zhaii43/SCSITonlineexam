"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { API_URL } from "@/lib/api";
export default function DashboardRedirect() {
  const router = useRouter();
  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      router.replace("/login");
      return;
    }

    fetch(`${API_URL}/profile/`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!data) { router.replace("/login"); return; }
        if (data.role === "student") router.replace("/dashboard/student");
        else if (data.role === "instructor") router.replace("/dashboard/teacher");
        else if (data.role === "dean") router.replace("/dashboard/dean");
        else router.replace("/login");
      })
      .catch(() => router.replace("/login"));
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-blue-50 to-cyan-50 flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-sky-600 mb-4"></div>
        <p className="text-slate-600">Redirecting to your dashboard...</p>
      </div>
    </div>
  );
}
