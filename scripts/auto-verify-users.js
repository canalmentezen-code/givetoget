const { initializeApp, cert } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const fs = require("fs");
const path = require("path");

// Load .env.local variables manually
const envPath = path.join(__dirname, "../.env.local");
if (fs.existsSync(envPath)) {
  const envConfig = fs.readFileSync(envPath, "utf-8");
  envConfig.split("\n").forEach((line) => {
    const parts = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (parts) {
      const key = parts[1];
      let value = parts[2] || "";
      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.substring(1, value.length - 1);
      }
      process.env[key] = value.replace(/\\n/g, "\n");
    }
  });
}

const privateKey = process.env.FIREBASE_PRIVATE_KEY;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const projectId = process.env.FIREBASE_PROJECT_ID;

if (!privateKey || !clientEmail || !projectId) {
  console.error("Missing Firebase Admin credentials in .env.local");
  process.exit(1);
}

initializeApp({
  credential: cert({
    projectId,
    clientEmail,
    privateKey,
  }),
});

const db = getFirestore();

console.log("Listening for new users in Firestore to automatically verify them for development...");

db.collection("users").onSnapshot((snapshot) => {
  snapshot.docChanges().forEach(async (change) => {
    if (change.type === "added" || change.type === "modified") {
      const doc = change.doc;
      const data = doc.data();
      
      // If user is not verified, verify them and give them transferable balance
      if (!data.isVerified) {
        console.log(`Auto-verifying user: ${doc.id} (${data.email || 'no-email'})`);
        try {
          await doc.ref.update({
            isVerified: true,
            transferableBalance: 10,
            creditBalance: 10
          });
          console.log(`Successfully auto-verified and granted 10 credits to ${data.email || doc.id}`);
        } catch (err) {
          console.error(`Error auto-verifying user ${doc.id}:`, err);
        }
      }
    }
  });
});
