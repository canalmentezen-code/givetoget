"use client";

import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { getClientDb } from "@/lib/firebase.client";

// Suppress Firebase permission errors from appearing as Next.js dev overlay
if (typeof window !== "undefined") {
  const originalOnError = window.onerror;
  window.onerror = (message, ...args) => {
    if (typeof message === "string" && message.includes("Missing or insufficient permissions")) {
      return true; // suppress
    }
    return originalOnError ? originalOnError(message, ...args) : false;
  };
  window.addEventListener("unhandledrejection", (e) => {
    if (e?.reason?.message?.includes("Missing or insufficient permissions")) {
      e.preventDefault();
    }
  });
}

export function useCredits(userId: string | null | undefined) {
  const [creditBalance, setCreditBalance] = useState<number | null>(null);
  const [transferableBalance, setTransferableBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const db = getClientDb();
    const userRef = doc(db, "users", userId);

    const unsubscribe = onSnapshot(
      userRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          setCreditBalance(data.creditBalance as number);
          setTransferableBalance(data.transferableBalance ?? 0 as number);
        }
        setLoading(false);
      },
      (error) => {
        console.error("[useCredits] Firestore error:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [userId]);

  return { creditBalance, transferableBalance, loading };
}
