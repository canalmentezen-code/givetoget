import type React from "react";
import styles from "./Badge.module.css";

type BadgeVariant =
  | "default"
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "primary"
  | "accent"
  | "gold";

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
  size?: "sm" | "md";
}

export function Badge({
  variant = "default",
  children,
  className = "",
  size = "sm",
}: BadgeProps) {
  return (
    <span className={`${styles.badge} ${styles[variant]} ${styles[size]} ${className}`}>
      {children}
    </span>
  );
}

// Convenience: maps feedback status to badge variant
export function FeedbackStatusBadge({
  status,
}: {
  status: "pending" | "approved" | "rejected";
}) {
  const map = {
    pending: "warning" as BadgeVariant,
    approved: "success" as BadgeVariant,
    rejected: "danger" as BadgeVariant,
  };

  const labels = {
    pending: "⏳ Pending",
    approved: "✅ Approved",
    rejected: "❌ Rejected",
  };

  return <Badge variant={map[status]}>{labels[status]}</Badge>;
}

export function ProjectStatusBadge({
  status,
}: {
  status: "active" | "paused" | "archived";
}) {
  const map = {
    active: "success" as BadgeVariant,
    paused: "warning" as BadgeVariant,
    archived: "default" as BadgeVariant,
  };

  const labels = {
    active: "Active",
    paused: "Paused",
    archived: "Archived",
  };

  return <Badge variant={map[status]}>{labels[status]}</Badge>;
}
