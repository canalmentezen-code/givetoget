import "server-only";

import { getAdminDb } from "./firebase.server";
import { FieldValue } from "firebase-admin/firestore";
import { CREDITS_ON_SIGNUP } from "@/types";

export async function syncUser(sessionUser: {
  id: string;
  email?: string | null;
  name?: string | null;
  image?: string | null;
  provider?: string | null;
  githubCreatedAt?: string | null;
  githubPublicRepos?: number | null;
}) {
  const { id: userId, email, name, image, provider, githubCreatedAt, githubPublicRepos } = sessionUser;

  try {
    const db = getAdminDb();

    const userRef = db.collection("users").doc(userId);
    const snapshot = await userRef.get();

    let isVerified = false;
    let verificationReason = "Apenas contas de GitHub estabelecidas são verificadas automaticamente.";

    if (provider === "github") {
      isVerified = true;
      verificationReason = "";

      if (githubCreatedAt) {
        const createdDate = new Date(githubCreatedAt);
        const ageInDays = (Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24);
        if (ageInDays < 30) {
          isVerified = false;
          verificationReason = "Conta do GitHub criada há menos de 30 dias";
        }
      } else {
        isVerified = false;
        verificationReason = "Data de criação da conta do GitHub não disponível";
      }

      if (githubPublicRepos !== undefined && githubPublicRepos !== null && githubPublicRepos < 1) {
        isVerified = false;
        verificationReason = "Conta do GitHub sem repositórios públicos";
      }
    }

    if (!snapshot.exists) {
      // First-time login — create user with starter credits
      await userRef.set({
        id: userId,
        email: email ?? "",
        name: name ?? "",
        avatarUrl: image ?? "",
        githubId: null,
        googleId: null,
        creditBalance: CREDITS_ON_SIGNUP,
        transferableBalance: isVerified ? CREDITS_ON_SIGNUP : 0, // Signup bonus is transferable for verified users
        isVerified,
        verificationReason,
        feedbacksGiven: 0,
        feedbacksReceived: 0,
        reputationScore: 0,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });

      // Record initial credit transaction
      const txRef = db.collection("credit_transactions").doc();
      await txRef.set({
        id: txRef.id,
        userId,
        type: "earn",
        amount: CREDITS_ON_SIGNUP,
        refId: "signup",
        description: "Welcome bonus credits",
        createdAt: FieldValue.serverTimestamp(),
      });

      // Mirror to user sub-collection for profile history
      await db
        .collection("users")
        .doc(userId)
        .collection("transactions")
        .doc(txRef.id)
        .set({
          id: txRef.id,
          type: "earn",
          amount: CREDITS_ON_SIGNUP,
          description: "Welcome bonus credits",
          createdAt: FieldValue.serverTimestamp(),
        });
    } else {
      // Update profile on subsequent logins
      const data = snapshot.data()!;
      const updates: any = {
        name: name ?? data.name,
        avatarUrl: image ?? data.avatarUrl,
        isVerified,
        verificationReason,
        updatedAt: FieldValue.serverTimestamp(),
      };

      if (data.transferableBalance === undefined) {
        updates.transferableBalance = Math.max(0, (data.creditBalance ?? 0) - CREDITS_ON_SIGNUP);
      }

      await userRef.update(updates);
    }
  } catch (error) {
    console.error("[syncUser] Error:", error);
  }
}
