import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";

const root = process.cwd();
const port = Number(process.env.AGENTACTION_DAEMON_PORT ?? 4428);
const base = `http://127.0.0.1:${port}`;
const appBinary = path.join(
  root,
  "apps/desktop/dist/mac-arm64/AgentActionDesktop.app/Contents/MacOS/AgentActionDesktop"
);

function log(message) {
  process.stdout.write(`${message}\n`);
}

async function waitForHealth(timeoutMs = 25000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const response = await fetch(`${base}/health`);
      if (response.ok) {
        return await response.json();
      }
    } catch {
      // Keep polling until desktop-spawned daemon starts.
    }
    await delay(500);
  }

  throw new Error(`Timed out waiting for packaged desktop daemon on ${base}`);
}

async function main() {
  if (!fs.existsSync(appBinary)) {
    throw new Error(`Packaged desktop binary is missing: ${appBinary}`);
  }

  log(`Smoke packaged desktop via ${appBinary}`);

  const child = spawn(appBinary, [], {
    cwd: root,
    env: {
      ...process.env,
      AGENTACTION_DAEMON_PORT: String(port),
      AGENTACTION_HEADLESS_SMOKE: "1"
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
    const health = await waitForHealth();
    const bootstrap = await fetch(`${base}/api/bootstrap`).then((res) => res.json());
    const runtime = bootstrap.runtimes.find((item) => item.id === "runtime_clone_openclaw");
    const templates = bootstrap.templates.map((item) => item.id);

    if (!templates.includes("tpl_build_feature")) {
      throw new Error("packaged desktop bootstrap missing build feature template");
    }
    if (!runtime?.githubUrl) {
      throw new Error("packaged desktop bootstrap missing runtime GitHub metadata");
    }

    log(
      JSON.stringify(
        {
          checked: "desktop",
          daemon: health.daemon,
          workspaceRoot: health.workspaceRoot,
          templates: bootstrap.templates.length,
          providers: bootstrap.providers.length,
          runtimeGithub: runtime.githubUrl
        },
        null,
        2
      )
    );
  } finally {
    child.kill("SIGTERM");
    await delay(1000);
    if (!child.killed) {
      child.kill("SIGKILL");
    }
  }

  if (child.exitCode && ![0, 143].includes(child.exitCode)) {
    throw new Error(`desktop app exited with ${child.exitCode}\n${output}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
