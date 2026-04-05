import type { Role, Task, TaskTemplatePlugin } from "@agentaction/shared";

export function nextMaterialPrompt(task: Task): string | undefined {
  if (task.collectedMaterials.length >= task.requiredMaterials.length) {
    return undefined;
  }

  return task.requiredMaterials[task.collectedMaterials.length];
}

export function buildCollectingReply(task: Task, template: TaskTemplatePlugin): string {
  const missing = nextMaterialPrompt(task);

  if (missing) {
    return `已收到。这个任务模板还需要你补充：${missing}。`;
  }

  return `资料已基本收齐，我会按模板《${template.title}》开始执行。`;
}

export function buildRunningReply(task: Task, roles: Role[]): string {
  const roleNames = task.roleSelections
    .map((selection) => roles.find((role) => role.id === selection.roleId)?.displayName)
    .filter(Boolean)
    .join("、");

  if (task.templateId === "tpl_build_feature") {
    return `${roleNames} 已进入协作执行。程序员开始实现，主审会在提交后决定是否打回。`;
  }

  return `${roleNames} 正在执行任务，主结果会尽量收束成一张结果卡。`;
}

export function buildReviewSummary(task: Task): string {
  if (task.templateId === "tpl_build_feature") {
    return "已通过主审验收，生成可运行程序主结果卡，并附带测试摘要与打包说明。";
  }

  return "已生成主结果卡，附属产物与摘要一并归档。";
}
