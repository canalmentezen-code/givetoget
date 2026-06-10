import { MIN_FEEDBACK_CHARS } from "@/types";

// ─── Feedback Validation ──────────────────────────────────────────────────────

export interface FeedbackValidationInput {
  qualitativeText: string;
  bugCount: number;
  bugLogs: string;
  reviewerId: string;
  projectOwnerId: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

const GENERIC_PATTERNS = [
  /^(great|good|nice|ok|okay|test|lorem|ipsum)\b/i,
  /(.)\1{10,}/, // repeated characters
];

export function validateFeedback(
  input: FeedbackValidationInput
): ValidationResult {
  const errors: string[] = [];

  // Self-review check
  if (input.reviewerId === input.projectOwnerId) {
    errors.push("You cannot review your own project.");
  }

  // Minimum character check
  const trimmed = input.qualitativeText.trim();
  if (trimmed.length < MIN_FEEDBACK_CHARS) {
    errors.push(
      `Qualitative feedback must be at least ${MIN_FEEDBACK_CHARS} characters (currently ${trimmed.length}).`
    );
  }

  // Generic text detection
  for (const pattern of GENERIC_PATTERNS) {
    if (pattern.test(trimmed)) {
      errors.push("Feedback appears to be generic. Please provide detailed, specific insights.");
      break;
    }
  }

  // Bug logs required when bugs are found
  if (input.bugCount > 0 && !input.bugLogs.trim()) {
    errors.push("Bug descriptions are required when bug count is greater than zero.");
  }

  // UX score is validated at the route level via Zod

  return {
    valid: errors.length === 0,
    errors,
  };
}

// ─── Self-review check (exported separately for convenience) ──────────────────

export function isSelfReview(reviewerId: string, ownerId: string): boolean {
  return reviewerId === ownerId;
}
