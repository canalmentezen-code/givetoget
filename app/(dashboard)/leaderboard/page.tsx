"use client";

import { useState, useEffect } from "react";
import { useLanguage } from "@/components/LanguageProvider";
import { Badge } from "@/components/ui/Badge";
import styles from "./page.module.css";

interface Leader {
  id: string;
  name: string;
  avatarUrl: string | null;
  feedbacksGiven: number;
  feedbacksReceived: number;
  reputationScore: number;
  isVerified: boolean;
}

export default function LeaderboardPage() {
  const { t } = useLanguage();
  const [leaders, setLeaders] = useState<Leader[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchLeaders() {
      try {
        const res = await fetch("/api/leaderboard");
        if (!res.ok) throw new Error("Erro ao carregar o ranking.");
        const data = await res.json();
        setLeaders(data.leaders || []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchLeaders();
  }, []);

  if (loading) {
    return (
      <div className={styles.page} style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "50vh" }}>
        <span className="spinner" style={{ width: 32, height: 32 }} />
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.page}>
        <div className="glass-card" style={{ padding: 24, textAlign: "center", color: "var(--color-danger)" }}>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  // Top 3 positions
  const topThree = leaders.slice(0, 3);
  const restOfLeaders = leaders.slice(3);

  // Map ranking slots to their visual positions: [2nd, 1st, 3rd] to match visual order in CSS grid/order
  const podiumOrder = [];
  if (topThree[1]) podiumOrder.push({ leader: topThree[1], rank: 2, className: styles.second, icon: "🥈" });
  if (topThree[0]) podiumOrder.push({ leader: topThree[0], rank: 1, className: styles.first, icon: "👑" });
  if (topThree[2]) podiumOrder.push({ leader: topThree[2], rank: 3, className: styles.third, icon: "🥉" });

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>🏆 {t("nav.leaderboard")} de Avaliadores</h1>
        <p className={styles.subtitle}>Os desenvolvedores mais ativos que estão a impulsionar a comunidade GiveToGet com reviews detalhadas.</p>
      </div>

      {/* Podium for top 3 */}
      {topThree.length > 0 && (
        <div className={styles.podiumContainer}>
          {podiumOrder.map(({ leader, rank, className, icon }) => (
            <div key={leader.id} className={`${styles.podiumCard} ${className} glass-card`}>
              <span className={styles.rankIcon}>{icon}</span>
              <div className={styles.avatarWrapper}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={leader.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${leader.id}`}
                  alt={leader.name}
                  className={styles.avatar}
                  width={rank === 1 ? 80 : 64}
                  height={rank === 1 ? 80 : 64}
                />
                <span className={styles.badge}>{rank}</span>
              </div>
              <h3 className={styles.name}>
                {leader.name}
                {leader.isVerified && (
                  <span className={styles.verified} title="Conta GitHub Verificada">✓</span>
                )}
              </h3>
              <span className={styles.statValue}>{leader.feedbacksGiven}</span>
              <span className={styles.statLabel}>Feedbacks</span>
              <span className={styles.repScore}>🛡️ {leader.reputationScore}% Rep</span>
            </div>
          ))}
        </div>
      )}

      {/* Table for rest */}
      <div className={styles.listContainer}>
        <div className={styles.tableHeader}>
          <span>Posição</span>
          <span>Usuário</span>
          <span>Feedbacks</span>
          <span className={styles.repHeader}>Reputação</span>
        </div>
        {restOfLeaders.length === 0 && topThree.length === 0 ? (
          <div style={{ padding: 24, textAlign: "center", color: "var(--color-text-3)" }}>
            Nenhum avaliador classificado ainda. Seja o primeiro!
          </div>
        ) : (
          restOfLeaders.map((leader, index) => (
            <div key={leader.id} className={styles.row} id={`leaderboard-row-${index + 4}`}>
              <span className={styles.rank}>#{index + 4}</span>
              <div className={styles.userCell}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={leader.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${leader.id}`}
                  alt={leader.name}
                  className={styles.listAvatar}
                  width={32}
                  height={32}
                />
                <span className={styles.listName}>
                  {leader.name}
                  {leader.isVerified && (
                    <span style={{ marginLeft: 6 }}>
                      <Badge variant="success" size="sm">✓ Verificado</Badge>
                    </span>
                  )}
                </span>
              </div>
              <span className={styles.statCell}>{leader.feedbacksGiven}</span>
              <span className={`${styles.statCell} ${styles.repCell}`}>{leader.reputationScore}%</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
