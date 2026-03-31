// app/register/page.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import Footer from "@/components/Footer";

import { API_URL } from "@/lib/api";

export default function Register() {
  const [formData, setFormData] = useState({
    username: "", email: "", first_name: "", last_name: "", password: "", password2: "",
    role: "student", department: "", school_id: "", year_level: "", contact_number: "",
    study_load: null as File | null,
    id_photo: null as File | null,
    profile_picture: null as File | null,
    is_transferee: false,
    is_irregular: false,
  });

  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [pendingApproval, setPendingApproval] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showPassword2, setShowPassword2] = useState(false);
  const [profilePreview, setProfilePreview] = useState<string | null>(null);
  const [idPhotoPreview, setIdPhotoPreview] = useState<string | null>(null);

  // OTP verification step (shown after form submit)
  const [otpStep, setOtpStep] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [otpError, setOtpError] = useState<string | null>(null);
  const [otpLoading, setOtpLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

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

  const validateUsername = (username: string) => /^[a-zA-Z][a-zA-Z0-9._-]*$/.test(username) && username.length >= 3;


  const checkPasswordStrength = (password: string) => {
    if (password.length < 8) { setPasswordStrength("Password must be at least 8 characters"); return false; }
    if (!/(?=.*[a-z])/.test(password)) { setPasswordStrength("Password must contain lowercase letters"); return false; }
    if (!/(?=.*[A-Z])/.test(password)) { setPasswordStrength("Password must contain uppercase letters"); return false; }
    if (!/(?=.*\d)/.test(password)) { setPasswordStrength("Password must contain numbers"); return false; }
    setPasswordStrength("Strong password");
    return true;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: "" }));
    }
    if (type === 'checkbox') {
      const checkbox = e.target as HTMLInputElement;
      setFormData((prev) => ({ ...prev, [name]: checkbox.checked }));
    } else if (type === 'file') {
      const fileInput = e.target as HTMLInputElement;
      const file = fileInput.files?.[0] || null;
      setFormData((prev) => ({ ...prev, [name]: file }));
      
      // Create preview for profile picture
      if (name === 'profile_picture' && file) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setProfilePreview(reader.result as string);
        };
        reader.readAsDataURL(file);
      } else if (name === 'profile_picture' && !file) {
        setProfilePreview(null);
      }

      if (name === 'id_photo' && file) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setIdPhotoPreview(reader.result as string);
        };
        reader.readAsDataURL(file);
      } else if (name === 'id_photo' && !file) {
        setIdPhotoPreview(null);
      }
    } else if (name === "username") {
      setFormData((prev) => ({ ...prev, [name]: value.toLowerCase().replace(/\s+/g, "") }));
    } else if (name === "password") {
      setFormData((prev) => ({ ...prev, [name]: value }));
      checkPasswordStrength(value);
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const safeJson = async (res: Response) => {
    const text = await res.text();
    try { return JSON.parse(text); } catch { return {}; }
  };

  const startCooldown = () => {
    setResendCooldown(60);
    const interval = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) { clearInterval(interval); return 0; }
        return prev - 1;
      });
    }, 1000);
  };

  const handleSendOtp = async () => {
    const res = await fetch(`${API_URL}/register/pre-verify-email/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: formData.email }),
    });
    const data = await safeJson(res);
    if (!res.ok) throw new Error(data.error || `Server error (${res.status}). Check that the backend is running.`);
    startCooldown();
  };

  const handleVerifyAndRegister = async () => {
    if (otpCode.length !== 6) { setOtpError("Please enter the 6-digit code"); return; }
    setOtpError(null);
    setFieldErrors({});
    setOtpLoading(true);
    try {
      // Step 1: verify OTP
      const verifyRes = await fetch(`${API_URL}/register/confirm-pre-verify/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.email, code: otpCode }),
      });
      const verifyData = await safeJson(verifyRes);
      if (!verifyRes.ok) { setOtpError(verifyData.error || "Invalid OTP code. Please try again."); return; }

      // Step 2: submit registration with otp_code
      const formDataToSend = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== null && value !== "") formDataToSend.append(key, value as string | Blob);
      });
      formDataToSend.append("otp_code", otpCode);

      const regRes = await fetch(`${API_URL}/register/`, {
        method: "POST",
        body: formDataToSend,
      });
      const regData = await safeJson(regRes);
      if (!regRes.ok) {
        let msg = "Registration failed";
        if (regData.detail) msg = regData.detail;
        else if (regData.error) msg = regData.error;
        else if (regData.non_field_errors) msg = regData.non_field_errors[0];
        const fieldMap: Record<string, string> = {};
        if (regData && typeof regData === "object") {
          Object.entries(regData).forEach(([key, val]) => {
            if (Array.isArray(val) && val.length > 0) {
              fieldMap[key] = String(val[0]);
            }
          });
        }
        if (Object.keys(fieldMap).length > 0) {
          setFieldErrors(fieldMap);
          if (fieldMap.non_field_errors) {
            msg = fieldMap.non_field_errors;
          } else {
            msg = "Please fix the highlighted fields.";
          }
        }
        // Registration error - go back to form so user can fix it
        setOtpStep(false);
        setOtpCode("");
        setError(msg);
        return;
      }
      setPendingApproval(true);
      setOtpStep(false);
    } catch {
      setOtpError("Something went wrong. Please try again.");
    } finally {
      setOtpLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0 || resendLoading) return;
    setResendLoading(true);
    setResendSuccess(false);
    setOtpError(null);
    try {
      await handleSendOtp();
      setResendSuccess(true);
      setTimeout(() => setResendSuccess(false), 3000);
    } catch (err: unknown) {
      setOtpError(err instanceof Error ? err.message : "Failed to resend OTP. Please try again.");
    } finally {
      setResendLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});
    setLoading(true);

    if (!validateUsername(formData.username)) {
      setError("Username must start with a letter and be at least 3 characters long");
      setFieldErrors((prev) => ({ ...prev, username: "Invalid username format." }));
      setLoading(false);
      return;
    }
    if (formData.role === 'student' && !formData.year_level) {
      setError("Year level is required for students");
      setFieldErrors((prev) => ({ ...prev, year_level: "Year level is required." }));
      setLoading(false);
      return;
    }
    if (formData.role === 'student' && !formData.id_photo) {
      setError("ID photo is required for students");
      setFieldErrors((prev) => ({ ...prev, id_photo: "ID photo is required." }));
      setLoading(false);
      return;
    }
    if (formData.contact_number && formData.contact_number.length !== 11) {
      setError("Contact number must be exactly 11 digits");
      setFieldErrors((prev) => ({ ...prev, contact_number: "Contact number must be 11 digits." }));
      setLoading(false);
      return;
    }
    if (!checkPasswordStrength(formData.password)) {
      setError("Password does not meet requirements");
      setFieldErrors((prev) => ({ ...prev, password: "Password does not meet requirements." }));
      setLoading(false);
      return;
    }
    if (formData.password !== formData.password2) {
      setError("Passwords do not match");
      setFieldErrors((prev) => ({ ...prev, password2: "Passwords do not match." }));
      setLoading(false);
      return;
    }

    try {
      await handleSendOtp();
      setOtpStep(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "";
      if (msg.includes("fetch") || msg.includes("network") || msg.includes("Failed")) {
        setError("Cannot connect to the server. Make sure the backend is running.");
      } else {
        setError(msg || "Failed to send OTP. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  if (pendingApproval) {
    if (typeof window !== 'undefined') {
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      localStorage.removeItem("user_name");
      localStorage.removeItem("user_role");
    }
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-200 via-blue-200 to-cyan-200 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-2xl border border-sky-100 p-10 text-center max-w-md w-full">
          <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Registration Submitted!</h2>
          <p className="text-slate-500 mb-2">Your account is <span className="font-semibold text-yellow-600">pending approval</span> from the admin or department dean.</p>
          <p className="text-sm text-slate-400 mb-6">You&apos;ll receive an email notification once your account is approved.</p>
          <Link href="/" className="inline-block bg-gradient-to-r from-sky-500 to-blue-600 text-white px-8 py-3 rounded-xl font-semibold hover:shadow-lg hover:shadow-sky-500/30 transition-all">
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-sky-200 to-blue-200">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(56,189,248,0.08),transparent_60%)]" />

      <div className="relative flex flex-col min-h-screen">

        <main className="flex flex-1 items-center justify-center px-4 sm:px-6 py-10">
          <div className="w-full max-w-6xl grid lg:grid-cols-[0.9fr_1.1fr] rounded-[28px] overflow-hidden shadow-2xl shadow-slate-900/40 border border-white/10 bg-white/90 backdrop-blur-xl">

            {/* Left visual panel */}
            <div className="hidden lg:flex flex-col justify-between bg-gradient-to-br from-emerald-500 via-teal-500 to-sky-500 p-10 relative overflow-hidden">
              <div className="absolute -top-20 -right-20 w-72 h-72 bg-white/10 rounded-full blur-sm" />
              <div className="absolute bottom-8 -left-16 w-56 h-56 bg-white/10 rounded-full blur-sm" />
              <div className="absolute top-28 left-12 w-24 h-24 border border-white/25 rounded-2xl rotate-12" />

              <div className="relative">
                <div className="inline-flex items-center justify-center w-14 h-14 bg-white/15 rounded-2xl shadow-lg shadow-teal-500/30 mb-6">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                  </svg>
                </div>
                <h1 className="text-3xl font-extrabold text-white leading-tight mb-3">
                  Create your<br />SCSIT account<br />with confidence
                </h1>
                <p className="text-emerald-50 text-sm leading-relaxed max-w-xs">
                  A secure onboarding experience for Salazar Colleges of Science and Institute of Technology.
                </p>
              </div>

              <div className="relative space-y-3">
                {[
                  { icon: "01", text: "Verify your email with OTP" },
                  { icon: "02", text: "Upload your study load" },
                  { icon: "03", text: "Get reviewed by your department" },
                ].map(item => (
                  <div key={item.icon} className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-full bg-white/15 text-white text-xs font-semibold flex items-center justify-center">
                      {item.icon}
                    </span>
                    <span className="text-emerald-50 text-sm">{item.text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right form panel */}
            <div className="bg-white/95 backdrop-blur-xl p-6 sm:p-8 lg:p-10 max-h-[82vh] overflow-y-auto custom-scrollbar">
              {/* Mobile branding */}
              <div className="flex lg:hidden items-center gap-3 mb-6">
                <div className="inline-flex items-center justify-center w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl shadow-lg shadow-emerald-500/30">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                  </svg>
                </div>
                <div>
                  <p className="text-slate-900 font-bold leading-tight">SCSIT Online Exam</p>
                  <p className="text-xs text-slate-500">Create your account</p>
                </div>
              </div>

              <div className="mb-6">
                <h2 className="text-2xl sm:text-3xl font-semibold text-slate-900 mb-1">Create your account</h2>
                <p className="text-slate-500 text-sm">Salazar Colleges of Science and Institute of Technology</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl">{error}</div>
                )}

                <div className="space-y-4 rounded-2xl bg-white border border-slate-200/70 p-6 shadow-sm shadow-slate-100/60">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                    </div>
                    <h3 className="text-base font-semibold text-slate-800">Personal Information</h3>
                  </div>

                  {/* Profile Picture Upload */}
                  <div className="flex justify-center">
                    <div className="relative">
                      <div className="w-28 h-28 rounded-full border border-slate-200 overflow-hidden bg-slate-50 flex items-center justify-center">
                        {profilePreview ? (
                          <img src={profilePreview} alt="Profile Preview" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-16 h-16 rounded-full bg-slate-200/70 flex items-center justify-center text-slate-500">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 14a4 4 0 10-8 0m8 0a4 4 0 01-8 0m8 0v1a2 2 0 01-2 2H10a2 2 0 01-2-2v-1m10-6a4 4 0 10-8 0 4 4 0 008 0z" />
                            </svg>
                          </div>
                        )}
                      </div>
                      <label htmlFor="profile_picture" className="absolute bottom-0 right-0 bg-sky-500 text-white p-2 rounded-full cursor-pointer hover:bg-sky-600 transition-all shadow-md">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </label>
                      <input
                        id="profile_picture"
                        name="profile_picture"
                        type="file"
                        accept="image/jpeg,image/jpg,image/png"
                        onChange={handleChange}
                        className="hidden"
                      />
                    </div>
                  </div>
                  <p className="text-center text-sm text-slate-500">Upload your profile picture (Optional)</p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">First Name *</label>
                      <input name="first_name" type="text" value={formData.first_name} onChange={handleChange} required
                        className={`w-full px-4 py-3 border rounded-xl bg-white text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all ${fieldErrors.first_name ? 'border-red-300' : 'border-slate-200'}`} placeholder="Juan" />
                      {fieldErrors.first_name && <p className="text-red-600 text-sm mt-1">{fieldErrors.first_name}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Last Name *</label>
                      <input name="last_name" type="text" value={formData.last_name} onChange={handleChange} required
                        className={`w-full px-4 py-3 border rounded-xl bg-white text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all ${fieldErrors.last_name ? 'border-red-300' : 'border-slate-200'}`} placeholder="Dela Cruz" />
                      {fieldErrors.last_name && <p className="text-red-600 text-sm mt-1">{fieldErrors.last_name}</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">{formData.role === 'student' ? 'Student ID' : 'Employee ID'} *</label>
                      <input name="school_id" type="text" value={formData.school_id} onChange={handleChange} required
                        className={`w-full px-4 py-3 border rounded-xl bg-white text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all ${fieldErrors.school_id ? 'border-red-300' : 'border-slate-200'}`} placeholder={formData.role === 'student' ? '2024-12345' : 'EMP-001'} />
                      {fieldErrors.school_id && <p className="text-red-600 text-sm mt-1">{fieldErrors.school_id}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Contact Number</label>
                      <input name="contact_number" type="tel" value={formData.contact_number} onChange={handleChange} maxLength={11} pattern="[0-9]{11}"
                        className={`w-full px-4 py-3 border rounded-xl bg-white text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all ${fieldErrors.contact_number ? 'border-red-300' : 'border-slate-200'}`} placeholder="09123456789 (11 digits)" />
                      {formData.contact_number && formData.contact_number.length !== 11 && (
                        <p className="text-red-600 text-sm mt-1">Contact number must be exactly 11 digits</p>
                      )}
                      {fieldErrors.contact_number && <p className="text-red-600 text-sm mt-1">{fieldErrors.contact_number}</p>}
                    </div>
                  </div>
                </div>

                <div className="space-y-4 rounded-2xl bg-white border border-slate-200/70 p-6 shadow-sm shadow-slate-100/60">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    </div>
                    <h3 className="text-base font-semibold text-slate-800">Account Information</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Username *</label>
                      <input name="username" type="text" value={formData.username} onChange={handleChange} required
                        className={`w-full px-4 py-3 border rounded-xl bg-white text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all ${fieldErrors.username || (formData.username && !validateUsername(formData.username)) ? 'border-red-300' : 'border-slate-200'}`}
                        placeholder="juandelacruz" />
                      {formData.username && !validateUsername(formData.username) && (
                        <p className="text-red-600 text-sm mt-1">Username must start with a letter and be at least 3 characters</p>
                      )}
                      {fieldErrors.username && <p className="text-red-600 text-sm mt-1">{fieldErrors.username}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Email Address *</label>
                      <input name="email" type="email" value={formData.email} onChange={handleChange} required
                        className={`w-full px-4 py-3 border rounded-xl bg-white text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all ${fieldErrors.email ? 'border-red-300' : 'border-slate-200'}`}
                        placeholder="juan@example.com" />
                      {fieldErrors.email && <p className="text-red-600 text-sm mt-1">{fieldErrors.email}</p>}
                    </div>
                  </div>
                </div>

                <div className="space-y-4 rounded-2xl bg-white border border-slate-200/70 p-6 shadow-sm shadow-slate-100/60">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5zm0 0v6" /></svg>
                    </div>
                    <h3 className="text-base font-semibold text-slate-800">Academic Information</h3>
                  </div>

                  {/* Role Selection - Redesigned */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-3">I am registering as: *</label>
                    <div className="grid grid-cols-1 gap-3">
                      <label className={`relative flex items-center p-4 border-2 rounded-xl cursor-pointer transition-all ${
                        formData.role === "student" 
                          ? "border-emerald-400 bg-emerald-50" 
                          : "border-slate-200 bg-white hover:border-slate-300"
                      }`}>
                        <input
                          type="radio"
                          name="role"
                          value="student"
                          checked={formData.role === "student"}
                          onChange={handleChange}
                          className="w-5 h-5 text-emerald-600 focus:ring-emerald-500"
                        />
                        <div className="ml-4 flex-1">
                          <div className="space-y-0.5">
                            <p className="text-[11px] uppercase tracking-wide text-slate-500">Role</p>
                            <p className="text-sm font-semibold text-slate-900">Student</p>
                            <p className="text-xs text-slate-500">Enrolling in courses</p>
                          </div>
                        </div>
                        {formData.role === "student" && (
                          <div className="absolute top-3 right-3 text-emerald-500">
                            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                          </div>
                        )}
                      </label>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Department *</label>
                      <select name="department" value={formData.department} onChange={handleChange} required
                        className={`w-full px-4 py-3 border rounded-xl bg-white text-slate-900 focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all ${fieldErrors.department ? 'border-red-300' : 'border-slate-200'}`}>
                        <option value="">Select Department</option>
                        {departments.map((dept) => (
                          <option key={dept.value} value={dept.value}>{dept.label}</option>
                        ))}
                      </select>
                      {fieldErrors.department && <p className="text-red-600 text-sm mt-1">{fieldErrors.department}</p>}
                    </div>
                    {formData.role === 'student' && (
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Year Level *</label>
                        <select name="year_level" value={formData.year_level} onChange={handleChange} required
                          className={`w-full px-4 py-3 border rounded-xl bg-white text-slate-900 focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all ${fieldErrors.year_level ? 'border-red-300' : 'border-slate-200'}`}>
                          <option value="">Select Year Level</option>
                          {yearLevels.map((year) => (
                            <option key={year.value} value={year.value}>{year.label}</option>
                          ))}
                        </select>
                        {fieldErrors.year_level && <p className="text-red-600 text-sm mt-1">{fieldErrors.year_level}</p>}
                      </div>
                    )}
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
                    <p className="text-sm font-semibold text-slate-800 mb-2">Student Status (Optional)</p>
                    <p className="text-xs text-slate-500 mb-3">
                      If you are a transferee or an irregular student, please declare it here. The dean will confirm before approval.
                    </p>
                    <div className="space-y-3">
                      <label className="flex items-center gap-3 text-sm text-slate-700">
                        <input
                          type="checkbox"
                          name="is_transferee"
                          checked={formData.is_transferee}
                          onChange={handleChange}
                          className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                        />
                        I am a transferee
                      </label>
                      <label className="flex items-center gap-3 text-sm text-slate-700">
                        <input
                          type="checkbox"
                          name="is_irregular"
                          checked={formData.is_irregular}
                          onChange={handleChange}
                          className="h-4 w-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                        />
                        I am an irregular student
                      </label>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl bg-white border border-slate-200/70 p-6 shadow-sm shadow-slate-100/60">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                    </div>
                    <h3 className="text-base font-semibold text-slate-800">Documents</h3>
                  </div>
                  <label className="block text-sm font-medium text-slate-700 mb-3">Study Load <span className="text-red-500">*</span></label>
                  <label className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-xl cursor-pointer transition-all ${
                    fieldErrors.study_load ? 'border-red-300 bg-red-50' : formData.study_load ? 'border-emerald-300 bg-emerald-50' : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                  }`}>
                    <div className="flex flex-col items-center justify-center">
                      {formData.study_load ? (
                        <>
                          <svg className="w-8 h-8 text-emerald-500 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                          <p className="text-sm font-medium text-emerald-700">{formData.study_load.name}</p>
                          <p className="text-xs text-slate-400 mt-1">Click to change file</p>
                        </>
                      ) : (
                        <>
                          <svg className="w-8 h-8 text-emerald-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                          <p className="text-sm font-medium text-slate-600">Click to upload study load</p>
                          <p className="text-xs text-slate-400 mt-1">PDF, JPG, PNG - max 5MB</p>
                        </>
                      )}
                    </div>
                    <input name="study_load" type="file" accept="image/jpeg,image/jpg,image/png,application/pdf" onChange={handleChange} required className="hidden" />
                  </label>
                  <p className="text-xs text-red-500 mt-2">Warning: Upload only YOUR OWN study load. Duplicate files will be rejected.</p>
                  {fieldErrors.study_load && <p className="text-red-600 text-sm mt-1">{fieldErrors.study_load}</p>}

                  <div className="mt-6">
                    <label className="block text-sm font-medium text-slate-700 mb-3">ID Photo <span className="text-red-500">*</span></label>
                    <label className={`flex flex-col items-center justify-center w-full min-h-32 border-2 border-dashed rounded-xl cursor-pointer transition-all overflow-hidden ${
                      fieldErrors.id_photo ? 'border-red-300 bg-red-50' : formData.id_photo ? 'border-sky-300 bg-sky-50' : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                    }`}>
                      {idPhotoPreview ? (
                        <div className="w-full">
                          <img src={idPhotoPreview} alt="ID Photo Preview" className="h-40 w-full object-cover" />
                          <div className="px-4 py-3 text-center">
                            <p className="text-sm font-medium text-sky-700">{formData.id_photo?.name}</p>
                            <p className="text-xs text-slate-400 mt-1">Click to change image</p>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-8 px-4">
                          <svg className="w-8 h-8 text-sky-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-8h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                          <p className="text-sm font-medium text-slate-600">Click to upload your school ID photo</p>
                          <p className="text-xs text-slate-400 mt-1">JPG or PNG only - max 5MB</p>
                        </div>
                      )}
                      <input name="id_photo" type="file" accept="image/jpeg,image/jpg,image/png" onChange={handleChange} className="hidden" />
                    </label>
                    <p className="text-xs text-slate-500 mt-2">Upload a clear photo of your valid school ID for dean verification.</p>
                    {fieldErrors.id_photo && <p className="text-red-600 text-sm mt-1">{fieldErrors.id_photo}</p>}
                  </div>
                </div>

                <div className="space-y-4 rounded-2xl bg-white border border-slate-200/70 p-6 shadow-sm shadow-slate-100/60">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                    </div>
                    <h3 className="text-base font-semibold text-slate-800">Security</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Password *</label>
                      <div className="relative">
                        <input name="password" type={showPassword ? "text" : "password"} value={formData.password} onChange={handleChange} required
                          className={`w-full px-4 py-3 pr-12 border rounded-xl bg-white text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all ${fieldErrors.password ? 'border-red-300' : 'border-slate-200'}`} placeholder="Minimum 8 characters" />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
                        >
                          {showPassword ? "Hide" : "Show"}
                        </button>
                      </div>
                      {fieldErrors.password && <p className="text-red-600 text-sm mt-1">{fieldErrors.password}</p>}
                      {passwordStrength && (
                        <p className={`text-sm mt-1 ${passwordStrength === "Strong password" ? "text-green-600" : "text-red-600"}`}>{passwordStrength}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Confirm Password *</label>
                      <div className="relative">
                        <input name="password2" type={showPassword2 ? "text" : "password"} value={formData.password2} onChange={handleChange} required
                          className={`w-full px-4 py-3 pr-12 border rounded-xl bg-white text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all ${fieldErrors.password2 ? 'border-red-300' : 'border-slate-200'}`} placeholder="Repeat password" />
                        <button
                          type="button"
                          onClick={() => setShowPassword2(!showPassword2)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
                        >
                          {showPassword2 ? "Hide" : "Show"}
                        </button>
                      </div>
                      {fieldErrors.password2 && <p className="text-red-600 text-sm mt-1">{fieldErrors.password2}</p>}
                    </div>
                  </div>

                  <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-4">
                    <h4 className="font-medium text-emerald-900 mb-2">Password Requirements:</h4>
                    <ul className="text-sm text-emerald-900/80 space-y-1">
                      <li>At least 8 characters long</li>
                      <li>Contains uppercase and lowercase letters</li>
                      <li>Contains at least one number</li>
                    </ul>
                  </div>
                </div>

                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                  <div className="flex items-start">
                    <input id="terms" type="checkbox" required className="mt-1 h-4 w-4 text-sky-600 focus:ring-sky-500 border-sky-300 rounded" />
                    <label htmlFor="terms" className="ml-3 text-sm text-slate-700">
                      I agree to the{" "}
                      <Link href="/terms" className="text-sky-600 hover:text-sky-700 font-medium">Terms of Service</Link>,{" "}
                      <Link href="/privacy" className="text-sky-600 hover:text-sky-700 font-medium">Privacy Policy</Link>, and{" "}
                      <Link href="/anti-cheating" className="text-sky-600 hover:text-sky-700 font-medium">Anti-Cheating Policies</Link>. I understand that violations may result in account suspension.
                    </label>
                  </div>
                </div>

                <div className="bg-yellow-50/70 border border-yellow-200 rounded-xl p-4">
                  <h4 className="font-medium text-yellow-900 mb-2">Account Approval Notice</h4>
                  <p className="text-sm text-yellow-800">
                    Student accounts require approval from the admin or department dean before you can access the system. You will receive an email notification once your account is approved.
                  </p>
                </div>

                <button type="submit" disabled={loading}
                  className="w-full bg-gradient-to-r from-sky-500 to-sky-600 text-white py-4 px-6 rounded-xl hover:shadow-xl hover:shadow-sky-500/30 focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed text-lg">
                  {loading ? "Creating Account..." : "Create Account"}
                </button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-slate-600">
                  Already have an account?{" "}
                  <Link href="/login" className="text-sky-600 hover:text-sky-700 font-medium">Sign in here</Link>
                </p>
              </div>

              <p className="mt-4 text-center text-xs text-slate-400 flex items-center justify-center gap-1.5">
                <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                </svg>
                Your information is secure and encrypted
              </p>
            </div>
          </div>
        </main>

        {otpStep && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm px-4">
            <div className="w-full max-w-md overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Verify Your Email</h2>
                  <p className="text-xs text-slate-500">A 6-digit code was sent to {formData.email}</p>
                </div>
                <button
                  onClick={() => { setOtpStep(false); setOtpCode(""); setOtpError(null); }}
                  className="text-slate-400 hover:text-slate-700 text-2xl"
                >
                  x
                </button>
              </div>
              <div className="px-6 py-6 text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                  <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>

                {otpError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-4 text-sm">{otpError}</div>
                )}

                {resendSuccess && (
                  <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl mb-4 text-sm">Success: A new code has been sent to your email.</div>
                )}

                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  className="w-full text-center text-3xl font-bold tracking-[0.5em] px-4 py-4 border-2 border-emerald-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent mb-6 text-black"
                  placeholder="000000"
                />

                <button
                  onClick={handleVerifyAndRegister}
                  disabled={otpLoading}
                  className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-3 rounded-xl font-semibold hover:shadow-lg hover:shadow-emerald-500/30 transition-all disabled:opacity-50 mb-3"
                >
                  {otpLoading ? "Verifying..." : "Verify & Create Account"}
                </button>

                <button
                  onClick={handleResendOtp}
                  disabled={resendCooldown > 0 || otpLoading || resendLoading}
                  className="text-emerald-600 hover:text-emerald-700 text-sm font-medium disabled:text-slate-400 mb-2 block w-full"
                >
                  {resendLoading ? "Sending..." : resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : "Resend code"}
                </button>
              </div>
            </div>
          </div>
        )}

        <Footer />
      </div>

      <style jsx global>{`
        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: rgba(14, 116, 144, 0.4) transparent;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(180deg, rgba(14, 165, 233, 0.55), rgba(14, 116, 144, 0.55));
          border-radius: 999px;
          border: 2px solid rgba(255, 255, 255, 0.7);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(180deg, rgba(14, 165, 233, 0.8), rgba(14, 116, 144, 0.8));
        }
      `}</style>
    </div>
  );
}

