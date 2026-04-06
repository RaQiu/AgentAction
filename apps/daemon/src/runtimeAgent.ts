import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import type {
  AppLocale,
  Role,
  RuntimeFinishContract,
  RuntimePlugin,
  RuntimeResponseStatus,
  Task,
  TaskTemplatePlugin
} from "@agentaction/shared";
import type { RuntimeTemplateEvent, RuntimeTemplateTaskResult } from "@agentaction/runtime-core";

interface CodexExecutionConfig {
  task: Task;
  template?: TaskTemplatePlugin;
  roles: Role[];
  runtime: RuntimePlugin;
  workspaceRoot: string;
  stateRoot: string;
  sandbox: "read-only" | "workspace-write";
  contractReminder?: string;
  locale: AppLocale;
}

interface CodexStructuredOutput {
  reply: string;
  status: RuntimeResponseStatus;
  finish: RuntimeFinishContract | null;
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

function buildPrompt(
  task: Task,
  template: TaskTemplatePlugin | undefined,
  roles: Role[],
  contractReminder?: string,
  locale: AppLocale = "zh-CN"
): string {
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
    `当前运行时会话：${task.runtimeState?.sessionId ?? "无"}`,
    "最近会话：",
    recentMessages,
    "你必须返回结构化 JSON：reply、status、finish。",
    "status 只能是 continue / needs_input / ready_for_review / finish。",
    "当 status=finish 时，finish 不能为 null，必须给出 summary/resultTitle/needsReview。",
    "当 status 不是 finish 时，finish 必须为 null。",
    "如果你只是本轮原生完成但还没给出平台 finish 合同，不要偷懒，继续给出我们要的 finish 字段。",
    locale === "en-US"
      ? "Reply in concise English and keep the task moving."
      : "reply 依然用中文，保持直接、具体、能继续推进任务。",
    contractReminder ?? ""
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

export async function runCodexTaskReply(config: CodexExecutionConfig): Promise<RuntimeTemplateTaskResult> {
  const workdirCandidate = existingPathCandidate(config.task.collectedMaterials) ?? config.workspaceRoot;
  const prompt = buildPrompt(config.task, config.template, config.roles, config.contractReminder, config.locale);
  const schemaPath = path.join(config.workspaceRoot, "scripts", "codex-task-schema.json");

  const args = config.task.runtimeState?.sessionId
    ? [
        "exec",
        "resume",
        config.task.runtimeState.sessionId,
        "--skip-git-repo-check",
        "--json",
        prompt
      ]
    : [
        "exec",
        "--skip-git-repo-check",
        "--sandbox",
        config.sandbox,
        "--json",
        "--output-schema",
        schemaPath,
        "-C",
        workdirCandidate,
        prompt
      ];

  const events: RuntimeTemplateEvent[] = [];
  let stderr = "";
  let stdoutBuffer = "";
  let reply = "";
  let sessionId = config.task.runtimeState?.sessionId;
  let compactDetected = false;
  let status: RuntimeResponseStatus | undefined;
  let finishContract: RuntimeFinishContract | null = null;

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
          sessionId = typeof parsed.thread_id === "string" ? parsed.thread_id : sessionId;
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
            const exitCode = typeof item.exit_code === "number" ? item.exit_code : null;
            events.push({
              kind: parsed.type === "item.started" ? "tool-start" : "tool-end",
              rawType: parsed.type,
              summary:
                parsed.type === "item.started"
                  ? `Codex 正在调用命令：${command}`
                  : `Codex 命令完成：${command}${exitCode === null ? "" : `（exit=${exitCode}）`}`,
              command,
              output
            });
          } else if (item.type === "agent_message") {
            const text = typeof item.text === "string" ? item.text.trim() : "";
            if (text) {
              try {
                const parsedText = JSON.parse(text) as CodexStructuredOutput;
                reply = parsedText.reply;
                status = parsedText.status;
                finishContract = parsedText.finish;
              } catch {
                reply = text;
              }
              events.push({
                kind: "agent-message",
                rawType: parsed.type,
                summary: "Codex 已产出最终回复",
                output: reply
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
          compactDetected = true;
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
    authorLabel: "Codex",
    events,
    sessionId,
    compactDetected,
    status,
    finishContract
  };
}
