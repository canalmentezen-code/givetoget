"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCurrency } from "@/components/CurrencyProvider";
import { Button } from "@/components/ui/Button";

const PACKS = [
  { id: "pkg_20", credits: 20, label: "Starter" },
  { id: "pkg_60", credits: 60, label: "Growth" },
  { id: "pkg_150", credits: 150, label: "Pro" },
];

const PRICES = {
  eur: { pkg_20: 5, pkg_60: 12, pkg_150: 25 },
  brl: { pkg_20: 25, pkg_60: 60, pkg_150: 125 },
};

export function BuyTokensPanel() {
  const { currency } = useCurrency();
  const [loadingPkg, setLoadingPkg] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const router = useRouter();

  const handleBuy = async (packageId: string) => {
    setLoadingPkg(packageId);
    setMessage(null);
    try {
      const res = await fetch("/api/credits/buy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packageId, currency }),
      });

      const data = await res.json();
      if (res.ok) {
        setMessage(`🎉 Compra realizada com sucesso! Adicionado +${data.credits} AT à sua carteira.`);
        router.refresh();
      } else {
        setMessage(`⚠️ Erro: ${data.error ?? "Falha ao processar pagamento."}`);
      }
    } catch {
      setMessage("⚠️ Erro de rede ao processar compra.");
    } finally {
      setLoadingPkg(null);
    }
  };

  const getPriceLabel = (pkgId: "pkg_20" | "pkg_60" | "pkg_150") => {
    const price = PRICES[currency][pkgId];
    if (currency === "brl") {
      return `R$ ${price},00`;
    }
    return `€ ${price},00`;
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 28 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <h3 style={{ fontSize: "1.2rem", fontWeight: "bold", color: "var(--color-text)" }}>
          🛒 Adquirir Attention Tokens (AT)
        </h3>
        <p style={{ fontSize: "0.8125rem", color: "var(--color-text-2)" }}>
          Precisa de feedbacks rápidos? Compre créditos adicionais. Moeda selecionada: <strong style={{ color: "var(--color-accent)", textTransform: "uppercase" }}>{currency}</strong>
        </p>
      </div>

      {message && (
        <div style={{
          padding: "10px 14px",
          background: message.startsWith("🎉") ? "rgba(34, 197, 94, 0.08)" : "rgba(239, 68, 68, 0.08)",
          border: `1px solid ${message.startsWith("🎉") ? "rgba(34, 197, 94, 0.2)" : "rgba(239, 68, 68, 0.2)"}`,
          borderRadius: 6,
          fontSize: "0.85rem",
          color: message.startsWith("🎉") ? "#4ade80" : "#f87171"
        }}>
          {message}
        </div>
      )}

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
        gap: 16
      }}>
        {PACKS.map((pack) => (
          <div
            key={pack.id}
            style={{
              padding: 20,
              background: "var(--color-surface-2)",
              border: "1px solid var(--color-border)",
              borderRadius: 12,
              textAlign: "center",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 8,
              transition: "border-color var(--transition-fast)",
            }}
            onMouseEnter={(e) => e.currentTarget.style.borderColor = "var(--color-border-2)"}
            onMouseLeave={(e) => e.currentTarget.style.borderColor = "var(--color-border)"}
          >
            <span style={{ fontSize: "0.8125rem", textTransform: "uppercase", fontWeight: "600", color: "var(--color-text-3)", letterSpacing: "0.05em" }}>
              {pack.label}
            </span>
            <span style={{ fontSize: "1.75rem", fontWeight: "800", color: "var(--color-text)" }}>
              {pack.credits} AT
            </span>
            <span style={{ fontSize: "1.125rem", fontWeight: "bold", color: "var(--color-accent)" }}>
              {getPriceLabel(pack.id as any)}
            </span>
            <Button
              variant="secondary"
              size="sm"
              loading={loadingPkg === pack.id}
              onClick={() => handleBuy(pack.id)}
              style={{ width: "100%", marginTop: 8 }}
              id={`buy-${pack.id}`}
            >
              Simular Compra
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
