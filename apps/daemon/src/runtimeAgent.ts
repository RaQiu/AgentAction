import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import type { Role, RuntimePlugin, Task, TaskTemplatePlugin } from "@agentaction/shared";

interface CodexExecutionConfig {
  task: Task;
  template?: TaskTemplatePlugin;
  roles: Role[];
  runtime: RuntimePlugin;
  workspaceRoot: string;
  sandbox: "read-only" | "workspace-write";
}

export interface CodexRuntimeEvent {
  kind: "thread" | "turn" | "tool-start" | "tool-end" | "agent-message" | "finish";
  summary: string;
  rawType?: string;
  command?: string;
  output?: string;
}

export interface CodexExecutionResult {
  reply: string;
  events: CodexRuntimeEvent[];
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

function safeJsonParse(line: string): Record<string, unknown> | null {
  try {
    return JSON.parse(line) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export async function runCodexTaskReply(config: CodexExecutionConfig): Promise<CodexExecutionResult> {
  const workdirCandidate = existingPathCandidate(config.task.collectedMaterials) ?? config.workspaceRoot;
  const prompt = buildPrompt(config.task, config.template, config.roles);

  const args = [
    "exec",
    "--skip-git-repo-check",
    "--sandbox",
    config.sandbox,
    "--json",
    "-C",
    workdirCandidate,
    prompt
  ];

  const events: CodexRuntimeEvent[] = [];
  let stderr = "";
  let stdoutBuffer = "";
  let reply = "";

  await new Promise<void>((resolve, reject) => {
    const child = spawn(config.runtime.command ?? "codex", args, {
      cwd: config.workspaceRoot,
      env: process.env,
      stdio: ["ignore", "pipe", "pipe"]
    });

    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });
    child.stdout.on("data", (chunk) => {
      stdoutBuffer += chunk.toString();
      const lines = stdoutBuffer.split("\n");
      stdoutBuffer = lines.pop() ?? "";

      for (const line of lines.map((item) => item.trim()).filter(Boolean)) {
        const parsed = safeJsonParse(line);
        if (!parsed || typeof parsed.type !== "string") {
          continue;
        }

        if (parsed.type === "thread.started") {
          events.push({
            kind: "thread",
            rawType: parsed.type,
            summary: `Codex 线程已启动`
          });
        } else if (parsed.type === "turn.started") {
          events.push({
            kind: "turn",
            rawType: parsed.type,
            summary: "Codex 开始处理本轮任务"
          });
        } else if (
          (parsed.type === "item.started" || parsed.type === "item.completed") &&
          parsed.item &&
          typeof parsed.item === "object"
        ) {
          const item = parsed.item as Record<string, unknown>;
          if (item.type === "command_execution") {
            const command = typeof item.command === "string" ? item.command : "";
            const output = typeof item.aggregated_output === "string" ? item.aggregated_output.trim() : "";
            events.push({
              kind: parsed.type === "item.started" ? "tool-start" : "tool-end",
              rawType: parsed.type,
              summary:
                parsed.type === "item.started"
                  ? `Codex 正在调用命令：${command}`
                  : `Codex 命令完成：${command}`,
              command,
              output
            });
          } else if (item.type === "agent_message") {
            const text = typeof item.text === "string" ? item.text.trim() : "";
            if (text) {
              reply = text;
              events.push({
                kind: "agent-message",
                rawType: parsed.type,
                summary: "Codex 已产出最终回复",
                output: text
              });
            }
          }
        } else if (parsed.type === "turn.completed") {
          events.push({
            kind: "finish",
            rawType: parsed.type,
            summary: "Codex 本轮执行完成"
          });
        } else if (parsed.type.includes("compact")) {
          events.push({
            kind: "turn",
            rawType: parsed.type,
            summary: `Codex 发出 compact 相关事件：${parsed.type}`
          });
        }
      }
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

  return {
    reply,
    events
  };
}
