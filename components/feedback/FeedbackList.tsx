"use client";

import { useState } from "react";
import { Feedback } from "@/types";
import { FeedbackStatusBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import styles from "./FeedbackList.module.css";

interface FeedbackListProps {
  feedbacks: Feedback[];
  isProjectOwner: boolean;
  onApprove?: (feedbackId: string, action: "approve" | "reject") => void;
}

export function FeedbackList({
  feedbacks,
  isProjectOwner,
  onApprove,
}: FeedbackListProps) {
  const [processing, setProcessing] = useState<string | null>(null);

  const handleAction = async (
    feedbackId: string,
    action: "approve" | "reject"
  ) => {
    setProcessing(feedbackId);
    try {
      const res = await fetch(`/api/feedbacks/${feedbackId}/approve`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });

      if (res.ok) {
        onApprove?.(feedbackId, action);
      }
    } finally {
      setProcessing(null);
    }
  };

  if (feedbacks.length === 0) {
    return (
      <div className={styles.empty}>
        <span>💬</span>
        <p>No feedback yet. Be the first to review this project!</p>
      </div>
    );
  }

  return (
    <div className={styles.list}>
      {feedbacks.map((feedback) => (
        <div key={feedback.id} className={styles.item} id={`feedback-${feedback.id}`}>
          <div className={styles.header}>
            <div className={styles.scores}>
              <span className={styles.uxScore}>
                {"★".repeat(feedback.uxScore)}
                {"☆".repeat(5 - feedback.uxScore)}
                <span className={styles.uxLabel}>UX: {feedback.uxScore}/5</span>
              </span>
              {feedback.bugCount > 0 && (
                <span className={styles.bugCount}>
                  🐛 {feedback.bugCount} bug{feedback.bugCount > 1 ? "s" : ""}
                </span>
              )}
            </div>
            <FeedbackStatusBadge status={feedback.status} />
          </div>

          <p className={styles.text}>{feedback.qualitativeText}</p>

          {feedback.bugLogs && (
            <div className={styles.bugLogs}>
              <h5>Bug Details</h5>
              <p>{feedback.bugLogs}</p>
            </div>
          )}

          {feedback.promptEvaluation && (
            <div className={styles.promptEval}>
              <h5>AI / Prompt Evaluation</h5>
              <p>{feedback.promptEvaluation}</p>
            </div>
          )}

          <div className={styles.footer}>
            <time className={styles.date}>
              {feedback.submittedAt &&
                new Date(
                  (feedback.submittedAt as unknown as { seconds: number }).seconds * 1000
                ).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
            </time>

            {isProjectOwner && feedback.status === "pending" && (
              <div className={styles.actions}>
                <Button
                  size="sm"
                  variant="secondary"
                  loading={processing === feedback.id}
                  onClick={() => handleAction(feedback.id, "reject")}
                  id={`reject-${feedback.id}`}
                >
                  Reject
                </Button>
                <Button
                  size="sm"
                  variant="accent"
                  loading={processing === feedback.id}
                  onClick={() => handleAction(feedback.id, "approve")}
                  id={`approve-${feedback.id}`}
                >
                  ✓ Approve
                </Button>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
