"use client";

import { useCurrency } from "./CurrencyProvider";
import styles from "./CurrencySwitcher.module.css";

export function CurrencySwitcher({ className }: { className?: string }) {
  const { currency, setCurrency } = useCurrency();

  return (
    <div className={`${styles.container} ${className || ""}`}>
      <button
        className={`${styles.currencyBtn} ${currency === "eur" ? styles.active : ""}`}
        onClick={() => setCurrency("eur")}
        aria-label="Euro"
      >
        <span className={styles.symbol}>€</span>
        <span className={styles.code}>EUR</span>
      </button>
      <button
        className={`${styles.currencyBtn} ${currency === "brl" ? styles.active : ""}`}
        onClick={() => setCurrency("brl")}
        aria-label="Real Brasileiro"
      >
        <span className={styles.symbol}>R$</span>
        <span className={styles.code}>BRL</span>
      </button>
    </div>
  );
}
