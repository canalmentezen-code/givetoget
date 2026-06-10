import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getAdminDb } from "@/lib/firebase.server";
import { FieldValue } from "firebase-admin/firestore";
import { CREDITS_ON_SIGNUP } from "@/types";

// ─── POST /api/auth/sync-user ─────────────────────────────────────────────────
// Called after sign-in to upsert the Firestore user document.
// This is needed because firebase-admin cannot run in edge middleware.

export async function POST() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: userId, email, name, image } = session.user;

  try {
    const db = getAdminDb();
    const userRef = db.collection("users").doc(userId);
    const snapshot = await userRef.get();

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
        feedbacksGiven: 0,
        feedbacksReceived: 0,
        reputationScore: 0,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });

      // Record initial credit transaction
      await db.collection("credit_transactions").add({
        userId,
        type: "earn",
        amount: CREDITS_ON_SIGNUP,
        refId: "signup",
        description: "Welcome bonus credits",
        createdAt: FieldValue.serverTimestamp(),
      });

      return NextResponse.json({ created: true });
    } else {
      // Update profile on subsequent logins
      await userRef.update({
        name: name ?? snapshot.data()?.name,
        avatarUrl: image ?? snapshot.data()?.avatarUrl,
        updatedAt: FieldValue.serverTimestamp(),
      });

      return NextResponse.json({ updated: true });
    }
  } catch (error) {
    console.error("[sync-user] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
