"use client";

import { useCredits } from "@/hooks/useCredits";
import styles from "./CreditDisplay.module.css";

interface CreditDisplayProps {
  userId: string | null | undefined;
}

export function CreditDisplay({ userId }: CreditDisplayProps) {
  const { creditBalance, transferableBalance, loading } = useCredits(userId);

  if (loading) {
    return <div className={`${styles.pill} skeleton`} style={{ width: 80, height: 32 }} />;
  }

  const tooltipText = `Saldo total: ${creditBalance ?? 0} AT (${transferableBalance ?? 0} transferíveis)`;

  return (
    <div className={styles.pill} title={tooltipText} aria-label={tooltipText}>
      <svg
        className={styles.icon}
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" />
        <path
          d="M12 7v2m0 6v2M9.5 9.5C9.5 8.4 10.6 7.5 12 7.5s2.5.9 2.5 2-.9 1.5-2.5 1.5S9.5 12.1 9.5 13s1.1 2 2.5 2 2.5-.9 2.5-2"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
      <span className={styles.value}>{creditBalance ?? 0}</span>
      <span className={styles.label}>AT</span>
    </div>
  );
}
