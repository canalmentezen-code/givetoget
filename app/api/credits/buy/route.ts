import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase.server";
import { withAuth } from "@/lib/middleware/withAuth";
import { purchaseCredits } from "@/lib/credits/engine";
import { FieldValue } from "firebase-admin/firestore";
import { z } from "zod";

const BuyCreditsSchema = z.object({
  packageId: z.enum(["pkg_20", "pkg_60", "pkg_150"]),
  currency: z.enum(["eur", "brl"]),
});

// Pack credits mapping
const CREDIT_MAPPING = {
  pkg_20: 20,
  pkg_60: 60,
  pkg_150: 150,
};

// Simulated price mapping in cents/centavos
const PRICE_MAPPING = {
  eur: {
    pkg_20: 500,    // €5.00
    pkg_60: 1200,   // €12.00
    pkg_150: 2500,  // €25.00
  },
  brl: {
    pkg_20: 2500,   // R$25.00
    pkg_60: 6000,   // R$60.00
    pkg_150: 12500, // R$125.00
  },
};

// ─── POST /api/credits/buy ───────────────────────────────────────────────────

export const POST = withAuth(async (req, { userId }) => {
  const body = await req.json();
  const parsed = BuyCreditsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { packageId, currency } = parsed.data;
  const credits = CREDIT_MAPPING[packageId];
  const amountCents = PRICE_MAPPING[currency][packageId];

  const db = getAdminDb();
  const paymentRef = db.collection("stripe_payments").doc();

  try {
    // 1. Record the simulated transaction
    const eventId = `sim_evt_${Date.now()}`;
    await paymentRef.set({
      id: paymentRef.id,
      userId,
      stripeSessionId: `sim_sess_${Date.now()}`,
      stripeEventId: eventId,
      creditsGranted: credits,
      amountCents,
      currency,
      status: "pending",
      processedAt: FieldValue.serverTimestamp(),
    });

    // 2. Add credits to the wallet
    await purchaseCredits(userId, credits, eventId);

    // 3. Mark payment as completed
    await paymentRef.update({
      status: "completed",
      processedAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({
      success: true,
      credits,
      amountCents,
      currency,
    });
  } catch (err) {
    console.error("[Simulated Purchase API] Error:", err);
    return NextResponse.json(
      { error: "Erro ao processar compra simulada." },
      { status: 500 }
    );
  }
});
