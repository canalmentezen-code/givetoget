"use client";

import { useState, useEffect, useRef } from "react";
import { useNotifications } from "@/hooks/useNotifications";
import Link from "next/link";
import styles from "./NotificationBell.module.css";

interface NotificationBellProps {
  userId: string | null | undefined;
}

export function NotificationBell({ userId }: NotificationBellProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications(userId);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const formatTime = (createdAt: any) => {
    if (!createdAt) return "";
    const date = createdAt.toDate ? createdAt.toDate() : new Date(createdAt);
    // eslint-disable-next-line react-hooks/purity
    const diffMs = Date.now() - date.getTime();
    const diffMin = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMin < 1) return "Agora mesmo";
    if (diffMin < 60) return `Há ${diffMin} min`;
    if (diffHours < 24) return `Há ${diffHours} h`;
    return `Há ${diffDays} dias`;
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "feedback_received":
        return "💬";
      case "feedback_approved":
        return "✅";
      case "feedback_rejected":
        return "❌";
      case "access_requested":
        return "🔑";
      case "access_approved":
        return "🔓";
      case "achievement":
        return "⟐";
      default:
        return "🔔";
    }
  };

  return (
    <div className={styles.container} ref={containerRef}>
      <button
        className={styles.bellBtn}
        onClick={() => setIsOpen(!isOpen)}
        aria-label={`Notificações. ${unreadCount} não lidas`}
        id="notification-bell-btn"
      >
        <svg
          className={styles.icon}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {unreadCount > 0 && <span className={styles.badge}>{unreadCount}</span>}
      </button>

      {isOpen && (
        <div className={styles.dropdown} id="notification-dropdown">
          <div className={styles.header}>
            <span className={styles.title}>Notificações</span>
            {unreadCount > 0 && (
              <button className={styles.clearBtn} onClick={markAllAsRead}>
                Marcar todas como lidas
              </button>
            )}
          </div>
          <div className={styles.list}>
            {notifications.length === 0 ? (
              <div className={styles.empty}>Nenhuma notificação por enquanto.</div>
            ) : (
              notifications.map((n) => (
                <Link
                  key={n.id}
                  href={n.link}
                  className={`${styles.item} ${!n.read ? styles.unread : ""}`}
                  onClick={() => {
                    markAsRead(n.id);
                    setIsOpen(false);
                  }}
                  id={`notification-item-${n.id}`}
                >
                  <div className={styles.itemHeader}>
                    <span className={styles.itemTitle}>
                      {getIcon(n.type)} {n.title}
                    </span>
                    <span className={styles.itemTime}>{formatTime(n.createdAt)}</span>
                  </div>
                  <p className={styles.itemMessage}>{n.message}</p>
                </Link>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
