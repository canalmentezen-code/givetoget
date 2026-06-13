"use client";

import { useState, useEffect } from "react";
import { useLanguage } from "./LanguageProvider";
import styles from "./CookieBanner.module.css";

export function CookieBanner() {
  const { lang } = useLanguage();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    try {
      const consent = localStorage.getItem("givetoget_cookies_consent");
      if (!consent) {
        setIsVisible(true);
      }
    } catch (e) {
      // If localStorage is unavailable, just show it
      setIsVisible(true);
    }
  }, []);

  const handleConsent = (accepted: boolean) => {
    try {
      localStorage.setItem("givetoget_cookies_consent", accepted ? "accepted" : "rejected");
    } catch (e) {
      console.error(e);
    }
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className={styles.banner} role="dialog" aria-label="Cookie consent banner">
      <div className={styles.content}>
        <span className={styles.icon} aria-hidden="true">🍪</span>
        <p className={styles.text}>
          {lang === "en"
            ? "We use cookies to enhance your experience, analyze traffic, and ensure security. By continuing, you consent to our use of cookies."
            : "Utilizamos cookies para melhorar a tua experiência, analisar o tráfego e garantir a segurança do site. Ao continuar, concordas com a nossa utilização de cookies."}
        </p>
      </div>
      <div className={styles.actions}>
        <button 
          onClick={() => handleConsent(false)} 
          className={`${styles.btn} ${styles.btnSecondary}`}
        >
          {lang === "en" ? "Reject" : "Rejeitar"}
        </button>
        <button 
          onClick={() => handleConsent(true)} 
          className={`${styles.btn} ${styles.btnPrimary}`}
        >
          {lang === "en" ? "Accept All" : "Aceitar Todos"}
        </button>
      </div>
    </div>
  );
}
