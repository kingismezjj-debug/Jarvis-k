import { spawn } from "node:child_process";
import path from "node:path";

const rootDirectory = path.resolve(import.meta.dirname, "..");

const smokeTests = [
  {
    name: "local-app allowlist fixture",
    script: "tests/desktop-command-router-local-app-fixture-smoke.mjs"
  },
  {
    name: "calculator allowlist fixture",
    script: "tests/desktop-command-router-calculator-fixture-smoke.mjs"
  },
  {
    name: "browser projection fixture",
    script: "tests/desktop-command-router-browser-fixture-smoke.mjs"
  },
  {
    name: "local-app blocked fixture",
    script: "tests/desktop-command-router-local-app-blocked-smoke.mjs"
  }
];

async function runSmokeTest(test) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [test.script], {
      cwd: rootDirectory,
      env: process.env,
      stdio: ["ignore", "pipe", "pipe"],
      windowsHide: true
    });
    let stdout = "";
    let stderr = "";
    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");
    child.stdout.on("data", (chunk) => {
      stdout += chunk;
      process.stdout.write(chunk);
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk;
      process.stderr.write(chunk);
    });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) {
        resolve({ name: test.name, script: test.script, stdout });
        return;
      }
      reject(
        new Error(
          `Command Router fixture smoke "${test.name}" failed with exit code ${code}.\n${stderr}`
        )
      );
    });
  });
}

const startedAt = performance.now();
const results = [];

for (const test of smokeTests) {
  console.log(`\n[command-router-fixture-suite] Running ${test.name}`);
  results.push(await runSmokeTest(test));
}

console.log(
  JSON.stringify({
    status: "PASS",
    durationMs: Math.round(performance.now() - startedAt),
    tests: results.map((result) => ({
      name: result.name,
      script: result.script
    }))
  })
);
