"use client";

import { useEffect } from "react";
import { signOut } from "next-auth/react";
import styles from "./logout.module.css";

export default function LogoutPage() {
  useEffect(() => {
    const timer = setTimeout(() => {
      signOut({ callbackUrl: "/" });
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className={styles.container}>
      <div className={`${styles.card} glass-card`}>
        <div className={styles.logoWrapper}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="GiveToGet Logo" className={styles.logo} />
        </div>
        <h1 className={styles.title}>A encerrar a sessão...</h1>
        <p className={styles.subtitle}>
          Obrigado por fazer parte da comunidade GiveToGet. Até breve!
        </p>
        <div className={styles.spinnerWrapper}>
          <div className="spinner" style={{ width: 28, height: 28 }}></div>
        </div>
      </div>
    </div>
  );
}
