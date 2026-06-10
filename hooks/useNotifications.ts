"use client";

import { useEffect, useState } from "react";
import { collection, query, where, onSnapshot, doc, updateDoc } from "firebase/firestore";
import { getClientDb } from "@/lib/firebase.client";

export interface AppNotification {
  id: string;
  userId: string;
  type: "feedback_received" | "feedback_approved" | "feedback_rejected" | "access_requested" | "access_approved" | "achievement";
  title: string;
  message: string;
  link: string;
  read: boolean;
  createdAt: any;
}

export function useNotifications(userId: string | null | undefined) {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setNotifications([]);
      setLoading(false);
      return;
    }

    const db = getClientDb();
    const q = query(collection(db, "notifications"), where("userId", "==", userId));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const items = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as AppNotification[];

        // Sort in memory by createdAt descending
        items.sort((a, b) => {
          const dateA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0;
          const dateB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0;
          return dateB - dateA;
        });

        setNotifications(items);
        setLoading(false);
      },
      (error) => {
        console.error("[useNotifications] Firestore error:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [userId]);

  const markAsRead = async (notificationId: string) => {
    try {
      const db = getClientDb();
      const ref = doc(db, "notifications", notificationId);
      await updateDoc(ref, { read: true });
    } catch (error) {
      console.error("[useNotifications] Error marking notification as read:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const db = getClientDb();
      const unread = notifications.filter((n) => !n.read);
      const promises = unread.map((n) =>
        updateDoc(doc(db, "notifications", n.id), { read: true })
      );
      await Promise.all(promises);
    } catch (error) {
      console.error("[useNotifications] Error marking all as read:", error);
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return { notifications, unreadCount, loading, markAsRead, markAllAsRead };
}
