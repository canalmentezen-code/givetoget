import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { getAdminDb } from "@/lib/firebase.server";
import { purchaseCredits } from "@/lib/credits/engine";
import { FieldValue } from "firebase-admin/firestore";

// ─── POST /api/webhooks/stripe ────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = getStripe().webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[Stripe Webhook] Signature verification failed:", message);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  // Only handle checkout.session.completed
  if (event.type !== "checkout.session.completed") {
    return NextResponse.json({ received: true });
  }

  const session = event.data.object as Stripe.Checkout.Session;
  const db = getAdminDb();

  // ─── Idempotency check ────────────────────────────────────────────────────
  const existingPayment = await db
    .collection("stripe_payments")
    .where("stripeEventId", "==", event.id)
    .limit(1)
    .get();

  if (!existingPayment.empty) {
    // Already processed — respond 200 to stop Stripe from retrying
    console.log("[Stripe Webhook] Duplicate event, skipping:", event.id);
    return NextResponse.json({ received: true, duplicate: true });
  }

  const { userId, creditsGranted } = session.metadata ?? {};
  if (!userId || !creditsGranted) {
    console.error("[Stripe Webhook] Missing metadata:", session.metadata);
    return NextResponse.json({ error: "Missing metadata" }, { status: 400 });
  }

  const credits = parseInt(creditsGranted, 10);

  try {
    // Record the payment (pending)
    const paymentRef = db.collection("stripe_payments").doc();
    await paymentRef.set({
      id: paymentRef.id,
      userId,
      stripeSessionId: session.id,
      stripeEventId: event.id,
      creditsGranted: credits,
      amountCents: session.amount_total ?? 0,
      currency: session.currency ?? "eur",
      status: "pending",
      processedAt: FieldValue.serverTimestamp(),
    });

    // Inject credits
    await purchaseCredits(userId, credits, event.id);

    // Mark payment as completed
    await paymentRef.update({
      status: "completed",
      processedAt: FieldValue.serverTimestamp(),
    });

    console.log(`[Stripe Webhook] Granted ${credits} credits to user ${userId}`);
    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("[Stripe Webhook] Error processing payment:", err);
    // Still return 200 to avoid Stripe retrying — we'll detect via payment status
    return NextResponse.json({ received: true, error: "Processing failed" });
  }
}
