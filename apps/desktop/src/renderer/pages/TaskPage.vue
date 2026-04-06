<template>
  <section v-if="task" class="page task-page">
    <header class="task-command">
      <div class="task-command__copy">
        <p class="eyebrow">{{ t("shell.tasks") }}</p>
        <h1>{{ task.templateId ? templateField(task.templateId, "title", task.title) : task.title }}</h1>
        <p class="page__lead">
          {{ statusLabelMap[task.status] }} · {{ t("task.runtime") }} {{ currentRuntimeName }} · {{ t("task.finishDiscipline") }} {{ task.finishRequired ? t("task.enabled") : t("task.disabled") }}
        </p>
      </div>
      <div class="hero-actions">
        <button class="button button--ghost" @click="share">{{ t("task.share") }}</button>
        <button class="button button--ghost" @click="requestReview">{{ t("task.requestReview") }}</button>
        <button class="button button--ghost" @click="rejectReview">{{ t("task.reject") }}</button>
        <button class="button button--primary" @click="finish">{{ t("task.finish") }}</button>
      </div>
    </header>

    <section class="task-stage-grid">
      <article class="task-stage">
        <p class="eyebrow">{{ t("task.status") }}</p>
        <div class="ops-grid ops-grid--compact">
          <div class="ops-cell">
            <strong>{{ task.mainConversation.messages.length }}</strong>
            <span>{{ t("task.events") }}</span>
          </div>
          <div class="ops-cell">
            <strong>{{ task.runtimeState?.sessionId ? t("task.sessionReady") : t("task.sessionMissing") }}</strong>
            <span>{{ t("task.session") }}</span>
          </div>
          <div class="ops-cell">
            <strong>{{ task.runtimeState?.compactDetected ? t("task.compactSeen") : t("task.compactNone") }}</strong>
            <span>{{ t("task.compact") }}</span>
          </div>
          <div class="ops-cell">
            <strong>{{ task.runtimeState?.pendingFinish ? t("task.contractReady") : t("task.contractPending") }}</strong>
            <span>{{ t("task.contract") }}</span>
          </div>
        </div>
      </article>

      <article class="task-stage task-stage--light">
        <p class="eyebrow">收束目标</p>
        <div class="task-stage__summary">
          <strong>主结果卡</strong>
          <span>{{ task.resultCard?.title || "尚未收束" }}</span>
        </div>
      </article>
    </section>

    <section class="task-grid">
      <article class="workspace-panel">
        <div class="section-heading">
          <div>
            <p class="eyebrow">{{ t("task.workspace") }}</p>
            <h3>{{ t("task.workspaceSubtitle") }}</h3>
          </div>
          <span class="tag">{{ task.mainConversation.messages.length }} 条</span>
        </div>

        <div class="timeline">
          <div
            v-for="message in task.mainConversation.messages"
            :key="message.id"
            class="timeline__item"
            :class="messageTone(message.authorLabel, message.role)"
          >
            <div class="timeline__meta">
              <strong>{{ message.authorLabel }}</strong>
              <span>{{ formatDate(message.createdAt) }}</span>
            </div>
            <p>{{ message.content }}</p>
          </div>
        </div>

        <div class="composer composer--command">
          <textarea v-model="messageText" :placeholder="t('task.composerPlaceholder')" />
          <div class="composer__actions">
            <button class="button button--ghost" @click="queue">{{ t("task.queue") }}</button>
            <button class="button button--ghost" @click="branch">{{ t("task.branch") }}</button>
            <button class="button button--primary" @click="send">{{ t("task.send") }}</button>
          </div>
        </div>
      </article>

      <div class="task-side">
        <QueuePanel :queue="task.queue.filter((item: QueuedMessage) => item.status === 'queued')" @promote="promoteQueue" @cancel="cancelQueue" />

        <section class="mission-stack">
          <div class="section-heading">
            <div>
              <p class="eyebrow">{{ t("task.sideThreads") }}</p>
              <h3>{{ t("task.sideThreadsSubtitle") }}</h3>
            </div>
            <span class="tag">{{ task.branches.length }} 条</span>
          </div>
          <div v-if="task.branches.length" class="branch-list">
            <article v-for="branchItem in task.branches" :key="branchItem.id" class="branch-item">
              <strong>{{ branchItem.title }}</strong>
              <p>{{ branchItem.messages[branchItem.messages.length - 1]?.content }}</p>
            </article>
          </div>
          <p v-else class="muted">{{ t("task.noBranch") }}</p>
        </section>

        <section class="mission-stack mission-stack--contract">
          <div class="section-heading">
            <div>
              <p class="eyebrow">{{ t("task.contractTitle") }}</p>
              <h3>{{ t("task.contractSubtitle") }}</h3>
            </div>
            <span class="tag">{{ task.runtimeState?.lastStatus || "未提交" }}</span>
          </div>
          <div v-if="task.runtimeState?.pendingFinish" class="contract-sheet">
            <strong>{{ task.runtimeState.pendingFinish.resultTitle }}</strong>
            <p>{{ task.runtimeState.pendingFinish.summary }}</p>
            <span class="tag">{{ task.runtimeState.pendingFinish.needsReview ? t("task.needsReview") : t("task.directFinish") }}</span>
          </div>
          <p v-else class="muted">{{ t("task.contractEmpty") }}</p>
        </section>

        <ResultCardPanel :task="task" @extract="extract" />

        <section class="mission-stack">
          <div class="section-heading">
            <div>
              <p class="eyebrow">{{ t("task.assets") }}</p>
              <h3>{{ t("task.assetsSubtitle") }}</h3>
            </div>
          </div>
          <ul class="list">
            <li v-for="asset in task.assets" :key="asset.id">
              <strong>{{ asset.title }}</strong>
              <span>{{ asset.kind }} · {{ asset.summary }}</span>
            </li>
          </ul>
        </section>

        <section class="mission-stack">
          <div class="section-heading">
            <div>
              <p class="eyebrow">{{ t("task.shares") }}</p>
              <h3>{{ t("task.sharesSubtitle") }}</h3>
            </div>
          </div>
          <ul class="list">
            <li v-for="shareItem in task.shares" :key="shareItem.id">
              <strong>{{ shareItem.url }}</strong>
              <span>{{ formatDate(shareItem.createdAt) }}</span>
            </li>
          </ul>
        </section>
      </div>
    </section>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import type { ConversationMessage, QueuedMessage, TaskStatus } from "@agentaction/shared";
import { useRoute } from "vue-router";
import { useI18n } from "@/i18n";
import QueuePanel from "@/components/QueuePanel.vue";
import ResultCardPanel from "@/components/ResultCardPanel.vue";
import { useWorkbenchStore } from "@/stores/workbench";

const route = useRoute();
const store = useWorkbenchStore();
const { t, templateField, runtimeField } = useI18n();
const messageText = ref("");

const statusLabelMap: Record<TaskStatus, string> = {
  collecting: "收资料",
  running: "执行中",
  review: "待验收",
  done: "已完成"
};

onMounted(async () => {
  await store.loadTask(String(route.params.taskId));
});

const task = computed(() => store.currentTask);
const currentRuntimeName = computed(() => {
  const runtimeId = task.value?.runtimeState?.runtimeId;
  const runtime = store.runtimes.find((item) => item.id === runtimeId);
  return runtime ? runtimeField(runtime.id, "name", runtime.name) : "—";
});

function formatDate(value: string): string {
  return new Date(value).toLocaleString("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
    month: "2-digit",
    day: "2-digit"
  });
}

function messageTone(authorLabel: string, role: ConversationMessage["role"]) {
  if (authorLabel.startsWith("Codex·工具")) {
    return "timeline__item--tool";
  }
  if (authorLabel === "系统") {
    return "timeline__item--system";
  }
  if (role === "assistant") {
    return "timeline__item--assistant";
  }
  if (role === "user") {
    return "timeline__item--user";
  }
  return "";
}

async function send() {
  if (!messageText.value.trim()) {
    return;
  }

  await store.sendMessage(messageText.value.trim());
  messageText.value = "";
}

async function queue() {
  if (!messageText.value.trim()) {
    return;
  }

  await store.queueMessage(messageText.value.trim());
  messageText.value = "";
}

async function branch() {
  if (!messageText.value.trim()) {
    return;
  }

  await store.createBranch(messageText.value.trim());
  messageText.value = "";
}

async function promoteQueue(queueId: string) {
  await store.promoteQueue(queueId);
}

async function cancelQueue(queueId: string) {
  await store.cancelQueue(queueId);
}

async function requestReview() {
  await store.requestReview();
}

async function rejectReview() {
  await store.rejectReview("主审认为结果还不够可交付，请继续完善。");
}

async function finish() {
  await store.finishTask();
}

async function share() {
  await store.shareTask();
}

async function extract(kind: "artifact" | "memory" | "skill") {
  await store.extract(kind);
}
</script>
