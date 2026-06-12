import { getAdminDb } from "@/lib/firebase.server";
import { FieldValue } from "firebase-admin/firestore";
import { CreditTxType } from "@/types";

// ─── Credit Engine ────────────────────────────────────────────────────────────
// All credit mutations go through here. Every operation uses runTransaction
// to atomically update creditBalance AND write to credit_transactions.

const db = () => getAdminDb();

// ─── Internal atomic helper ───────────────────────────────────────────────────

async function applyTransaction(
  userId: string,
  type: CreditTxType,
  amount: number,  // positive = credit added, negative = credit removed
  description: string,
  refId: string
): Promise<void> {
  const firestore = db();
  const userRef = firestore.collection("users").doc(userId);

  await firestore.runTransaction(async (tx) => {
    const userSnap = await tx.get(userRef);
    if (!userSnap.exists) throw new Error(`User ${userId} not found`);

    const userData = userSnap.data()!;
    const current = userData.creditBalance as number;
    const next = current + amount;

    if (next < 0) {
      throw new Error(
        `Insufficient credits: balance=${current}, attempted=${Math.abs(amount)}`
      );
    }

    const currentTransferable = (userData.transferableBalance ?? 0) as number;
    if (type === "hold" && currentTransferable < Math.abs(amount)) {
      throw new Error(
        `Insufficient transferable credits: O saldo de boas-vindas não pode ser transferido diretamente para outros usuários. Adquira créditos adicionais ou ganhe-os avaliando outros projetos.`
      );
    }

    let updatedTransferable = currentTransferable;
    if (type === "hold") {
      updatedTransferable -= Math.abs(amount);
    } else if (type === "release" || type === "purchase" || type === "refund") {
      updatedTransferable += amount;
    }

    // transferableBalance cannot exceed total creditBalance (next) and cannot be negative
    const nextTransferable = Math.max(0, Math.min(updatedTransferable, next));

    tx.update(userRef, {
      creditBalance: next,
      transferableBalance: nextTransferable,
      updatedAt: FieldValue.serverTimestamp(),
    });

    const txRef = firestore.collection("credit_transactions").doc();
    tx.set(txRef, {
      id: txRef.id,
      userId,
      type,
      amount,
      refId,
      description,
      createdAt: FieldValue.serverTimestamp(),
    });

    // Mirror to user sub-collection for fast profile reads
    const mirrorRef = firestore
      .collection("users")
      .doc(userId)
      .collection("transactions")
      .doc(txRef.id);
    tx.set(mirrorRef, {
      id: txRef.id,
      type,
      amount,
      description,
      createdAt: FieldValue.serverTimestamp(),
    });
  });
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Debit credits from a user (e.g., listing a project).
 * Throws if balance is insufficient.
 */
export async function debitCredits(
  userId: string,
  amount: number,
  description: string,
  refId: string
): Promise<void> {
  await applyTransaction(userId, "spend", -amount, description, refId);
}

/**
 * Hold credits for a pending feedback submission.
 * Credits are deducted from balance immediately but marked as "hold".
 */
export async function holdCredits(
  userId: string,
  amount: number,
  feedbackId: string
): Promise<void> {
  await applyTransaction(
    userId,
    "hold",
    -amount,
    `Feedback submitted — awaiting approval`,
    feedbackId
  );
}

/**
 * Release held credits to the reviewer when feedback is approved.
 * Deducts 1 AT platform transaction fee and transfers it to the system_platform account.
 */
export async function releaseCredits(
  userId: string,
  amount: number,
  feedbackId: string,
  projectName: string
): Promise<void> {
  const platformFee = 1;
  const reviewerAmount = amount - platformFee;

  // 1. Release reviewer amount to reviewer
  if (reviewerAmount > 0) {
    await applyTransaction(
      userId,
      "release",
      reviewerAmount,
      `Feedback approved for "${projectName}" (after platform fee)`,
      feedbackId
    );
  }

  // 2. Transfer platformFee to system_platform user
  if (platformFee > 0) {
    const firestore = db();
    const platformRef = firestore.collection("users").doc("system_platform");
    
    await firestore.runTransaction(async (tx) => {
      const platformSnap = await tx.get(platformRef);
      if (!platformSnap.exists) {
        tx.set(platformRef, {
          id: "system_platform",
          name: "GiveToGet Platform",
          email: "platform@givetoget.com",
          creditBalance: platformFee,
          transferableBalance: platformFee,
          feedbacksGiven: 0,
          feedbacksReceived: 0,
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        });
      } else {
        const data = platformSnap.data()!;
        const current = (data.creditBalance ?? 0) as number;
        const currentTransferable = (data.transferableBalance ?? 0) as number;
        tx.update(platformRef, {
          creditBalance: current + platformFee,
          transferableBalance: currentTransferable + platformFee,
          updatedAt: FieldValue.serverTimestamp(),
        });
      }

      // Write credit transaction for platform
      const txRef = firestore.collection("credit_transactions").doc();
      tx.set(txRef, {
        id: txRef.id,
        userId: "system_platform",
        type: "platform_fee",
        amount: platformFee,
        refId: feedbackId,
        description: `Platform fee for feedback on "${projectName}"`,
        createdAt: FieldValue.serverTimestamp(),
      });

      // Mirror to sub-collection
      const mirrorRef = platformRef.collection("transactions").doc(txRef.id);
      tx.set(mirrorRef, {
        id: txRef.id,
        type: "platform_fee",
        amount: platformFee,
        description: `Platform fee for feedback on "${projectName}"`,
        createdAt: FieldValue.serverTimestamp(),
      });
    });
  }
}

/**
 * Refund held credits if feedback is rejected.
 */
export async function refundCredits(
  userId: string,
  amount: number,
  feedbackId: string
): Promise<void> {
  await applyTransaction(
    userId,
    "refund",
    amount,
    "Feedback rejected — credits refunded",
    feedbackId
  );
}

/**
 * Inject credits from a Stripe purchase.
 */
export async function purchaseCredits(
  userId: string,
  amount: number,
  stripeEventId: string
): Promise<void> {
  await applyTransaction(
    userId,
    "purchase",
    amount,
    `Purchased ${amount} Attention Tokens`,
    stripeEventId
  );
}

/**
 * Grant credits (e.g., signup bonus, earn from approved feedback).
 */
export async function earnCredits(
  userId: string,
  amount: number,
  description: string,
  refId: string
): Promise<void> {
  await applyTransaction(userId, "earn", amount, description, refId);
}
