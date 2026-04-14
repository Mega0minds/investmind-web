export const ROLE_ALIASES = {
  innovator: "founder",
  mentor: "investor",
} as const;

export type CanonicalRole = "founder" | "investor" | "admin";
export type AnyRole = CanonicalRole | keyof typeof ROLE_ALIASES;

/**
 * Normalizes role aliases so the app can treat:
 * - innovator ≈ founder
 * - mentor ≈ investor
 */
export function normalizeRole(role: string | null | undefined): CanonicalRole | "unknown" {
  if (!role) return "unknown";
  const r = String(role).toLowerCase().trim();
  if (r === "admin") return "admin";
  if (r === "founder" || r === "investor") return r;
  if (r === "innovator") return "founder";
  if (r === "mentor") return "investor";
  return "unknown";
}

export function roleIn(role: string | null | undefined, canonical: Exclude<CanonicalRole, "admin">): boolean {
  return normalizeRole(role) === canonical;
}

export function rolesForAudienceFilter(canonical: Exclude<CanonicalRole, "admin">): string[] {
  // Include both canonical values and their legacy/alias values when querying profiles.
  if (canonical === "founder") return ["founder", "innovator"];
  return ["investor", "mentor"];
}

