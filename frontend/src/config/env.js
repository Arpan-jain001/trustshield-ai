const fallbackApiBase = "/api";

function resolveApiBaseUrl() {
  const configuredApiBase = (import.meta.env.VITE_API_BASE_URL || "").trim().replace(/\/$/, "");

  if (configuredApiBase) {
    return configuredApiBase;
  }

  if (typeof window !== "undefined") {
    const hostname = window.location.hostname;
    const isLocalHost = hostname === "localhost" || hostname === "127.0.0.1" || hostname.endsWith(".local");

    if (isLocalHost) {
      return fallbackApiBase;
    }
  }

  return fallbackApiBase;
}

export const frontendEnv = {
  apiBaseUrl: resolveApiBaseUrl(),
  supportEmail: import.meta.env.VITE_SUPPORT_EMAIL || "",
  siteUrl: import.meta.env.VITE_SITE_URL || "https://trustshield-ai-frontend.vercel.app/"
};
