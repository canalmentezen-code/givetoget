import type { Metadata } from "next";
import { SessionProvider } from "next-auth/react";
import { cookies } from "next/headers";
import { LanguageProvider } from "@/components/LanguageProvider";
import { Language } from "@/lib/translations";
import "./globals.css";

export const metadata: Metadata = {
  title: "GiveToGet — Earn Feedback, Get Visibility",
  description:
    "A gamified platform for Micro-SaaS and AI tool builders. Give structured feedback to earn Attention Tokens. Spend tokens to get your project in front of real developers.",
  keywords: ["micro-saas", "feedback", "indie hacker", "ai tools", "developer community"],
  openGraph: {
    title: "GiveToGet",
    description: "Give feedback. Earn tokens. Get visibility.",
    type: "website",
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const lang = (cookieStore.get("lang")?.value as Language) || "pt";

  return (
    <html lang={lang}>
      <body>
        <SessionProvider>
          <LanguageProvider initialLang={lang}>
            {children}
          </LanguageProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
