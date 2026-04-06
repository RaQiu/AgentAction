import { spawn } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";

const root = process.cwd();
const port = Number(process.env.AGENTACTION_DAEMON_PORT ?? 4418);
const base = `http://127.0.0.1:${port}`;

function log(message) {
  process.stdout.write(`${message}\n`);
}

async function waitForHealth(timeoutMs = 20000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const response = await fetch(`${base}/health`);
      if (response.ok) {
        return await response.json();
      }
    } catch {
      // Keep polling.
    }
    await delay(500);
  }

  throw new Error(`Timed out waiting for daemon on ${base}`);
}

async function post(pathname, body) {
  const response = await fetch(`${base}${pathname}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });

  const payload = await response.json();
  if (!response.ok) {
    throw new Error(`${pathname} failed: ${JSON.stringify(payload)}`);
  }

  return payload;
}

async function main() {
  log(`Smoke daemon on ${base}`);

  const child = spawn("pnpm", ["--filter", "@agentaction/daemon", "dev"], {
    cwd: root,
    env: {
      ...process.env,
      AGENTACTION_ROOT: root,
      AGENTACTION_DAEMON_PORT: String(port),
      AGENTACTION_DISABLE_DEFAULT_RUNTIME: "1"
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
    log(`health ok: ${JSON.stringify(health)}`);

    const bootstrap = await fetch(`${base}/api/bootstrap`).then((res) => res.json());
    if (!Array.isArray(bootstrap.templates) || bootstrap.templates.length < 4) {
      throw new Error("bootstrap templates are incomplete");
    }

    const task = await post("/api/templates/tpl_build_feature/tasks", {});
    await post(`/api/tasks/${task.id}/messages`, {
      content: "我要做一个任务宿主桌面端。"
    });
    await post(`/api/tasks/${task.id}/messages`, {
      content: root
    });
    await post(`/api/tasks/${task.id}/messages`, {
      content: "macOS + Windows"
    });
    await post(`/api/tasks/${task.id}/review/request`, {});
    await post(`/api/tasks/${task.id}/review/reject`, {
      feedback: "请继续完善交付说明"
    });
    const finished = await post(`/api/tasks/${task.id}/finish`, {});
    const extracted = await post(`/api/tasks/${task.id}/extract/artifact`, {});
    const clone = await post("/api/roles/role_engineer_ache/clone", {});
    const syncBack = await post(`/api/roles/${clone.id}/sync-back`, {});
    const explicitBranchTask = await post(`/api/templates/tpl_paper_word_review/tasks`, {});
    const branchResult = await post(`/api/tasks/${explicitBranchTask.id}/messages`, {
      content: "/btw 解释一下为什么当前论文只适合生成带批注的 Word"
    });

    if (finished.status !== "done") {
      throw new Error(`expected finished task status done, got ${finished.status}`);
    }
    if (!finished.resultCard?.title) {
      throw new Error("result card missing after finish");
    }
    if (!Array.isArray(extracted.assets) || extracted.assets.length < 1) {
      throw new Error("artifact extraction did not persist");
    }
    if (!clone.isClone || !clone.cloneSourceRoleId) {
      throw new Error("role clone flow failed");
    }
    if (!syncBack.source?.notes?.includes("手动回流经验")) {
      throw new Error("clone sync-back note missing");
    }
    if (!Array.isArray(branchResult.branches) || branchResult.branches.length < 1) {
      throw new Error("explicit /btw branch was not created");
    }

    log(
      JSON.stringify(
        {
          checked: "daemon",
          task: finished.id,
          resultCard: finished.resultCard.title,
          assets: extracted.assets.length,
          clone: clone.displayName,
          branchCount: branchResult.branches.length
        },
        null,
        2
      )
    );
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

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
