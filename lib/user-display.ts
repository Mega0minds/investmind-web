export function avatarInitials(displayName: string, fallback: string = "U"): string {
  const normalized = displayName.trim();
  if (!normalized) return fallback;
  return normalized.slice(0, 2).toUpperCase();
}
