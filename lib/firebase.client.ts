// ─── Firebase Client SDK (browser-side, real-time subscriptions) ──────────────
"use client";

import { initializeApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const clientConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
};

function getClientApp() {
  if (getApps().length > 0) {
    return getApps()[0];
  }
  return initializeApp(clientConfig);
}

export function getClientDb() {
  return getFirestore(getClientApp());
}
