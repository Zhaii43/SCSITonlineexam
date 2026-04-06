const DEFAULT_API_BASE_URL = "https://scsitonlineexambackend.onrender.com";

function normalizeBackendUrl(value: string) {
  return value.trim().replace(/\/+$/, "").replace(/\/api$/, "");
}

export function getServerBackendUrl() {
  const candidates = [
    process.env.API_URL,
    process.env.NEXT_PUBLIC_API_BASE_URL,
    process.env.NEXT_PUBLIC_API_URL,
    DEFAULT_API_BASE_URL,
  ];

  for (const candidate of candidates) {
    if (candidate && candidate.trim()) {
      return normalizeBackendUrl(candidate);
    }
  }

  return DEFAULT_API_BASE_URL;
}
