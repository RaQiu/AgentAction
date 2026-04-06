import type { AppLocale as SharedAppLocale } from "@agentaction/shared";

export type AppLocale = SharedAppLocale;

export function readLocale(input?: string): AppLocale {
  return input === "en-US" ? "en-US" : "zh-CN";
}

export function daemonText(locale: AppLocale) {
  if (locale === "en-US") {
    return {
      roleFallback: "Role",
      you: "You",
      collaborator: "Collaborator",
      collectFirst: (prompt: string) => `I will collect materials first. Please start with: ${prompt}.`,
      branchOpened: "A /btw side thread was opened from your explicit command.",
      materialsReceived: "Materials received.",
      keepGoing: "Got it. I will keep moving within the current task context.",
      finishReminder:
        "You did not submit the platform finish contract in the last turn. Now set status to finish and fill finish.summary, finish.resultTitle, and finish.needsReview.",
      compactDetected: "Codex emitted a compact-related event in this conversation.",
      reviewRequested: "Codex moved this task into review.",
      finishSubmitted: (title: string, summary: string) =>
        `Codex submitted a delivery contract: ${title} · ${summary}`,
      runtimeFailed: (message: string) => `Codex default assistant failed: ${message}`,
      assetTitles: {
        artifact: "Extracted Artifact",
        memory: "Extracted Memory",
        skill: "Extracted Skill"
      },
      assetSummary: "Asset extracted from the current task.",
      cloneSuffix: (index: number) => ` Clone ${index}`,
      pendingStatus: "Idle",
      syncNote: (name: string) => `Synced experience back from ${name}.`
    };
  }

  return {
    roleFallback: "角色",
    you: "你",
    collaborator: "协作者",
    collectFirst: (prompt: string) => `我先收资料。请先给我：${prompt}。`,
    branchOpened: "已根据显式 /btw 指令打开旁枝。",
    materialsReceived: "资料已收到。",
    keepGoing: "已收到这条补充，我会继续沿当前任务上下文处理。",
    finishReminder:
      "你上一轮没有交出平台 finish 合同。现在必须把 status 设为 finish，并完整填写 finish.summary、finish.resultTitle、finish.needsReview。",
    compactDetected: "Codex 会话已触发 compact 相关事件。",
    reviewRequested: "Codex 已请求进入待验收状态。",
    finishSubmitted: (title: string, summary: string) =>
      `Codex 已提交平台 finish 合同：${title} · ${summary}`,
    runtimeFailed: (message: string) => `Codex 默认智能体调用失败：${message}`,
    assetTitles: {
      artifact: "现场提炼产物",
      memory: "现场提炼记忆",
      skill: "现场提炼技能"
    },
    assetSummary: "从任务现场提炼出的资产。",
    cloneSuffix: (index: number) => `·分身${index}`,
    pendingStatus: "待派遣",
    syncNote: (name: string) => `已从 ${name} 手动回流经验。`
  };
}
