import { MAX_FEEDBACKS_PER_HOUR } from "@/types";

// ─── In-memory rate limiter ───────────────────────────────────────────────────
// Keyed by userId. Stores an array of timestamps for feedback submissions.
// Note: This works per-instance. For multi-instance deployments, use Redis/Firestore.

const feedbackTimestamps = new Map<string, number[]>();

const WINDOW_MS = 60 * 60 * 1000; // 1 hour

export function checkFeedbackRateLimit(userId: string): {
  allowed: boolean;
  remaining: number;
  resetAt: number;
} {
  const now = Date.now();
  const windowStart = now - WINDOW_MS;

  // Get existing timestamps, filtering out expired ones
  const existing = (feedbackTimestamps.get(userId) ?? []).filter(
    (ts) => ts > windowStart
  );

  if (existing.length >= MAX_FEEDBACKS_PER_HOUR) {
    const oldestInWindow = Math.min(...existing);
    const resetAt = oldestInWindow + WINDOW_MS;
    return {
      allowed: false,
      remaining: 0,
      resetAt,
    };
  }

  // Record this attempt
  existing.push(now);
  feedbackTimestamps.set(userId, existing);

  return {
    allowed: true,
    remaining: MAX_FEEDBACKS_PER_HOUR - existing.length,
    resetAt: now + WINDOW_MS,
  };
}

// Clean up stale entries periodically (run when module loads)
setInterval(() => {
  const now = Date.now();
  const windowStart = now - WINDOW_MS;
  for (const [userId, timestamps] of feedbackTimestamps.entries()) {
    const filtered = timestamps.filter((ts) => ts > windowStart);
    if (filtered.length === 0) {
      feedbackTimestamps.delete(userId);
    } else {
      feedbackTimestamps.set(userId, filtered);
    }
  }
}, WINDOW_MS);
