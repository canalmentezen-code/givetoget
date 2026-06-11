import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase.server";

export async function GET() {
  try {
    const db = getAdminDb();
    
    // Fetch users ordered by feedbacksGiven desc, limit to 20
    const snapshot = await db
      .collection("users")
      .orderBy("feedbacksGiven", "desc")
      .limit(20)
      .get();
      
    const leaders = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name || "Avaliador Anônimo",
        avatarUrl: data.avatarUrl || null,
        feedbacksGiven: data.feedbacksGiven || 0,
        feedbacksReceived: data.feedbacksReceived || 0,
        reputationScore: data.reputationScore !== undefined ? Math.round(data.reputationScore * 100) : 0,
        isVerified: !!data.isVerified,
      };
    });
    
    return NextResponse.json({ leaders });
  } catch (err: any) {
    console.error("[leaderboard] Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
