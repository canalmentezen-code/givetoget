"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useLanguage } from "@/components/LanguageProvider";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import styles from "./page.module.css";

interface LoginFormProps {
  githubConfigured: boolean;
  googleConfigured: boolean;
}

export default function LoginForm({ githubConfigured, googleConfigured }: LoginFormProps) {
  const { t } = useLanguage();
  const [loading, setLoading] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  const handleSignIn = async (provider: string) => {
    if (provider === "github" && !githubConfigured) {
      alert("Configuração Necessária:\n\nPara usar o login real do GitHub, você precisa configurar as variáveis GITHUB_ID e GITHUB_SECRET no arquivo .env.local. Como você está rodando localmente sem essas chaves, por favor utilize os botões do 'Modo Teste' abaixo.");
      return;
    }
    if (provider === "google" && !googleConfigured) {
      alert("Configuração Necessária:\n\nPara usar o login real do Google, você precisa configurar as variáveis GOOGLE_CLIENT_ID e GOOGLE_CLIENT_SECRET no arquivo .env.local. Como você está rodando localmente sem essas chaves, por favor utilize os botões do 'Modo Teste' abaixo.");
      return;
    }
    setLoading(provider);
    await signIn(provider, { callbackUrl: "/showcase" });
  };

  const handleDevSignIn = async (email: string, name: string) => {
    setLoading(email);
    try {
      await signIn("dev-login", { email, name, callbackUrl: "/showcase" });
    } catch (err) {
      console.error("[Dev Login] Sign in error:", err);
      setLoading(null);
    }
  };

  return (
    <main className={styles.main}>
      <div className={styles.topRight}>
        <LanguageSwitcher />
      </div>

      <div className={styles.card}>
        <div className={styles.header}>
          <Link href="/" className={styles.logo}>
            <span className={styles.logoIcon}>⟐</span>
            GiveToGet
          </Link>
          <h1 className={styles.title}>{t("login.welcome")}</h1>
          <p className={styles.subtitle}>{t("login.subtitle")}</p>
        </div>

        {error && (
          <div className={styles.errorBanner}>
            {error === "NoGitAccount"
              ? "Apenas utilizadores já registados através do GitHub podem fazer login com o Google. Por favor, entre com o GitHub primeiro!"
              : error === "OAuthAccountNotLinked"
              ? "Este e-mail já está associado a outra conta (GitHub). Por favor, faça login com o GitHub para aceder ao seu painel."
              : error === "ServerError"
              ? "Erro interno ao verificar a conta. Por favor, tente novamente."
              : "Ocorreu um erro ao tentar fazer login. Por favor, tente novamente."}
          </div>
        )}

        <div className={styles.providers}>
          <div className={styles.providerWrapper}>
            <button
              id="login-github"
              className={`${styles.providerBtn} ${styles.github}`}
              onClick={() => handleSignIn("github")}
              disabled={loading !== null}
              aria-label="Sign in with GitHub"
            >
              {loading === "github" ? (
                <span className="spinner" />
              ) : (
                <svg viewBox="0 0 24 24" fill="currentColor" className={styles.providerIcon}>
                  <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                </svg>
              )}
              <span>{t("login.github")}</span>
            </button>
            {!githubConfigured && (
              <span className={styles.configAlert}>⚠️ Requer GITHUB_ID no .env.local</span>
            )}
          </div>

          <div className={styles.providerWrapper}>
            <button
              id="login-google"
              className={`${styles.providerBtn} ${styles.google}`}
              onClick={() => handleSignIn("google")}
              disabled={loading !== null}
              aria-label="Sign in with Google"
            >
              {loading === "google" ? (
                <span className="spinner" />
              ) : (
                <svg viewBox="0 0 24 24" className={styles.providerIcon}>
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
              )}
              <span>{t("login.google")}</span>
            </button>
            {!googleConfigured && (
              <span className={styles.configAlert}>⚠️ Requer GOOGLE_CLIENT_ID no .env.local</span>
            )}
          </div>
        </div>

        {/* Developer Login Section (Dev Mode or explicit config only) */}
        {(process.env.NODE_ENV === "development" || process.env.NEXT_PUBLIC_ENABLE_DEV_LOGIN === "true") && (
          <div className={styles.devSection}>
            <div className={styles.devDivider}>
              <span>Modo Teste / Dev Only</span>
            </div>
            <div className={styles.devButtons}>
              <button
                type="button"
                className={styles.devBtn}
                onClick={() => handleDevSignIn("criador@teste.com", "Dev Criador")}
                disabled={loading !== null}
                id="dev-login-creator"
              >
                {loading === "criador@teste.com" ? (
                  <span className="spinner" />
                ) : (
                  "👤 Entrar como Dev Criador"
                )}
              </button>
              <button
                type="button"
                className={styles.devBtn}
                onClick={() => handleDevSignIn("avaliador@teste.com", "Dev Avaliador")}
                disabled={loading !== null}
                id="dev-login-reviewer"
              >
                {loading === "avaliador@teste.com" ? (
                  <span className="spinner" />
                ) : (
                  "🔍 Entrar como Dev Avaliador"
                )}
              </button>
            </div>
          </div>
        )}

        <p className={styles.terms}>
          {t("login.terms")}{" "}
          <a href="#">{t("login.tos")}</a> and{" "}
          <a href="#">{t("login.privacy")}</a>.
        </p>

        <div className={styles.bonus}>
          {t("login.bonus")}
        </div>
      </div>
    </main>
  );
}
