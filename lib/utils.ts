/**
 * Shared utilities used across the app.
 * Import from "@/lib/utils".
 */

export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}
