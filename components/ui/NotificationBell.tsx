"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useNotifications } from "@/hooks/useNotifications";
import Link from "next/link";
import styles from "./NotificationBell.module.css";

interface NotificationBellProps {
  userId: string | null | undefined;
}

export function NotificationBell({ userId }: NotificationBellProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownPos, setDropdownPos] = useState<{ top: number; left: number } | null>(null);
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications(userId);
  const containerRef = useRef<HTMLDivElement>(null);
  const bellBtnRef = useRef<HTMLButtonElement>(null);
  const [notificationPermission, setNotificationPermission] = useState<string>("default");
  const prevUnreadCountRef = useRef(unreadCount);

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setNotificationPermission(Notification.permission);
    }
  }, []);

  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      "Notification" in window &&
      Notification.permission === "granted" &&
      unreadCount > prevUnreadCountRef.current
    ) {
      const newUnreads = notifications.filter((n) => !n.read);
      if (newUnreads.length > 0) {
        const newest = newUnreads[0];
        new Notification(newest.title, {
          body: newest.message,
          icon: "/logo.png",
        });
      }
    }
    prevUnreadCountRef.current = unreadCount;
  }, [unreadCount, notifications]);

  const requestNotificationPermission = async () => {
    if (typeof window !== "undefined" && "Notification" in window) {
      try {
        const permission = await Notification.requestPermission();
        setNotificationPermission(permission);
        if (permission === "granted") {
          new Notification("Notificações Ativas! 🎉", {
            body: "Você receberá atualizações sobre seus feedbacks e acessos em tempo real.",
            icon: "/logo.png",
          });
        }
      } catch (err) {
        console.error("Erro ao solicitar permissão de notificações:", err);
      }
    }
  };

  const updatePosition = useCallback(() => {
    if (!bellBtnRef.current) return;
    const rect = bellBtnRef.current.getBoundingClientRect();
    const dropdownWidth = 320;
    const margin = 12;
    const viewportWidth = window.innerWidth;

    // Position below the button, aligned to the right of it — but never off screen
    let left = rect.right - dropdownWidth;
    if (left < margin) left = margin;
    if (left + dropdownWidth > viewportWidth - margin) left = viewportWidth - dropdownWidth - margin;

    setDropdownPos({ top: rect.bottom + 8, left });
  }, []);

  const toggleOpen = () => {
    if (!isOpen) {
      updatePosition();
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    function handleScroll() {
      if (isOpen) updatePosition();
    }
    function handleResize() {
      if (isOpen) updatePosition();
    }
    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("scroll", handleScroll, true);
    window.addEventListener("resize", handleResize);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("scroll", handleScroll, true);
      window.removeEventListener("resize", handleResize);
    };
  }, [isOpen, updatePosition]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const formatTime = (createdAt: any) => {
    if (!createdAt) return "";
    const date = createdAt.toDate ? createdAt.toDate() : new Date(createdAt);
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
      case "feedback_received": return "💬";
      case "feedback_approved": return "✅";
      case "feedback_rejected": return "❌";
      case "access_requested": return "🔑";
      case "access_approved": return "🔓";
      case "achievement": return "⭐";
      default: return "🔔";
    }
  };

  return (
    <div className={styles.container} ref={containerRef}>
      <button
        ref={bellBtnRef}
        className={styles.bellBtn}
        onClick={toggleOpen}
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

      {isOpen && dropdownPos && (
        <div
          className={styles.dropdown}
          id="notification-dropdown"
          style={{ top: dropdownPos.top, left: dropdownPos.left }}
        >
          <div className={styles.header}>
            <span className={styles.title}>Notificações</span>
            {unreadCount > 0 && (
              <button className={styles.clearBtn} onClick={markAllAsRead}>
                Marcar todas como lidas
              </button>
            )}
          </div>
          {notificationPermission === "default" && (
            <div className={styles.permissionBanner}>
              <span className={styles.permissionText}>Deseja receber notificações no navegador?</span>
              <button className={styles.permissionBtn} onClick={requestNotificationPermission}>
                Ativar
              </button>
            </div>
          )}
          <div className={styles.list}>
            {notifications.length === 0 ? (
              <div className={styles.empty}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.3, marginBottom: 8 }}>
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
                <p>Nenhuma notificação por enquanto.</p>
              </div>
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
