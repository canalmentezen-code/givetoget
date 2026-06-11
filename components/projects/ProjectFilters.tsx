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
  search: string;
  sortBy: string;
}

interface ProjectFiltersProps {
  onChange: (filters: Filters) => void;
}

export function ProjectFilters({ onChange }: ProjectFiltersProps) {
  const [filters, setFilters] = useState<Filters>({
    niche: "",
    techStack: "",
    helpType: "",
    search: "",
    sortBy: "",
  });

  const update = (key: keyof Filters, value: string) => {
    const next = { ...filters, [key]: value };
    setFilters(next);
    onChange(next);
  };

  const reset = () => {
    const cleared = { niche: "", techStack: "", helpType: "", search: "", sortBy: "" };
    setFilters(cleared);
    onChange(cleared);
  };

  const hasFilters = Object.values(filters).some(Boolean);

  return (
    <div className={styles.container} role="search" aria-label="Filter projects">
      <div className={styles.searchField}>
        <label htmlFor="filter-search" className={styles.label}>Pesquisa</label>
        <input
          id="filter-search"
          type="text"
          className={styles.searchInput}
          placeholder="Pesquisar projetos (nome, stack, descrição)..."
          value={filters.search}
          onChange={(e) => update("search", e.target.value)}
        />
      </div>

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
          <label htmlFor="filter-sort" className={styles.label}>Ordenar por</label>
          <select
            id="filter-sort"
            className={styles.select}
            value={filters.sortBy}
            onChange={(e) => update("sortBy", e.target.value)}
          >
            <option value="">Mais Recente</option>
            <option value="views">Mais Visualizados</option>
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
