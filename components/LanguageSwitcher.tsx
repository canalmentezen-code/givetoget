"use client";

import { useLanguage } from "./LanguageProvider";
import styles from "./LanguageSwitcher.module.css";

export function LanguageSwitcher({ className }: { className?: string }) {
  const { lang, setLang } = useLanguage();

  return (
    <div className={`${styles.container} ${className || ""}`}>
      <button
        className={`${styles.langBtn} ${lang === "pt" ? styles.active : ""}`}
        onClick={() => setLang("pt")}
        aria-label="Português"
      >
        <span className={styles.flag}>🇧🇷</span>
        <span className={styles.code}>PT</span>
      </button>
      <button
        className={`${styles.langBtn} ${lang === "en" ? styles.active : ""}`}
        onClick={() => setLang("en")}
        aria-label="English"
      >
        <span className={styles.flag}>🇬🇧</span>
        <span className={styles.code}>EN</span>
      </button>
    </div>
  );
}
