import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase.server";
import { withAuth } from "@/lib/middleware/withAuth";

// ─── GET /api/credits ─────────────────────────────────────────────────────────

export const GET = withAuth(async (_req, { userId }) => {
  const db = getAdminDb();

  // Get current balance from user document
  const userSnap = await db.collection("users").doc(userId).get();
  if (!userSnap.exists) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const { creditBalance } = userSnap.data()!;

  // Get last 20 transactions from the mirror sub-collection
  const txSnap = await db
    .collection("users")
    .doc(userId)
    .collection("transactions")
    .orderBy("createdAt", "desc")
    .limit(20)
    .get();

  const transactions = txSnap.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));

  // Check if the user has any projects
  const projectsSnap = await db
    .collection("projects")
    .where("ownerId", "==", userId)
    .limit(1)
    .get();
  const isFirstProject = projectsSnap.empty;

  return NextResponse.json({ creditBalance, transactions, isFirstProject });
});
