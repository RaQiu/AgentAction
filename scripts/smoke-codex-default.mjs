import { spawn } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";

const root = process.cwd();
const port = Number(process.env.AGENTACTION_DAEMON_PORT ?? 4448);
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
        return;
      }
    } catch {
      // keep polling
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
  log(`Smoke codex default runtime on ${base}`);

  const child = spawn("pnpm", ["--filter", "@agentaction/daemon", "dev"], {
    cwd: root,
    env: {
      ...process.env,
      AGENTACTION_ROOT: root,
      AGENTACTION_DAEMON_PORT: String(port)
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
    const task = await post("/api/templates/tpl_build_feature/tasks", {});
    await post(`/api/tasks/${task.id}/messages`, { content: "我要做一个支持多智能体的桌面宿主。" });
    await post(`/api/tasks/${task.id}/messages`, { content: root });
    const updated = await post(`/api/tasks/${task.id}/messages`, {
      content: "先用命令查看当前工作目录，然后告诉我接下来还缺什么，以及 daemon 和 desktop 为什么要分开。"
    });

    const lastAssistant = [...updated.mainConversation.messages]
      .reverse()
      .find((message) => message.role === "assistant");
    const toolMessages = updated.mainConversation.messages.filter(
      (message) => message.authorLabel === "Codex·工具"
    );

    if (!lastAssistant) {
      throw new Error("no assistant message returned");
    }
    if (lastAssistant.authorLabel !== "Codex") {
      throw new Error(`expected Codex author label, got ${lastAssistant.authorLabel}`);
    }
    if (!lastAssistant.content || lastAssistant.content.includes("调用失败")) {
      throw new Error(`codex default reply looks invalid: ${lastAssistant.content}`);
    }
    if (toolMessages.length === 0) {
      throw new Error("expected at least one structured Codex tool event in conversation");
    }
    if (!updated.runtimeState?.sessionId) {
      throw new Error("codex runtime sessionId was not persisted on task");
    }

    const bootstrap = await fetch(`${base}/api/bootstrap`).then((res) => res.json());
    const codex = bootstrap.runtimes.find((item) => item.id === "runtime_hack_codex_cli");
    if (!codex || codex.checkState !== "passed" || codex.status !== "ready") {
      throw new Error(`codex runtime was not auto-probed into ready state: ${JSON.stringify(codex)}`);
    }

    const finished = await post(`/api/tasks/${task.id}/messages`, {
      content: "为了 smoke test，请把当前任务视为已经满足交付条件，并输出平台 finish 合同。"
    });
    if (finished.status !== "review") {
      throw new Error(`expected task to move into review after finish contract, got ${finished.status}`);
    }
    if (!finished.runtimeState?.pendingFinish?.summary) {
      throw new Error(`finish contract was not captured: ${JSON.stringify(finished.runtimeState)}`);
    }

    log(
      JSON.stringify(
        {
          task: updated.id,
          author: lastAssistant.authorLabel,
          reply: lastAssistant.content,
          codexPath: codex.detectedCommandPath,
          sessionId: updated.runtimeState.sessionId,
          toolEvents: toolMessages.length,
          finishSummary: finished.runtimeState.pendingFinish.summary
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
