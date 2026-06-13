import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { getAdminDb } from "@/lib/firebase.server";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { FeedbackList } from "@/components/feedback/FeedbackList";
import { ShipLogFeed } from "@/components/projects/ShipLogFeed";
import { FeedbackFormWrapper } from "./feedback-form";
import { PromoteButton } from "./promote-button";
import { cookies } from "next/headers";
import { getTranslation, Language } from "@/lib/translations";
import type { Metadata } from "next";
import type { Project, Feedback, ShipLog } from "@/types";
import Link from "next/link";
import styles from "./page.module.css";

interface Props {
  params: Promise<{ projectId: string }>;
}

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
    createdAt: new Date().toISOString(),
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
    createdAt: new Date().toISOString(),
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
    createdAt: new Date().toISOString(),
    isDemo: true,
  }
];

const DEMO_FEEDBACKS: Record<string, any[]> = {
  "demo-logcraft": [
    {
      id: "f1",
      reviewerName: "Alexandre Santos",
      reviewerImage: null,
      uxScore: 5,
      bugCount: 0,
      bugLogs: "",
      promptEvaluation: "Muito bom! Testei prompts em inglês e português. A geração de logos minimalistas com estilos geométricos funcionou perfeitamente. Os detalhes das curvas SVG ficaram super limpos.",
      qualitativeText: "Interface de edição é ótima! A ferramenta de exportação em SVG gera um arquivo limpo e bem formatado. Sugiro adicionar uma opção de 'grade de alinhamento' no canvas para facilitar o posicionamento do texto em relação ao ícone.",
      status: "approved",
      submittedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    },
    {
      id: "f2",
      reviewerName: "Joana Silva",
      reviewerImage: null,
      uxScore: 4,
      bugCount: 1,
      bugLogs: "A ferramenta de corte/crop às vezes falha se tentarmos arrastar para fora do canvas delimitador, bloqueando o scroll no Firefox.",
      promptEvaluation: "Gera ícones de altíssima qualidade, mas sinto falta de suporte a prompts em espanhol.",
      qualitativeText: "Gostei muito da velocidade de geração! O tempo de resposta foi de apenas 4 segundos. O bug da ferramenta de corte no Firefox é chato mas fácil de mitigar com overflow hidden. Excelente projeto!",
      status: "approved",
      submittedAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    }
  ],
  "demo-devpulse": [
    {
      id: "f3",
      reviewerName: "Daniel Lima",
      reviewerImage: null,
      uxScore: 5,
      bugCount: 0,
      bugLogs: "",
      promptEvaluation: "",
      qualitativeText: "Conectei ao meu repositório e os gráficos de commits por hora foram super úteis para notar os picos de trabalho da equipe. A performance da sincronização via webhook é excelente, responde em milissegundos.",
      status: "approved",
      submittedAt: new Date(Date.now() - 86400000).toISOString(),
    }
  ],
  "demo-saasboard": [
    {
      id: "f4",
      reviewerName: "Mariana Costa",
      reviewerImage: null,
      uxScore: 4,
      bugCount: 1,
      promptEvaluation: "",
      bugLogs: "Ao converter de Euros para BRL no gráfico de MRR acumulado, os valores históricos da tabela usam a cotação estática de hoje em vez da histórica.",
      qualitativeText: "Um micro-saas muito necessário! O layout escuro com azul-violeta é lindíssimo. A integração com a Stripe funcionou sem problemas no modo de teste. O bug da conversão de moeda histórica pode ser resolvido com uma API de taxas de câmbio históricas.",
      status: "approved",
      submittedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    }
  ]
};

const DEMO_LOGS: Record<string, any[]> = {
  "demo-logcraft": [
    {
      id: "l1",
      version: "v1.2.0",
      description: "Adicionado suporte para exportação em formato Figma, e paleta de cores automática gerada a partir da descrição do logo.",
      createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    },
    {
      id: "l2",
      version: "v1.1.0",
      description: "Correção do bug de crop no canvas para navegadores Firefox e Safari. Performance de geração melhorada em 20%.",
      createdAt: new Date(Date.now() - 86400000 * 7).toISOString(),
    }
  ],
  "demo-devpulse": [
    {
      id: "l3",
      version: "v1.0.1",
      description: "Otimização de cache para a API do GitHub e correções na apuração de PRs pendentes.",
      createdAt: new Date(Date.now() - 86400000 * 4).toISOString(),
    }
  ],
  "demo-saasboard": []
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { projectId } = await params;
  
  const cookieStore = await cookies();
  const lang = (cookieStore.get("lang")?.value || "pt") as Language;
  const t = getTranslation(lang);

  if (projectId.startsWith("demo-")) {
    const demoProj = DEMO_PROJECTS.find(p => p.id === projectId);
    if (!demoProj) return { title: t("common.error") };
    return {
      title: `${demoProj.name} — GiveToGet`,
      description: demoProj.description,
    };
  }

  const db = getAdminDb();
  const snap = await db.collection("projects").doc(projectId).get();
  
  if (!snap.exists) return { title: t("common.error") };
  const data = snap.data()!;
  return {
    title: `${data.name} — GiveToGet`,
    description: data.description,
  };
}

export default async function ProjectDetailPage({ params }: Props) {
  const { projectId } = await params;
  const session = await auth();
  const userId = session?.user?.id ?? null;

  const db = getAdminDb();

  const cookieStore = await cookies();
  const lang = (cookieStore.get("lang")?.value || "pt") as Language;
  const t = getTranslation(lang);

  let project: Project;
  let feedbacks: Feedback[] = [];
  let logs: ShipLog[] = [];
  let isOwner = false;
  let hasAccess = true;
  let isBlockedByStealth = false;
  let reviewerReputation = 1.0;

  if (projectId.startsWith("demo-")) {
    const demoProj = DEMO_PROJECTS.find((p) => p.id === projectId);
    if (!demoProj) notFound();
    project = demoProj as unknown as Project;
    feedbacks = (DEMO_FEEDBACKS[projectId] || []) as unknown as Feedback[];
    logs = (DEMO_LOGS[projectId] || []) as unknown as ShipLog[];
  } else {
    // Load project
    const projectSnap = await db.collection("projects").doc(projectId).get();
    if (!projectSnap.exists) notFound();

    const projectData = projectSnap.data()!;
    isOwner = userId === projectData.ownerId;

    // Increment viewCount atomically if the current visitor is not the owner (or is anonymous)
    if (!isOwner) {
      const { FieldValue } = await import("firebase-admin/firestore");
      await db.collection("projects").doc(projectId).update({
        viewCount: FieldValue.increment(1)
      });
      projectData.viewCount = (projectData.viewCount ?? 0) + 1;
    }

    project = { id: projectSnap.id, ...projectData } as unknown as Project;

    // Privacy check
    hasAccess = isOwner;
    if (!hasAccess && userId && project.visibility === "private") {
      const accessSnap = await db
        .collection("access_requests")
        .where("projectId", "==", projectId)
        .where("requesterId", "==", userId)
        .where("status", "==", "approved")
        .limit(1)
        .get();
      hasAccess = !accessSnap.empty;
    }

    // Stealth check
    if ((project as any).isStealth && !isOwner) {
      if (!userId) {
        isBlockedByStealth = true;
      } else {
        const userSnap = await db.collection("users").doc(userId).get();
        if (userSnap.exists) {
          const userData = userSnap.data()!;
          reviewerReputation = userData.reputationScore ?? 1.0;
          if (reviewerReputation < 0.95) {
            isBlockedByStealth = true;
          }
        } else {
          isBlockedByStealth = true;
        }
      }
    }

    if (isBlockedByStealth) {
      return (
        <div className={styles.page} style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
          <div className="glass-card" style={{ padding: 40, maxWidth: 500, textAlign: "center", borderRadius: 16, border: "1px solid rgba(239, 68, 68, 0.2)" }}>
            <span style={{ fontSize: "3rem", display: "block", marginBottom: 16 }} role="img" aria-label="Stealth">🕵️</span>
            <h2 style={{ fontSize: "1.5rem", fontWeight: "bold", marginBottom: 12, color: "#ef4444" }}>Projeto em Modo Stealth</h2>
            <p style={{ fontSize: "0.9375rem", color: "var(--color-text-2)", lineHeight: 1.6, marginBottom: 20 }}>
              Este projeto foi configurado com restrições extras de privacidade pelo criador. Apenas avaliadores com reputação superior a <strong>95%</strong> podem visualizar os detalhes e testar o produto.
            </p>
            <div style={{ background: "rgba(255,255,255,0.03)", padding: "16px 20px", borderRadius: 8, border: "1px solid var(--color-border)", marginBottom: 20 }}>
              <span style={{ fontSize: "0.875rem", color: "var(--color-text-3)", display: "block", marginBottom: 4 }}>Sua reputação atual:</span>
              <span style={{ fontSize: "1.75rem", fontWeight: "bold", color: "#f87171" }}>
                {Math.round(reviewerReputation * 100)}%
              </span>
            </div>
            <p style={{ fontSize: "0.8125rem", color: "var(--color-text-3)" }}>
              Faça avaliações mais detalhadas e úteis em outros projetos públicos para subir a sua reputação na comunidade!
            </p>
          </div>
        </div>
      );
    }

    // Load feedbacks
    const feedbacksSnap = await db
      .collection("feedbacks")
      .where("projectId", "==", projectId)
      .get();

    feedbacks = feedbacksSnap.docs
      .map((d) => {
        const data = d.data();
        return {
          id: d.id,
          ...data,
          submittedAt: data.submittedAt?.toDate ? data.submittedAt.toDate().toISOString() : null,
          approvedAt: data.approvedAt?.toDate ? data.approvedAt.toDate().toISOString() : null,
        };
      })
      .sort((a: any, b: any) => {
        const dateA = a.submittedAt ? new Date(a.submittedAt).getTime() : 0;
        const dateB = b.submittedAt ? new Date(b.submittedAt).getTime() : 0;
        return dateB - dateA;
      })
      .slice(0, 20) as unknown as Feedback[];

    // Load ship logs
    const logsSnap = await db
      .collection("ship_logs")
      .where("projectId", "==", projectId)
      .get();

    logs = logsSnap.docs
      .map((d) => {
        const data = d.data();
        return {
          id: d.id,
          ...data,
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : null,
        };
      })
      .sort((a: any, b: any) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      })
      .slice(0, 10) as unknown as ShipLog[];
  }

  return (
    <div className={styles.page}>
      {(project as any).isDemo && (
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "12px 18px",
          background: "rgba(20, 184, 166, 0.08)",
          border: "1px solid rgba(20, 184, 166, 0.2)",
          borderRadius: "var(--radius-lg)",
          marginBottom: 8
        }}>
          <span style={{ fontSize: "1.25rem" }}>💡</span>
          <p style={{ flex: 1, fontSize: "0.88rem", color: "var(--color-text-2)", margin: 0, lineHeight: 1.4 }}>
            {lang === "en"
              ? "You are viewing an interactive demo project. Submitting reviews is disabled for demo items."
              : "Estás a visualizar uma demonstração interativa de projeto. A submissão de avaliações está desativada para itens de demonstração."}
          </p>
          {!userId && (
            <Link href="/login" style={{ textDecoration: "none" }}>
              <Button variant="accent" size="sm">
                {lang === "en" ? "Sign In" : "Entrar"}
              </Button>
            </Link>
          )}
        </div>
      )}

      <div className={styles.hero}>
        <div className={styles.heroLeft}>
          <div className={styles.metaRow}>
            {project.visibility === "private" && (
              <Badge variant="info">🔒 Private</Badge>
            )}
            {(project as any).isStealth && (
              <Badge variant="warning">🕵️ Stealth</Badge>
            )}
            <span className={styles.niche}>#{project.niche}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <h1 className={styles.name}>{project.name}</h1>
            {(project as any).isFeatured && (
              <Badge variant="gold" size="sm">🏆 Destaque</Badge>
            )}
            {(project as any).isDemo && (
              <Badge variant="accent" size="sm">💡 Demo</Badge>
            )}
          </div>
          <p className={styles.description}>{project.description}</p>

          <div className={styles.tags}>
            {project.techStack?.map((t: string) => (
              <Badge key={t} variant="primary">{t}</Badge>
            ))}
            {project.helpTypes?.map((h: string) => (
              <Badge key={h} variant="accent">{h}</Badge>
            ))}
          </div>

          {(hasAccess || project.visibility === "public") && project.url && (
            <a
              href={project.url}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.projectLink}
              id="project-url-link"
            >
              {t("projectDetail.visit")}
            </a>
          )}

          {project.visibility === "private" && !hasAccess && userId && !isOwner && (
            <div className={styles.privateNotice}>
              {t("projectDetail.privateNotice")}{" "}
              <button className={styles.requestBtn} id="request-access-btn">
                {t("projectDetail.btnRequest")}
              </button>
            </div>
          )}
        </div>

        <div className={styles.heroStats}>
          <div className={styles.stat}>
            <span className={styles.statValue}>{project.viewCount ?? 0}</span>
            <span className={styles.statLabel}>{t("projectDetail.views")}</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statValue}>{feedbacks.length}</span>
            <span className={styles.statLabel}>{t("projectDetail.feedbacks")}</span>
          </div>
        </div>
      </div>

      {/* Test Instructions */}
      {project.testInstructions && (
        <section className={`${styles.section} glass-card`} style={{ padding: 24, marginBottom: 28 }}>
          <h2 className={styles.sectionTitle}>{t("projectDetail.howToTest")}</h2>
          <p className={styles.instructions}>{project.testInstructions}</p>
        </section>
      )}

      {/* Creator Analytics Panel */}
      {isOwner && (
        <section className={`${styles.section} glass-card`} style={{ padding: 24, marginBottom: 28 }} id="creator-analytics-panel">
          <h2 className={styles.sectionTitle}>📈 Painel de Métricas e Analytics (Visão do Criador)</h2>
          
          <div className={styles.analyticsGrid}>
            {/* Stat: Average rating */}
            <div className={styles.aStatCard}>
              <span className={styles.aStatValue}>
                {feedbacks.filter(f => f.status === "approved").length > 0
                  ? (feedbacks.filter(f => f.status === "approved").reduce((acc, f) => acc + (f.uxScore ?? 0), 0) / feedbacks.filter(f => f.status === "approved").length).toFixed(1)
                  : "0.0"}
                <span className={styles.aStatUnit}> / 5</span>
              </span>
              <span className={styles.aStatLabel}>Nota UX Média</span>
            </div>

            {/* Stat: Bugs reported */}
            <div className={styles.aStatCard}>
              <span className={styles.aStatValue}>
                {feedbacks.filter(f => f.status === "approved").reduce((acc, f) => acc + (f.bugCount ?? 0), 0)}
              </span>
              <span className={styles.aStatLabel}>Bugs Reportados</span>
            </div>

            {/* Stat: Total reviews */}
            <div className={styles.aStatCard}>
              <span className={styles.aStatValue}>{feedbacks.length}</span>
              <span className={styles.aStatLabel}>Avaliações Recebidas</span>
            </div>
          </div>

          {/* Rating Distribution Graph */}
          {feedbacks.filter(f => f.status === "approved").length > 0 && (
            <div className={styles.distributionContainer}>
              <h3 className={styles.distTitle}>Distribuição de Notas UX</h3>
              <div className={styles.distBars}>
                {[5, 4, 3, 2, 1].map((score) => {
                  const approved = feedbacks.filter(f => f.status === "approved");
                  const count = approved.filter(f => f.uxScore === score).length;
                  const percentage = Math.round((count / approved.length) * 100);
                  return (
                    <div key={score} className={styles.distBarRow}>
                      <span className={styles.distBarLabel}>{score} ★</span>
                      <div className={styles.distBarTrack}>
                        <div
                          className={styles.distBarFill}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className={styles.distBarValue}>{count} ({percentage}%)</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <PromoteButton
            projectId={projectId}
            isFeatured={(project as any).isFeatured === true}
            featuredUntil={(project as any).featuredUntil?.toDate ? (project as any).featuredUntil.toDate().toISOString() : null}
          />
        </section>
      )}

      <div className={styles.twoCol}>
        {/* Feedback Section */}
        <section className={styles.feedbackSection}>
          <h2 className={styles.sectionTitle}>
            {t("projectDetail.feedbackTitle")} ({feedbacks.length})
          </h2>

          {userId && !isOwner && !(project as any).isDemo && (
            <div className={`${styles.formWrapper} glass-card`} style={{ padding: 28, marginBottom: 24 }}>
              <FeedbackFormWrapper
                projectId={projectId}
                projectName={project.name}
                hasPrompts={project.techStack?.includes("OpenAI") || project.niche === "ai"}
              />
            </div>
          )}

          {!userId && (
            <div className={`${styles.formWrapper} glass-card`} style={{ padding: 28, marginBottom: 24, textAlign: "center" }}>
              <h3 style={{ fontSize: "1.1rem", fontWeight: "600", marginBottom: 8 }}>
                {lang === "en" ? "Want to evaluate this project?" : "Queres avaliar este projeto?"}
              </h3>
              <p style={{ fontSize: "0.85rem", color: "var(--color-text-2)", marginBottom: 16 }}>
                {lang === "en" 
                  ? "Sign in now to write a detailed feedback and earn Attention Tokens (AT)!" 
                  : "Entra na tua conta agora para escreveres um feedback detalhado e ganhares Attention Tokens (AT)!"}
              </p>
              <Link href="/login" style={{ textDecoration: "none" }}>
                <Button variant="primary" style={{ margin: "0 auto" }}>
                  {lang === "en" ? "Sign In to Evaluate" : "Entrar para Avaliar"}
                </Button>
              </Link>
            </div>
          )}

          <FeedbackList
            feedbacks={feedbacks}
            isProjectOwner={isOwner}
          />
        </section>

        {/* Ship Logs */}
        {logs.length > 0 && (
          <aside className={styles.logsSection}>
            <h2 className={styles.sectionTitle}>{t("projectDetail.shipLogTitle")}</h2>
            <ShipLogFeed logs={logs} />
          </aside>
        )}
      </div>
    </div>
  );
}
