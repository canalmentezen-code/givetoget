"use client";

import { useState, useEffect } from "react";
import { useProjects } from "@/hooks/useProjects";
import { ProjectCard } from "@/components/projects/ProjectCard";
import { ProjectFilters } from "@/components/projects/ProjectFilters";
import { Button } from "@/components/ui/Button";
import { useLanguage } from "@/components/LanguageProvider";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { getClientDb } from "@/lib/firebase.client";
import { doc, onSnapshot } from "firebase/firestore";
import styles from "./page.module.css";

const DEMO_PROJECTS = [
  {
    id: "demo-logcraft",
    name: "LogCraft — AI Logo Studio",
    description: "Crie logos profissionais em minutos usando prompts inteligentes de IA. Exportação direta em SVG e PNG de alta resolução com ferramenta de ajuste fino no navegador.",
    niche: "ai",
    techStack: ["React", "Next.js", "TailwindCSS", "OpenAI"],
    helpTypes: ["UX/UI Design", "Performance"],
    testInstructions: "1. Acesse o estúdio virtual. 2. Digite um prompt simples (ex: 'minimalist tech startup logo'). 3. Teste a ferramenta de corte e rotação no canvas. 4. Exporte em SVG e avalie o tempo de resposta.",
    viewCount: 342,
    creditsRequired: 3,
    status: "active" as const,
    visibility: "public" as const,
    ownerId: "demo-owner",
    isFeatured: true,
    isStealth: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isDemo: true,
  },
  {
    id: "demo-devpulse",
    name: "DevPulse — Git Analytics Dashboard",
    description: "Dashboard inteligente que analisa a produtividade e qualidade do código da equipe com base em dados de commits, PRs e issues do GitHub. Integração de 1 clique.",
    niche: "dev-tools",
    techStack: ["Node.js", "TypeScript", "Chart.js", "GitHub API"],
    helpTypes: ["Bugs", "UX/UI Design"],
    testInstructions: "1. Conecte com um repositório público do GitHub. 2. Veja o dashboard com as métricas de tempo de resposta de PR. 3. Verifique se os filtros de data funcionam corretamente.",
    viewCount: 198,
    creditsRequired: 3,
    status: "active" as const,
    visibility: "public" as const,
    ownerId: "demo-owner",
    isFeatured: false,
    isStealth: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isDemo: true,
  },
  {
    id: "demo-saasboard",
    name: "SaaSBoard — Stripe Dashboard",
    description: "Um painel financeiro compacto para fundadores de micro-saas. Acompanhe MRR, Churn, LTV e receitas líquidas de forma unificada com conversão automática de moedas.",
    niche: "saas",
    techStack: ["Next.js", "PostgreSQL", "Stripe API", "Vercel"],
    helpTypes: ["Performance", "Bugs"],
    testInstructions: "1. Veja o painel geral de métricas na tela inicial. 2. Altere o seletor de moedas (BRL/EUR/USD) e veja se os gráficos se adaptam. 3. Verifique se os dados da tabela de transações batem com os gráficos.",
    viewCount: 254,
    creditsRequired: 5,
    status: "active" as const,
    visibility: "public" as const,
    ownerId: "demo-owner",
    isFeatured: false,
    isStealth: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isDemo: true,
  }
] as any[];

export default function ShowcasePage() {
  const { t, lang } = useLanguage();
  const { data: session } = useSession();
  const isLoggedIn = !!session?.user;
  const [feedbacksGiven, setFeedbacksGiven] = useState<number | null>(null);

  const [filters, setFilters] = useState({
    niche: "",
    techStack: "",
    helpType: "",
    search: "",
    sortBy: "",
  });

  const { projects: dbProjects, hasMore, loadMore, isLoading, isValidating } = useProjects({
    niche: filters.niche,
    techStack: filters.techStack,
    search: filters.search,
    sortBy: filters.sortBy,
  });

  // Listen to user's stats for feedbacksGiven
  useEffect(() => {
    if (!session?.user?.id) return;
    const db = getClientDb();
    const userRef = doc(db, "users", session.user.id);
    const unsubscribe = onSnapshot(
      userRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          setFeedbacksGiven(data.feedbacksGiven ?? 0);
        }
      },
      (err) => {
        console.error("Error reading feedbacksGiven stats:", err);
      }
    );
    return () => unsubscribe();
  }, [session?.user?.id]);

  // Filter and merge demo projects based on onboarding rules
  const demoMatches = DEMO_PROJECTS.filter(p => {
    if (filters.niche && p.niche !== filters.niche) return false;
    if (filters.search) {
      const term = filters.search.toLowerCase().trim();
      return (
        p.name.toLowerCase().includes(term) ||
        p.description.toLowerCase().includes(term) ||
        p.techStack.some((ts: string) => ts.toLowerCase().includes(term)) ||
        p.niche.toLowerCase().includes(term)
      );
    }
    return true;
  });

  // Decide which demos to show based on login state and onboarding progress
  let showDemos: any[] = [];
  if (!isLoggedIn) {
    // Public visitor: show all 3 demos
    showDemos = demoMatches;
  } else {
    // Authenticated user: onboarding rules
    // 1. Check if they have listed any projects
    const hasCreatedProject = dbProjects.some((p: any) => p.ownerId === session?.user?.id);
    // 2. Check if they have given any feedbacks
    const hasGivenFeedback = feedbacksGiven !== null && feedbacksGiven > 0;

    // Only show 1 demo (demo-logcraft) if they haven't listed a project AND haven't given feedback
    if (!hasCreatedProject && !hasGivenFeedback) {
      showDemos = demoMatches.filter((p) => p.id === "demo-logcraft");
    } else {
      // Hide all demos once they start participating
      showDemos = [];
    }
  }

  const projects = [...dbProjects, ...showDemos];

  return (
    <div className={styles.page}>
      {!isLoggedIn && (
        <div className={styles.publicNoticeBanner}>
          <span className={styles.noticeIcon}>💡</span>
          <p className={styles.noticeText}>
            {lang === "en"
              ? "You are viewing the public showcase. Sign in to start giving feedback, earning tokens, and listing your own SaaS!"
              : "Estás a ver a vitrine pública. Entra na tua conta para começares a dar feedback, ganhares tokens e publicares o teu SaaS!"}
          </p>
          <Link href="/login" className={styles.noticeBtn}>
            {lang === "en" ? "Sign In" : "Entrar"}
          </Link>
        </div>
      )}

      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>{t("showcase.title")}</h1>
          <p className={styles.subtitle}>{t("showcase.subtitle")}</p>
        </div>
        {isLoggedIn && (
          <Link href="/submit" id="showcase-submit-btn">
            <Button variant="primary">{t("showcase.btnAdd")}</Button>
          </Link>
        )}
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
