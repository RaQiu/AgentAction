<template>
  <section v-if="task" class="page task-page">
    <header class="page__hero page__hero--compact">
      <div>
        <p class="eyebrow">任务容器</p>
        <h1>{{ task.title }}</h1>
        <p class="page__lead">
          状态：{{ statusLabelMap[task.status] }} · finish 纪律：{{ task.finishRequired ? "开启" : "关闭" }}
        </p>
      </div>
      <div class="hero-actions">
        <button class="button button--ghost" @click="share">分享</button>
        <button class="button button--ghost" @click="requestReview">送审</button>
        <button class="button button--ghost" @click="rejectReview">打回</button>
        <button class="button button--primary" @click="finish">finish</button>
      </div>
    </header>

    <section class="task-grid">
      <article class="card conversation-card">
        <div class="section-heading">
          <div>
            <p class="eyebrow">主会话</p>
            <h3>真实事件尽量保真展示</h3>
          </div>
          <span class="tag">{{ task.mainConversation.messages.length }} 条</span>
        </div>

        <div class="timeline">
          <div v-for="message in task.mainConversation.messages" :key="message.id" class="timeline__item" :class="`timeline__item--${message.role}`">
            <div class="timeline__meta">
              <strong>{{ message.authorLabel }}</strong>
              <span>{{ formatDate(message.createdAt) }}</span>
            </div>
            <p>{{ message.content }}</p>
          </div>
        </div>

        <div class="composer">
          <textarea v-model="messageText" placeholder="继续给主任务补资料或发指令..." />
          <div class="composer__actions">
            <button class="button button--ghost" @click="queue">排队插话</button>
            <button class="button button--ghost" @click="branch">显式 /btw</button>
            <button class="button button--primary" @click="send">发到主线</button>
          </div>
        </div>
      </article>

      <div class="task-side">
        <QueuePanel :queue="task.queue.filter((item: QueuedMessage) => item.status === 'queued')" @promote="promoteQueue" @cancel="cancelQueue" />

        <section class="card">
          <div class="section-heading">
            <div>
              <p class="eyebrow">旁枝</p>
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

        <ResultCardPanel :task="task" @extract="extract" />

        <section class="card">
          <div class="section-heading">
            <div>
              <p class="eyebrow">资产</p>
              <h3>现场按钮提炼，不跳后台</h3>
            </div>
          </div>
          <ul class="list">
            <li v-for="asset in task.assets" :key="asset.id">
              <strong>{{ asset.title }}</strong>
              <span>{{ asset.kind }} · {{ asset.summary }}</span>
            </li>
          </ul>
        </section>
      </div>
    </section>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import type { QueuedMessage, TaskStatus } from "@agentaction/shared";
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
