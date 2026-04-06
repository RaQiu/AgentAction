import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import type { Role, RuntimePlugin, Task, TaskTemplatePlugin } from "@agentaction/shared";
import { createId } from "@agentaction/shared";

interface CodexExecutionConfig {
  task: Task;
  template?: TaskTemplatePlugin;
  roles: Role[];
  runtime: RuntimePlugin;
  workspaceRoot: string;
  sandbox: "read-only" | "workspace-write";
}

function existingPathCandidate(values: string[]): string | undefined {
  for (const value of values) {
    const trimmed = value.trim();
    if (!trimmed.startsWith("/")) {
      continue;
    }
    if (fs.existsSync(trimmed)) {
      return trimmed;
    }
  }

  return undefined;
}

function buildPrompt(task: Task, template: TaskTemplatePlugin | undefined, roles: Role[]): string {
  const roleNames = task.roleSelections
    .map((selection) => roles.find((role) => role.id === selection.roleId)?.displayName)
    .filter(Boolean)
    .join("、");

  const recentMessages = task.mainConversation.messages
    .slice(-6)
    .map((message) => `${message.authorLabel}: ${message.content}`)
    .join("\n");

  return [
    "你是 AgentAction 当前任务的默认智能体 Codex。",
    "请使用中文回复，保持直接、具体、能继续推进任务。",
    "不要解释平台内部实现，不要说自己是被调用的。",
    `当前任务：${task.title}`,
    template ? `模板说明：${template.description}` : "",
    `任务状态：${task.status}`,
    `当前角色编队：${roleNames || "未命名角色"}`,
    `已收集资料：${task.collectedMaterials.join(" | ") || "暂无"}`,
    `未收集资料：${task.requiredMaterials
      .filter((item) => !task.collectedMaterials.includes(item))
      .join(" | ") || "无"}`,
    "最近会话：",
    recentMessages,
    "如果信息不足，明确点名缺什么；如果信息足够，直接给推进结果。回答尽量控制在 200 中文字以内。"
  ]
    .filter(Boolean)
    .join("\n");
}

export async function runCodexTaskReply(config: CodexExecutionConfig): Promise<string> {
  const tmpFile = path.join(os.tmpdir(), `${createId("codex")}.txt`);
  const workdirCandidate = existingPathCandidate(config.task.collectedMaterials) ?? config.workspaceRoot;
  const prompt = buildPrompt(config.task, config.template, config.roles);

  const args = [
    "exec",
    "--skip-git-repo-check",
    "--sandbox",
    config.sandbox,
    "-o",
    tmpFile,
    "-C",
    workdirCandidate,
    prompt
  ];

  await new Promise<void>((resolve, reject) => {
    const child = spawn(config.runtime.command ?? "codex", args, {
      cwd: config.workspaceRoot,
      env: process.env,
      stdio: ["ignore", "pipe", "pipe"]
    });

    let stderr = "";
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(stderr || `codex exec exited with ${code}`));
      }
    });
  });

  const reply = fs.readFileSync(tmpFile, "utf-8").trim();
  fs.rmSync(tmpFile, { force: true });
  return reply;
}
