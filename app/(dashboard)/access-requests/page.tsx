"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useLanguage } from "@/components/LanguageProvider";
import styles from "./page.module.css";

interface AccessRequest {
  id: string;
  projectId: string;
  requesterId: string;
  status: "pending" | "approved" | "rejected";
  message: string;
  requestedAt: unknown;
}

export default function AccessRequestsPage() {
  const { t } = useLanguage();
  const [requests, setRequests] = useState<AccessRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/access-requests")
      .then((r) => r.json())
      .then((data) => {
        setRequests(data.requests ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleAction = async (
    requestId: string,
    projectId: string,
    action: "approve" | "reject"
  ) => {
    setProcessing(requestId);
    try {
      await fetch(`/api/projects/${projectId}/access`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId, action }),
      });

      setRequests((prev) =>
        prev.map((r) =>
          r.id === requestId
            ? { ...r, status: action === "approve" ? "approved" : "rejected" }
            : r
        )
      );
    } finally {
      setProcessing(null);
    }
  };

  const pending = requests.filter((r) => r.status === "pending");
  const resolved = requests.filter((r) => r.status !== "pending");

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>{t("accessRequests.title")}</h1>
        <p className={styles.subtitle}>{t("accessRequests.subtitle")}</p>
      </div>

      {loading ? (
        <div className={styles.list}>
          {[1, 2, 3].map((i) => (
            <div key={i} className={`skeleton ${styles.skeletonItem}`} />
          ))}
        </div>
      ) : pending.length === 0 && resolved.length === 0 ? (
        <div className={styles.empty}>
          <span>🔑</span>
          <p>{t("accessRequests.noRequests")}</p>
        </div>
      ) : (
        <>
          {pending.length > 0 && (
            <section>
              <h2 className={styles.sectionTitle}>
                {t("accessRequests.pending")} ({pending.length})
              </h2>
              <div className={styles.list}>
                {pending.map((req) => (
                  <div
                    key={req.id}
                    className={styles.requestCard}
                    id={`access-req-${req.id}`}
                  >
                    <div className={styles.cardLeft}>
                      <Badge variant="warning" size="sm">{t("accessRequests.statusPending")}</Badge>
                      <p className={styles.requesterId}>
                        {t("accessRequests.user")}: <code>{req.requesterId}</code>
                      </p>
                      {req.message && (
                        <p className={styles.message}>&quot;{req.message}&quot;</p>
                      )}
                    </div>
                    <div className={styles.actions}>
                      <Button
                        size="sm"
                        variant="secondary"
                        loading={processing === req.id}
                        onClick={() =>
                          handleAction(req.id, req.projectId, "reject")
                        }
                        id={`reject-access-${req.id}`}
                      >
                        {t("accessRequests.btnReject")}
                      </Button>
                      <Button
                        size="sm"
                        variant="accent"
                        loading={processing === req.id}
                        onClick={() =>
                          handleAction(req.id, req.projectId, "approve")
                        }
                        id={`approve-access-${req.id}`}
                      >
                        {t("accessRequests.btnApprove")}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {resolved.length > 0 && (
            <section>
              <h2 className={styles.sectionTitle}>{t("accessRequests.resolved")}</h2>
              <div className={styles.list}>
                {resolved.map((req) => (
                  <div key={req.id} className={`${styles.requestCard} ${styles.resolved}`}>
                    <div className={styles.cardLeft}>
                      <Badge
                        variant={req.status === "approved" ? "success" : "danger"}
                        size="sm"
                      >
                        {req.status === "approved"
                          ? t("accessRequests.statusApproved")
                          : t("accessRequests.statusRejected")}
                      </Badge>
                      <p className={styles.requesterId}>
                        {t("accessRequests.user")}: <code>{req.requesterId}</code>
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
