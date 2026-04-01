"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import * as faceapi from "face-api.js";
import ReportIssueModal from "@/components/ReportIssueModal";

import { API_URL, apiFetch } from "@/lib/api";
export default function TakeExam() {
  const router = useRouter();
  const params = useParams();
  const examId = params.id;
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const examStartedRef = useRef(false);
  
  const [exam, setExam] = useState<any>(null);
  const [answers, setAnswers] = useState<{ [key: number]: string }>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [warningCount, setWarningCount] = useState(0);
  const [examStarted, setExamStarted] = useState(false);
  const [faceDetected, setFaceDetected] = useState(true);
  const [terminationCount, setTerminationCount] = useState(0);
  const [lastPhotoCapture, setLastPhotoCapture] = useState(0);
  const terminationCountRef = useRef(0);
  const terminationRecordedRef = useRef(false);
  const [terminationBlocked, setTerminationBlocked] = useState(false);
  const [terminationProcessing, setTerminationProcessing] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [extensionToast, setExtensionToast] = useState<string | null>(null);
  const [questionToReport, setQuestionToReport] = useState<any>(null);
  const lastWarningRef = useRef<{ message: string; time: number } | null>(null);
  const noFaceStartedAtRef = useRef<number | null>(null);
  const lastNoFaceWarningAtRef = useRef<number | null>(null);
  const consecutiveMultipleFacesRef = useRef(0);
  const autoSaveInterval = useRef<any>(null);

  const heartbeatRef = useRef<any>(null);
  const faceDetectionIntervalRef = useRef<any>(null);
  const modelsLoadedRef = useRef(false);
  const extensionPollingRef = useRef<any>(null);
  const appliedExtraMinutesRef = useRef(0);
  const awayTimerRef = useRef<any>(null);
  const sessionTokenRef = useRef<string | null>(null);
  const FACE_SCAN_INTERVAL_MS = 2500;
  const NO_FACE_VIOLATION_DELAY_MS = 5000;
  const NO_FACE_REPEAT_DELAY_MS = 5000;
  const MULTIPLE_FACE_VIOLATION_THRESHOLD = 2;

  const readErrorMessage = async (res: Response, fallback: string) => {
    try {
      const data = await res.json();
      if (typeof data?.error === "string" && data.error.trim()) return data.error;
      if (typeof data?.detail === "string" && data.detail.trim()) return data.detail;
      if (typeof data?.message === "string" && data.message.trim()) return data.message;
    } catch {}
    return fallback;
  };

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) router.push("/login");
    if (typeof window !== "undefined") {
      sessionTokenRef.current = sessionStorage.getItem(sessionKey());
    }
    
    fetchExam();
    initCamera();
    const cleanup = setupAntiCheating();
    const unsubscribeNetwork = setupNetworkMonitoring();

    return () => {
      stopCamera();
      if (cleanup) cleanup();
      if (unsubscribeNetwork) unsubscribeNetwork();
      if (autoSaveInterval.current) clearInterval(autoSaveInterval.current);
      if (heartbeatRef.current) clearInterval(heartbeatRef.current);
      if (extensionPollingRef.current) clearInterval(extensionPollingRef.current);
      if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
      if (examStartedRef.current) {
        const token = localStorage.getItem("access_token");
        fetch(`${API_URL}/exams/${examId}/session/end/`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            ...(sessionTokenRef.current ? { "X-Exam-Session": sessionTokenRef.current } : {}),
          },
        }).catch(() => {});
      }
    };
  }, []);

  // Record termination when warning count reaches 5
  useEffect(() => {
    if (warningCount >= 5 && !terminationRecordedRef.current) {
      terminationRecordedRef.current = true;
      setTerminationProcessing(true);
      const recordTermination = async () => {
        const token = localStorage.getItem("access_token");
        try {
          const res = await fetch(`${API_URL}/exams/${examId}/terminate/`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
              ...(sessionTokenRef.current ? { "X-Exam-Session": sessionTokenRef.current } : {}),
            },
            body: JSON.stringify({ session_token: sessionTokenRef.current }),
          });
          if (res.ok) {
            const data = await res.json();
            terminationCountRef.current = data.termination_count;
            setTerminationCount(data.termination_count);
            if (data.is_blocked) {
              setTerminationBlocked(true);
            } else {
              alert(data.message || "Suspicious behavior detected. You may retry.");
              router.replace(`/exam/${examId}/instructions`);
            }
          }
        } catch (err) {
          console.error("Failed to record termination");
        } finally {
          setTerminationProcessing(false);
        }
      };
      recordTermination();
    }
  }, [warningCount, examId]);

  useEffect(() => {
    examStartedRef.current = examStarted;
    if (examStarted) {
      startAutoSave();
      startExtensionPolling();
    } else if (autoSaveInterval.current) {
      clearInterval(autoSaveInterval.current);
    }
  }, [examStarted]);

  useEffect(() => {
    if (examStarted && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && exam) {
      handleSubmit();
    }
  }, [examStarted, timeLeft]);

  const fetchExam = async () => {
    try {
      const res = await apiFetch(`${API_URL}/exams/${examId}/take/`, {
        headers: {
          ...(sessionTokenRef.current ? { "X-Exam-Session": sessionTokenRef.current } : {}),
        },
      });
      if (!res.ok) {
        const message = await readErrorMessage(res, "Failed to load exam.");
        alert(message);
        router.push("/dashboard/student");
        return;
      }
      const data = await res.json();
      setExam(data);
      setTimeLeft(data.duration_minutes * 60);
      appliedExtraMinutesRef.current = 0;
      await fetchAndApplyExtensions();
      setLoading(false);
    } catch (err) {
      alert("Unable to reach the exam server. Please check your connection and refresh the page.");
      router.push("/dashboard/student");
    }
  };

  const fetchAndApplyExtensions = async () => {
    try {
      const res = await apiFetch(`${API_URL}/exams/${examId}/my-extensions/`, {
        headers: {},
      });
      if (!res.ok) return;
      const data = await res.json();
      const totalExtra = Number(data.total_extra_minutes || 0);
      const delta = totalExtra - appliedExtraMinutesRef.current;
      if (delta > 0) {
        setTimeLeft((prev) => prev + delta * 60);
        appliedExtraMinutesRef.current = totalExtra;
        setExtensionToast(`Time extended by ${delta} minute${delta === 1 ? "" : "s"}.`);
        setTimeout(() => setExtensionToast(null), 4000);
      }
    } catch {}
  };

  const startExtensionPolling = () => {
    if (extensionPollingRef.current) clearInterval(extensionPollingRef.current);
    fetchAndApplyExtensions();
    extensionPollingRef.current = setInterval(fetchAndApplyExtensions, 15000);
  };

  const setupNetworkMonitoring = () => {
    setIsOnline(true);
    return () => {};
  };

  const storageKey = () => `exam_${examId}_answers`;
  const pendingKey = () => `exam_${examId}_pending`;
  const sessionKey = () => `exam_${examId}_session_token`;

  const saveAnswersLocally = () => {
    try {
      const saveData = {
        examId,
        answers,
        timeLeft,
        timestamp: Date.now(),
      };
      localStorage.setItem(storageKey(), JSON.stringify(saveData));
    } catch (err) {
      console.error("Failed to save answers locally:", err);
    }
  };

  const loadSavedAnswers = async () => {
    try {
      const savedData = localStorage.getItem(storageKey());
      if (!savedData) return;
      const parsed = JSON.parse(savedData);
      if (parsed?.answers && Object.keys(parsed.answers).length > 0) {
        const shouldRestore = confirm("We found saved answers for this exam. Restore them?");
        if (shouldRestore) {
          setAnswers(parsed.answers);
        }
      }
    } catch (err) {
      console.error("Failed to load saved answers:", err);
    }
  };

  const clearSavedAnswers = () => {
    try {
      localStorage.removeItem(storageKey());
    } catch (err) {
      console.error("Failed to clear saved answers:", err);
    }
  };

  const startAutoSave = () => {
    if (autoSaveInterval.current) clearInterval(autoSaveInterval.current);
  };

  const enqueuePendingSubmission = () => {
    return;
  };

  const clearPendingSubmission = () => {
    return;
  };

  const retrySubmission = async () => {
    return;
  };

  const loadFaceModels = async () => {
    if (modelsLoadedRef.current) return;
    await faceapi.nets.tinyFaceDetector.loadFromUri("/models");
    modelsLoadedRef.current = true;
  };

  const initCamera = async () => {
    try {
      setCameraError(null);
      if (!window.isSecureContext) {
        throw new Error("Camera access requires HTTPS.");
      }

      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("This browser does not support camera access.");
      }

      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: "user" },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });
      } catch {
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
      }

      if (!videoRef.current) {
        stream.getTracks().forEach((track) => track.stop());
        throw new Error("Camera preview is not ready yet.");
      }

      videoRef.current.srcObject = stream;
      videoRef.current.muted = true;
      videoRef.current.playsInline = true;
      await videoRef.current.play().catch(() => {});

      setCameraActive(true);
      await loadFaceModels();
      faceDetectionIntervalRef.current = setInterval(() => detectFace(), FACE_SCAN_INTERVAL_MS);
    } catch (err) {
      setCameraActive(false);
      const message =
        err instanceof DOMException
          ? err.name === "NotAllowedError"
            ? "Camera access was blocked. Please allow camera permission in your browser and reload the exam page."
            : err.name === "NotFoundError"
              ? "No camera device was found. Please connect a camera and reload the exam page."
              : err.name === "NotReadableError"
                ? "Your camera is already in use by another app. Close other camera apps and reload the exam page."
                : "Unable to start the camera. Please reload the exam page."
          : err instanceof Error
            ? err.message
            : "Unable to start the camera. Please reload the exam page.";
      setCameraError(message);
      alert(message);
    }
  };

  const stopCamera = () => {
    if (faceDetectionIntervalRef.current) clearInterval(faceDetectionIntervalRef.current);
    if (videoRef.current?.srcObject) {
      (videoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
    }
  };

  const detectFace = async () => {
    if (!videoRef.current || !examStartedRef.current || !modelsLoadedRef.current) return;
    const video = videoRef.current;
    if (
      video.readyState < 2 ||
      video.paused ||
      video.ended ||
      video.videoWidth === 0 ||
      video.videoHeight === 0
    ) return;

    try {
      const detections = await faceapi.detectAllFaces(
        video,
        new faceapi.TinyFaceDetectorOptions({ inputSize: 416, scoreThreshold: 0.3 })
      );

      const now = Date.now();
      if (detections.length === 0) {
        if (!noFaceStartedAtRef.current) {
          noFaceStartedAtRef.current = now;
        }
        consecutiveMultipleFacesRef.current = 0;
        const noFaceDuration = now - noFaceStartedAtRef.current;
        if (noFaceDuration >= NO_FACE_VIOLATION_DELAY_MS) {
          setFaceDetected(false);
          if (
            !lastNoFaceWarningAtRef.current ||
            now - lastNoFaceWarningAtRef.current >= NO_FACE_REPEAT_DELAY_MS
          ) {
            lastNoFaceWarningAtRef.current = now;
            addWarning("No face detected - student may have left the camera");
          }
        }
      } else if (detections.length > 1) {
        consecutiveMultipleFacesRef.current += 1;
        noFaceStartedAtRef.current = null;
        lastNoFaceWarningAtRef.current = null;
        setFaceDetected(true);
        if (consecutiveMultipleFacesRef.current === MULTIPLE_FACE_VIOLATION_THRESHOLD) {
          addWarning("Multiple faces detected in camera");
        }
      } else {
        noFaceStartedAtRef.current = null;
        lastNoFaceWarningAtRef.current = null;
        consecutiveMultipleFacesRef.current = 0;
        setFaceDetected(true);
      }
    } catch (err) {
      console.error("Face detection failed:", err);
    }

    // Capture periodic photos every 5-10 minutes (random interval)
    const now = Date.now();
    const minInterval = 5 * 60 * 1000;
    const maxInterval = 10 * 60 * 1000;
    const randomInterval = Math.random() * (maxInterval - minInterval) + minInterval;
    if (now - lastPhotoCapture > randomInterval) {
      capturePhoto("periodic");
      setLastPhotoCapture(now);
    }
  };

  const setupScreenRecordingDetection = () => {
    const originalGetDisplayMedia = navigator.mediaDevices?.getDisplayMedia?.bind(navigator.mediaDevices);
    if (!originalGetDisplayMedia) return () => {};

    (navigator.mediaDevices as any).getDisplayMedia = async (constraints?: DisplayMediaStreamOptions) => {
      if (examStartedRef.current) addWarning("Screen recording attempt detected");
      throw new DOMException("Screen capture is not allowed during exam", "NotAllowedError");
    };

    return () => {
      if (originalGetDisplayMedia) {
        (navigator.mediaDevices as any).getDisplayMedia = originalGetDisplayMedia;
      }
    };
  };

  const setupAntiCheating = () => {
    const clearAwayTimer = () => {
      if (awayTimerRef.current) {
        clearTimeout(awayTimerRef.current);
        awayTimerRef.current = null;
      }
    };

    const startAwayTimer = (reason: string) => {
      if (awayTimerRef.current) return;
      awayTimerRef.current = setTimeout(() => {
        if (!examStartedRef.current) return;
        addWarning(`Cheating: stayed away from exam tab for 15 seconds (${reason})`);
        awayTimerRef.current = null;
      }, 15000);
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      if (examStartedRef.current) addWarning("Right-click detected");
    };

    const handleVisibilityChange = () => {
      if (!examStartedRef.current) return;
      if (document.hidden) {
        addWarning("App minimized / switched to background");
        startAwayTimer("tab hidden");
      } else {
        clearAwayTimer();
      }
    };

    // Catches: new tab opened, address bar clicked, alt-tab, window minimized
    const handleWindowBlur = () => {
      if (!examStartedRef.current) return;
      addWarning("App switched to background / another window opened");
      startAwayTimer("window blur");
    };

    const handleWindowFocus = () => {
      clearAwayTimer();
    };

    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && examStartedRef.current) {
        addWarning("Fullscreen exited");
        setTimeout(() => document.documentElement.requestFullscreen?.(), 100);
      }
    };

    const handleCopy = (e: ClipboardEvent) => {
      if (examStartedRef.current) { e.preventDefault(); addWarning("Copy detected"); }
    };

    const handlePaste = (e: ClipboardEvent) => {
      if (examStartedRef.current) { e.preventDefault(); addWarning("Paste detected"); }
    };

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (examStartedRef.current) {
        e.preventDefault();
        e.returnValue = "Your exam is still in progress. Are you sure you want to leave?";
        return e.returnValue;
      }
    };

    const handlePageHide = () => {
      if (!examStartedRef.current) return;
      const token = localStorage.getItem("access_token");
      if (!token) return;
      // sendBeacon works even during page close
      navigator.sendBeacon(
        `${API_URL}/exams/${examId}/session/end-beacon/`,
        new Blob([JSON.stringify({ token, session_token: sessionTokenRef.current })], { type: "application/json" })
      );
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (!examStartedRef.current) return;
      if (
        e.key === "F12" ||
        (e.ctrlKey && e.shiftKey && (e.key === "I" || e.key === "J")) ||
        (e.ctrlKey && e.key === "u") ||
        (e.ctrlKey && e.key === "t") ||
        (e.ctrlKey && e.key === "n") ||
        (e.ctrlKey && e.key === "w") ||
        (e.ctrlKey && e.key === "p") ||
        e.key === "PrintScreen"
      ) {
        e.preventDefault();
        if (e.key === "t" || e.key === "n") addWarning("Attempted to open new tab/window");
        else if (e.key === "w") addWarning("Attempted to close tab");
        else if (e.key === "p") addWarning("Print/screenshot attempt detected");
        else if (e.key === "PrintScreen") addWarning("Screenshot attempt detected");
        else addWarning("Developer tools attempt detected");
      }
    };

    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("copy", handleCopy);
    document.addEventListener("paste", handlePaste);
    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("blur", handleWindowBlur);
    window.addEventListener("focus", handleWindowFocus);
    window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener("pagehide", handlePageHide);
    const cleanupScreenRecording = setupScreenRecordingDetection();

    return () => {
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("copy", handleCopy);
      document.removeEventListener("paste", handlePaste);
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("blur", handleWindowBlur);
      window.removeEventListener("focus", handleWindowFocus);
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("pagehide", handlePageHide);
      clearAwayTimer();
      cleanupScreenRecording();
    };
  };

  const addWarning = (message: string) => {
    const now = Date.now();
    if (lastWarningRef.current && 
        lastWarningRef.current.message === message && 
        now - lastWarningRef.current.time < 1000) {
      return;
    }
    
    lastWarningRef.current = { message, time: now };
    const timestamp = new Date().toLocaleTimeString();
    setWarnings(prev => [...prev, `[${timestamp}] ${message}`]);
    setWarningCount(prev => prev + 1);
    
    // Capture photo on violation
    capturePhoto('violation', message);
  };

  const capturePhoto = async (captureType: 'start' | 'periodic' | 'violation', violationReason?: string) => {
    if (!videoRef.current || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const video = videoRef.current;
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.drawImage(video, 0, 0);
    const photoData = canvas.toDataURL('image/jpeg', 0.8);
    
    try {
      await apiFetch(`${API_URL}/exams/${examId}/capture-photo/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(sessionTokenRef.current ? { "X-Exam-Session": sessionTokenRef.current } : {}),
        },
        body: JSON.stringify({ 
          photo: photoData, 
          capture_type: captureType,
          violation_reason: violationReason,
          session_token: sessionTokenRef.current,
        }),
      });
    } catch (err) {
      console.error("Failed to capture photo");
    }
  };

  const handleStartExam = async () => {
    const video = videoRef.current;
    const stream = video?.srcObject as MediaStream | null;
    const hasLiveVideo =
      !!video &&
      !!stream &&
      stream.getVideoTracks().some((track) => track.readyState === "live" && track.enabled) &&
      video.readyState >= 2 &&
      video.videoWidth > 0 &&
      video.videoHeight > 0;

    if (!cameraActive || !hasLiveVideo) {
      alert(
        cameraError ||
          "Camera is required before you can take this exam. Please allow camera access and wait for the preview to load."
      );
      return;
    }

    try {
      const res = await apiFetch(`${API_URL}/exams/${examId}/session/start/`, {
        method: "POST",
        headers: {
          ...(sessionTokenRef.current ? { "X-Exam-Session": sessionTokenRef.current } : {}),
        },
      });
      if (!res.ok) {
        const message = await readErrorMessage(res, "Failed to start exam session.");
        alert(message);
        return;
      }
      const data = await res.json();
      if (data.session_token) {
        sessionTokenRef.current = data.session_token;
        sessionStorage.setItem(sessionKey(), data.session_token);
      }
    } catch {
      alert("Unable to reach the exam server. Please check your connection and try again.");
      return;
    }
    setExamStarted(true);
    examStartedRef.current = true;
    document.documentElement.requestFullscreen?.();
    capturePhoto('start');
    // Send heartbeat every 30 seconds
    heartbeatRef.current = setInterval(async () => {
      try {
        await apiFetch(`${API_URL}/exams/${examId}/session/heartbeat/`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(sessionTokenRef.current ? { "X-Exam-Session": sessionTokenRef.current } : {}),
          },
          body: JSON.stringify({ session_token: sessionTokenRef.current }),
        });
      } catch {}
    }, 30000);
  };

  const handleSubmit = async () => {
    if (submitting) return;
    setSubmitting(true);
    examStartedRef.current = false;
    if (heartbeatRef.current) clearInterval(heartbeatRef.current);
    console.log("=== SUBMITTING EXAM ===");
    console.log("Answers being submitted:", answers);
    console.log("Number of answers:", Object.keys(answers).length);
    console.log("=== END ===");
    
    try {
      const res = await apiFetch(`${API_URL}/exams/${examId}/submit/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(sessionTokenRef.current ? { "X-Exam-Session": sessionTokenRef.current } : {}),
        },
        body: JSON.stringify({ answers, session_token: sessionTokenRef.current }),
      });

      if (!res.ok) {
        const errorMessage = await readErrorMessage(res, "Failed to submit exam.");
        throw new Error(errorMessage);
      }
      
      const result = await res.json();
      console.log("Submission result:", result);

      clearSavedAnswers();
      sessionStorage.removeItem(sessionKey());
      sessionTokenRef.current = null;
      
      if (document.fullscreenElement) {
        await document.exitFullscreen().catch(() => {});
      }
      
      if (result.needs_manual_grading) {
        alert("Exam submitted successfully!\n\nYour exam contains essay/enumeration questions that require manual grading by your instructor.\nYour results will be available once grading is complete.");
      } else {
        const penaltyMsg = result.penalty_percent > 0
          ? `\nPenalty applied: -${result.penalty_percent}% (score before penalty: ${result.score_before_penalty})`
          : '';
        alert(`Exam submitted successfully!\nScore: ${result.score}/${result.total_points}\nGrade: ${result.grade}${penaltyMsg}`);
      }
      
      router.push("/dashboard/student");
    } catch (err) {
      console.error("Submission error:", err);
      const message =
        err instanceof Error && err.message
          ? err.message
          : "Unable to reach the exam server. Please check your connection and try submitting again.";
      alert(message);

      setSubmitting(false);
      examStartedRef.current = true;
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-50 via-blue-50 to-cyan-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-2 border-sky-600"></div>
          <p className="mt-4 text-slate-600">Loading exam...</p>
        </div>
      </div>
    );
  }

  if (terminationBlocked) {
    return (
      <div className="min-h-screen bg-red-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-red-600 mb-4">Exam Terminated</h2>
          <p className="text-slate-600 mb-2">Too many violations detected during this exam session.</p>
          {terminationCount > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 my-4">
              <p className="text-red-800 font-semibold">Termination Count: {terminationCount}/3</p>
              {terminationCount >= 3 ? (
                <p className="text-red-600 text-sm mt-2">⚠️ You have been permanently blocked from this exam</p>
              ) : (
                <p className="text-yellow-700 text-sm mt-2">Warning: {3 - terminationCount} more termination(s) will result in permanent block</p>
              )}
            </div>
          )}
          <p className="text-slate-500 text-sm mb-6">Your instructor has been notified.</p>
          <div className="inline-flex items-center gap-2 rounded-lg bg-red-100 px-4 py-3 text-sm font-semibold text-red-700">
            You have been permanently blocked. Please contact your instructor.
          </div>
        </div>
      </div>
    );
  }
  
  if (terminationProcessing) {
    return (
      <div className="min-h-screen bg-red-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-red-600 mb-4">Recording Termination</h2>
          <p className="text-slate-600">Please wait a moment...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-blue-50 to-cyan-50">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(56,189,248,0.15),transparent_50%)]" />
      <div className="relative">
        {examStarted && terminationCount > 0 && (
          <div className="bg-orange-50 border-b border-orange-300 px-6 py-3 text-orange-800 flex items-center gap-3">
            <span className="text-lg">⚠️</span>
            <span className="font-bold">Termination Warning:</span>
            <span className="text-sm">
              You have been terminated <strong>{terminationCount}/3</strong> time(s).
              {terminationCount >= 2
                ? " One more termination will permanently block you from this exam."
                : " Focus on your exam to avoid further violations."}
            </span>
          </div>
        )}
        {extensionToast && (
          <div className="absolute top-20 right-6 z-20 rounded-2xl bg-emerald-600 text-white px-4 py-3 text-sm font-semibold shadow-xl shadow-emerald-600/30">
            {extensionToast}
          </div>
        )}
        <div className="bg-white/60 backdrop-blur-xl border-b border-sky-200/50 px-6 py-4 flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-4">
            <div className="text-xl font-bold text-slate-900">Exam in Progress</div>
            <div className={`px-3 py-1 rounded-full text-sm font-semibold ${cameraActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
              📹 {cameraActive ? "Camera Active" : "Camera Inactive"}
            </div>
            <div className={`px-3 py-1 rounded-full text-sm font-semibold ${faceDetected ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
              {faceDetected ? "✓ Face Detected" : "⚠ Face Not Clear"}
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="px-3 py-1 rounded-full text-sm font-semibold bg-green-100 text-green-700">
              Server Connected
            </div>
            
            <div className="text-2xl font-bold text-sky-600">⏱️ {formatTime(timeLeft)}</div>
            <div className={`px-3 py-1 rounded-full text-sm font-semibold ${warningCount === 0 ? "bg-green-100 text-green-700" : warningCount < 3 ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"}`}>
              ⚠️ Warnings: {warningCount}/5
            </div>
          </div>
        </div>

        <div className="flex h-[calc(100vh-73px)]">
          <div className="flex-1 overflow-y-auto p-6 select-none">
            <div className="max-w-4xl mx-auto">
              <div className="bg-white/60 backdrop-blur-xl rounded-2xl shadow-xl border border-sky-200/50 p-6 mb-6">
                <h1 className="text-2xl font-bold text-slate-900 mb-4">{exam?.title}</h1>
                <p className="text-slate-600 mb-6">{exam?.subject}</p>
                
                {!examStarted ? (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">📝</div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-4">Ready to Start?</h2>
                    <p className="text-slate-600 mb-2">Duration: {exam?.duration_minutes} minutes</p>
                    <p className="text-slate-600 mb-6">Total Points: {exam?.total_points}</p>
                    {exam?.instructions && (
                      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 text-left">
                        <h3 className="font-bold text-blue-900 mb-2">Instructions:</h3>
                        <p className="text-blue-800 text-sm">{exam.instructions}</p>
                      </div>
                    )}
                    <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
                      <h3 className="font-bold text-yellow-900 mb-2">⚠️ Anti-Cheating Measures Active:</h3>
                      <ul className="text-sm text-yellow-800 text-left space-y-1">
                        <li>• Webcam monitoring is enabled</li>
                        <li>• Tab switching, minimizing &amp; app backgrounding will be detected</li>
                        <li>• Opening new tabs/windows is blocked</li>
                        <li>• Copy/paste is disabled</li>
                        <li>• Fullscreen mode is required</li>
                        <li>• Closing the tab will be blocked during exam</li>
                        <li>• Closing or leaving the exam page counts as 1 termination</li>
                        <li>• Screenshots and printing are blocked</li>
                        <li>• Screen recording is blocked</li>
                        <li>• 5 violations = automatic termination</li>
                      </ul>
                    </div>
                    {!cameraActive && (
                      <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                        {cameraError || "Camera access is required. Turn on your camera before starting the exam."}
                      </div>
                    )}
                    <button
                      onClick={handleStartExam}
                      disabled={!cameraActive}
                      className="bg-gradient-to-r from-sky-500 to-blue-500 text-white px-8 py-4 rounded-xl hover:shadow-xl font-bold text-lg disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Start Exam Now
                    </button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {exam?.questions?.map((question: any, index: number) => (
                      <div key={question.id} className="bg-sky-50 border border-sky-200 rounded-xl p-6">
                        <div className="flex justify-between items-start mb-3">
                          <h3 className="font-bold text-slate-900">Question {index + 1}</h3>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setQuestionToReport({ ...question, order: index + 1 })}
                              className="rounded-full border border-amber-200 bg-white px-3 py-1 text-xs font-semibold text-amber-700 hover:bg-amber-50"
                            >
                              Report Issue
                            </button>
                            <span className="text-sm bg-sky-100 text-sky-700 px-3 py-1 rounded-full">{question.points} pts</span>
                          </div>
                        </div>
                        <p className="text-slate-700 mb-4">{question.question}</p>
                        
                        {question.type === 'multiple_choice' && question.options && (
                          <div className="space-y-2">
                            {question.options.map((option: string, optIndex: number) => (
                              <label key={optIndex} className="flex items-center gap-3 p-3 bg-white border border-sky-200 rounded-lg cursor-pointer hover:bg-sky-50">
                                <input
                                  type="radio"
                                  name={`q${question.id}`}
                                  value={option}
                                  checked={answers[question.id] === option}
                                  onChange={(e) => setAnswers(prev => ({ ...prev, [question.id]: e.target.value }))}
                                  className="w-4 h-4 text-sky-600"
                                />
                                <span className="text-slate-900">{option}</span>
                              </label>
                            ))}
                          </div>
                        )}
                        
                        {(question.type === 'essay' || question.type === 'identification' || question.type === 'enumeration') && (
                          <textarea
                            className="w-full bg-white border border-sky-200 rounded-lg p-4 text-slate-900 min-h-32 focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                            placeholder="Type your answer here..."
                            value={answers[question.id] || ""}
                            onChange={(e) => setAnswers(prev => ({ ...prev, [question.id]: e.target.value }))}
                          />
                        )}
                      </div>
                    ))}
                    
                    <button onClick={handleSubmit} disabled={submitting} className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white py-4 rounded-xl hover:shadow-xl font-bold text-lg disabled:opacity-50">
                      {submitting ? "Submitting..." : "Submit Exam"}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="w-80 bg-white/60 backdrop-blur-xl border-l border-sky-200/50 p-4 overflow-y-auto shadow-lg">
            <div className="mb-6">
              <h3 className="font-bold text-slate-900 mb-3">Live Monitoring</h3>
              <div className="relative bg-slate-100 rounded-lg overflow-hidden border border-sky-200">
                <video ref={videoRef} autoPlay muted className="w-full h-48 object-cover" />
                <canvas ref={canvasRef} className="hidden" />
                <div className="absolute top-2 right-2 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
              </div>
              <p className="text-xs text-slate-600 mt-2">Your session is being monitored for academic integrity.</p>
            </div>
            
            <div>
              <h3 className="font-bold text-slate-900 mb-3">Activity Log</h3>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {warnings.length === 0 ? (
                  <p className="text-sm text-slate-600">No violations detected</p>
                ) : (
                  warnings.map((warning, idx) => (
                    <div key={idx} className="bg-yellow-50 border border-yellow-200 rounded-lg p-2 text-xs text-yellow-700">{warning}</div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      {questionToReport && (
        <ReportIssueModal
          examId={String(examId)}
          question={questionToReport}
          reportedAnswer={answers[questionToReport.id] || ""}
          onClose={() => setQuestionToReport(null)}
        />
      )}
    </div>
  );
}
