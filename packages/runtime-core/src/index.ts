import type { RuntimePlugin, RuntimeSupportMode } from "@agentaction/shared";

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
