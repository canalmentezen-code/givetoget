"use client";

import { useLanguage } from "./LanguageProvider";
import styles from "./LanguageSwitcher.module.css";

export function LanguageSwitcher() {
  const { lang, setLang } = useLanguage();

  return (
    <button
      className={styles.btn}
      onClick={() => setLang(lang === "pt" ? "en" : "pt")}
      aria-label={lang === "pt" ? "Mudar para inglês" : "Switch to Portuguese"}
    >
      <span className={styles.flag}>{lang === "pt" ? "🇧🇷" : "🇬🇧"}</span>
      <span className={styles.code}>{lang === "pt" ? "PT" : "EN"}</span>
    </button>
  );
}
