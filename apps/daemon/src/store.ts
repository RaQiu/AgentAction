import path from "node:path";
import fs from "node:fs";
import { spawnSync } from "node:child_process";
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
import { runCodexTaskReply } from "./runtimeAgent";
import { buildCollectingReply, buildReviewSummary, buildRunningReply } from "./simulate";

function commandLocatorForCurrentOs(): { command: string; args: (binary: string) => string[] } {
  if (process.platform === "win32") {
    return {
      command: "where",
      args: (binary) => [binary]
    };
  }

  return {
    command: "which",
    args: (binary) => [binary]
  };
}

function firstNonEmptyLine(value: string): string | undefined {
  return value
    .split("\n")
    .map((line) => line.trim())
    .find(Boolean);
}

function repoLooksRunnable(targetDir: string): string[] {
  const candidatePaths = [
    "package.json",
    "pyproject.toml",
    "Cargo.toml",
    "go.mod",
    "requirements.txt",
    "README.md",
    "src/main.py",
    "src/setup.py",
    "rust/Cargo.toml"
  ];

  return candidatePaths.filter((signal) => fs.existsSync(path.join(targetDir, signal)));
}

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
        addAssistantEvent(task, "Codex", runtimeReply ?? buildRunningReply(task, roles));
      }
    } else {
      const runtimeReply = await this.tryRunDefaultRuntime(task, template ?? undefined, roles, settings);
      addAssistantEvent(
        task,
        runtimeReply ? "Codex" : roles.find((role) => role.id === task.roleSelections[0]?.roleId)?.displayName ?? "角色",
        runtimeReply ?? "已收到这条补充，我会继续沿当前任务上下文处理。"
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
  ): Promise<string | undefined> {
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

    try {
      return await runCodexTaskReply({
        task,
        template,
        roles,
        runtime,
        workspaceRoot: this.workspaceRoot,
        sandbox: settings.defaultRuntimeSandbox
      });
    } catch (error) {
      return `Codex 默认智能体调用失败：${(error as Error).message}`;
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

    if ((runtime.installMode !== "clone" && !runtime.supportsCloneInstall) || !runtime.githubUrl) {
      throw new Error("This runtime does not support GitHub clone install");
    }

    const runtimeDir = path.join(
      this.stateRoot,
      "runtime-clones",
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
      source: "cloned-source",
      status: "ready",
      pathHint: runtimeDir,
      checkState: "partial",
      checkSummary: "GitHub clone 已完成，等待进一步 hack/运行探测。",
      checkDetails: [`已克隆到 ${runtimeDir}`],
      lastCheckedAt: nowIso()
    };

    this.db.upsert("runtimes", updated, nowIso());
    return updated;
  }

  checkRuntime(runtimeId: string): RuntimePlugin {
    const runtime = this.db.get<RuntimePlugin>("runtimes", runtimeId);

    if (!runtime) {
      throw new Error("Runtime not found");
    }

    const details: string[] = [];
    let existingPassed = false;
    let clonePassed = false;
    let detectedCommandPath = runtime.detectedCommandPath;
    let detectedVersion = runtime.detectedVersion;

    if (runtime.githubUrl) {
      const remote = spawnSync("git", ["ls-remote", runtime.githubUrl, "HEAD"], {
        cwd: this.workspaceRoot,
        encoding: "utf-8"
      });

      if (remote.status === 0) {
        details.push(`GitHub 可达：${firstNonEmptyLine(remote.stdout) ?? runtime.githubUrl}`);
      } else {
        details.push(`GitHub 不可达：${runtime.githubUrl}`);
      }
    }

    if (runtime.command) {
      const locator = commandLocatorForCurrentOs();
      const locate = spawnSync(locator.command, locator.args(runtime.command), {
        cwd: this.workspaceRoot,
        encoding: "utf-8"
      });

      if (locate.status === 0) {
        detectedCommandPath = firstNonEmptyLine(locate.stdout);
        details.push(`命令存在：${detectedCommandPath}`);

        const probe = spawnSync(runtime.command, runtime.probeArgs ?? ["--version"], {
          cwd: this.workspaceRoot,
          encoding: "utf-8"
        });

        const stdout = `${probe.stdout ?? ""}\n${probe.stderr ?? ""}`.trim();
        if (probe.status === 0 || stdout.length > 0) {
          existingPassed = true;
          detectedVersion = firstNonEmptyLine(stdout) ?? detectedVersion;
          details.push(`hack 探测通过：${detectedVersion ?? "已拿到命令输出"}`);
        } else {
          details.push(`hack 探测失败：命令可执行但没有拿到有效输出`);
        }
      } else {
        details.push(`命令缺失：${runtime.command}`);
      }
    }

    if (runtime.pathHint && fs.existsSync(runtime.pathHint)) {
      const signals = repoLooksRunnable(runtime.pathHint);
      if (signals.length > 0) {
        clonePassed = true;
        details.push(`clone 仓库有效：检测到 ${signals.join("、")}`);
      } else {
        details.push(`clone 仓库存在，但缺少常见项目入口文件`);
      }
    } else if (runtime.source === "cloned-source") {
      details.push(`clone 路径缺失：${runtime.pathHint ?? "未记录路径"}`);
    }

    let checkState: RuntimePlugin["checkState"] = "failed";
    let status: RuntimePlugin["status"] = "missing";
    let checkSummary = "既没有通过 hack 检查，也没有通过 clone 检查。";

    if (existingPassed && clonePassed) {
      checkState = "passed";
      status = "ready";
      checkSummary = "hack 与 clone 检查都通过。";
    } else if (existingPassed) {
      checkState = "passed";
      status = "ready";
      checkSummary = "hack 注入探测通过。";
    } else if (clonePassed) {
      checkState = "partial";
      status = "degraded";
      checkSummary = "clone 检查通过，但 hack 注入尚未通过。";
    }

    const updated: RuntimePlugin = {
      ...runtime,
      detectedCommandPath,
      detectedVersion,
      checkState,
      checkSummary,
      checkDetails: details,
      status,
      lastCheckedAt: nowIso()
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
