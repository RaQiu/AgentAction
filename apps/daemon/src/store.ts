import path from "node:path";
import {
  type AppBootstrap,
  type AssetRecord,
  type Conversation,
  type EventEnvelope,
  type QueuedMessage,
  type Role,
  type RoleSelection,
  type RuntimePlugin,
  type ShareRecord,
  type Task,
  type TaskTemplatePlugin,
  createId,
  getOfficialEquipment,
  getOfficialRoles,
  getOfficialRuntimePlugins,
  getOfficialTemplates,
  nowIso
} from "@agentaction/shared";
import {
  addAssistantEvent,
  addUserMessage,
  approveTask,
  createExplicitBranch,
  createTaskFromTemplate,
  enqueueMessage,
  extractAsset,
  promoteQueuedMessageToBranch,
  rejectTask,
  reopenTask,
  submitForReview
} from "@agentaction/task-engine";
import { previewImport } from "@agentaction/plugin-core";
import { LocalDatabase } from "./db";
import { buildCollectingReply, buildReviewSummary, buildRunningReply } from "./simulate";

export class AppStore {
  private readonly db: LocalDatabase;

  constructor(private readonly workspaceRoot: string) {
    this.db = new LocalDatabase(
      path.join(workspaceRoot, "apps/daemon/.agentaction-data/agentaction.db")
    );
    this.seed();
  }

  private seed(): void {
    if (this.db.list<TaskTemplatePlugin>("templates").length === 0) {
      getOfficialTemplates().forEach((template) =>
        this.db.upsert("templates", template, nowIso())
      );
    }

    if (this.db.list<Role>("roles").length === 0) {
      getOfficialRoles().forEach((role) => this.db.upsert("roles", role, nowIso()));
    }

    if (this.db.list("equipment").length === 0) {
      getOfficialEquipment().forEach((equipment) =>
        this.db.upsert("equipment", equipment, nowIso())
      );
    }

    if (this.db.list<RuntimePlugin>("runtimes").length === 0) {
      getOfficialRuntimePlugins().forEach((runtime) =>
        this.db.upsert("runtimes", runtime, nowIso())
      );
    }
  }

  bootstrap(): AppBootstrap {
    const tasks = this.listTasks();
    const assets = tasks.flatMap((task) => task.assets);

    return {
      templates: this.db.list("templates"),
      roles: this.db.list("roles"),
      equipment: this.db.list("equipment"),
      runtimes: this.db.list("runtimes"),
      tasks,
      assets
    };
  }

  listTasks(): Task[] {
    return this.db.list("tasks");
  }

  getTask(taskId: string): Task {
    const task = this.db.get<Task>("tasks", taskId);

    if (!task) {
      throw new Error("Task not found");
    }

    return task;
  }

  createTask(templateId: string, roleSelections?: RoleSelection[]): Task {
    const template = this.db.get<TaskTemplatePlugin>("templates", templateId);
    const roles = this.db.list<Role>("roles");

    if (!template) {
      throw new Error("Template not found");
    }

    const task = createTaskFromTemplate(template, roles, roleSelections);
    const collectPrompt = task.requiredMaterials[0];

    if (collectPrompt) {
      addAssistantEvent(
        task,
        roles.find((role) => role.id === task.roleSelections[0]?.roleId)?.displayName ?? "角色",
        `我先收资料。请先给我：${collectPrompt}。`
      );
    }

    this.saveTask(task, "task.created", { task });
    return task;
  }

  sendMainMessage(taskId: string, content: string, authorLabel = "你"): Task {
    const task = this.getTask(taskId);
    const template = this.db.get<TaskTemplatePlugin>("templates", task.templateId ?? "");
    const roles = this.db.list<Role>("roles");

    addUserMessage(task, content, authorLabel);

    if (task.status === "collecting") {
      task.collectedMaterials.push(content);

      if (task.collectedMaterials.length >= task.requiredMaterials.length) {
        task.status = "running";
      }

      addAssistantEvent(
        task,
        roles.find((role) => role.id === task.roleSelections[0]?.roleId)?.displayName ?? "角色",
        template ? buildCollectingReply(task, template) : "资料已收到。"
      );

      if (task.status === "running") {
        addAssistantEvent(
          task,
          "系统",
          buildRunningReply(task, roles)
        );
      }
    } else {
      addAssistantEvent(
        task,
        roles.find((role) => role.id === task.roleSelections[0]?.roleId)?.displayName ?? "角色",
        "已收到这条补充，我会继续沿当前任务上下文处理。"
      );
    }

    this.saveTask(task, "conversation.delta", { taskId, content, authorLabel });
    return task;
  }

  queueMessage(taskId: string, content: string, from: string): { task: Task; entry: QueuedMessage } {
    const task = this.getTask(taskId);
    const entry = enqueueMessage(task, from, content);
    this.saveTask(task, "conversation.queue.enqueued", { taskId, entry });
    return { task, entry };
  }

  promoteQueueToBranch(taskId: string, queueId: string): Task {
    const task = this.getTask(taskId);
    promoteQueuedMessageToBranch(task, queueId);
    this.saveTask(task, "conversation.branch.opened", { taskId, queueId });
    return task;
  }

  cancelQueue(taskId: string, queueId: string): Task {
    const task = this.getTask(taskId);
    task.queue = task.queue.map((entry) =>
      entry.id === queueId ? { ...entry, status: "cancelled" } : entry
    );
    this.saveTask(task, "conversation.queue.enqueued", { taskId, queueId, cancelled: true });
    return task;
  }

  createBranch(taskId: string, prompt: string): Task {
    const task = this.getTask(taskId);
    createExplicitBranch(task, prompt);
    this.saveTask(task, "conversation.branch.opened", { taskId, prompt });
    return task;
  }

  requestReview(taskId: string): Task {
    const task = this.getTask(taskId);
    submitForReview(task);
    this.saveTask(task, "review.requested", { taskId });
    return task;
  }

  rejectReview(taskId: string, feedback: string): Task {
    const task = this.getTask(taskId);
    rejectTask(task, feedback);
    this.saveTask(task, "review.rejected", { taskId, feedback });
    return task;
  }

  finishTask(taskId: string): Task {
    const task = this.getTask(taskId);
    approveTask(task, buildReviewSummary(task));
    this.saveTask(task, "finish.confirmed", { taskId, resultCard: task.resultCard });
    return task;
  }

  reopenTask(taskId: string): Task {
    const task = this.getTask(taskId);
    reopenTask(task);
    this.saveTask(task, "task.state.changed", { taskId, status: task.status });
    return task;
  }

  shareTask(taskId: string): Task {
    const task = this.getTask(taskId);
    const share: ShareRecord = {
      id: createId("share"),
      taskId,
      url: `https://agentaction.local/share/${taskId}/${createId("token")}`,
      allowComment: true,
      createdAt: nowIso()
    };
    task.shares.unshift(share);
    this.saveTask(task, "share.created", { taskId, share });
    return task;
  }

  extractTaskAsset(taskId: string, kind: AssetRecord["kind"], roleId?: string): Task {
    const task = this.getTask(taskId);
    const titleMap = {
      artifact: "现场提炼产物",
      memory: "现场提炼记忆",
      skill: "现场提炼技能"
    } as const;

    extractAsset(
      task,
      kind,
      titleMap[kind],
      task.resultCard?.summary ?? "从任务现场提炼出的资产。",
      roleId
    );

    const eventType = kind === "artifact" ? "artifact.created" : kind === "memory" ? "memory.suggested" : "skill.suggested";
    this.saveTask(task, eventType, { taskId, kind });
    return task;
  }

  previewImport(content: string) {
    return previewImport(content);
  }

  private saveTask(task: Task, eventType: EventEnvelope["type"], payload: unknown): void {
    task.updatedAt = nowIso();
    this.db.upsert("tasks", task, task.updatedAt);
    this.db.appendEvent(task.id, eventType, payload, task.updatedAt);
  }
}
