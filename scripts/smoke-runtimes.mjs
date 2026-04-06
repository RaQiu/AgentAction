import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { setTimeout as delay } from "node:timers/promises";

const root = process.cwd();
const port = Number(process.env.AGENTACTION_DAEMON_PORT ?? 4438);
const base = `http://127.0.0.1:${port}`;
const stateDir = path.join(root, ".agentaction", "runtime-smoke");

function log(message) {
  process.stdout.write(`${message}\n`);
}

async function waitForHealth(timeoutMs = 20000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const response = await fetch(`${base}/health`);
      if (response.ok) {
        return;
      }
    } catch {
      // keep polling
    }
    await delay(500);
  }

  throw new Error(`Timed out waiting for daemon on ${base}`);
}

async function post(pathname) {
  const response = await fetch(`${base}${pathname}`, {
    method: "POST"
  });
  const payload = await response.json();
  if (!response.ok) {
    throw new Error(`${pathname} failed: ${JSON.stringify(payload)}`);
  }
  return payload;
}

async function getBootstrap() {
  const response = await fetch(`${base}/api/bootstrap`);
  if (!response.ok) {
    throw new Error("bootstrap failed");
  }
  return response.json();
}

async function runWithDaemon(callback) {
  const child = spawn("pnpm", ["--filter", "@agentaction/daemon", "dev"], {
    cwd: root,
    env: {
      ...process.env,
      AGENTACTION_ROOT: root,
      AGENTACTION_DAEMON_PORT: String(port),
      AGENTACTION_STATE_DIR: stateDir
    },
    stdio: ["ignore", "pipe", "pipe"]
  });

  let output = "";
  child.stdout.on("data", (chunk) => {
    output += chunk.toString();
  });
  child.stderr.on("data", (chunk) => {
    output += chunk.toString();
  });

  try {
    await waitForHealth();
    await callback();
  } finally {
    child.kill("SIGTERM");
    await delay(500);
    if (!child.killed) {
      child.kill("SIGKILL");
    }
  }

  if (child.exitCode && ![0, 143].includes(child.exitCode)) {
    throw new Error(`daemon child exited with ${child.exitCode}\n${output}`);
  }
}

async function main() {
  log(`Smoke runtimes on ${base}`);
  fs.rmSync(stateDir, { recursive: true, force: true });

  await runWithDaemon(async () => {
    const codex = await post("/api/runtimes/runtime_hack_codex_cli/check");
    if (codex.checkState !== "passed" || !codex.detectedCommandPath) {
      throw new Error(`codex probe failed: ${JSON.stringify(codex)}`);
    }

    const clawMissing = await post("/api/runtimes/runtime_hack_claw_code/check");
    if (clawMissing.checkState !== "failed") {
      throw new Error(`expected claw-code to fail before clone: ${JSON.stringify(clawMissing)}`);
    }

    const clawInstalled = await post("/api/runtimes/runtime_hack_claw_code/install-source");
    if (clawInstalled.source !== "cloned-source") {
      throw new Error(`claw-code clone did not switch source: ${JSON.stringify(clawInstalled)}`);
    }

    const clawChecked = await post("/api/runtimes/runtime_hack_claw_code/check");
    if (clawChecked.checkState !== "partial" || clawChecked.status !== "degraded") {
      throw new Error(`expected partial/degraded after claw clone: ${JSON.stringify(clawChecked)}`);
    }

    log(
      JSON.stringify(
        {
          codex: {
            command: codex.detectedCommandPath,
            version: codex.detectedVersion,
            checkState: codex.checkState
          },
          clawCode: {
            source: clawChecked.source,
            pathHint: clawChecked.pathHint,
            checkState: clawChecked.checkState,
            status: clawChecked.status
          }
        },
        null,
        2
      )
    );
  });

  await runWithDaemon(async () => {
    const bootstrap = await getBootstrap();
    const claw = bootstrap.runtimes.find((item) => item.id === "runtime_hack_claw_code");
    if (!claw || claw.source !== "cloned-source" || claw.checkState !== "partial") {
      throw new Error(`claw-code state did not persist across restart: ${JSON.stringify(claw)}`);
    }

    log(
      JSON.stringify(
        {
          persisted: {
            source: claw.source,
            checkState: claw.checkState,
            status: claw.status,
            pathHint: claw.pathHint
          }
        },
        null,
        2
      )
    );
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
