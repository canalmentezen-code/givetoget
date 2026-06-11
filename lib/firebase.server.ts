import "server-only";

import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

// ─── Firebase Admin SDK (server-side only) ───────────────────────────────────

function getAdminApp() {
  if (getApps().length > 0) {
    return getApps()[0];
  }

  if (!process.env.FIREBASE_PROJECT_ID) {
    throw new Error("[firebase.server] FIREBASE_PROJECT_ID is not set");
  }
  if (!process.env.FIREBASE_CLIENT_EMAIL) {
    throw new Error("[firebase.server] FIREBASE_CLIENT_EMAIL is not set");
  }

  // Use base64-encoded key to avoid newline escaping issues across environments
  let privateKey: string;
  if (process.env.FIREBASE_PRIVATE_KEY_B64) {
    privateKey = Buffer.from(process.env.FIREBASE_PRIVATE_KEY_B64, "base64").toString("utf8");
  } else if (process.env.FIREBASE_PRIVATE_KEY) {
    // Fallback: normalize any literal \n sequences to real newlines
    privateKey = process.env.FIREBASE_PRIVATE_KEY.split("\\n").join("\n");
  } else {
    throw new Error("[firebase.server] Neither FIREBASE_PRIVATE_KEY_B64 nor FIREBASE_PRIVATE_KEY is set");
  }

  return initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey,
    }),
  });
}

export function getAdminDb() {
  const app = getAdminApp();
  return getFirestore(app);
}
