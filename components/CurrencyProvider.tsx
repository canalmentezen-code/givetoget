"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

type Currency = "eur" | "brl";

interface CurrencyContextType {
  currency: Currency;
  setCurrency: (c: Currency) => void;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrencyState] = useState<Currency>("eur");

  useEffect(() => {
    // 1. Check cookies
    const match = document.cookie.match(/(^| )currency=([^;]+)/);
    if (match && (match[2] === "eur" || match[2] === "brl")) {
      setCurrencyState(match[2] as Currency);
    } else {
      // 2. Geolocation/Locale auto-detection
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const isBrazilTz = tz && (
        tz.startsWith("America/Sao_Paulo") ||
        tz.startsWith("America/Rio_Branco") ||
        tz.startsWith("America/Manaus") ||
        tz.startsWith("America/Recife") ||
        tz.startsWith("America/Belem") ||
        tz.startsWith("America/Fortaleza") ||
        tz.startsWith("America/Cuiaba") ||
        tz.startsWith("America/Campo_Grande") ||
        tz.startsWith("America/Noronha") ||
        tz.startsWith("America/Maceio") ||
        tz.startsWith("America/Salvador")
      );
      
      const isPtBrLocale = typeof navigator !== "undefined" && navigator.language === "pt-BR";
      const detected: Currency = (isBrazilTz || isPtBrLocale) ? "brl" : "eur";
      
      // Save default cookie
      document.cookie = `currency=${detected};path=/;max-age=31536000;SameSite=Lax`;
      setCurrencyState(detected);
    }
  }, []);

  const setCurrency = (c: Currency) => {
    document.cookie = `currency=${c};path=/;max-age=31536000;SameSite=Lax`;
    setCurrencyState(c);
  };

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error("useCurrency must be used within a CurrencyProvider");
  }
  return context;
}
