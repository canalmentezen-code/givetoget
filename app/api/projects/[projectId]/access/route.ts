import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAdminDb } from "@/lib/firebase.server";
import { createNotification } from "@/lib/notifications.server";
import { withAuth } from "@/lib/middleware/withAuth";
import { FieldValue } from "firebase-admin/firestore";

// ─── POST /api/projects/[projectId]/access ────────────────────────────────────
// Requester creates an access request for a private project

const RequestAccessSchema = z.object({
  message: z.string().max(500).optional().default(""),
});

export const POST = withAuth(async (req, { userId, params }) => {
  const projectId = params?.projectId;
  if (!projectId)
    return NextResponse.json({ error: "Missing projectId" }, { status: 400 });

  const db = getAdminDb();

  const projectSnap = await db.collection("projects").doc(projectId).get();
  if (!projectSnap.exists) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const project = projectSnap.data()!;

  if (project.ownerId === userId) {
    return NextResponse.json(
      { error: "You cannot request access to your own project." },
      { status: 400 }
    );
  }

  // Check for existing pending/approved request
  const existing = await db
    .collection("access_requests")
    .where("projectId", "==", projectId)
    .where("requesterId", "==", userId)
    .limit(1)
    .get();

  if (!existing.empty) {
    const status = existing.docs[0].data().status;
    return NextResponse.json(
      { error: `Access request already exists with status: ${status}` },
      { status: 409 }
    );
  }

  const body = await req.json().catch(() => ({}));
  const parsed = RequestAccessSchema.safeParse(body);
  const message = parsed.success ? parsed.data.message : "";

  const requestRef = db.collection("access_requests").doc();
  await requestRef.set({
    id: requestRef.id,
    projectId,
    requesterId: userId,
    ownerId: project.ownerId,
    status: "pending",
    message,
    requestedAt: FieldValue.serverTimestamp(),
    resolvedAt: null,
  });

  // Send notification to project owner
  await createNotification(
    project.ownerId,
    "access_requested",
    "Solicitação de Acesso",
    `Um usuário solicitou acesso ao seu projeto privado "${project.name}".`,
    "/access-requests"
  );

  return NextResponse.json({ requestId: requestRef.id }, { status: 201 });
});

// ─── PATCH /api/projects/[projectId]/access ───────────────────────────────────
// Project owner approves or rejects a request

const ResolveAccessSchema = z.object({
  requestId: z.string(),
  action: z.enum(["approve", "reject"]),
});

export const PATCH = withAuth(async (req, { userId, params }) => {
  const projectId = params?.projectId;
  if (!projectId)
    return NextResponse.json({ error: "Missing projectId" }, { status: 400 });

  const body = await req.json();
  const parsed = ResolveAccessSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { requestId, action } = parsed.data;
  const db = getAdminDb();

  const requestSnap = await db.collection("access_requests").doc(requestId).get();
  if (!requestSnap.exists) {
    return NextResponse.json({ error: "Request not found" }, { status: 404 });
  }

  const requestData = requestSnap.data()!;
  if (requestData.ownerId !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await requestSnap.ref.update({
    status: action === "approve" ? "approved" : "rejected",
    resolvedAt: FieldValue.serverTimestamp(),
  });

  // Fetch project name
  const pSnap = await db.collection("projects").doc(projectId).get();
  const pName = pSnap.exists ? pSnap.data()!.name : "projeto";

  // Send notification to requester
  await createNotification(
    requestData.requesterId,
    action === "approve" ? "access_approved" : "access_rejected",
    action === "approve" ? "Acesso Aprovado! 🔑" : "Acesso Recusado",
    action === "approve"
      ? `Seu pedido de acesso ao projeto privado "${pName}" foi aprovado.`
      : `Seu pedido de acesso ao projeto privado "${pName}" foi recusado.`,
    `/showcase/${projectId}`
  );

  return NextResponse.json({ success: true });
});
