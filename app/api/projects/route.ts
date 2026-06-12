import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAdminDb } from "@/lib/firebase.server";
import { checkAndAwardAchievements } from "@/lib/achievements.server";
import { withAuth } from "@/lib/middleware/withAuth";
import { debitCredits } from "@/lib/credits/engine";
import { FieldValue } from "firebase-admin/firestore";
import { CREDITS_TO_LIST_PROJECT, CREDITS_ON_FIRST_POST, ProjectStatus, ProjectVisibility } from "@/types";

// ─── Zod Schemas ──────────────────────────────────────────────────────────────

const CreateProjectSchema = z.object({
  name: z.string().min(2).max(100),
  url: z.string().url(),
  description: z.string().min(20).max(1000),
  testInstructions: z.string().min(20).max(2000),
  techStack: z.array(z.string()).min(1).max(10),
  niche: z.string().min(2).max(50),
  helpTypes: z.array(z.string()).min(1).max(5),
  visibility: z.enum(["public", "private"]),
  isStealth: z.boolean().optional(),
});

const ListProjectsSchema = z.object({
  niche: z.string().optional(),
  techStack: z.string().optional(), // comma-separated
  status: z.enum(["active", "paused", "archived"]).optional(),
  limit: z.coerce.number().min(1).max(50).default(20),
  cursor: z.string().optional(), // Firestore document ID for pagination
  search: z.string().optional(),
  sortBy: z.string().optional(), // "recent" | "views"
});

// ─── GET /api/projects ────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const parsed = ListProjectsSchema.safeParse(
    Object.fromEntries(searchParams.entries())
  );

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { niche, techStack, status, limit, cursor, search, sortBy } = parsed.data;
  const db = getAdminDb();

  let query = db
    .collection("projects")
    .where("status", "==", status ?? "active")
    .where("visibility", "==", "public");

  if (niche) {
    query = query.where("niche", "==", niche);
  }

  const snapshot = await query.get();

  const allProjects = snapshot.docs.map((doc) => {
    const data = doc.data();
    // Strip url for all public listing (url is only shown on detail page with access check)
    const { url: _url, ...rest } = data;
    return { id: doc.id, ...rest };
  });

  // Filter in memory for techStack if specified
  let filteredProjects = allProjects;
  if (techStack) {
    const stacks = techStack.split(",").map((s) => s.trim().toLowerCase());
    filteredProjects = filteredProjects.filter((p: any) =>
      p.techStack && p.techStack.some((ts: string) => stacks.includes(ts.toLowerCase()))
    );
  }

  // Filter by search term if specified
  if (search) {
    const term = search.toLowerCase().trim();
    filteredProjects = filteredProjects.filter((p: any) =>
      (p.name && p.name.toLowerCase().includes(term)) ||
      (p.description && p.description.toLowerCase().includes(term)) ||
      (p.techStack && p.techStack.some((ts: string) => ts.toLowerCase().includes(term))) ||
      (p.niche && p.niche.toLowerCase().includes(term))
    );
  }

  // Sort in memory: Featured projects go first
  filteredProjects.sort((a: any, b: any) => {
    const isAFeatured = a.isFeatured === true;
    const isBFeatured = b.isFeatured === true;
    if (isAFeatured && !isBFeatured) return -1;
    if (!isAFeatured && isBFeatured) return 1;

    // Tie-breaker
    if (sortBy === "views") {
      return (b.viewCount ?? 0) - (a.viewCount ?? 0);
    } else {
      const dateA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0;
      const dateB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0;
      return dateB - dateA;
    }
  });

  // Handle pagination in memory
  let startIndex = 0;
  if (cursor) {
    const idx = filteredProjects.findIndex((p) => p.id === cursor);
    if (idx !== -1) {
      startIndex = idx + 1;
    }
  }

  const projects = filteredProjects.slice(startIndex, startIndex + limit);

  const nextCursor =
    filteredProjects.length > startIndex + limit
      ? projects[projects.length - 1].id
      : null;

  return NextResponse.json({ projects, nextCursor });
}

// ─── POST /api/projects ───────────────────────────────────────────────────────

export const POST = withAuth(async (req, { userId }) => {
  const body = await req.json();
  const parsed = CreateProjectSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const data = parsed.data;
  const db = getAdminDb();

  // Check balance before deducting
  const userSnap = await db.collection("users").doc(userId).get();
  if (!userSnap.exists) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const balance = userSnap.data()!.creditBalance as number;

  // Check if this is the user's first project
  const userProjectsSnap = await db
    .collection("projects")
    .where("ownerId", "==", userId)
    .limit(1)
    .get();

  const isFirstProject = userProjectsSnap.empty;
  const cost = isFirstProject ? 0 : CREDITS_TO_LIST_PROJECT;

  if (cost > 0 && balance < cost) {
    return NextResponse.json(
      {
        error: `Insufficient credits. You need ${cost} credits to list a project. Current balance: ${balance}.`,
      },
      { status: 402 }
    );
  }

  // Create project document
  const projectRef = db.collection("projects").doc();
  const now = FieldValue.serverTimestamp();

  await projectRef.set({
    id: projectRef.id,
    ownerId: userId,
    name: data.name,
    url: data.url,
    description: data.description,
    testInstructions: data.testInstructions,
    techStack: data.techStack,
    niche: data.niche,
    helpTypes: data.helpTypes,
    status: "active" as ProjectStatus,
    visibility: data.visibility as ProjectVisibility,
    isStealth: data.isStealth ?? false,
    creditsRequired: cost,
    viewCount: 0,
    createdAt: now,
    updatedAt: now,
  });

  // Evaluate achievements (e.g. first project listed)
  await checkAndAwardAchievements(userId);

  // Debit credits atomically if there is a cost
  if (cost > 0) {
    await debitCredits(
      userId,
      cost,
      `Listed project "${data.name}"`,
      projectRef.id
    );
  } else if (isFirstProject) {
    // Award first post bonus
    const { earnCredits } = await import("@/lib/credits/engine");
    await earnCredits(
      userId,
      CREDITS_ON_FIRST_POST,
      `Bônus por publicar o seu primeiro projeto: "${data.name}"`,
      projectRef.id
    );
  }

  return NextResponse.json({ projectId: projectRef.id }, { status: 201 });
});
