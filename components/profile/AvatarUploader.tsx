"use client";

import React, { useState, useRef } from "react";
import styles from "./AvatarUploader.module.css";

interface AvatarUploaderProps {
  userId: string;
  initialAvatar: string;
  fallbackAvatar: string;
  userName: string;
}

export default function AvatarUploader({
  userId,
  initialAvatar,
  fallbackAvatar,
  userName,
}: AvatarUploaderProps) {
  const [avatar, setAvatar] = useState(initialAvatar);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Por favor, selecione um arquivo de imagem válido.");
      return;
    }

    setUploading(true);
    setError(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = async () => {
        try {
          const canvas = document.createElement("canvas");
          canvas.width = 150;
          canvas.height = 150;
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            setError("Erro ao processar imagem.");
            setUploading(false);
            return;
          }

          // Crop centered square
          const size = Math.min(img.width, img.height);
          const sx = (img.width - size) / 2;
          const sy = (img.height - size) / 2;

          ctx.drawImage(img, sx, sy, size, size, 0, 0, 150, 150);

          // Get compressed Base64 JPEG data URL
          const base64Data = canvas.toDataURL("image/jpeg", 0.85);

          const res = await fetch("/api/user/profile", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ image: base64Data }),
          });

          if (!res.ok) {
            throw new Error("Erro no upload");
          }

          const data = await res.json();
          setAvatar(data.avatarUrl);
          
          // Force page reload to sync the sidebar avatar
          window.location.reload();
        } catch (err) {
          console.error(err);
          setError("Falha ao salvar a imagem de perfil.");
          setUploading(false);
        }
      };
      img.onerror = () => {
        setError("Erro ao carregar a imagem selecionada.");
        setUploading(false);
      };
      img.src = event.target?.result as string;
    };
    reader.onerror = () => {
      setError("Erro ao ler o arquivo de imagem.");
      setUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveAvatar = async () => {
    setUploading(true);
    setError(null);
    try {
      const res = await fetch("/api/user/profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ image: null }),
      });

      if (!res.ok) {
        throw new Error("Erro ao remover a foto.");
      }

      setAvatar(fallbackAvatar);
      
      // Force page reload to sync the sidebar avatar
      window.location.reload();
    } catch (err) {
      console.error(err);
      setError("Falha ao redefinir a imagem de perfil.");
      setUploading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div 
        className={styles.avatarWrapper}
        onClick={() => !uploading && fileInputRef.current?.click()}
        title="Clique para alterar a foto"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={avatar || "/logo.png"}
          alt={userName}
          className={styles.avatar}
          width={72}
          height={72}
        />
        <div className={styles.overlay}>
          {uploading ? (
            <span className="spinner" style={{ width: 20, height: 20 }}></span>
          ) : (
            <svg 
              className={styles.pencilIcon} 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          )}
        </div>
      </div>
      <div className={styles.actions}>
        <button
          type="button"
          className={styles.uploadBtn}
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? "Carregando..." : "Alterar foto"}
        </button>
        {avatar !== fallbackAvatar && (
          <button
            type="button"
            className={styles.removeBtn}
            onClick={handleRemoveAvatar}
            disabled={uploading}
          >
            Usar GitHub
          </button>
        )}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*"
          style={{ display: "none" }}
        />
        {error && <span className={styles.error}>{error}</span>}
      </div>
    </div>
  );
}
