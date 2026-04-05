import type { ProviderConfig } from "@agentaction/shared";

const defaults: ProviderConfig[] = [
  {
    id: "provider_remote_primary",
    kind: "remote",
    name: "远程模型主通道",
    enabled: true,
    role: "后台机械工",
    proxyMode: "split-by-target",
    note: "首发优先落地，承担转写、整理、标签、记忆建议等重复活。"
  },
  {
    id: "provider_ollama_local",
    kind: "ollama",
    name: "Ollama 本地 provider",
    enabled: false,
    role: "可配置后备",
    proxyMode: "direct-only",
    note: "首版先作为集成配置，后续再增强本地推理调度。"
  },
  {
    id: "provider_ktransformers_local",
    kind: "ktransformers",
    name: "ktransformers 本地 provider",
    enabled: false,
    role: "高性能后备",
    proxyMode: "direct-only",
    note: "为后续更强本地推理和硬件适配预留。"
  }
];

export function getDefaultProviders(): ProviderConfig[] {
  return defaults;
}
