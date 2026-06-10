import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase.server";
import { createNotification } from "@/lib/notifications.server";
import { checkAndAwardAchievements } from "@/lib/achievements.server";
import { withAuth } from "@/lib/middleware/withAuth";
import { releaseCredits, refundCredits } from "@/lib/credits/engine";
import { FieldValue } from "firebase-admin/firestore";
import { z } from "zod";

// ─── PATCH /api/feedbacks/[feedbackId]/approve ────────────────────────────────

const ApproveSchema = z.object({
  action: z.enum(["approve", "reject"]),
});

export const PATCH = withAuth(async (req, { userId, params }) => {
  const feedbackId = params?.feedbackId;
  if (!feedbackId) {
    return NextResponse.json({ error: "Missing feedbackId" }, { status: 400 });
  }

  const body = await req.json();
  const parsed = ApproveSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { action } = parsed.data;
  const db = getAdminDb();

  // Load feedback
  const feedbackSnap = await db.collection("feedbacks").doc(feedbackId).get();
  if (!feedbackSnap.exists) {
    return NextResponse.json({ error: "Feedback not found" }, { status: 404 });
  }

  const feedback = feedbackSnap.data()!;

  if (feedback.status !== "pending") {
    return NextResponse.json(
      { error: `Feedback is already ${feedback.status}.` },
      { status: 409 }
    );
  }

  // Load project to verify ownership
  const projectSnap = await db
    .collection("projects")
    .doc(feedback.projectId)
    .get();
  if (!projectSnap.exists) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const project = projectSnap.data()!;
  if (project.ownerId !== userId) {
    return NextResponse.json(
      { error: "Only the project owner can approve or reject feedback." },
      { status: 403 }
    );
  }

  if (action === "approve") {
    // Update feedback status
    await feedbackSnap.ref.update({
      status: "approved",
      approvedAt: FieldValue.serverTimestamp(),
    });

    // Release credits to reviewer
    await releaseCredits(
      feedback.reviewerId,
      feedback.creditsHeld,
      feedbackId,
      project.name
    );

    // Send notification to reviewer
    await createNotification(
      feedback.reviewerId,
      "feedback_approved",
      "Feedback Aprovado! 🎉",
      `Sua avaliação para o projeto "${project.name}" foi aprovada pelo autor. +${feedback.creditsHeld} AT adicionados.`,
      `/showcase/${feedback.projectId}`
    );

    // Update reviewer reputation score
    const reviewerSnap = await db
      .collection("users")
      .doc(feedback.reviewerId)
      .get();
    const reviewerData = reviewerSnap.data()!;
    const totalGiven = reviewerData.feedbacksGiven as number;
    // Get count of approved feedbacks
    const approvedCount = await db
      .collection("feedbacks")
      .where("reviewerId", "==", feedback.reviewerId)
      .where("status", "==", "approved")
      .get();
    const newReputation =
      totalGiven > 0 ? (approvedCount.size + 1) / totalGiven : 1;

    await db.collection("users").doc(feedback.reviewerId).update({
      reputationScore: newReputation,
      updatedAt: FieldValue.serverTimestamp(),
    });

    // Check and award achievements for the reviewer (e.g. great_critic, bug_hunter, etc.)
    await checkAndAwardAchievements(feedback.reviewerId);
  } else {
    // Reject: update feedback and refund held credits
    await feedbackSnap.ref.update({
      status: "rejected",
      approvedAt: FieldValue.serverTimestamp(),
    });

    await refundCredits(
      project.ownerId,
      feedback.creditsHeld,
      feedbackId
    );

    // Send notification to reviewer
    await createNotification(
      feedback.reviewerId,
      "feedback_rejected",
      "Feedback Rejeitado",
      `Sua avaliação para o projeto "${project.name}" foi rejeitada pelo autor.`,
      `/showcase/${feedback.projectId}`
    );
  }

  return NextResponse.json({ success: true, action });
});
