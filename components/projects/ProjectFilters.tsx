"use client";

import { useState } from "react";
import styles from "./ProjectFilters.module.css";

const NICHES = [
  "productivity",
  "saas-tools",
  "ai",
  "developer-tools",
  "marketing",
  "analytics",
  "e-commerce",
  "education",
  "finance",
  "health",
];

const TECH_STACKS = [
  "Next.js",
  "React",
  "Vue",
  "Svelte",
  "Node.js",
  "Python",
  "Firebase",
  "Supabase",
  "Stripe",
  "OpenAI",
];

const HELP_TYPES = [
  "Onboarding Feedback",
  "UX Review",
  "Prompt Evaluation",
  "Pricing Feedback",
  "Bug Testing",
  "Feature Validation",
];

interface Filters {
  niche: string;
  techStack: string;
  helpType: string;
}

interface ProjectFiltersProps {
  onChange: (filters: Filters) => void;
}

export function ProjectFilters({ onChange }: ProjectFiltersProps) {
  const [filters, setFilters] = useState<Filters>({
    niche: "",
    techStack: "",
    helpType: "",
  });

  const update = (key: keyof Filters, value: string) => {
    const next = { ...filters, [key]: value };
    setFilters(next);
    onChange(next);
  };

  const reset = () => {
    const cleared = { niche: "", techStack: "", helpType: "" };
    setFilters(cleared);
    onChange(cleared);
  };

  const hasFilters = Object.values(filters).some(Boolean);

  return (
    <div className={styles.container} role="search" aria-label="Filter projects">
      <div className={styles.filters}>
        <div className={styles.field}>
          <label htmlFor="filter-niche" className={styles.label}>Niche</label>
          <select
            id="filter-niche"
            className={styles.select}
            value={filters.niche}
            onChange={(e) => update("niche", e.target.value)}
          >
            <option value="">All niches</option>
            {NICHES.map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </div>

        <div className={styles.field}>
          <label htmlFor="filter-tech" className={styles.label}>Tech Stack</label>
          <select
            id="filter-tech"
            className={styles.select}
            value={filters.techStack}
            onChange={(e) => update("techStack", e.target.value)}
          >
            <option value="">All stacks</option>
            {TECH_STACKS.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        <div className={styles.field}>
          <label htmlFor="filter-help" className={styles.label}>Help Needed</label>
          <select
            id="filter-help"
            className={styles.select}
            value={filters.helpType}
            onChange={(e) => update("helpType", e.target.value)}
          >
            <option value="">All types</option>
            {HELP_TYPES.map((h) => (
              <option key={h} value={h}>{h}</option>
            ))}
          </select>
        </div>
      </div>

      {hasFilters && (
        <button className={styles.resetBtn} onClick={reset} id="filters-reset-btn">
          ✕ Clear filters
        </button>
      )}
    </div>
  );
}
