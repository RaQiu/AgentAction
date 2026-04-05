import { computed, ref } from "vue";
import { defineStore } from "pinia";
import type {
  AppBootstrap,
  AssetRecord,
  RoleSelection,
  Task,
  TaskTemplatePlugin
} from "@agentaction/shared";
import { api } from "@/api/client";

export const useWorkbenchStore = defineStore("workbench", () => {
  const bootstrap = ref<AppBootstrap | null>(null);
  const currentTask = ref<Task | null>(null);
  const loading = ref(false);
  const errorMessage = ref("");
  const socketConnected = ref(false);

  let socket: WebSocket | null = null;

  const templates = computed(() => bootstrap.value?.templates ?? []);
  const roles = computed(() => bootstrap.value?.roles ?? []);
  const equipment = computed(() => bootstrap.value?.equipment ?? []);
  const runtimes = computed(() => bootstrap.value?.runtimes ?? []);
  const tasks = computed(() => bootstrap.value?.tasks ?? []);
  const assets = computed<AssetRecord[]>(() => bootstrap.value?.assets ?? []);

  function upsertTask(task: Task): void {
    if (!bootstrap.value) {
      return;
    }

    const nextTasks = [...bootstrap.value.tasks];
    const index = nextTasks.findIndex((item) => item.id === task.id);

    if (index >= 0) {
      nextTasks[index] = task;
    } else {
      nextTasks.unshift(task);
    }

    bootstrap.value = {
      ...bootstrap.value,
      tasks: nextTasks,
      assets: nextTasks.flatMap((item) => item.assets)
    };

    if (currentTask.value?.id === task.id) {
      currentTask.value = task;
    }
  }

  function bindSocket(): void {
    if (socket) {
      socket.close();
    }

    const nextSocket = api.createSocket();
    socket = nextSocket;

    nextSocket.addEventListener("open", () => {
      socketConnected.value = true;
    });
    nextSocket.addEventListener("close", () => {
      socketConnected.value = false;
    });
    nextSocket.addEventListener("message", (event) => {
      const payload = JSON.parse(event.data) as { payload?: { task?: Task } };
      if (payload.payload?.task) {
        upsertTask(payload.payload.task);
      }
    });
  }

  async function initialize(): Promise<void> {
    loading.value = true;
    errorMessage.value = "";

    try {
      bootstrap.value = await api.bootstrap();
      bindSocket();
    } catch (error) {
      errorMessage.value = (error as Error).message;
    } finally {
      loading.value = false;
    }
  }

  async function ensureInitialized(): Promise<void> {
    if (!bootstrap.value) {
      await initialize();
    }
  }

  async function loadTask(taskId: string): Promise<void> {
    await ensureInitialized();
    const task = await api.getTask(taskId);
    currentTask.value = task;
    upsertTask(task);
  }

  async function createTaskFromTemplate(
    template: TaskTemplatePlugin,
    roleSelections?: RoleSelection[]
  ): Promise<Task> {
    await ensureInitialized();
    const task = await api.createTask(template.id, roleSelections);
    upsertTask(task);
    currentTask.value = task;
    return task;
  }

  async function sendMessage(content: string): Promise<void> {
    if (!currentTask.value) {
      return;
    }

    const task = await api.sendMessage(currentTask.value.id, content);
    upsertTask(task);
  }

  async function queueMessage(content: string): Promise<void> {
    if (!currentTask.value) {
      return;
    }

    const result = await api.queueMessage(currentTask.value.id, content, "协作者");
    upsertTask(result.task);
  }

  async function promoteQueue(queueId: string): Promise<void> {
    if (!currentTask.value) {
      return;
    }

    const task = await api.promoteQueue(currentTask.value.id, queueId);
    upsertTask(task);
  }

  async function cancelQueue(queueId: string): Promise<void> {
    if (!currentTask.value) {
      return;
    }

    const task = await api.cancelQueue(currentTask.value.id, queueId);
    upsertTask(task);
  }

  async function createBranch(prompt: string): Promise<void> {
    if (!currentTask.value) {
      return;
    }

    const task = await api.createBranch(currentTask.value.id, prompt);
    upsertTask(task);
  }

  async function requestReview(): Promise<void> {
    if (!currentTask.value) {
      return;
    }

    const task = await api.requestReview(currentTask.value.id);
    upsertTask(task);
  }

  async function rejectReview(feedback: string): Promise<void> {
    if (!currentTask.value) {
      return;
    }

    const task = await api.rejectReview(currentTask.value.id, feedback);
    upsertTask(task);
  }

  async function finishTask(): Promise<void> {
    if (!currentTask.value) {
      return;
    }

    const task = await api.finishTask(currentTask.value.id);
    upsertTask(task);
  }

  async function reopenTask(): Promise<void> {
    if (!currentTask.value) {
      return;
    }

    const task = await api.reopenTask(currentTask.value.id);
    upsertTask(task);
  }

  async function shareTask(): Promise<void> {
    if (!currentTask.value) {
      return;
    }

    const task = await api.shareTask(currentTask.value.id);
    upsertTask(task);
  }

  async function extract(kind: "artifact" | "memory" | "skill"): Promise<void> {
    if (!currentTask.value) {
      return;
    }

    const task = await api.extractAsset(currentTask.value.id, kind);
    upsertTask(task);
  }

  return {
    bootstrap,
    templates,
    roles,
    equipment,
    runtimes,
    tasks,
    assets,
    currentTask,
    loading,
    errorMessage,
    socketConnected,
    initialize,
    ensureInitialized,
    loadTask,
    createTaskFromTemplate,
    sendMessage,
    queueMessage,
    promoteQueue,
    cancelQueue,
    createBranch,
    requestReview,
    rejectReview,
    finishTask,
    reopenTask,
    shareTask,
    extract
  };
});
