import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getAdminDb } from "@/lib/firebase.server";
import { Badge } from "@/components/ui/Badge";
import { cookies } from "next/headers";
import { getTranslation, Language } from "@/lib/translations";
import type { Project, CreditTransaction, CreditTxType, Feedback } from "@/types";
import type { Metadata } from "next";
import styles from "./page.module.css";

export async function generateMetadata(): Promise<Metadata> {
  const cookieStore = await cookies();
  const lang = (cookieStore.get("lang")?.value || "pt") as Language;
  const t = getTranslation(lang);
  return { title: t("profile.metaTitle") };
}

interface Props {
  searchParams: Promise<{ tab?: string }>;
}

export default async function ProfilePage({ searchParams }: Props) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const userId = session.user.id;
  const db = getAdminDb();

  const cookieStore = await cookies();
  const lang = (cookieStore.get("lang")?.value || "pt") as Language;
  const t = getTranslation(lang);

  const { tab } = await searchParams;
  const activeTab = tab || "projects";

  // Parallel queries to Firestore
  const [userSnap, txSnap, projectsSnap, feedbacksSnap] = await Promise.all([
    db.collection("users").doc(userId).get(),
    db
      .collection("users")
      .doc(userId)
      .collection("transactions")
      .orderBy("createdAt", "desc")
      .limit(30)
      .get(),
    db
      .collection("projects")
      .where("ownerId", "==", userId)
      .get(),
    db
      .collection("feedbacks")
      .where("reviewerId", "==", userId)
      .get(),
  ]);

  const user = userSnap.data()!;
  const transactions = txSnap.docs.map((d) => ({ id: d.id, ...d.data() }) as unknown as CreditTransaction);
  
  const badgesMap: Record<string, { label: string; icon: string; desc: string; color: string }> = {
    first_post: {
      label: "Pioneiro",
      icon: "⟐",
      desc: "Listou seu primeiro projeto",
      color: "#a78bfa",
    },
    great_critic: {
      label: "Crítico Construtivo",
      icon: "💬",
      desc: "Teve 5 avaliações aprovadas",
      color: "#10b981",
    },
    bug_hunter: {
      label: "Caçador de Bugs",
      icon: "🐛",
      desc: "Reportou 5 ou mais bugs",
      color: "#ef4444",
    },
    reputation_master: {
      label: "Mestre de Opinião",
      icon: "👑",
      desc: "Reputação >= 90% com 5+ feedbacks",
      color: "#f59e0b",
    },
  };

  const userAchievements: string[] = user.achievements ?? [];
  
  // Projects list
  const allProjects = projectsSnap.docs.map((d) => ({ id: d.id, ...d.data() }) as unknown as Project);
  const projects = allProjects
    .filter((p) => p.status !== "archived")
    .sort((a, b) => {
      if (a.status !== b.status) {
        return a.status.localeCompare(b.status);
      }
      const dateA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0;
      const dateB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0;
      return dateB - dateA;
    });

  // Feedbacks given list sorted in memory
  const feedbacks = feedbacksSnap.docs
    .map((d) => {
      const data = d.data();
      return {
        id: d.id,
        ...data,
        submittedAt: data.submittedAt?.toDate ? data.submittedAt.toDate().toISOString() : null,
      };
    })
    .sort((a: any, b: any) => {
      const dateA = a.submittedAt ? new Date(a.submittedAt).getTime() : 0;
      const dateB = b.submittedAt ? new Date(b.submittedAt).getTime() : 0;
      return dateB - dateA;
    }) as unknown as Feedback[];

  // Resolve project names for the feedbacks
  const projectIds = Array.from(new Set(feedbacks.map((f: any) => f.projectId)));
  const projectNames: Record<string, string> = {};
  if (projectIds.length > 0) {
    const projSnaps = await Promise.all(
      projectIds.map((id) => db.collection("projects").doc(id).get())
    );
    projSnaps.forEach((snap) => {
      if (snap.exists) {
        projectNames[snap.id] = snap.data()!.name;
      }
    });
  }

  const txTypeColors: Record<CreditTxType, "success" | "danger" | "warning" | "info"> = {
    earn: "success",
    purchase: "success",
    release: "success",
    spend: "danger",
    hold: "warning",
    refund: "info",
  };

  const txSign: Record<CreditTxType, string> = {
    earn: "+",
    purchase: "+",
    release: "+",
    spend: "-",
    hold: "-",
    refund: "+",
  };

  return (
    <div className={styles.page}>
      {/* Profile Header */}
      <div className={styles.profileCard}>
        {session.user.image && (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={session.user.image}
            alt={session.user.name ?? "Avatar"}
            className={styles.avatar}
            width={72}
            height={72}
          />
        )}
        <div className={styles.profileInfo}>
          <h1 className={styles.name}>{session.user.name}</h1>
          <p className={styles.email}>{session.user.email}</p>

          {/* Achievements Badges */}
          {userAchievements.length > 0 && (
            <div className={styles.badgesRow}>
              {userAchievements.map((achKey) => {
                const badge = badgesMap[achKey];
                if (!badge) return null;
                return (
                  <div
                    key={achKey}
                    className={styles.badgeItem}
                    title={`${badge.label}: ${badge.desc}`}
                    style={{ borderColor: badge.color, color: badge.color }}
                  >
                    <span className={styles.badgeIcon}>{badge.icon}</span>
                    <span className={styles.badgeLabel}>{badge.label}</span>
                  </div>
                );
              })}
            </div>
          )}

          <div className={styles.profileStats}>
            <div className={styles.pStat}>
              <span className={styles.pStatValue}>{user.creditBalance ?? 0}</span>
              <span className={styles.pStatLabel}>{t("profile.balance")}</span>
            </div>
            <div className={styles.pStat}>
              <span className={styles.pStatValue}>{user.feedbacksGiven ?? 0}</span>
              <span className={styles.pStatLabel}>{t("profile.given")}</span>
            </div>
            <div className={styles.pStat}>
              <span className={styles.pStatValue}>{user.feedbacksReceived ?? 0}</span>
              <span className={styles.pStatLabel}>{t("profile.received")}</span>
            </div>
            <div className={styles.pStat}>
              <span className={styles.pStatValue}>
                {Math.round((user.reputationScore ?? 0) * 100)}%
              </span>
              <span className={styles.pStatLabel}>{t("profile.rate")}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Menu Navigation */}
      <div className={styles.tabsContainer}>
        <a
          href="/profile?tab=projects"
          className={`${styles.tab} ${activeTab === "projects" ? styles.activeTab : ""}`}
          id="profile-tab-projects"
        >
          📁 {t("profile.myProjects")} ({projects.length})
        </a>
        <a
          href="/profile?tab=feedbacks"
          className={`${styles.tab} ${activeTab === "feedbacks" ? styles.activeTab : ""}`}
          id="profile-tab-feedbacks"
        >
          💬 Feedbacks Enviados ({feedbacks.length})
        </a>
        <a
          href="/profile?tab=transactions"
          className={`${styles.tab} ${activeTab === "transactions" ? styles.activeTab : ""}`}
          id="profile-tab-transactions"
        >
          💸 {t("profile.history")} ({transactions.length})
        </a>
      </div>

      {/* Tab Contents */}
      <div style={{ marginTop: 8 }}>
        {activeTab === "projects" && (
          <section className="glass-card" style={{ padding: 24 }}>
            <h2 className={styles.sectionTitle} style={{ marginBottom: 16 }}>📁 Meus Projetos Listados</h2>
            {projects.length === 0 ? (
              <p className={styles.empty}>
                {t("profile.noProjects")}{" "}
                <a href="/submit">{t("profile.linkList")}</a>
              </p>
            ) : (
              <div className={styles.projectList}>
                {projects.map((p) => (
                  <a
                    key={p.id}
                    href={`/showcase/${p.id}`}
                    className={styles.projectItem}
                    id={`my-project-${p.id}`}
                  >
                    <div className={styles.projectItemLeft}>
                      <span className={styles.projectItemName}>{p.name}</span>
                      <div className={styles.projectItemMeta}>
                        <Badge variant={p.visibility === "private" ? "info" : "default"} size="sm">
                          {p.visibility === "private" ? "🔒 Private" : "🌍 Public"}
                        </Badge>
                        <span className={styles.projectNiche}>#{p.niche}</span>
                      </div>
                    </div>
                    <span className={styles.projectViews}>👁 {p.viewCount}</span>
                  </a>
                ))}
              </div>
            )}
          </section>
        )}

        {activeTab === "feedbacks" && (
          <section className="glass-card" style={{ padding: 24 }}>
            <h2 className={styles.sectionTitle} style={{ marginBottom: 16 }}>💬 Avaliações que você deu</h2>
            {feedbacks.length === 0 ? (
              <p className={styles.empty}>Você ainda não deu nenhum feedback. Visite a Vitrine para avaliar!</p>
            ) : (
              <div className={styles.feedbackList}>
                {feedbacks.map((f: any) => (
                  <div key={f.id} className={styles.feedbackCard} id={`feedback-card-${f.id}`}>
                    <div className={styles.feedbackHeader}>
                      <a href={`/showcase/${f.projectId}`} className={styles.feedbackProjName}>
                        {projectNames[f.projectId] || "Projeto Antigo"}
                      </a>
                      <Badge variant={f.status === "approved" ? "success" : "warning"}>
                        {f.status === "approved" ? "Aprovada" : "Pendente"}
                      </Badge>
                    </div>
                    
                    <div className={styles.feedbackMeta}>
                      <span className={styles.feedbackStars}>
                        {"★".repeat(f.uxScore)}{"☆".repeat(5 - f.uxScore)} ({f.uxScore}/5 UX)
                      </span>
                      {f.bugCount > 0 && (
                        <span style={{ color: "var(--color-danger)" }}>🐛 {f.bugCount} Bugs</span>
                      )}
                    </div>

                    <p className={styles.feedbackBody}>{f.qualitativeText}</p>

                    {f.bugCount > 0 && f.bugLogs && (
                      <div style={{ background: "rgba(239, 68, 68, 0.05)", borderLeft: "3px solid var(--color-danger)", padding: 12, borderRadius: 4, marginTop: 4 }}>
                        <span style={{ fontSize: "0.75rem", fontWeight: "bold", textTransform: "uppercase", color: "var(--color-danger)", display: "block", marginBottom: 6 }}>Logs de Bugs</span>
                        <p style={{ fontSize: "0.8125rem", color: "var(--color-text-2)", margin: 0, whiteSpace: "pre-wrap" }}>{f.bugLogs}</p>
                      </div>
                    )}

                    <div className={styles.feedbackFooter}>
                      <span>
                        {f.status === "approved"
                          ? `Liberado: +${f.creditsHeld - 1} AT (1 AT taxa da plataforma)`
                          : `Em garantia: +${f.creditsHeld} AT`}
                      </span>
                      <span>{f.submittedAt ? new Date(f.submittedAt).toLocaleDateString() : ""}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {activeTab === "transactions" && (
          <section className="glass-card" style={{ padding: 24 }}>
            <h2 className={styles.sectionTitle} style={{ marginBottom: 16 }}>💸 Extrato de Transações de AT</h2>
            {transactions.length === 0 ? (
              <p className={styles.empty}>{t("profile.noTx")}</p>
            ) : (
              <div className={styles.txList}>
                {transactions.map((tx) => (
                  <div key={tx.id} className={styles.txItem}>
                    <div className={styles.txLeft}>
                      <Badge variant={txTypeColors[tx.type]} size="sm">
                        {tx.type}
                      </Badge>
                      <span className={styles.txDesc}>{tx.description}</span>
                    </div>
                    <span
                      className={styles.txAmount}
                      style={{
                        color:
                          tx.amount > 0
                            ? "var(--color-success)"
                            : tx.type === "hold"
                            ? "var(--color-warning)"
                            : "var(--color-danger)",
                      }}
                    >
                      {txSign[tx.type]}{Math.abs(tx.amount)} AT
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
