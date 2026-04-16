const fallbackApiBase = "/api";

export const frontendEnv = {
  apiBaseUrl: (import.meta.env.VITE_API_BASE_URL || fallbackApiBase).replace(/\/$/, ""),
  supportEmail: import.meta.env.VITE_SUPPORT_EMAIL || "",
  siteUrl: import.meta.env.VITE_SITE_URL || "https://trustshield-ai-frontend.vercel.app/"
};
