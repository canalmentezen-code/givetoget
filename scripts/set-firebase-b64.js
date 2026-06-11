#!/usr/bin/env node
// Store FIREBASE_PRIVATE_KEY_B64 in Vercel via API

const https = require("https");
const fs = require("fs");

const VERCEL_TOKEN = process.env.VERCEL_TOKEN;
const PROJECT_ID = "prj_V8Yc9c1777qu60YWApY2N5LNEFF0";
const TEAM_ID = "team_gAEFqEmFye0kYi7ppHNMJsFi";
const B64_KEY = fs.readFileSync("/tmp/firebase_key_b64.txt", "utf8").trim();

function apiRequest(method, path, body) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const options = {
      hostname: "api.vercel.com",
      path: `${path}?teamId=${TEAM_ID}`,
      method,
      headers: {
        Authorization: `Bearer ${VERCEL_TOKEN}`,
        "Content-Type": "application/json",
        ...(data ? { "Content-Length": Buffer.byteLength(data) } : {}),
      },
    };
    const req = https.request(options, (res) => {
      let raw = "";
      res.on("data", (c) => (raw += c));
      res.on("end", () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(raw) }); }
        catch { resolve({ status: res.statusCode, body: raw }); }
      });
    });
    req.on("error", reject);
    if (data) req.write(data);
    req.end();
  });
}

async function main() {
  // Remove existing entries
  const listRes = await apiRequest("GET", `/v9/projects/${PROJECT_ID}/env`);
  const envs = listRes.body.envs || [];
  for (const e of envs) {
    if (e.key === "FIREBASE_PRIVATE_KEY_B64") {
      await apiRequest("DELETE", `/v9/projects/${PROJECT_ID}/env/${e.id}`);
      console.log(`Deleted old FIREBASE_PRIVATE_KEY_B64 [${e.target}]`);
    }
  }

  // Create for all environments
  const res = await apiRequest("POST", `/v10/projects/${PROJECT_ID}/env`, [
    {
      key: "FIREBASE_PRIVATE_KEY_B64",
      value: B64_KEY,
      type: "encrypted",
      target: ["production", "preview", "development"],
    },
  ]);

  if (res.status === 200 || res.status === 201) {
    console.log("✅ FIREBASE_PRIVATE_KEY_B64 set for all environments");
    console.log("Key length:", B64_KEY.length, "chars");
  } else {
    console.log("❌ Error:", JSON.stringify(res.body).substring(0, 200));
  }
}

main().catch(console.error);
