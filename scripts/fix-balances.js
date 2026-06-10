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

async function run() {
  console.log("Fetching all users...");
  const usersRef = db.collection("users");
  const snapshot = await usersRef.get();
  
  console.log(`Found ${snapshot.size} users. Updating balances...`);
  const batch = db.batch();
  let count = 0;
  
  snapshot.forEach((doc) => {
    const data = doc.data();
    console.log(`User: ${doc.id} (${data.email}) - creditBalance: ${data.creditBalance}, transferableBalance: ${data.transferableBalance}`);
    
    const targetBalance = typeof data.creditBalance === 'number' ? data.creditBalance : 10;
    
    batch.update(doc.ref, {
      transferableBalance: targetBalance
    });
    count++;
  });
  
  if (count > 0) {
    await batch.commit();
    console.log(`Successfully updated ${count} users' transferable balances!`);
  } else {
    console.log("No users found to update.");
  }
}

run().catch(console.error);
