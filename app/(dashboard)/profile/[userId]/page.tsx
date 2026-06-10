import { notFound } from "next/navigation";
import { getAdminDb } from "@/lib/firebase.server";
import type { Metadata } from "next";
import type { Project } from "@/types";
import styles from "./page.module.css";

interface Props {
  params: Promise<{ userId: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { userId } = await params;
  const db = getAdminDb();
  const snap = await db.collection("users").doc(userId).get();
  if (!snap.exists) return { title: "User Not Found — GiveToGet" };
  const user = snap.data()!;
  return {
    title: `${user.name}'s Profile — GiveToGet`,
    description: `View ${user.name}'s listed projects and stats on GiveToGet.`,
  };
}

export default async function PublicProfilePage({ params }: Props) {
  const { userId } = await params;
  const db = getAdminDb();

  const [userSnap, projectsSnap] = await Promise.all([
    db.collection("users").doc(userId).get(),
    db
      .collection("projects")
      .where("ownerId", "==", userId)
      .get(),
  ]);

  if (!userSnap.exists) {
    notFound();
  }

  const user = userSnap.data()!;
  
  const allProjects = projectsSnap.docs.map((d) => ({ id: d.id, ...d.data() }) as unknown as Project);
  const projects = allProjects
    .filter((p) => p.status === "active" && p.visibility === "public")
    .sort((a, b) => {
      const dateA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0;
      const dateB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0;
      return dateB - dateA;
    })
    .slice(0, 10);

  return (
    <div className={styles.page}>
      {/* Profile Header */}
      <div className={styles.profileCard}>
        {user.avatarUrl && (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={user.avatarUrl}
            alt={user.name ?? "Avatar"}
            className={styles.avatar}
            width={72}
            height={72}
          />
        )}
        <div className={styles.profileInfo}>
          <h1 className={styles.name}>{user.name}</h1>
          <div className={styles.profileStats}>
            <div className={styles.pStat}>
              <span className={styles.pStatValue}>{user.feedbacksGiven ?? 0}</span>
              <span className={styles.pStatLabel}>Feedbacks Given</span>
            </div>
            <div className={styles.pStat}>
              <span className={styles.pStatValue}>{user.feedbacksReceived ?? 0}</span>
              <span className={styles.pStatLabel}>Feedbacks Received</span>
            </div>
            <div className={styles.pStat}>
              <span className={styles.pStatValue}>
                {Math.round((user.reputationScore ?? 0) * 100)}%
              </span>
              <span className={styles.pStatLabel}>Approval Rate</span>
            </div>
          </div>
        </div>
      </div>

      {/* Projects */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Public Projects</h2>
        {projects.length === 0 ? (
          <p className={styles.empty}>This user hasn&apos;t listed any public projects yet.</p>
        ) : (
          <div className={styles.projectList}>
            {projects.map((p) => (
              <a
                key={p.id}
                href={`/showcase/${p.id}`}
                className={styles.projectItem}
                id={`user-project-${p.id}`}
              >
                <div className={styles.projectItemLeft}>
                  <span className={styles.projectItemName}>{p.name}</span>
                  <div className={styles.projectItemMeta}>
                    <span className={styles.projectNiche}>#{p.niche}</span>
                  </div>
                </div>
                <span className={styles.projectViews}>👁 {p.viewCount}</span>
              </a>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
