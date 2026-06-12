"use client";

import { useState } from "react";
import Link from "next/link";
import { useLanguage } from "@/components/LanguageProvider";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { CurrencySwitcher } from "@/components/CurrencySwitcher";
import styles from "./page.module.css";

export default function LandingPage() {
  const { t } = useLanguage();
  const [simStep, setSimStep] = useState<"write" | "submitting" | "holding" | "approving" | "payout">("write");
  const [walletBalance, setWalletBalance] = useState(10);
  const [floatCoins, setFloatCoins] = useState(false);

  const startSimulation = () => {
    setSimStep("submitting");
    setTimeout(() => {
      setSimStep("holding");
      setTimeout(() => {
        setSimStep("approving");
        setTimeout(() => {
          setSimStep("payout");
          setFloatCoins(true);
          setWalletBalance(13);
        }, 6500); // 6.5s for approving state (reading speech bubbles)
      }, 6500); // 6.5s for escrow/holding explain state
    }, 2200); // 2.2s for loader
  };

  const resetSimulation = () => {
    setSimStep("write");
    setWalletBalance(10);
    setFloatCoins(false);
  };

  return (
    <main className={styles.main}>
      {/* Background Decorative Blobs */}
      <div className={styles.decorBlob1} />
      <div className={styles.decorBlob2} />

      {/* Main Shell Container */}
      <div className={styles.gridContainer}>
        {/* Left Column - Core Pitch */}
        <section className={styles.leftCol}>
          <header className={styles.header}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", gap: 16 }}>
              <Link href="/" className={styles.logo}>
                <img src="/logo.png" alt="GiveToGet Logo" className={styles.logoImg} />
                <span>GiveToGet</span>
              </Link>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <LanguageSwitcher />
                <CurrencySwitcher />
              </div>
            </div>
          </header>

          <div className={styles.content}>
            <div className={styles.tagline}>
              <span className={styles.taglineDot} />
              <span>{t("landing.tagline")}</span>
            </div>

            <h1 className={styles.title}>
              {t("landing.titlePre")} <span className="gradient-text">{t("landing.titleTokens")}</span>.<br />
              {t("landing.titleAnd")} <span className="gradient-text">{t("landing.titleVisibility")}</span>.
            </h1>

            <p className={styles.subtitle}>
              {t("landing.subtitle")}
            </p>

            <div className={styles.ctas}>
              <Link href="/login" className={styles.ctaPrimary}>
                {t("landing.ctaLaunch")}
                <span className={styles.ctaArrow}>→</span>
              </Link>
              <Link href="/showcase" className={styles.ctaSecondary}>
                {t("landing.ctaShowcase")}
              </Link>
            </div>

            {/* Micro-Features Checklist */}
            <div className={styles.featureList}>
              <div className={styles.featureItem}>
                <span className={styles.featureIcon}>🛡️</span>
                <div>
                  <h4 className={styles.featureTitle}>{t("landing.escrowTitle")}</h4>
                  <p className={styles.featureDesc}>{t("landing.escrowDesc")}</p>
                </div>
              </div>
              <div className={styles.featureItem}>
                <span className={styles.featureIcon}>🔒</span>
                <div>
                  <h4 className={styles.featureTitle}>{t("landing.stealthTitle")}</h4>
                  <p className={styles.featureDesc}>{t("landing.stealthDesc")}</p>
                </div>
              </div>
              <div className={styles.featureItem}>
                <span className={styles.featureIcon}>🐙</span>
                <div>
                  <h4 className={styles.featureTitle}>{t("landing.logsTitle")}</h4>
                  <p className={styles.featureDesc}>{t("landing.logsDesc")}</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Right Column - Interactive App Simulator */}
        <section className={styles.rightCol}>
          <div className={`${styles.browserFrame} glass-card`}>
            {/* Browser Top Bar */}
            <div className={styles.browserHeader}>
              <div className={styles.browserDots}>
                <span className={styles.dotRed} />
                <span className={styles.dotYellow} />
                <span className={styles.dotGreen} />
              </div>
              <div className={styles.browserAddress}>givetoget.dev/simulation</div>
              {/* Virtual Wallet Indicator */}
              <div className={styles.walletBadge} id="sim-wallet">
                <span className={styles.walletIcon}>🪙</span>
                <span>{t("landing.simWallet")}: </span>
                <strong className={styles.walletVal} style={{ transform: floatCoins ? "scale(1.15)" : "scale(1)" }}>
                  {walletBalance} AT
                </strong>
                {floatCoins && <span className={styles.coinSparkle}>+3</span>}
              </div>
            </div>

            {/* Simulation Canvas */}
            <div className={styles.simulationBody}>
              {simStep === "write" && (
                <div className={`${styles.simSlide} animate-fade-up`}>
                  <div className={styles.mockProjectHeader}>
                    <div>
                      <span className={styles.mockBadge}>{t("landing.simProjectBadge")}</span>
                      <h3 className={styles.mockProjectName}>LogCraft — AI Logo Studio</h3>
                    </div>
                    <span className={styles.mockPool}>{t("landing.simProjectBadge") === "🔥 Listed Project" ? "Deposit" : "Depósito"}: 15 AT</span>
                  </div>

                  <p className={styles.mockInstruction}>
                    <strong>{t("landing.simInstruction")}:</strong> Test the canvas drag-and-drop tool and export format options.
                  </p>

                  <div className={styles.mockForm}>
                    <label className={styles.mockLabel}>{t("landing.simReviewLabel")}</label>
                    <textarea
                      className={styles.mockTextarea}
                      readOnly
                      value={t("landing.simReviewValue")}
                    />
                    <button className={styles.mockSubmitBtn} onClick={startSimulation}>
                      {t("landing.simSubmitBtn")}
                    </button>
                  </div>
                </div>
              )}

              {simStep === "submitting" && (
                <div className={styles.loaderSlide}>
                  <div className="spinner" />
                  <p className={styles.loaderText}>{t("landing.simLoaderText")}</p>
                </div>
              )}

              {simStep === "holding" && (
                <div className={`${styles.simSlide} animate-fade-up`}>
                  <div className={styles.statusBannerWarning}>
                    <span>{t("landing.simEscrowActive")}</span>
                    <p>{t("landing.simEscrowDesc")}</p>
                  </div>

                  <div className={styles.cardPreview}>
                    <div className={styles.cardPreviewLine}>
                      <span>{t("landing.simEscrowDetailReviewer")}:</span> <strong>You</strong>
                    </div>
                    <div className={styles.cardPreviewLine}>
                      <span>{t("landing.simEscrowDetailTarget")}:</span> <strong>LogCraft</strong>
                    </div>
                    <div className={styles.cardPreviewLine}>
                      <span>{t("landing.simEscrowDetailTx")}:</span> <code>esc_9841_tx</code>
                    </div>
                  </div>

                  <p className={styles.stepInfo}>
                    {t("landing.simEscrowAwaiting")}
                  </p>
                </div>
              )}

              {simStep === "approving" && (
                <div className={`${styles.simSlide} animate-fade-up`}>
                  <div className={styles.simulationLog}>
                    <div className={styles.notificationBubble}>
                      {t("landing.simAwaitingDeveloper")}
                    </div>
                  </div>

                  <div className={styles.mockApprovalInterface}>
                    <div className={styles.avatarRow}>
                      <span className={styles.mockAvatar}>👨‍💻</span>
                      <div>
                        <strong>Alex</strong>
                        <span className={styles.avatarSub}>LogCraft Founder</span>
                      </div>
                    </div>
                    <div className={styles.speechBubble}>
                      &quot;{t("landing.simSpeechBubble")}&quot;
                    </div>
                    <div className={styles.simulatingClick}>
                      <span className={styles.virtualCursor}>🖱️</span>
                      <button className={styles.mockApproveBtn} disabled>
                        {t("landing.simVirtualClick")}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {simStep === "payout" && (
                <div className={`${styles.simSlide} animate-fade-up`}>
                  <div className={styles.statusBannerSuccess}>
                    <span>{t("landing.simRewardReleased")}</span>
                    <p>{t("landing.simRewardReleasedDesc")}</p>
                  </div>

                  {/* Coin Float Simulation Graphic */}
                  <div className={styles.coinShowcase}>
                    <div className={styles.coinAnimationWrapper}>
                      <span className={styles.floatingCoin}>🪙</span>
                      <span className={styles.floatingCoin}>🪙</span>
                      <span className={styles.floatingCoin}>🪙</span>
                    </div>
                    <div className={styles.payoutOverview}>
                      <div className={styles.payoutRow}>
                        <span>{t("landing.simInitialBalance")}:</span> <span>10 AT</span>
                      </div>
                      <div className={styles.payoutRow}>
                        <span>{t("landing.simEarnedReward")}:</span> <span className={styles.greenText}>+3 AT</span>
                      </div>
                      <div className={styles.payoutRow} style={{ borderTop: "1px solid var(--color-border)" }}>
                        <span>{t("landing.simNewBalance")}:</span> <strong>13 AT</strong>
                      </div>
                    </div>
                  </div>

                  <div className={styles.simulationFooterActions}>
                    <button className={styles.replayBtn} onClick={resetSimulation}>
                      {t("landing.simReplayBtn")}
                    </button>
                    <Link href="/login" className={styles.mockJoinBtn}>
                      {t("landing.simJoinBtn")}
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      </div>

      {/* Micro Footer */}
      <footer className={styles.footer}>
        <span>© {new Date().getFullYear()} GiveToGet · The Indie Feedback Loop.</span>
      </footer>
    </main>
  );
}
