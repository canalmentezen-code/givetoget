"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { useLanguage } from "@/components/LanguageProvider";
import { MIN_FEEDBACK_CHARS } from "@/types";
import styles from "./FeedbackForm.module.css";

interface FeedbackFormProps {
  projectId: string;
  projectName: string;
  hasPrompts?: boolean;
  onSuccess?: (feedbackId: string) => void;
}

export function FeedbackForm({
  projectId,
  projectName,
  hasPrompts = false,
  onSuccess,
}: FeedbackFormProps) {
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    qualitativeText: "",
    uxScore: 0,
    bugCount: 0,
    bugLogs: "",
    promptEvaluation: "",
  });
  const [errors, setErrors] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);

  const handleAiPolish = async () => {
    if (!formData.qualitativeText.trim()) return;
    setAiLoading(true);
    setErrors([]);
    try {
      const res = await fetch("/api/ai/polish-feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          draft: formData.qualitativeText,
          projectId,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrors([data.error ?? "Erro ao polir o feedback com IA."]);
        return;
      }

      if (data.polishedText) {
        setFormData((d) => ({ ...d, qualitativeText: data.polishedText }));
      }
    } catch {
      setErrors(["Erro de conexão com a IA. Tente novamente."]);
    } finally {
      setAiLoading(false);
    }
  };

  const charCount = formData.qualitativeText.trim().length;
  const charProgress = Math.min(charCount / MIN_FEEDBACK_CHARS, 1);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors([]);
    setSubmitting(true);

    try {
      const res = await fetch("/api/feedbacks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          qualitativeText: formData.qualitativeText,
          uxScore: formData.uxScore,
          bugCount: formData.bugCount,
          bugLogs: formData.bugLogs,
          promptEvaluation: hasPrompts ? formData.promptEvaluation : null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrors(data.errors ?? [data.error ?? "Something went wrong."]);
        return;
      }

      setSuccess(true);
      onSuccess?.(data.feedbackId);
    } catch {
      setErrors(["Network error. Please try again."]);
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className={styles.success}>
        <div className={styles.successIcon}>🎉</div>
        <h3>{t("feedbackForm.successTitle")}</h3>
        <p>{t("feedbackForm.successDesc")}</p>
      </div>
    );
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit} id="feedback-form" noValidate>
      <div className={styles.header}>
        <h3 className={styles.title}>{t("feedbackForm.title")} <span>{projectName}</span></h3>
        <p className={styles.subtitle}>{t("feedbackForm.subtitle")}</p>
      </div>

      {errors.length > 0 && (
        <div className={styles.errors} role="alert">
          <ul>
            {errors.map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Qualitative Text */}
      <div className="form-field">
        <label htmlFor="feedback-text" className="form-label">
          {t("feedbackForm.labelDetailed")}
          <span className={styles.required}>*</span>
        </label>
        <textarea
          id="feedback-text"
          className="form-input"
          placeholder={t("feedbackForm.placeholderDetailed")}
          rows={6}
          value={formData.qualitativeText}
          onChange={(e) =>
            setFormData((d) => ({ ...d, qualitativeText: e.target.value }))
          }
          required
        />
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
          {formData.qualitativeText.trim().length > 10 && (
            <button
              type="button"
              className={styles.aiBtn}
              onClick={handleAiPolish}
              disabled={aiLoading || submitting}
              id="ai-polish-btn"
            >
              {aiLoading ? (
                <>
                  <span className="spinner" style={{ width: 12, height: 12, marginRight: 6, display: "inline-block", border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff" }} />
                  Polindo...
                </>
              ) : (
                "✨ Polir com IA"
              )}
            </button>
          )}
        </div>
        <div className={styles.charCounter}>
          <div className={styles.charBar}>
            <div
              className={styles.charFill}
              style={{
                width: `${charProgress * 100}%`,
                background:
                  charProgress >= 1
                    ? "var(--color-success)"
                    : "var(--color-primary)",
              }}
            />
          </div>
          <span
            className={styles.charCount}
            style={{ color: charProgress >= 1 ? "var(--color-success)" : "var(--color-text-3)" }}
          >
            {charCount} / {MIN_FEEDBACK_CHARS} {t("feedbackForm.minChars")}
          </span>
        </div>
      </div>

      {/* UX Score */}
      <div className="form-field">
        <label className="form-label">
          {t("feedbackForm.labelUx")}
          <span className={styles.required}>*</span>
        </label>
        <div className={styles.stars} role="radiogroup" aria-label="UX Score">
          {[1, 2, 3, 4, 5].map((score) => (
            <button
              key={score}
              type="button"
              role="radio"
              aria-checked={formData.uxScore === score}
              aria-label={`${score} star${score > 1 ? "s" : ""}`}
              className={`${styles.star} ${formData.uxScore >= score ? styles.starActive : ""}`}
              onClick={() => setFormData((d) => ({ ...d, uxScore: score }))}
              id={`ux-score-${score}`}
            >
              ★
            </button>
          ))}
          {formData.uxScore > 0 && (
            <span className={styles.scoreLabel}>{formData.uxScore}/5</span>
          )}
        </div>
      </div>

      {/* Bug Count */}
      <div className="form-field">
        <label htmlFor="bug-count" className="form-label">
          {t("feedbackForm.labelBugs")}
        </label>
        <input
          id="bug-count"
          type="number"
          min={0}
          max={99}
          className="form-input"
          style={{ maxWidth: 120 }}
          value={formData.bugCount}
          onChange={(e) =>
            setFormData((d) => ({
              ...d,
              bugCount: Math.max(0, parseInt(e.target.value) || 0),
            }))
          }
        />
      </div>

      {/* Bug Logs (conditional) */}
      {formData.bugCount > 0 && (
        <div className="form-field">
          <label htmlFor="bug-logs" className="form-label">
            {t("feedbackForm.labelBugLogs")}
            <span className={styles.required}>*</span>
          </label>
          <textarea
            id="bug-logs"
            className="form-input"
            placeholder={t("feedbackForm.placeholderBugLogs")}
            rows={4}
            value={formData.bugLogs}
            onChange={(e) =>
              setFormData((d) => ({ ...d, bugLogs: e.target.value }))
            }
            required
          />
        </div>
      )}

      {/* Prompt Evaluation (optional, only shown for AI projects) */}
      {hasPrompts && (
        <div className="form-field">
          <label htmlFor="prompt-eval" className="form-label">
            {t("feedbackForm.labelPrompt")}
            <span className={styles.optional}> {t("feedbackForm.optional")}</span>
          </label>
          <textarea
            id="prompt-eval"
            className="form-input"
            placeholder={t("feedbackForm.placeholderPrompt")}
            rows={3}
            value={formData.promptEvaluation}
            onChange={(e) =>
              setFormData((d) => ({ ...d, promptEvaluation: e.target.value }))
            }
          />
        </div>
      )}

      <div className={styles.actions}>
        <div className={styles.creditNote}>
          {t("feedbackForm.creditNote")}
        </div>
        <Button
          type="submit"
          variant="primary"
          size="lg"
          loading={submitting}
          disabled={charCount < MIN_FEEDBACK_CHARS || formData.uxScore === 0}
          id="submit-feedback-btn"
        >
          {t("feedbackForm.btnSubmit")}
        </Button>
      </div>
    </form>
  );
}
