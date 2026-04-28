/**
 * App-wide constants. Import from "@/lib/constants".
 */

export const ROLES = {
  ADMIN: "admin",
  FOUNDER: "founder",
  INVESTOR: "investor",
} as const;

/** Theme colors used by shared UI and feature widgets */
export const THEME = {
  primary: "#5A2D8F",
  accent: "#E84989",
  text: "#4A4A4A",
  textMuted: "#6B7280",
  border: "#E5E7EB",
  white: "#ffffff",
} as const;

/** Max characters for profile bio (settings). */
export const PROFILE_BIO_MAX_LENGTH = 300;

/** Max characters per social field (handles or URLs). */
export const PROFILE_SOCIAL_MAX_LENGTH = 200;
