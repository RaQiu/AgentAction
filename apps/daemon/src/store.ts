import path from "node:path";
import fs from "node:fs";
import { spawnSync } from "node:child_process";
import {
  type AppBootstrap,
  type AssetRecord,
  type Conversation,
  type EventEnvelope,
  type PluginDirectoryEntry,
  type ProviderConfig,
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
import { getDefaultProviders } from "@agentaction/provider-core";
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
import { scanPluginDirectory } from "@agentaction/plugin-core";
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
    getOfficialTemplates().forEach((template) =>
      this.db.upsert("templates", template, nowIso())
    );

    getOfficialRoles().forEach((role) => this.db.upsert("roles", role, nowIso()));

    getOfficialEquipment().forEach((equipment) =>
      this.db.upsert("equipment", equipment, nowIso())
    );

    getOfficialRuntimePlugins().forEach((runtime) =>
      this.db.upsert("runtimes", runtime, nowIso())
    );

    getDefaultProviders().forEach((provider) =>
      this.db.upsert("providers", provider, nowIso())
    );
  }

  bootstrap(): AppBootstrap {
    const tasks = this.listTasks();
    const assets = tasks.flatMap((task) => task.assets);

    return {
      templates: this.db.list("templates"),
      roles: this.db.list("roles"),
      equipment: this.db.list("equipment"),
      runtimes: this.db.list("runtimes"),
      providers: this.db.list("providers"),
      tasks,
      assets,
      pluginInventory: this.scanPluginInventory()
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
    const trimmed = content.trim();

    if (trimmed.startsWith("/btw ")) {
      createExplicitBranch(task, trimmed);
      addAssistantEvent(task, "系统", "已根据显式 /btw 指令打开旁枝。");
      this.saveTask(task, "conversation.branch.opened", { taskId, prompt: trimmed });
      return task;
    }

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

  installRuntimeFromGitHub(runtimeId: string): RuntimePlugin {
    const runtime = this.db.get<RuntimePlugin>("runtimes", runtimeId);

    if (!runtime) {
      throw new Error("Runtime not found");
    }

    if (runtime.installMode !== "clone" || !runtime.githubUrl) {
      throw new Error("This runtime does not support GitHub clone install");
    }

    const runtimeDir = path.join(
      this.workspaceRoot,
      "plugins/runtimes/clones",
      runtime.targetRuntime
    );

    fs.rmSync(runtimeDir, { recursive: true, force: true });
    fs.mkdirSync(path.dirname(runtimeDir), { recursive: true });

    const args = ["clone"];
    if (runtime.shallowClone) {
      args.push("--depth", "1", "--filter=blob:none");
    }
    args.push(runtime.githubUrl, runtimeDir);

    const result = spawnSync("git", args, {
      cwd: this.workspaceRoot,
      encoding: "utf-8"
    });

    if (result.status !== 0) {
      throw new Error(result.stderr || result.stdout || "Git clone failed");
    }

    const updated: RuntimePlugin = {
      ...runtime,
      status: "ready",
      pathHint: path.relative(this.workspaceRoot, runtimeDir)
    };

    this.db.upsert("runtimes", updated, nowIso());
    return updated;
  }

  cloneRole(roleId: string): Role {
    const role = this.db.get<Role>("roles", roleId);

    if (!role) {
      throw new Error("Role not found");
    }

    const cloneIndex =
      this.db.list<Role>("roles").filter((item) => item.cloneLineageId === role.cloneLineageId).length + 1;

    const clone: Role = {
      ...role,
      id: createId("role"),
      displayName: `${role.displayName}·分身${cloneIndex}`,
      nickname: `${role.nickname}${cloneIndex}`,
      cloneSourceRoleId: role.id,
      isClone: true,
      statusLabel: "待派遣"
    };

    this.db.upsert("roles", clone, nowIso());
    return clone;
  }

  syncCloneBack(roleId: string): { clone: Role; source: Role } {
    const clone = this.db.get<Role>("roles", roleId);

    if (!clone?.cloneSourceRoleId) {
      throw new Error("Only cloned roles can sync back");
    }

    const source = this.db.get<Role>("roles", clone.cloneSourceRoleId);

    if (!source) {
      throw new Error("Clone source not found");
    }

    source.projectExperienceSkillIds = Array.from(
      new Set([...source.projectExperienceSkillIds, ...clone.projectExperienceSkillIds])
    );
    source.notes = `${source.notes ?? ""}\n已从 ${clone.displayName} 手动回流经验。`.trim();

    this.db.upsert("roles", source, nowIso());
    return { clone, source };
  }

  private scanPluginInventory() {
    const toEntries = (
      dir: string,
      family: PluginDirectoryEntry["family"]
    ): PluginDirectoryEntry[] =>
      scanPluginDirectory(dir).map((entry) => ({
        ...entry,
        family
      }));

    return {
      equipmentFiles: [
        ...toEntries(path.join(this.workspaceRoot, "plugins/equipment/skills"), "skills"),
        ...toEntries(path.join(this.workspaceRoot, "plugins/equipment/mcp"), "mcp")
      ],
      runtimeFiles: [
        ...toEntries(path.join(this.workspaceRoot, "plugins/runtimes/hacks"), "hacks"),
        ...toEntries(path.join(this.workspaceRoot, "plugins/runtimes/clones"), "clones"),
        ...toEntries(path.join(this.workspaceRoot, "plugins/runtimes/adapters"), "adapters")
      ],
      templateFiles: toEntries(path.join(this.workspaceRoot, "plugins/templates/official"), "templates")
    };
  }

  private saveTask(task: Task, eventType: EventEnvelope["type"], payload: unknown): void {
    task.updatedAt = nowIso();
    this.db.upsert("tasks", task, task.updatedAt);
    this.db.appendEvent(task.id, eventType, payload, task.updatedAt);
  }
}
