export type PasswordStrengthLevel =
  | "empty"
  | "very_weak"
  | "weak"
  | "fair"
  | "good"
  | "strong";

export type PasswordStrength = {
  /** 0–5 checklist score (length, lower, upper, digit, special). */
  score: number;
  level: PasswordStrengthLevel;
  /** Fill width 0–100. */
  percent: number;
  color: string;
};

/** Minimum score accepted for signup / password update (fair+). */
export const MIN_PASSWORD_STRENGTH_SCORE = 3;

export function scorePassword(password: string): number {
  let score = 0;
  if (password.length >= 8) score += 1;
  if (/[a-z]/.test(password)) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;
  return score;
}

export function getPasswordStrength(password: string): PasswordStrength {
  if (!password) {
    return {
      score: 0,
      level: "empty",
      percent: 0,
      color: "#94a3b8",
    };
  }

  const score = scorePassword(password);
  const percent = score * 20;

  if (score <= 1) {
    return { score, level: "very_weak", percent, color: "#ef4444" };
  }
  if (score === 2) {
    return { score, level: "weak", percent, color: "#f97316" };
  }
  if (score === 3) {
    return { score, level: "fair", percent, color: "#eab308" };
  }
  if (score === 4) {
    return { score, level: "good", percent, color: "#22c55e" };
  }
  return { score, level: "strong", percent, color: "#10b981" };
}

export function isPasswordStrongEnough(password: string): boolean {
  return scorePassword(password) >= MIN_PASSWORD_STRENGTH_SCORE;
}
