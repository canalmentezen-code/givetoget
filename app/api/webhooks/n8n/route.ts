import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAdminDb } from "@/lib/firebase.server";
import { FieldValue } from "firebase-admin/firestore";

// ─── POST /api/webhooks/n8n ───────────────────────────────────────────────────
// Generic automation endpoint for n8n workflows.
// Accepts a projectId and content, creates a ShipLog entry.

const N8nPayloadSchema = z.object({
  projectId: z.string().min(1),
  content: z.string().min(1).max(2000),
  source: z.enum(["n8n", "manual"]).default("n8n"),
  externalRef: z.string().nullable().optional(),
  // Simple bearer token auth
  token: z.string(),
});

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = N8nPayloadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { projectId, content, source, externalRef, token } = parsed.data;

  // Verify static token
  if (token !== process.env.N8N_WEBHOOK_TOKEN) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = getAdminDb();

  const projectSnap = await db.collection("projects").doc(projectId).get();
  if (!projectSnap.exists) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const logRef = db.collection("ship_logs").doc();
  await logRef.set({
    id: logRef.id,
    projectId,
    authorId: projectSnap.data()!.ownerId,
    content,
    source,
    externalRef: externalRef ?? null,
    createdAt: FieldValue.serverTimestamp(),
  });

  return NextResponse.json({ logId: logRef.id }, { status: 201 });
}
