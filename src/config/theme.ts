// Theme configuration — reads from environment variables
// Different values per client are set in Cloudflare Pages env vars

export const theme = {
  clientName: import.meta.env.VITE_CLIENT_NAME || "Real-Time Translator",
  logoUrl: import.meta.env.VITE_LOGO_URL || "/logos/default.png",
  primaryColor: import.meta.env.VITE_PRIMARY_COLOR || "#6366f1",
  secondaryColor: import.meta.env.VITE_SECONDARY_COLOR || "#4f46e5",
  defaultLanguage: import.meta.env.VITE_DEFAULT_TARGET_LANGUAGE_CODE || "en",
};