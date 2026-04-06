import type { Role, Task, TaskTemplatePlugin } from "@agentaction/shared";
import type { AppLocale } from "./locale";

export function nextMaterialPrompt(task: Task): string | undefined {
  if (task.collectedMaterials.length >= task.requiredMaterials.length) {
    return undefined;
  }

  return task.requiredMaterials[task.collectedMaterials.length];
}

export function buildCollectingReply(task: Task, template: TaskTemplatePlugin, locale: AppLocale): string {
  const missing = nextMaterialPrompt(task);

  if (missing) {
    return locale === "en-US"
      ? `Got it. This task still needs: ${missing}.`
      : `已收到。这个任务模板还需要你补充：${missing}。`;
  }

  return locale === "en-US"
    ? `Materials look complete. I will start working through ${template.title}.`
    : `资料已基本收齐，我会按模板《${template.title}》开始执行。`;
}

export function buildRunningReply(task: Task, roles: Role[], locale: AppLocale): string {
  const roleNames = task.roleSelections
    .map((selection) => roles.find((role) => role.id === selection.roleId)?.displayName)
    .filter(Boolean)
    .join(locale === "en-US" ? ", " : "、");

  if (task.templateId === "tpl_build_feature") {
    return locale === "en-US"
      ? `${roleNames} are now working together. The programmer is building, and the reviewer will decide whether it goes back.`
      : `${roleNames} 已进入协作执行。程序员开始实现，主审会在提交后决定是否打回。`;
  }

  return locale === "en-US"
    ? `${roleNames} are working on the task. The main result will be collected into one result panel.`
    : `${roleNames} 正在执行任务，主结果会尽量收束成一张结果卡。`;
}

export function buildReviewSummary(task: Task, locale: AppLocale): string {
  if (task.templateId === "tpl_build_feature") {
    return locale === "en-US"
      ? "Review passed. A runnable app result is ready with test notes and packaging details."
      : "已通过主审验收，生成可运行程序主结果卡，并附带测试摘要与打包说明。";
  }

  return locale === "en-US"
    ? "The main result is ready, with attachments and summary archived."
    : "已生成主结果卡，附属产物与摘要一并归档。";
}
