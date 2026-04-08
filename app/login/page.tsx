"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";

import { API_URL } from "@/lib/api";
import { useToast } from "@/components/ToastProvider";
export default function Login() {
  const toast = useToast();
  const [formData, setFormData] = useState({ username: "", password: "" });
  const [error, setError] = useState<{ message: string; code: string | null } | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  useEffect(() => {
    const savedUsername = localStorage.getItem("saved_username");
    if (savedUsername) {
      setFormData(prev => ({ ...prev, username: savedUsername }));
      setRememberMe(true);
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/login/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok) {
        setError({ message: data.error || "Login failed. Please try again.", code: data.code || null });
        return;
      }
      await finishLogin(data.access, data.refresh);
    } catch (err) {
      setError({
        message: err instanceof Error ? err.message : "Login failed. Please check your credentials.",
        code: null,
      });
    } finally {
      setLoading(false);
    }
  };

  const finishLogin = async (access: string, refresh: string) => {
    localStorage.setItem("access_token", access);
    localStorage.setItem("refresh_token", refresh);
    if (rememberMe) {
      localStorage.setItem("saved_username", formData.username);
    } else {
      localStorage.removeItem("saved_username");
    }
    const profileRes = await fetch(`${API_URL}/profile/`, {
      headers: { Authorization: `Bearer ${access}` },
    });
    if (profileRes.ok) {
      const profileData = await profileRes.json();
      localStorage.setItem("user_role", profileData.role);
      localStorage.setItem("user_name", profileData.first_name || profileData.username);
      localStorage.setItem("user_id", String(profileData.id));
      setSuccess(true);
      toast.success("Login successful. Redirecting...");
      setTimeout(() => {
        if (profileData.role === "student") window.location.href = "/dashboard/student";
        else if (profileData.role === "instructor") window.location.href = "/dashboard/teacher";
        else if (profileData.role === "dean") window.location.href = "/dashboard/dean";
        else window.location.href = "/dashboard";
      }, 1500);
    } else {
      setSuccess(true);
      toast.success("Login successful. Redirecting...");
      setTimeout(() => { window.location.href = "/dashboard"; }, 1500);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-200 via-blue-200 to-cyan-200">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(56,189,248,0.15),transparent_50%)]" />

      <div className="relative flex flex-col min-h-screen">

        <main className="flex flex-1 items-center justify-center px-4 sm:px-6 py-6 sm:py-8">
          <div className="w-full max-w-5xl grid lg:grid-cols-2 rounded-3xl overflow-hidden shadow-2xl shadow-sky-200/60 border border-sky-200/50">

            {/* Left branding panel */}
            <div className="flex flex-col justify-between bg-gradient-to-br from-sky-400 via-sky-500 to-blue-600 p-8 sm:p-10 relative overflow-hidden">
              <div className="absolute -top-16 -right-16 w-64 h-64 bg-white/10 rounded-full" />
              <div className="absolute bottom-10 -left-10 w-48 h-48 bg-white/10 rounded-full" />

              <div className="relative">
                <div className="flex items-center gap-3 mb-8">
                  <div className="relative h-10 w-10 rounded-xl bg-white/10 p-1 shadow-sm">
                    <Image
                      src="/logo.png"
                      alt="SCSIT Logo"
                      fill
                      className="object-contain [filter:drop-shadow(1px_0_0_#fff)_drop-shadow(-1px_0_0_#fff)_drop-shadow(0_1px_0_#fff)_drop-shadow(0_-1px_0_#fff)]"
                      priority
                    />
                  </div>
                  <span className="text-white font-semibold text-base sm:text-lg">SCSIT Online Exam</span>
                </div>

                <h1 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight mb-3">
                  Secure.<br />Smart.<br />Seamless.
                </h1>
                <p className="text-sky-100 text-sm leading-relaxed max-w-xs">
                  Your trusted digital examination platform for Salazar Colleges of Science and Institute of Technology.
                </p>
              </div>

              <div className="relative space-y-3">
                {[
                  "End-to-end encrypted sessions",
                  "Real-time results and analytics",
                  "Built for students and educators",
                ].map((text) => (
                  <div key={text} className="flex items-center gap-3">
                    <span className="inline-flex h-2.5 w-2.5 rounded-full bg-white/80" />
                    <span className="text-sky-100 text-sm">{text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right form panel */}
            <div className="bg-white/70 backdrop-blur-xl p-7 sm:p-10 flex flex-col justify-center">
              <div className="mb-6">
                <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-1">Welcome back</h2>
                <p className="text-slate-500 text-sm">Sign in to access your examination portal</p>
              </div>

              {error?.code === "pending_approval" && (
                <div className="mb-5 rounded-xl bg-amber-50 border border-amber-300 px-4 py-3">
                  <p className="text-amber-800 font-semibold text-sm">Account Pending Approval</p>
                  <p className="text-amber-700 text-sm mt-0.5">{error.message}</p>
                </div>
              )}
              {error?.code === "account_not_found" && (
                <div className="mb-5 rounded-xl bg-red-50 border border-red-200 px-4 py-3">
                  <p className="text-red-700 font-semibold text-sm">Account Not Found</p>
                  <p className="text-red-600 text-sm mt-0.5">{error.message}</p>
                  <a href="/help" className="text-red-700 text-sm font-semibold underline mt-1 inline-block">View student access guide</a>
                </div>
              )}
              {error?.code === "wrong_password" && (
                <div className="mb-5 rounded-xl bg-red-50 border border-red-200 px-4 py-3">
                  <p className="text-red-700 font-semibold text-sm">Incorrect Password</p>
                  <p className="text-red-600 text-sm mt-0.5">{error.message}</p>
                  <a href="/forgot-password" className="text-red-700 text-sm font-semibold underline mt-1 inline-block">Forgot password?</a>
                </div>
              )}
              {error?.code === "password_setup_required" && (
                <div className="mb-5 rounded-xl bg-amber-50 border border-amber-300 px-4 py-3">
                  <p className="text-amber-800 font-semibold text-sm">Password Setup Required</p>
                  <p className="text-amber-700 text-sm mt-0.5">{error.message}</p>
                  <a href="/forgot-password" className="text-amber-800 text-sm font-semibold underline mt-1 inline-block">Set password first</a>
                </div>
              )}
              {error?.code === "account_disabled" && (
                <div className="mb-5 rounded-xl bg-red-50 border border-red-200 px-4 py-3">
                  <p className="text-red-700 font-semibold text-sm">Account Deactivated</p>
                  <p className="text-red-600 text-sm mt-0.5">{error.message}</p>
                </div>
              )}
              {error && !error.code && (
                <div className="mb-5 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-red-700 text-sm">
                  {error.message}
                </div>
              )}
              {success && (
                <div className="mb-5 rounded-xl bg-green-50 border border-green-200 px-4 py-3 text-green-700 text-sm">
                  Login successful! Redirecting to your dashboard...
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="username" className="block text-sm font-medium text-slate-700 mb-1.5">
                    Student ID, Username, or Email
                  </label>
                  <input
                    id="username" name="username" type="text"
                    value={formData.username} onChange={handleChange} required
                    placeholder="Enter your Student ID, username, or email"
                    className="w-full px-4 py-3 rounded-xl bg-white/80 border border-sky-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all text-sm"
                  />
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="password" name="password"
                      type={showPassword ? "text" : "password"}
                      value={formData.password} onChange={handleChange} required
                      placeholder="Enter your password"
                      className="w-full px-4 py-3 pr-16 rounded-xl bg-white/80 border border-sky-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-sky-600 hover:text-sky-700 transition-colors px-1"
                    >
                      {showPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox" checked={rememberMe}
                      onChange={e => setRememberMe(e.target.checked)}
                      className="h-4 w-4 rounded border-sky-300 text-sky-600 focus:ring-sky-500"
                    />
                    <span className="text-sm text-slate-700">Remember me</span>
                  </label>
                  <Link href="/forgot-password" className="text-sm text-sky-600 hover:text-sky-700 transition-colors">
                    Forgot password?
                  </Link>
                </div>

                <button
                  type="submit" disabled={loading}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 text-white font-semibold text-sm shadow-lg shadow-sky-500/30 hover:shadow-sky-500/50 hover:from-sky-400 hover:to-blue-500 focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 focus:ring-offset-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                      </svg>
                      Signing in...
                    </span>
                  ) : "Sign in"}
                </button>
              </form>

              <p className="mt-4 text-center text-xs text-slate-400 flex items-center justify-center gap-1.5">
                <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                </svg>
                Your connection is secure and encrypted
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}


