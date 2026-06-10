import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase.server";
import { withAuth } from "@/lib/middleware/withAuth";

// ─── GET /api/access-requests ─────────────────────────────────────────────────
// Returns all access requests where the current user is the project owner

export const GET = withAuth(async (_req, { userId }) => {
  const db = getAdminDb();

  const snap = await db
    .collection("access_requests")
    .where("ownerId", "==", userId)
    .get();

  const requests = snap.docs
    .map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }))
    .sort((a: any, b: any) => {
      const dateA = a.requestedAt?.toDate ? a.requestedAt.toDate().getTime() : 0;
      const dateB = b.requestedAt?.toDate ? b.requestedAt.toDate().getTime() : 0;
      return dateB - dateA;
    })
    .slice(0, 50);

  return NextResponse.json({ requests });
});
