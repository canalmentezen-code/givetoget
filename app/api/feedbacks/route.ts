import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAdminDb } from "@/lib/firebase.server";
import { createNotification } from "@/lib/notifications.server";
import { withAuth } from "@/lib/middleware/withAuth";
import { holdCredits } from "@/lib/credits/engine";
import { validateFeedback } from "@/lib/credits/validation";
import { checkFeedbackRateLimit } from "@/lib/middleware/rateLimit";
import { FieldValue } from "firebase-admin/firestore";
import { CREDITS_PER_APPROVED_FEEDBACK } from "@/types";

// ─── Zod Schema ───────────────────────────────────────────────────────────────

const SubmitFeedbackSchema = z.object({
  projectId: z.string().min(1),
  qualitativeText: z.string(),
  uxScore: z.number().int().min(1).max(5),
  bugCount: z.number().int().min(0),
  bugLogs: z.string().default(""),
  promptEvaluation: z.string().nullable().optional(),
});

// ─── POST /api/feedbacks ──────────────────────────────────────────────────────

export const POST = withAuth(async (req, { userId }) => {
  // Rate limit check
  const rateCheck = checkFeedbackRateLimit(userId);
  if (!rateCheck.allowed) {
    return NextResponse.json(
      {
        error: `Rate limit exceeded. You can submit at most 5 feedbacks per hour. Try again at ${new Date(rateCheck.resetAt).toISOString()}.`,
      },
      {
        status: 429,
        headers: {
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": String(rateCheck.resetAt),
        },
      }
    );
  }

  const body = await req.json();
  const parsed = SubmitFeedbackSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const data = parsed.data;
  const db = getAdminDb();

  // Verify reviewer is verified (GitHub fraud check)
  let reviewerName = "outro usuário";
  const reviewerSnap = await db.collection("users").doc(userId).get();
  if (reviewerSnap.exists) {
    const reviewerData = reviewerSnap.data()!;
    reviewerName = reviewerData.name || reviewerName;
    if (reviewerData.isVerified === false) {
      return NextResponse.json(
        {
          error: `Sua conta não atende aos requisitos mínimos de segurança do GitHub para avaliar projetos e ganhar tokens. Motivo: ${reviewerData.verificationReason || "Perfil muito recente ou inativo"}.`,
        },
        { status: 403 }
      );
    }
  }

  // Verify project exists and get owner
  const projectSnap = await db
    .collection("projects")
    .doc(data.projectId)
    .get();
  if (!projectSnap.exists) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const project = projectSnap.data()!;

  // Stealth mode verification
  if (project.isStealth && project.ownerId !== userId) {
    if (reviewerSnap.exists) {
      const reviewerData = reviewerSnap.data()!;
      const reputation = reviewerData.reputationScore ?? 1.0;
      if (reputation < 0.95) {
        return NextResponse.json(
          {
            error: `Este projeto está em Modo Stealth e requer reputação mínima de 95% para avaliar. Sua reputação atual é ${Math.round(reputation * 100)}%.`,
          },
          { status: 403 }
        );
      }
    } else {
      return NextResponse.json(
        { error: "Perfil do avaliador não encontrado." },
        { status: 403 }
      );
    }
  }

  // Business rule: validate feedback quality and self-review
  const validation = validateFeedback({
    qualitativeText: data.qualitativeText,
    bugCount: data.bugCount,
    bugLogs: data.bugLogs,
    reviewerId: userId,
    projectOwnerId: project.ownerId,
  });

  if (!validation.valid) {
    return NextResponse.json({ errors: validation.errors }, { status: 422 });
  }

  // Check project owner's balance before hold
  const ownerSnap = await db.collection("users").doc(project.ownerId).get();
  if (!ownerSnap.exists) {
    return NextResponse.json({ error: "Project owner not found" }, { status: 404 });
  }
  const ownerData = ownerSnap.data()!;
  const ownerTransferable = (ownerData.transferableBalance ?? 0) as number;
  if (ownerTransferable < CREDITS_PER_APPROVED_FEEDBACK) {
    return NextResponse.json(
      {
        error: "O proprietário do projeto não possui saldo transferível suficiente para recompensar esta avaliação (o criador precisa de verificar a sua conta do GitHub ou ganhar créditos participando da comunidade). Tente outro projeto!",
      },
      { status: 402 }
    );
  }

  // Create feedback document
  const feedbackRef = db.collection("feedbacks").doc();
  const now = FieldValue.serverTimestamp();

  await feedbackRef.set({
    id: feedbackRef.id,
    projectId: data.projectId,
    reviewerId: userId,
    qualitativeText: data.qualitativeText,
    uxScore: data.uxScore,
    bugCount: data.bugCount,
    bugLogs: data.bugLogs,
    promptEvaluation: data.promptEvaluation ?? null,
    status: "pending",
    creditsHeld: CREDITS_PER_APPROVED_FEEDBACK,
    submittedAt: now,
    approvedAt: null,
  });

  // Hold credits from the project owner (deducted from owner balance)
  await holdCredits(project.ownerId, CREDITS_PER_APPROVED_FEEDBACK, feedbackRef.id);

  // Update reviewer's feedbacksGiven counter
  await db
    .collection("users")
    .doc(userId)
    .update({ feedbacksGiven: FieldValue.increment(1) });

  // Update project owner's feedbacksReceived counter
  await db
    .collection("users")
    .doc(project.ownerId)
    .update({ feedbacksReceived: FieldValue.increment(1) });

  // Send notification to project owner
  await createNotification(
    project.ownerId,
    "feedback_received",
    "Novo Feedback Recebido",
    `Seu projeto "${project.name}" recebeu uma nova avaliação de ${reviewerName}.`,
    `/showcase/${data.projectId}`
  );

  return NextResponse.json({ feedbackId: feedbackRef.id, autoApproved: false }, { status: 201 });
});
