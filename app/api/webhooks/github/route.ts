import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase.server";
import { FieldValue } from "firebase-admin/firestore";
import crypto from "crypto";

// ─── POST /api/webhooks/github ────────────────────────────────────────────────
// Listens for push events. Creates a ShipLog entry for the associated project.
// The project must have externalRef set to the GitHub repo "owner/repo" format.

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("x-hub-signature-256");
  const event = req.headers.get("x-github-event");

  // Verify webhook signature if secret is configured
  if (process.env.GITHUB_WEBHOOK_SECRET && signature) {
    const expected =
      "sha256=" +
      crypto
        .createHmac("sha256", process.env.GITHUB_WEBHOOK_SECRET)
        .update(body)
        .digest("hex");

    if (
      !crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expected)
      )
    ) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }
  }

  if (event !== "push") {
    return NextResponse.json({ received: true, event });
  }

  let payload: {
    repository?: { full_name?: string };
    after?: string;
    commits?: Array<{ message?: string }>;
    pusher?: { name?: string };
  };
  try {
    payload = JSON.parse(body);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const repoFullName = payload.repository?.full_name;
  const commitSha = payload.after;

  if (!repoFullName || !commitSha) {
    return NextResponse.json({ error: "Missing repository info or commit SHA" }, { status: 400 });
  }

  const commitMessage: string =
    payload.commits?.[0]?.message ?? "New commit pushed";
  const pusherName: string = payload.pusher?.name ?? "Unknown";

  const db = getAdminDb();

  // Find project by GitHub repo reference
  const projectsSnap = await db
    .collection("projects")
    .where("githubRepo", "==", repoFullName)
    .limit(1)
    .get();

  if (projectsSnap.empty) {
    // No linked project — ignore silently
    return NextResponse.json({ received: true, linked: false });
  }

  const project = projectsSnap.docs[0];

  // Create a ship log
  const logRef = db.collection("ship_logs").doc();
  await logRef.set({
    id: logRef.id,
    projectId: project.id,
    authorId: project.data().ownerId,
    content: `🚢 [${pusherName}] ${commitMessage}`,
    source: "github",
    externalRef: commitSha,
    createdAt: FieldValue.serverTimestamp(),
  });

  return NextResponse.json({ received: true, logId: logRef.id });
}
