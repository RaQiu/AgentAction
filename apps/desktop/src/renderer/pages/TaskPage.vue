<template>
  <section v-if="task" class="page task-page">
    <header class="task-command">
      <div class="task-command__copy">
        <p class="eyebrow">任务容器</p>
        <h1>{{ task.title }}</h1>
        <p class="page__lead">
          {{ statusLabelMap[task.status] }} · 默认智能体 {{ task.runtimeState?.runtimeId || "未接管" }} · finish 纪律 {{ task.finishRequired ? "开启" : "关闭" }}
        </p>
      </div>
      <div class="hero-actions">
        <button class="button button--ghost" @click="share">分享</button>
        <button class="button button--ghost" @click="requestReview">送审</button>
        <button class="button button--ghost" @click="rejectReview">打回</button>
        <button class="button button--primary" @click="finish">finish</button>
      </div>
    </header>

    <section class="task-stage-grid">
      <article class="task-stage">
        <p class="eyebrow">运行态势</p>
        <div class="ops-grid ops-grid--compact">
          <div class="ops-cell">
            <strong>{{ task.mainConversation.messages.length }}</strong>
            <span>事件/消息</span>
          </div>
          <div class="ops-cell">
            <strong>{{ task.runtimeState?.sessionId ? "已接住" : "未持久化" }}</strong>
            <span>Codex 会话</span>
          </div>
          <div class="ops-cell">
            <strong>{{ task.runtimeState?.compactDetected ? "已发现" : "未发现" }}</strong>
            <span>compact</span>
          </div>
          <div class="ops-cell">
            <strong>{{ task.runtimeState?.pendingFinish ? "已提交" : "待提交" }}</strong>
            <span>finish 合同</span>
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
            <p class="eyebrow">主工作区</p>
            <h3>主回复、工具事件、系统节点分层展示</h3>
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
          <textarea v-model="messageText" placeholder="继续给主任务补资料、发指令，或要求 Codex 提交 finish 合同..." />
          <div class="composer__actions">
            <button class="button button--ghost" @click="queue">排队插话</button>
            <button class="button button--ghost" @click="branch">显式 /btw</button>
            <button class="button button--primary" @click="send">发到主线</button>
          </div>
        </div>
      </article>

      <div class="task-side">
        <QueuePanel :queue="task.queue.filter((item: QueuedMessage) => item.status === 'queued')" @promote="promoteQueue" @cancel="cancelQueue" />

        <section class="mission-stack">
          <div class="section-heading">
            <div>
              <p class="eyebrow">旁枝线程</p>
              <h3>显式 /btw 才开分叉</h3>
            </div>
            <span class="tag">{{ task.branches.length }} 条</span>
          </div>
          <div v-if="task.branches.length" class="branch-list">
            <article v-for="branchItem in task.branches" :key="branchItem.id" class="branch-item">
              <strong>{{ branchItem.title }}</strong>
              <p>{{ branchItem.messages[branchItem.messages.length - 1]?.content }}</p>
            </article>
          </div>
          <p v-else class="muted">当前没有旁枝。</p>
        </section>

        <section class="mission-stack mission-stack--contract">
          <div class="section-heading">
            <div>
              <p class="eyebrow">交付合同</p>
              <h3>平台 finish 字段</h3>
            </div>
            <span class="tag">{{ task.runtimeState?.lastStatus || "未提交" }}</span>
          </div>
          <div v-if="task.runtimeState?.pendingFinish" class="contract-sheet">
            <strong>{{ task.runtimeState.pendingFinish.resultTitle }}</strong>
            <p>{{ task.runtimeState.pendingFinish.summary }}</p>
            <span class="tag">{{ task.runtimeState.pendingFinish.needsReview ? "需要主审" : "可直接收束" }}</span>
          </div>
          <p v-else class="muted">默认智能体尚未提交平台 finish 合同。</p>
        </section>

        <ResultCardPanel :task="task" @extract="extract" />

        <section class="mission-stack">
          <div class="section-heading">
            <div>
              <p class="eyebrow">现场资产</p>
              <h3>不跳后台，直接从任务流里提炼</h3>
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
              <p class="eyebrow">分享记录</p>
              <h3>当前任务的分享记录</h3>
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
import QueuePanel from "@/components/QueuePanel.vue";
import ResultCardPanel from "@/components/ResultCardPanel.vue";
import { useWorkbenchStore } from "@/stores/workbench";

const route = useRoute();
const store = useWorkbenchStore();
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
