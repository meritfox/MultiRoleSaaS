/**
 * Central form-validation helpers shared by the auth screens
 * (login / register). Each validator returns a human-readable error
 * string, or `null` when the value is valid.
 */

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function isValidEmail(email: string): boolean {
  return EMAIL_PATTERN.test(email.trim());
}

export function validateEmail(email: string): string | null {
  if (!email.trim()) return "Email is required.";
  if (!isValidEmail(email)) return "Enter a valid email address (e.g. you@example.com).";
  return null;
}

/** Registration-grade password rules (stricter than login). */
export function validatePassword(password: string): string | null {
  if (!password) return "Password is required.";
  if (password.length < 8) return "Password must be at least 8 characters.";
  return null;
}

/** Login only checks presence — the server validates credentials. */
export function validateLoginPassword(password: string): string | null {
  if (!password) return "Password is required.";
  return null;
}

export function validateConfirmPassword(password: string, confirm: string): string | null {
  if (!confirm) return "Please confirm your password.";
  if (password !== confirm) return "Passwords do not match.";
  return null;
}

export function validateDisplayName(name: string): string | null {
  if (!name.trim()) return "Full name is required.";
  if (name.trim().length < 2) return "Name must be at least 2 characters.";
  return null;
}

export function validatePhone(phone: string, isValid: (raw: string) => boolean): string | null {
  if (!phone.trim()) return "Phone number is required.";
  if (!isValid(phone)) return "Enter a valid phone number (e.g. +91 98765 43210).";
  return null;
}
