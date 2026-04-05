import {
  type AssetRecord,
  type Conversation,
  type ConversationMessage,
  type QueuedMessage,
  type ResultCard,
  type Role,
  type RoleSelection,
  type Task,
  type TaskTemplatePlugin,
  createId,
  nowIso,
  summarize
} from "@agentaction/shared";

function createMessage(
  role: ConversationMessage["role"],
  authorLabel: string,
  content: string
): ConversationMessage {
  return {
    id: createId("msg"),
    role,
    authorLabel,
    content,
    createdAt: nowIso()
  };
}

export function createTaskFromTemplate(
  template: TaskTemplatePlugin,
  roles: Role[],
  roleSelections?: RoleSelection[]
): Task {
  const createdAt = nowIso();
  const pickedRoles =
    roleSelections ??
    template.recommendedRoleIds.map((roleId) => {
      const role = roles.find((item) => item.id === roleId);

      return {
        roleId,
        equipmentIds: role?.currentEquipmentIds ?? []
      };
    });

  const mainConversation: Conversation = {
    id: createId("conv"),
    kind: "main",
    title: template.title,
    messages: [
      createMessage(
        "system",
        "系统",
        `任务已创建。当前模板：${template.title}。先收资料，再执行。`
      )
    ]
  };

  return {
    id: createId("task"),
    title: template.title,
    templateId: template.id,
    status: "collecting",
    origin: "desktop",
    createdAt,
    updatedAt: createdAt,
    roleSelections: pickedRoles,
    mainConversation,
    branches: [],
    queue: [],
    assets: [],
    shares: [],
    requiredMaterials: template.requiredMaterials,
    collectedMaterials: [],
    reviewerRoleId: template.recommendedRoleIds[0],
    finishRequired: true
  };
}

export function addUserMessage(task: Task, content: string, authorLabel = "你"): Task {
  task.mainConversation.messages.push(createMessage("user", authorLabel, content));
  task.updatedAt = nowIso();
  return task;
}

export function addAssistantEvent(
  task: Task,
  authorLabel: string,
  content: string
): Task {
  task.mainConversation.messages.push(createMessage("assistant", authorLabel, content));
  task.updatedAt = nowIso();
  return task;
}

export function collectMaterial(task: Task, material: string): Task {
  if (!task.collectedMaterials.includes(material)) {
    task.collectedMaterials.push(material);
  }

  const allCollected =
    task.requiredMaterials.length > 0 &&
    task.requiredMaterials.every((required) =>
      task.collectedMaterials.some((item) => item.includes(required) || required.includes(item))
    );

  task.status = allCollected ? "running" : task.status;
  task.updatedAt = nowIso();
  return task;
}

export function enqueueMessage(task: Task, from: string, content: string): QueuedMessage {
  const entry: QueuedMessage = {
    id: createId("queue"),
    content,
    from,
    createdAt: nowIso(),
    status: "queued"
  };

  task.queue.push(entry);
  task.updatedAt = nowIso();
  return entry;
}

export function cancelQueuedMessage(task: Task, queueId: string): Task {
  task.queue = task.queue.map((entry) =>
    entry.id === queueId ? { ...entry, status: "cancelled" } : entry
  );
  task.updatedAt = nowIso();
  return task;
}

export function promoteQueuedMessageToBranch(task: Task, queueId: string): Task {
  const entry = task.queue.find((item) => item.id === queueId);

  if (!entry) {
    return task;
  }

  entry.status = "promoted";

  task.branches.push({
    id: createId("branch"),
    kind: "branch",
    title: summarize(entry.content, 28),
    messages: [
      createMessage("system", "系统", "已根据排队消息显式转为 /btw 旁枝。"),
      createMessage("user", entry.from, entry.content)
    ]
  });

  task.updatedAt = nowIso();
  return task;
}

export function createExplicitBranch(task: Task, prompt: string): Task {
  task.branches.push({
    id: createId("branch"),
    kind: "branch",
    title: summarize(prompt, 28),
    messages: [
      createMessage("system", "系统", "这是一个显式打开的 /btw 旁枝。"),
      createMessage("user", "你", prompt)
    ]
  });

  task.updatedAt = nowIso();
  return task;
}

export function submitForReview(task: Task): Task {
  task.status = "review";
  task.updatedAt = nowIso();
  return task;
}

export function rejectTask(task: Task, feedback: string): Task {
  task.status = "running";
  task.mainConversation.messages.push(
    createMessage("system", "主审", `打回重做：${feedback}`)
  );
  task.updatedAt = nowIso();
  return task;
}

export function createResultCard(task: Task, summary: string, title?: string): ResultCard {
  return {
    id: createId("result"),
    title: title ?? `${task.title} · 主结果卡`,
    summary,
    primaryActionLabel: "继续完善",
    attachments: [
      {
        id: createId("att"),
        title: "执行摘要",
        type: "note",
        summary
      }
    ],
    canContinue: true,
    canExtract: true,
    canShare: true
  };
}

export function approveTask(task: Task, summary: string): Task {
  task.resultCard = createResultCard(task, summary);
  task.status = "done";
  task.updatedAt = nowIso();
  return task;
}

export function reopenTask(task: Task): Task {
  task.status = "running";
  task.updatedAt = nowIso();
  task.mainConversation.messages.push(
    createMessage("system", "系统", "任务已重新打开，继续沿用当前历史和结果卡。")
  );
  return task;
}

export function extractAsset(
  task: Task,
  kind: AssetRecord["kind"],
  title: string,
  summary: string,
  roleId?: string
): AssetRecord {
  const asset: AssetRecord = {
    id: createId(kind),
    kind,
    taskId: task.id,
    roleId,
    title,
    summary,
    createdAt: nowIso()
  };

  task.assets.unshift(asset);
  task.updatedAt = nowIso();

  return asset;
}
