import Stripe from "stripe";
import { CREDIT_PACKAGES, CreditPackage } from "@/types";

// ─── Stripe SDK Singleton ────────────────────────────────────────────────────

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: "2026-05-27.dahlia",
    });
  }
  return _stripe;
}

// ─── Checkout Session Helper ──────────────────────────────────────────────────

export async function createCheckoutSession(
  userId: string,
  packageId: string,
  baseUrl: string
): Promise<string> {
  const stripe = getStripe();

  const pkg = CREDIT_PACKAGES.find((p) => p.id === packageId);
  if (!pkg) throw new Error(`Unknown package: ${packageId}`);

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: pkg.currency,
          unit_amount: pkg.amountCents,
          product_data: {
            name: `GiveToGet — ${pkg.label} Pack`,
            description: `${pkg.credits} Attention Tokens`,
          },
        },
      },
    ],
    metadata: {
      userId,
      packageId,
      creditsGranted: String(pkg.credits),
    },
    success_url: `${baseUrl}/profile?payment=success`,
    cancel_url: `${baseUrl}/profile?payment=cancelled`,
  });

  return session.url!;
}

export { CREDIT_PACKAGES };
export type { CreditPackage };
