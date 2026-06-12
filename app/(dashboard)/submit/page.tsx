"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { useLanguage } from "@/components/LanguageProvider";
import styles from "./page.module.css";

const NICHES = [
  "productivity", "saas-tools", "ai", "developer-tools",
  "marketing", "analytics", "e-commerce", "education", "finance", "health",
];

const TECH_OPTIONS = [
  "Next.js", "React", "Vue", "Svelte", "Angular", "Node.js",
  "Python", "Firebase", "Supabase", "PostgreSQL", "Stripe", "OpenAI",
  "LangChain", "Vercel", "AWS",
];

const HELP_OPTIONS = [
  "Onboarding Feedback", "UX Review", "Prompt Evaluation",
  "Pricing Feedback", "Bug Testing", "Feature Validation",
  "Marketing Copy Review", "Performance Review",
];

export default function SubmitPage() {
  const router = useRouter();
  const { t } = useLanguage();
  
  const [form, setForm] = useState({
    name: "",
    url: "",
    description: "",
    testInstructions: "",
    techStack: [] as string[],
    niche: "",
    helpTypes: [] as string[],
    visibility: "public" as "public" | "private",
    isStealth: false,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFirstProject, setIsFirstProject] = useState(true);

  useEffect(() => {
    fetch("/api/credits")
      .then((res) => res.json())
      .then((data) => {
        if (data && typeof data.isFirstProject === "boolean") {
          setIsFirstProject(data.isFirstProject);
        }
      })
      .catch((err) => console.error("Error fetching credit status:", err));
  }, []);

  const toggleArray = (field: "techStack" | "helpTypes", value: string) => {
    setForm((f) => ({
      ...f,
      [field]: f[field].includes(value)
        ? f[field].filter((v) => v !== value)
        : [...f[field], value],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Submission failed.");
        return;
      }

      router.push(`/showcase/${data.projectId}`);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>{t("submit.title")}</h1>
        <p className={styles.subtitle}>
          {isFirstProject ? t("submit.subtitleFirst") : t("submit.subtitleNormal")}
        </p>
      </div>

      <form className={styles.form} onSubmit={handleSubmit} id="submit-project-form" noValidate>
        {error && (
          <div className={styles.errorBanner} role="alert">⚠️ {error}</div>
        )}

        <div className={styles.formSection}>
          <h2 className={styles.formSectionTitle}>{t("submit.basicInfo")}</h2>

          <div className="form-field">
            <label htmlFor="project-name" className="form-label">
              {t("submit.projectName")} <span className={styles.req}>*</span>
            </label>
            <input
              id="project-name"
              type="text"
              className="form-input"
              placeholder="My Awesome SaaS"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              required
              maxLength={100}
            />
          </div>

          <div className="form-field">
            <label htmlFor="project-url" className="form-label">
              {t("submit.projectUrl")} <span className={styles.req}>*</span>
            </label>
            <input
              id="project-url"
              type="url"
              className="form-input"
              placeholder="https://myproject.com"
              value={form.url}
              onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))}
              required
            />
          </div>

          <div className="form-field">
            <label htmlFor="project-desc" className="form-label">
              {t("submit.description")} <span className={styles.req}>*</span>
            </label>
            <textarea
              id="project-desc"
              className="form-input"
              placeholder={t("submit.descriptionPlaceholder")}
              value={form.description}
              onChange={(e) =>
                setForm((f) => ({ ...f, description: e.target.value }))
              }
              required
              rows={4}
              maxLength={1000}
            />
          </div>

          <div className="form-field">
            <label htmlFor="project-niche" className="form-label">
              {t("submit.niche")} <span className={styles.req}>*</span>
            </label>
            <select
              id="project-niche"
              className="form-input"
              value={form.niche}
              onChange={(e) => setForm((f) => ({ ...f, niche: e.target.value }))}
              required
            >
              <option value="">{t("submit.selectNiche")}</option>
              {NICHES.map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>
        </div>

        <div className={styles.formSection}>
          <h2 className={styles.formSectionTitle}>{t("submit.techStack")}</h2>
          <p className={styles.formSectionDesc}>{t("submit.techStackDesc")}</p>
          <div className={styles.chips}>
            {TECH_OPTIONS.map((tech) => (
              <button
                key={tech}
                type="button"
                className={`${styles.chip} ${
                  form.techStack.includes(tech) ? styles.chipSelected : ""
                }`}
                onClick={() => toggleArray("techStack", tech)}
                id={`tech-${tech.toLowerCase().replace(/[^a-z0-9]/g, "-")}`}
              >
                {tech}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.formSection}>
          <h2 className={styles.formSectionTitle}>{t("submit.helpNeed")}</h2>
          <p className={styles.formSectionDesc}>{t("submit.helpNeedDesc")}</p>
          <div className={styles.chips}>
            {HELP_OPTIONS.map((help) => (
              <button
                key={help}
                type="button"
                className={`${styles.chip} ${
                  form.helpTypes.includes(help) ? styles.chipSelectedAccent : ""
                }`}
                onClick={() => toggleArray("helpTypes", help)}
                id={`help-${help.toLowerCase().replace(/[^a-z0-9]/g, "-")}`}
              >
                {help}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.formSection}>
          <h2 className={styles.formSectionTitle}>{t("submit.testInstructions")}</h2>
          <div className="form-field">
            <label htmlFor="project-instructions" className="form-label">
              {t("submit.testInstructionsLabel")} <span className={styles.req}>*</span>
            </label>
            <textarea
              id="project-instructions"
              className="form-input"
              placeholder={t("submit.testInstructionsPlaceholder")}
              value={form.testInstructions}
              onChange={(e) =>
                setForm((f) => ({ ...f, testInstructions: e.target.value }))
              }
              required
              rows={5}
            />
          </div>
        </div>

        <div className={styles.formSection}>
          <h2 className={styles.formSectionTitle}>{t("submit.visibility")}</h2>
          <div className={styles.visibilityOptions}>
            {(["public", "private"] as const).map((v) => (
              <label
                key={v}
                className={`${styles.visOption} ${
                  form.visibility === v ? styles.visOptionSelected : ""
                }`}
                htmlFor={`visibility-${v}`}
              >
                <input
                  id={`visibility-${v}`}
                  type="radio"
                  name="visibility"
                  value={v}
                  checked={form.visibility === v}
                  onChange={() => setForm((f) => ({ ...f, visibility: v }))}
                  className={styles.radioInput}
                />
                <span className={styles.visIcon}>{v === "public" ? "🌍" : "🔒"}</span>
                <div>
                  <span className={styles.visLabel}>
                    {v === "public" ? t("submit.public") : t("submit.private")}
                  </span>
                  <span className={styles.visDesc}>
                    {v === "public" ? t("submit.publicDesc") : t("submit.privateDesc")}
                  </span>
                </div>
              </label>
            ))}
          </div>
        </div>

        <div className={styles.formSection}>
          <h2 className={styles.formSectionTitle}>Modo Stealth (Privacidade Extra)</h2>
          <p className={styles.formSectionDesc}>
            Restrinja o acesso aos detalhes e links de teste do seu projeto apenas a avaliadores que possuem reputação de excelência.
          </p>
          <div style={{ marginTop: 12 }}>
            <label
              className={`${styles.visOption} ${
                form.isStealth ? styles.visOptionSelected : ""
              }`}
              htmlFor="is-stealth-checkbox"
              style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 12 }}
            >
              <input
                id="is-stealth-checkbox"
                type="checkbox"
                checked={form.isStealth}
                onChange={(e) => setForm((f) => ({ ...f, isStealth: e.target.checked }))}
                style={{ width: 18, height: 18, cursor: "pointer", accentColor: "var(--color-primary)" }}
              />
              <div>
                <span className={styles.visLabel} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  🕵️ Ativar Modo Stealth
                </span>
                <span className={styles.visDesc}>
                  Apenas avaliadores de elite com reputação &ge; 95% (taxa de aprovação de feedback) poderão visualizar o link e enviar avaliações.
                </span>
              </div>
            </label>
          </div>
        </div>

        <div className={styles.submitRow}>
          <div className={styles.costNote}>
            {isFirstProject ? t("submit.submitRowFirst") : t("submit.submitRowNormal")}
          </div>
          <Button
            type="submit"
            variant="primary"
            size="lg"
            loading={submitting}
            disabled={
              !form.name ||
              !form.url ||
              !form.description ||
              !form.niche ||
              !form.testInstructions ||
              form.techStack.length === 0 ||
              form.helpTypes.length === 0
            }
            id="submit-project-btn"
          >
            {isFirstProject ? t("submit.btnSubmitFirst") : t("submit.btnSubmitNormal")}
          </Button>
        </div>
      </form>
    </div>
  );
}
