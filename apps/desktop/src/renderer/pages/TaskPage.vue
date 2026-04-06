<template>
  <section v-if="task" class="page task-page">
    <header class="task-command">
      <div class="task-command__copy">
        <p class="eyebrow">{{ t("shell.tasks") }}</p>
        <h1>{{ task.templateId ? templateField(task.templateId, "title", task.title) : task.title }}</h1>
        <p class="page__lead">{{ statusLabel(task.status) }}</p>
      </div>
      <div class="hero-actions">
        <button class="button button--ghost" @click="share">{{ t("task.share") }}</button>
        <button class="button button--ghost" @click="requestReview">{{ t("task.requestReview") }}</button>
        <button class="button button--ghost" @click="rejectReview">{{ t("task.reject") }}</button>
        <button class="button button--primary" @click="finish">{{ t("task.finish") }}</button>
      </div>
    </header>

    <section class="task-shell">
      <article class="workspace-panel workspace-panel--primary">
        <div class="section-heading">
          <div>
            <p class="eyebrow">{{ t("task.workspace") }}</p>
            <h3>{{ t("task.workspaceSubtitle") }}</h3>
          </div>
        </div>

        <div class="timeline">
          <div
            v-for="message in task.mainConversation.messages"
            :key="message.id"
            class="timeline__item"
            :class="messageTone(message.authorLabel, message.role)"
          >
            <div class="timeline__meta">
              <strong>{{ messageAuthorLabel(message.authorLabel) }}</strong>
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

      <aside class="task-shell__side">
        <section class="mission-stack mission-stack--result">
          <div class="section-heading">
            <div>
              <p class="eyebrow">{{ t("result.card") }}</p>
              <h3>{{ task.resultCard?.title || t("task.goalEmpty") }}</h3>
            </div>
            <span class="tag">{{ statusLabel(task.status) }}</span>
          </div>
          <p class="muted">
            {{
              task.resultCard?.summary ||
              task.runtimeState?.pendingFinish?.summary ||
              t("task.contractEmpty")
            }}
          </p>
        </section>

        <section v-if="task.runtimeState?.pendingFinish" class="mission-stack">
          <div class="section-heading">
            <div>
              <p class="eyebrow">{{ t("task.contractTitle") }}</p>
              <h3>{{ task.runtimeState.pendingFinish.resultTitle }}</h3>
            </div>
          </div>
          <p class="muted">{{ task.runtimeState.pendingFinish.summary }}</p>
        </section>

        <section v-if="task.queue.length" class="mission-stack">
          <QueuePanel
            :queue="task.queue.filter((item: QueuedMessage) => item.status === 'queued')"
            @promote="promoteQueue"
            @cancel="cancelQueue"
          />
        </section>

        <section v-if="task.branches.length" class="mission-stack">
          <div class="section-heading">
            <div>
              <p class="eyebrow">{{ t("task.sideThreads") }}</p>
              <h3>{{ t("task.sideThreadsSubtitle") }}</h3>
            </div>
          </div>
          <div class="branch-list">
            <article v-for="branchItem in task.branches" :key="branchItem.id" class="branch-item">
              <strong>{{ branchItem.title }}</strong>
              <p>{{ branchItem.messages[branchItem.messages.length - 1]?.content }}</p>
            </article>
          </div>
        </section>

        <ResultCardPanel v-if="task.resultCard" :task="task" @extract="extract" />
      </aside>
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
const { locale, t, templateField, runtimeField, roleDisplayName } = useI18n();
const messageText = ref("");

function statusLabel(status: TaskStatus) {
  return t(`status.${status}`);
}

onMounted(async () => {
  await store.loadTask(String(route.params.taskId));
});

const task = computed(() => store.currentTask);

function formatDate(value: string): string {
  return new Date(value).toLocaleString(locale.value, {
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

function messageAuthorLabel(authorLabel: string): string {
  if (authorLabel === "系统" || authorLabel === "System") {
    return t("task.systemLabel");
  }
  if (authorLabel.startsWith("Codex·工具")) {
    return `Codex · ${t("task.toolLabel")}`;
  }
  if (authorLabel === "🐮 产品经理") {
    return roleDisplayName("role_product_xiaoce", authorLabel);
  }
  if (authorLabel === "🐎 程序员") {
    return roleDisplayName("role_engineer_ache", authorLabel);
  }
  return authorLabel;
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
  await store.rejectReview(t("task.rejectMessage"));
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
