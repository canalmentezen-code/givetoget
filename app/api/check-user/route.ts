import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase.server";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email");
    const apiKey = req.headers.get("x-api-key");

    const expectedApiKey = process.env.AUTH_SECRET || "fallback-development-secret-only-1234567890";
    if (apiKey !== expectedApiKey) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!email) {
      return NextResponse.json({ error: "Email required" }, { status: 400 });
    }

    const db = getAdminDb();
    const q = await db.collection("users").where("email", "==", email).limit(1).get();
    
    return NextResponse.json({ exists: !q.empty });
  } catch (err: any) {
    console.error("[check-user] Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
