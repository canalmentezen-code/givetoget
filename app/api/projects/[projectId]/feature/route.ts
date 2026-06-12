import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase.server";
import { withAuth } from "@/lib/middleware/withAuth";
import { FieldValue } from "firebase-admin/firestore";

// ─── POST /api/projects/[projectId]/feature ───────────────────────────────────

export const POST = withAuth(async (req, { userId, params }) => {
  const projectId = params?.projectId;
  if (!projectId) {
    return NextResponse.json({ error: "Missing projectId" }, { status: 400 });
  }

  const db = getAdminDb();
  const projectRef = db.collection("projects").doc(projectId);
  const projectSnap = await projectRef.get();

  if (!projectSnap.exists) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const project = projectSnap.data()!;
  if (project.ownerId !== userId) {
    return NextResponse.json({ error: "Forbidden: You are not the owner of this project." }, { status: 403 });
  }

  // Calculate featured duration (7 days from now)
  const featuredUntil = new Date();
  featuredUntil.setDate(featuredUntil.getDate() + 7);

  await projectRef.update({
    isFeatured: true,
    featuredUntil: featuredUntil,
    updatedAt: FieldValue.serverTimestamp(),
  });

  return NextResponse.json({
    success: true,
    isFeatured: true,
    featuredUntil: featuredUntil.toISOString(),
  });
});
