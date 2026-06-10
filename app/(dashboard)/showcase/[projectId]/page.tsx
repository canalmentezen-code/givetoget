import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { getAdminDb } from "@/lib/firebase.server";
import { Badge } from "@/components/ui/Badge";
import { FeedbackList } from "@/components/feedback/FeedbackList";
import { ShipLogFeed } from "@/components/projects/ShipLogFeed";
import { FeedbackFormWrapper } from "./feedback-form";
import { cookies } from "next/headers";
import { getTranslation, Language } from "@/lib/translations";
import type { Metadata } from "next";
import type { Project, Feedback, ShipLog } from "@/types";
import styles from "./page.module.css";

interface Props {
  params: Promise<{ projectId: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { projectId } = await params;
  const db = getAdminDb();
  const snap = await db.collection("projects").doc(projectId).get();
  
  const cookieStore = await cookies();
  const lang = (cookieStore.get("lang")?.value || "pt") as Language;
  const t = getTranslation(lang);

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

  // Load project
  const projectSnap = await db.collection("projects").doc(projectId).get();
  if (!projectSnap.exists) notFound();

  const project = { id: projectSnap.id, ...projectSnap.data()! } as unknown as Project;
  const isOwner = userId === project.ownerId;

  // Privacy check
  let hasAccess = isOwner;
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

  // Load feedbacks
  const feedbacksSnap = await db
    .collection("feedbacks")
    .where("projectId", "==", projectId)
    .get();

  const feedbacks = feedbacksSnap.docs
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

  const logs = logsSnap.docs
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

  return (
    <div className={styles.page}>
      <div className={styles.hero}>
        <div className={styles.heroLeft}>
          <div className={styles.metaRow}>
            {project.visibility === "private" && (
              <Badge variant="info">🔒 Private</Badge>
            )}
            <span className={styles.niche}>#{project.niche}</span>
          </div>
          <h1 className={styles.name}>{project.name}</h1>
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
        </section>
      )}

      <div className={styles.twoCol}>
        {/* Feedback Section */}
        <section className={styles.feedbackSection}>
          <h2 className={styles.sectionTitle}>
            {t("projectDetail.feedbackTitle")} ({feedbacks.length})
          </h2>

          {userId && !isOwner && (
            <div className={`${styles.formWrapper} glass-card`} style={{ padding: 28, marginBottom: 24 }}>
              <FeedbackFormWrapper
                projectId={projectId}
                projectName={project.name}
                hasPrompts={project.techStack?.includes("OpenAI") || project.niche === "ai"}
              />
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
