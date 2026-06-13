import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase.server";
import { auth } from "@/lib/auth";
import { FieldValue } from "firebase-admin/firestore";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { image } = await req.json();
    const db = getAdminDb();
    const userRef = db.collection("users").doc(session.user.id);

    const updates: any = {
      updatedAt: FieldValue.serverTimestamp(),
    };

    if (image === null || image === "") {
      // Revert to fallback (GitHub/Google)
      updates.customAvatarUrl = null;
    } else {
      // Validate image starts with base64 jpeg signature
      if (!image.startsWith("data:image/jpeg;base64,")) {
        return NextResponse.json(
          { error: "Formato de imagem inválido. Deve ser JPEG base64." },
          { status: 400 }
        );
      }
      updates.customAvatarUrl = image;
    }

    await userRef.update(updates);

    return NextResponse.json({
      success: true,
      avatarUrl: updates.customAvatarUrl || null,
    });
  } catch (error: any) {
    console.error("[api/user/profile] Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
