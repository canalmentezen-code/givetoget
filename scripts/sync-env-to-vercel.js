const { spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const envPath = path.join(__dirname, "../.env.local");
if (!fs.existsSync(envPath)) {
  console.error(".env.local file not found");
  process.exit(1);
}

const envConfig = fs.readFileSync(envPath, "utf-8");
const envVars = {};

envConfig.split("\n").forEach((line) => {
  const parts = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (parts) {
    const key = parts[1];
    let value = parts[2] || "";
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.substring(1, value.length - 1);
    }
    envVars[key] = value.replace(/\\n/g, "\n");
  }
});

if (!envVars.AUTH_SECRET) {
  console.log("Generating secure AUTH_SECRET...");
  envVars.AUTH_SECRET = crypto.randomBytes(32).toString("base64");
}

const keys = Object.keys(envVars);
console.log(`Syncing ${keys.length} variables to Vercel...`);

const targets = ["production", "preview", "development"];

for (const key of keys) {
  const value = envVars[key];
  if (key.startsWith("VERCEL_") || key === "TEST_VAR_123") continue;
  
  console.log(`Uploading ${key}...`);
  for (const target of targets) {
    const result = spawnSync("npx", [
      "--no-install",
      "vercel",
      "env",
      "add",
      key,
      target,
      "",
      `--value=${value}`,
      "--force",
      "--yes"
    ], {
      stdio: "pipe",
      encoding: "utf-8"
    });
    
    if (result.status !== 0) {
      console.error(`Error uploading ${key} to ${target}:`, result.stderr || result.error?.message);
    }
  }
}

console.log("Environment variables sync complete!");
