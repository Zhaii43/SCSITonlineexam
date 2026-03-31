const DEFAULT_FRONTEND_HOST = "scsi-tonlineexam.vercel.app";
const DEFAULT_API_BASE_URL = "https://scsitonlineexambackend.onrender.com";

function resolveApiBaseUrl() {
  const envBaseUrl =
    process.env.NEXT_PUBLIC_API_BASE_URL ??
    process.env.NEXT_PUBLIC_API_URL?.replace(/\/api\/?$/, "");

  if (envBaseUrl) {
    return envBaseUrl.replace(/\/+$/, "");
  }

  if (typeof window !== "undefined" && window.location.hostname === DEFAULT_FRONTEND_HOST) {
    return DEFAULT_API_BASE_URL;
  }

  return DEFAULT_API_BASE_URL;
}

export const API_BASE_URL = resolveApiBaseUrl();
export const API_URL = `${API_BASE_URL}/api`;
export const WS_URL =
  process.env.NEXT_PUBLIC_WS_URL ?? "wss://scsitonlineexambackend.onrender.com";

export function apiUrl(path: string) {
  if (!path.startsWith("/")) {
    return `${API_BASE_URL}/${path}`;
  }

  return `${API_BASE_URL}${path}`;
}

/**
 * Wrapper around fetch that automatically refreshes the access token
 * when a 401 is received, then retries the original request once.
 */
export async function apiFetch(input: RequestInfo, init: RequestInit = {}): Promise<Response> {
  const token = localStorage.getItem("access_token");

  const headers = new Headers(init.headers || {});
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (!headers.has("Content-Type") && !(init.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  let res = await fetch(input, { ...init, headers });

  if (res.status === 401) {
    const refreshToken = localStorage.getItem("refresh_token");
    if (!refreshToken) {
      redirectToLogin();
      return res;
    }

    const refreshRes = await fetch(`${API_URL}/token/refresh/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh: refreshToken }),
    });

    if (!refreshRes.ok) {
      redirectToLogin();
      return res;
    }

    const { access } = await refreshRes.json();
    localStorage.setItem("access_token", access);

    // Retry original request with new token
    headers.set("Authorization", `Bearer ${access}`);
    res = await fetch(input, { ...init, headers });
  }

  return res;
}

function redirectToLogin() {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
  if (typeof window !== "undefined") window.location.href = "/login";
}
