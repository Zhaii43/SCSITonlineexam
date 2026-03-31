export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "";
export const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? "";

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
