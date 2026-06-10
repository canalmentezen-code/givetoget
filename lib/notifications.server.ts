import "server-only";

import { getAdminDb } from "./firebase.server";
import { FieldValue } from "firebase-admin/firestore";

export async function createNotification(
  userId: string,
  type: string,
  title: string,
  message: string,
  link: string
) {
  try {
    const db = getAdminDb();
    const ref = db.collection("notifications").doc();
    await ref.set({
      id: ref.id,
      userId,
      type,
      title,
      message,
      link,
      read: false,
      createdAt: FieldValue.serverTimestamp(),
    });
  } catch (error) {
    console.error("[createNotification] Error:", error);
  }
}
