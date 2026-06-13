"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

interface PromoteButtonProps {
  projectId: string;
  isFeatured: boolean;
  featuredUntil: string | null;
}

export function PromoteButton({ projectId, isFeatured, featuredUntil }: PromoteButtonProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handlePromote = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/feature`, {
        method: "POST",
      });
      if (res.ok) {
        router.refresh();
      } else {
        const data = await res.json();
        alert(data.error ?? "Falha ao promover o projeto.");
      }
    } catch {
      alert("Erro de rede ao promover projeto.");
    } finally {
      setLoading(false);
    }
  };

  if (isFeatured) {
    const dateStr = featuredUntil
      ? new Date(featuredUntil).toLocaleDateString()
      : "7 dias";
    return (
      <div style={{
        marginTop: 16,
        padding: 16,
        background: "rgba(245, 158, 11, 0.08)",
        border: "1px dashed rgba(245, 158, 11, 0.35)",
        borderRadius: 8,
        display: "flex",
        flexDirection: "column",
        gap: 6
      }}>
        <span style={{ color: "#fbbf24", fontWeight: "bold", fontSize: "0.95rem" }}>
          👑 Projeto Destacado!
        </span>
        <span style={{ fontSize: "0.8125rem", color: "var(--color-text-2)" }}>
          O seu projeto está fixado no topo da Vitrine. Promoção ativa até {dateStr}.
        </span>
      </div>
    );
  }

  return (
    <div style={{
      marginTop: 16,
      padding: 16,
      background: "var(--color-surface-2)",
      border: "1px solid var(--color-border)",
      borderRadius: 8,
      display: "flex",
      flexDirection: "column",
      gap: 12
    }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <span style={{ fontWeight: "600", fontSize: "0.9375rem", color: "var(--color-text)" }}>
          🚀 Destacar na Vitrine
        </span>
        <span style={{ fontSize: "0.8125rem", color: "var(--color-text-2)" }}>
          Coloque o seu projeto fixado no topo da página principal para receber feedbacks 5x mais rápido.
        </span>
      </div>
      <Button
        variant="accent"
        size="sm"
        loading={loading}
        onClick={handlePromote}
        style={{
          background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
          color: "#000",
          fontWeight: "600",
          border: "none"
        }}
        id="promote-project-btn"
      >
        Destacar Projeto (Simular Compra 9€/semana)
      </Button>
    </div>
  );
}
