import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

// ─── Types ────────────────────────────────────────────────────────────────────

export type AuthedHandler = (
  req: NextRequest,
  context: { userId: string; params?: Record<string, string> }
) => Promise<NextResponse>;

// ─── withAuth HOF ─────────────────────────────────────────────────────────────

/**
 * Wraps an API route handler, injects the authenticated userId.
 * Returns 401 if the request has no valid session.
 */
export function withAuth(handler: AuthedHandler) {
  return async function (
    req: NextRequest,
    context: { params: Promise<Record<string, string>> }
  ): Promise<NextResponse> {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const resolvedParams = context && context.params ? await context.params : {};

    return handler(req, {
      userId: session.user.id,
      params: resolvedParams,
    });
  };
}
