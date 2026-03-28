/** Minimum length for new passwords (signup & reset). */
export const PASSWORD_MIN_LENGTH = 8;

/** Avoid absurdly long strings (bcrypt and UX). */
export const PASSWORD_MAX_LENGTH = 128;

/**
 * Short hint shown under password fields.
 */
export const PASSWORD_REQUIREMENTS_HINT = `${PASSWORD_MIN_LENGTH}+ characters: uppercase, lowercase, number, and a special character.`;

/**
 * Returns the first validation problem, or `null` if the password meets policy.
 * Does not trim — leading/trailing spaces are rare and user-controlled.
 */
export function validateNewPassword(password: string): string | null {
  if (password.length < PASSWORD_MIN_LENGTH) {
    return `Password must be at least ${PASSWORD_MIN_LENGTH} characters.`;
  }
  if (password.length > PASSWORD_MAX_LENGTH) {
    return `Password must be at most ${PASSWORD_MAX_LENGTH} characters.`;
  }
  if (!/[a-z]/.test(password)) {
    return "Include at least one lowercase letter (a–z).";
  }
  if (!/[A-Z]/.test(password)) {
    return "Include at least one uppercase letter (A–Z).";
  }
  if (!/\d/.test(password)) {
    return "Include at least one number (0–9).";
  }
  // Any non–ASCII-letter, non-digit, non-whitespace counts as special (covers !@# etc.)
  if (!/[^A-Za-z0-9\s]/.test(password)) {
    return "Include at least one special character (e.g. ! @ # $ % & *).";
  }
  return null;
}
