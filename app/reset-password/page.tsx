"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(true);
  const [valid, setValid] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const safeJson = async (res: Response) => {
    try {
      return await res.json();
    } catch {
      return {};
    }
  };

  useEffect(() => {
    if (token) {
      validateToken();
    } else {
      setValidating(false);
    }
  }, [token]);

  const validateToken = async () => {
    try {
      const res = await fetch(`/api/password-reset/validate/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      const data = await safeJson(res);
      setValid(data.valid);
      if (!data.valid) {
        setError(data.error || "Invalid or expired token");
      }
    } catch (err) {
      setError("Unable to validate token right now.");
    } finally {
      setValidating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`/api/password-reset/reset/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, new_password: password }),
      });

      const data = await safeJson(res);

      if (res.ok) {
        setSuccess(true);
        setTimeout(() => router.push("/login"), 3000);
      } else {
        setError(data.error || "Failed to reset password");
      }
    } catch (err) {
      setError("Unable to reach the server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (validating) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-50 via-blue-50 to-cyan-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-2 border-sky-600"></div>
          <p className="mt-4 text-slate-600">Validating token...</p>
        </div>
      </div>
    );
  }

  if (!valid) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-50 via-blue-50 to-cyan-50">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(56,189,248,0.15),transparent_50%)]" />
        <div className="relative">
          <Header />
          <div className="flex items-center justify-center py-20 px-4">
            <div className="max-w-md w-full bg-white/60 backdrop-blur-xl rounded-2xl shadow-xl border border-sky-200/50 p-8 text-center">
              <div className="text-6xl mb-4">❌</div>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">Invalid Link</h2>
              <p className="text-slate-600 mb-6">{error}</p>
              <Link href="/forgot-password" className="text-sky-600 hover:text-sky-700 font-medium">
                Request New Link
              </Link>
            </div>
          </div>
          <Footer />
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-50 via-blue-50 to-cyan-50">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(56,189,248,0.15),transparent_50%)]" />
        <div className="relative">
          <Header />
          <div className="flex items-center justify-center py-20 px-4">
            <div className="max-w-md w-full bg-white/60 backdrop-blur-xl rounded-2xl shadow-xl border border-sky-200/50 p-8 text-center">
              <div className="text-6xl mb-4">✅</div>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">Password Reset!</h2>
              <p className="text-slate-600 mb-6">
                Your password has been reset successfully. Redirecting to login...
              </p>
            </div>
          </div>
          <Footer />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-blue-50 to-cyan-50">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(56,189,248,0.15),transparent_50%)]" />
      <div className="relative">
        <Header />
        <main className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-md w-full space-y-8">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-slate-900 mb-2">Reset Password</h2>
              <p className="text-slate-600">Enter your new password</p>
            </div>

            <div className="bg-white/60 backdrop-blur-xl rounded-2xl shadow-xl border border-sky-200/50 p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl">
                    {error}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    New Password
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full px-4 py-3 border border-sky-200 rounded-xl bg-white/80 text-slate-900 focus:ring-2 focus:ring-sky-500"
                    placeholder="Minimum 8 characters"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="w-full px-4 py-3 border border-sky-200 rounded-xl bg-white/80 text-slate-900 focus:ring-2 focus:ring-sky-500"
                    placeholder="Repeat password"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-sky-500 to-blue-500 text-white py-3 px-6 rounded-xl hover:shadow-xl transition-all font-medium disabled:opacity-50"
                >
                  {loading ? "Resetting..." : "Reset Password"}
                </button>
              </form>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    </div>
  );
}

export default function ResetPassword() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
