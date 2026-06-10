"use client";

import React, { createContext, useContext, useState } from "react";
import { translations, Language } from "@/lib/translations";
import { useRouter } from "next/navigation";

interface LanguageContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({
  children,
  initialLang,
}: {
  children: React.ReactNode;
  initialLang: Language;
}) {
  const [lang, setLangState] = useState<Language>(initialLang);
  const router = useRouter();

  const setLang = (newLang: Language) => {
    setLangState(newLang);
    // Write cookie
    document.cookie = `lang=${newLang}; path=/; max-age=31536000`;
    router.refresh();
  };

  const t = (path: string) => {
    const keys = path.split(".");
    let current: unknown = translations[lang];
    for (const key of keys) {
      if (current && typeof current === "object" && key in (current as Record<string, unknown>)) {
        current = (current as Record<string, unknown>)[key];
      } else {
        return path;
      }
    }
    return typeof current === "string" ? current : path;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
