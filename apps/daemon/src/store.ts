import path from "node:path";
import {
  type AppBootstrap,
  type AppSettings,
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
import { getRuntimeTemplate } from "./runtimeTemplates";
import { buildCollectingReply, buildReviewSummary, buildRunningReply } from "./simulate";

export class AppStore {
  private readonly db: LocalDatabase;
  private readonly stateRoot: string;

  constructor(private readonly workspaceRoot: string) {
    this.stateRoot =
      process.env.AGENTACTION_STATE_DIR ??
      path.join(workspaceRoot, "apps/daemon/.agentaction-data");
    this.db = new LocalDatabase(
      path.join(this.stateRoot, "agentaction.db")
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

    getOfficialRuntimePlugins().forEach((runtime) => {
      const existing = this.db.get<RuntimePlugin>("runtimes", runtime.id);
      const merged: RuntimePlugin = existing
        ? {
            ...runtime,
            source: existing.source,
            status: existing.status,
            pathHint: existing.pathHint ?? runtime.pathHint,
            checkState: existing.checkState ?? runtime.checkState,
            checkSummary: existing.checkSummary ?? runtime.checkSummary,
            checkDetails: existing.checkDetails ?? runtime.checkDetails,
            detectedCommandPath: existing.detectedCommandPath,
            detectedVersion: existing.detectedVersion,
            lastCheckedAt: existing.lastCheckedAt
          }
        : runtime;

      this.db.upsert("runtimes", merged, nowIso());
    });

    getDefaultProviders().forEach((provider) =>
      this.db.upsert("providers", provider, nowIso())
    );

    const settings = this.db.get<AppSettings>("settings" as never, "settings");
    const nextSettings: AppSettings = settings ?? {
      defaultRuntimeId: "runtime_hack_codex_cli",
      defaultRuntimeLabel: "Codex",
      defaultRuntimeEnabled: true,
      defaultRuntimeSandbox: "read-only",
      defaultRuntimeMode: "advisory"
    };
    this.db.upsert("settings" as never, { id: "settings", ...nextSettings } as never, nowIso());
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
      settings: this.getSettings(),
      tasks,
      assets,
      pluginInventory: this.scanPluginInventory()
    };
  }

  getSettings(): AppSettings {
    const settings = this.db.get<(AppSettings & { id: string })>("settings" as never, "settings");
    if (!settings) {
      throw new Error("Settings missing");
    }
    const { id, ...rest } = settings;
    void id;
    return rest;
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

  async sendMainMessage(taskId: string, content: string, authorLabel = "你"): Promise<Task> {
    const task = this.getTask(taskId);
    const template = this.db.get<TaskTemplatePlugin>("templates", task.templateId ?? "");
    const roles = this.db.list<Role>("roles");
    const settings = this.getSettings();
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
        const runtimeReply = await this.tryRunDefaultRuntime(task, template ?? undefined, roles, settings);
        addAssistantEvent(
          task,
          runtimeReply?.authorLabel ?? "系统",
          runtimeReply?.reply ?? buildRunningReply(task, roles)
        );
      }
    } else {
      const runtimeReply = await this.tryRunDefaultRuntime(task, template ?? undefined, roles, settings);
      addAssistantEvent(
        task,
        runtimeReply?.authorLabel ??
          roles.find((role) => role.id === task.roleSelections[0]?.roleId)?.displayName ??
          "角色",
        runtimeReply?.reply ?? "已收到这条补充，我会继续沿当前任务上下文处理。"
      );
    }

    this.saveTask(task, "conversation.delta", { taskId, content, authorLabel });
    return task;
  }

  private async tryRunDefaultRuntime(
    task: Task,
    template: TaskTemplatePlugin | undefined,
    roles: Role[],
    settings: AppSettings
  ): Promise<{ reply: string; authorLabel: string } | undefined> {
    if (process.env.AGENTACTION_DISABLE_DEFAULT_RUNTIME === "1") {
      return undefined;
    }

    if (!settings.defaultRuntimeEnabled || settings.defaultRuntimeId !== "runtime_hack_codex_cli") {
      return undefined;
    }

    let runtime = this.db.get<RuntimePlugin>("runtimes", settings.defaultRuntimeId);
    if (!runtime) {
      return undefined;
    }

    if (runtime.checkState !== "passed" || runtime.status !== "ready") {
      runtime = this.checkRuntime(settings.defaultRuntimeId);
    }

    if (runtime.checkState !== "passed" || runtime.status !== "ready") {
      return undefined;
    }

    const runtimeTemplate = getRuntimeTemplate(runtime);
    if (!runtimeTemplate?.runTask) {
      return undefined;
    }

    try {
      const explicitFinishRequest =
        task.mainConversation.messages
          .slice(-2)
          .some(
            (message) =>
              message.role === "user" &&
              /finish|交付条件|提交.*finish|输出.*finish|完成合同|结束合同/i.test(message.content)
          );

      let result = await runtimeTemplate.runTask({
        task,
        template,
        roles,
        runtime,
        workspaceRoot: this.workspaceRoot,
        stateRoot: this.stateRoot,
        sandbox: settings.defaultRuntimeSandbox
      });

      if (explicitFinishRequest && result.status !== "finish") {
        result = await runtimeTemplate.runTask({
          task,
          template,
          roles,
          runtime,
          workspaceRoot: this.workspaceRoot,
          stateRoot: this.stateRoot,
          sandbox: settings.defaultRuntimeSandbox,
          contractReminder:
            "你上一轮没有交出平台 finish 合同。现在必须把 status 设为 finish，并完整填写 finish.summary、finish.resultTitle、finish.needsReview。"
        });
      }

      task.runtimeState = {
        ...task.runtimeState,
        runtimeId: runtime.id,
        sessionId: result.sessionId ?? task.runtimeState?.sessionId,
        compactDetected:
          result.compactDetected ?? task.runtimeState?.compactDetected ?? false,
        lastTurnCompletedAt: nowIso(),
        lastStatus: result.status ?? task.runtimeState?.lastStatus,
        pendingFinish: result.finishContract ?? task.runtimeState?.pendingFinish ?? null
      };

      for (const event of result.events) {
        if (event.kind === "tool-start") {
          addAssistantEvent(task, "Codex·工具", event.summary);
        } else if (event.kind === "tool-end") {
          addAssistantEvent(
            task,
            "Codex·工具",
            event.output ? `${event.summary}\n${event.output}` : event.summary
          );
        } else if (event.kind === "finish") {
          addAssistantEvent(task, "系统", event.summary);
        }
      }

      if (result.compactDetected) {
        addAssistantEvent(task, "系统", "Codex 会话已触发 compact 相关事件。");
      }

      if (result.status === "ready_for_review") {
        task.status = "review";
        addAssistantEvent(task, "系统", "Codex 已请求进入待验收状态。");
      }

      if (result.status === "finish" && result.finishContract) {
        addAssistantEvent(
          task,
          "系统",
          `Codex 已提交平台 finish 合同：${result.finishContract.resultTitle} · ${result.finishContract.summary}`
        );

        if (result.finishContract.needsReview || task.reviewerRoleId) {
          task.status = "review";
        } else {
          approveTask(task, result.finishContract.summary);
        }
      }

      return {
        reply: result.reply,
        authorLabel: result.authorLabel
      };
    } catch (error) {
      return {
        reply: `Codex 默认智能体调用失败：${(error as Error).message}`,
        authorLabel: "系统"
      };
    }
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

    const runtimeTemplate = getRuntimeTemplate(runtime);
    if (!runtimeTemplate?.installFromGitHub) {
      throw new Error("This runtime does not support GitHub clone install");
    }

    const updated = runtimeTemplate.installFromGitHub(runtime, {
      workspaceRoot: this.workspaceRoot,
      stateRoot: this.stateRoot
    });
    this.db.upsert("runtimes", updated, nowIso());
    return updated;
  }

  checkRuntime(runtimeId: string): RuntimePlugin {
    const runtime = this.db.get<RuntimePlugin>("runtimes", runtimeId);

    if (!runtime) {
      throw new Error("Runtime not found");
    }

    const runtimeTemplate = getRuntimeTemplate(runtime);
    if (!runtimeTemplate) {
      throw new Error(`No runtime template for ${runtime.targetRuntime}`);
    }

    const updated = runtimeTemplate.check(runtime, {
      workspaceRoot: this.workspaceRoot,
      stateRoot: this.stateRoot
    });

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
