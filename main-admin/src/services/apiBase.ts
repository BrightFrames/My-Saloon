function normalizeApiBase(url?: string) {
  if (!url) return undefined;
  const trimmed = url.trim().replace(/\/$/, "");
  if (!trimmed) return undefined;
  return trimmed.endsWith("/api/v1") ? trimmed : `${trimmed}/api/v1`;
}

export const API_BASE_URL =
  normalizeApiBase(import.meta.env.VITE_API_URL) ||
  "http://localhost:3000/api/v1";

