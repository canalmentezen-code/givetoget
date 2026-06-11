"use client";

import { useState } from "react";
import { useProjects } from "@/hooks/useProjects";
import { ProjectCard } from "@/components/projects/ProjectCard";
import { ProjectFilters } from "@/components/projects/ProjectFilters";
import { Button } from "@/components/ui/Button";
import { useLanguage } from "@/components/LanguageProvider";
import Link from "next/link";
import styles from "./page.module.css";

export default function ShowcasePage() {
  const { t } = useLanguage();
  const [filters, setFilters] = useState({
    niche: "",
    techStack: "",
    helpType: "",
    search: "",
    sortBy: "",
  });

  const { projects, hasMore, loadMore, isLoading, isValidating } = useProjects({
    niche: filters.niche,
    techStack: filters.techStack,
    search: filters.search,
    sortBy: filters.sortBy,
  });

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>{t("showcase.title")}</h1>
          <p className={styles.subtitle}>{t("showcase.subtitle")}</p>
        </div>
        <Link href="/submit" id="showcase-submit-btn">
          <Button variant="primary">{t("showcase.btnAdd")}</Button>
        </Link>
      </div>

      <div className={styles.filtersWrapper}>
        <ProjectFilters onChange={setFilters} />
      </div>

      {isLoading ? (
        <div className={styles.grid}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className={`skeleton ${styles.skeletonCard}`} />
          ))}
        </div>
      ) : projects.length === 0 ? (
        <div className={styles.empty}>
          <span className={styles.emptyIcon}>🔭</span>
          <h3>{t("showcase.noProjects")}</h3>
          <p>{t("showcase.noProjectsDesc")}</p>
          <Link href="/submit">
            <Button variant="primary">{t("showcase.btnList")}</Button>
          </Link>
        </div>
      ) : (
        <>
          <div className={styles.grid}>
            {projects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>

          {hasMore && (
            <div className={styles.loadMore}>
              <Button
                variant="secondary"
                onClick={loadMore}
                loading={isValidating}
                id="load-more-btn"
              >
                {t("showcase.btnLoadMore")}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
