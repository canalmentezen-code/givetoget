import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAdminDb } from "@/lib/firebase.server";
import { withAuth } from "@/lib/middleware/withAuth";
import { auth } from "@/lib/auth";
import { FieldValue } from "firebase-admin/firestore";

// ─── GET /api/projects/[projectId] ───────────────────────────────────────────

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;
  const db = getAdminDb();
  const session = await auth();
  const userId = session?.user?.id ?? null;

  const projectSnap = await db.collection("projects").doc(projectId).get();
  if (!projectSnap.exists) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const data = projectSnap.data()!;

  // Increment view count (fire-and-forget)
  db.collection("projects")
    .doc(projectId)
    .update({ viewCount: FieldValue.increment(1) })
    .catch(console.error);

  // Strip url for private projects unless requester has approved access
  if (data.visibility === "private" && data.ownerId !== userId) {
    let hasAccess = false;

    if (userId) {
      const accessQuery = await db
        .collection("access_requests")
        .where("projectId", "==", projectId)
        .where("requesterId", "==", userId)
        .where("status", "==", "approved")
        .limit(1)
        .get();
      hasAccess = !accessQuery.empty;
    }

    if (!hasAccess) {
      const { url: _url, ...rest } = data;
      return NextResponse.json({ id: projectSnap.id, ...rest, url: null });
    }
  }

  return NextResponse.json({ id: projectSnap.id, ...data });
}

// ─── PATCH /api/projects/[projectId] ─────────────────────────────────────────

const UpdateProjectSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  description: z.string().min(20).max(1000).optional(),
  testInstructions: z.string().min(20).max(2000).optional(),
  techStack: z.array(z.string()).min(1).max(10).optional(),
  niche: z.string().min(2).max(50).optional(),
  helpTypes: z.array(z.string()).min(1).max(5).optional(),
  status: z.enum(["active", "paused", "archived"]).optional(),
  visibility: z.enum(["public", "private"]).optional(),
});

export const PATCH = withAuth(async (req, { userId, params }) => {
  const projectId = params?.projectId;
  if (!projectId)
    return NextResponse.json({ error: "Missing projectId" }, { status: 400 });

  const db = getAdminDb();
  const projectSnap = await db.collection("projects").doc(projectId).get();

  if (!projectSnap.exists) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }
  if (projectSnap.data()!.ownerId !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = UpdateProjectSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  await db
    .collection("projects")
    .doc(projectId)
    .update({ ...parsed.data, updatedAt: FieldValue.serverTimestamp() });

  return NextResponse.json({ success: true });
});

// ─── DELETE /api/projects/[projectId] ────────────────────────────────────────

export const DELETE = withAuth(async (_req, { userId, params }) => {
  const projectId = params?.projectId;
  if (!projectId)
    return NextResponse.json({ error: "Missing projectId" }, { status: 400 });

  const db = getAdminDb();
  const projectSnap = await db.collection("projects").doc(projectId).get();

  if (!projectSnap.exists) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }
  if (projectSnap.data()!.ownerId !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Soft-delete: archive rather than hard delete
  await db
    .collection("projects")
    .doc(projectId)
    .update({ status: "archived", updatedAt: FieldValue.serverTimestamp() });

  return NextResponse.json({ success: true });
});
