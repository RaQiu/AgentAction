import type {
  Role,
  RuntimePlugin,
  RuntimeSupportMode,
  Task,
  TaskTemplatePlugin
} from "@agentaction/shared";

export function supportModeLabel(mode: RuntimeSupportMode): string {
  switch (mode) {
    case "deep":
      return "深度托管";
    case "enhanced":
      return "增强兼容";
    case "basic":
    default:
      return "基础接入";
  }
}

export function normalizeRuntimeStatus(runtime: RuntimePlugin): string {
  if (runtime.status === "ready") {
    return `${supportModeLabel(runtime.supportMode)} · 可用`;
  }

  if (runtime.status === "degraded") {
    return `${supportModeLabel(runtime.supportMode)} · 降级运行`;
  }

  return `${supportModeLabel(runtime.supportMode)} · 待配置`;
}

export function runtimeMissingCapabilities(runtime: RuntimePlugin): string[] {
  if (runtime.status !== "degraded") {
    return [];
  }

  return runtime.capabilities.filter((capability) => capability.includes("compact"));
}

export interface RuntimeTemplateEvent {
  kind: "thread" | "turn" | "tool-start" | "tool-end" | "agent-message" | "finish";
  summary: string;
  rawType?: string;
  command?: string;
  output?: string;
}

export interface RuntimeTemplateCheckContext {
  workspaceRoot: string;
  stateRoot: string;
}

export interface RuntimeTemplateInstallContext extends RuntimeTemplateCheckContext {}

export interface RuntimeTemplateTaskContext extends RuntimeTemplateCheckContext {
  task: Task;
  template?: TaskTemplatePlugin;
  roles: Role[];
  runtime: RuntimePlugin;
  sandbox: "read-only" | "workspace-write";
}

export interface RuntimeTemplateTaskResult {
  reply: string;
  authorLabel: string;
  events: RuntimeTemplateEvent[];
}

export interface RuntimeTemplate {
  targetRuntime: string;
  check(runtime: RuntimePlugin, context: RuntimeTemplateCheckContext): RuntimePlugin;
  installFromGitHub?(
    runtime: RuntimePlugin,
    context: RuntimeTemplateInstallContext
  ): RuntimePlugin;
  runTask?(context: RuntimeTemplateTaskContext): Promise<RuntimeTemplateTaskResult>;
}
