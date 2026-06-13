"use client";

import React from "react";
import Link from "next/link";
import { useLanguage } from "@/components/LanguageProvider";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import styles from "./PublicLayout.module.css";

export function PublicLayout({ children }: { children: React.ReactNode }) {
  const { t } = useLanguage();

  return (
    <div className={styles.shell}>
      {/* Top Header */}
      <header className={styles.header}>
        <div className={styles.headerContainer}>
          <Link href="/" className={styles.logo}>
            <img src="/logo.png" alt="GiveToGet Logo" className={styles.logoImg} />
            <span>GiveToGet</span>
          </Link>
          <div className={styles.headerRight}>
            <LanguageSwitcher />
            <Link href="/login" className={styles.loginBtn}>
              {t("nav.getStarted") || "Iniciar →"}
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className={styles.main}>
        <div className={styles.contentContainer}>
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.footerLinks}>
          <a href="#">{t("login.tos")}</a>
          <span className={styles.divider}>•</span>
          <a href="#">{t("login.privacy")}</a>
          <span className={styles.divider}>•</span>
          <a href="#">{t("login.cookies")}</a>
          <span className={styles.divider}>•</span>
          <a href="#">{t("login.gdpr")}</a>
        </div>
        <p className={styles.copyright}>
          {t("login.copyright")}
        </p>
      </footer>
    </div>
  );
}
