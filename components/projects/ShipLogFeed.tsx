import { ShipLog } from "@/types";
import styles from "./ShipLogFeed.module.css";

interface ShipLogFeedProps {
  logs: ShipLog[];
  loading?: boolean;
}

const sourceIcon = (source: ShipLog["source"]) => {
  if (source === "github") return "🐙";
  if (source === "n8n") return "⚡";
  return "✍️";
};

export function ShipLogFeed({ logs, loading = false }: ShipLogFeedProps) {
  if (loading) {
    return (
      <div className={styles.container}>
        {[1, 2, 3].map((i) => (
          <div key={i} className={`skeleton ${styles.skeletonItem}`} />
        ))}
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className={styles.empty}>
        <span className={styles.emptyIcon}>🚢</span>
        <p>No ship logs yet. Connect your GitHub repo to auto-generate logs!</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {logs.map((log, index) => (
        <div key={log.id} className={styles.entry} style={{ animationDelay: `${index * 60}ms` }}>
          <div className={styles.connector}>
            <span className={styles.dot} />
            {index < logs.length - 1 && <div className={styles.line} />}
          </div>
          <div className={styles.content}>
            <div className={styles.header}>
              <span className={styles.source}>
                {sourceIcon(log.source)} {log.source}
              </span>
              {log.createdAt && (
                <time className={styles.time}>
                  {new Date((log.createdAt as unknown as { seconds: number }).seconds * 1000).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </time>
              )}
            </div>
            <p className={styles.text}>{log.content}</p>
            {log.externalRef && (
              <span className={styles.ref}>{log.externalRef.slice(0, 7)}</span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
