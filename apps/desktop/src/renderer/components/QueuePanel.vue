<template>
  <section class="queue-panel">
    <div class="section-heading">
      <div>
        <p class="eyebrow">插话队列</p>
        <h3>默认先排队，显式 /btw 才分叉</h3>
      </div>
      <span class="tag">{{ queue.length }} 条</span>
    </div>

    <ul v-if="queue.length" class="queue-panel__list">
      <li v-for="item in queue" :key="item.id">
        <div>
          <strong>{{ item.from }}</strong>
          <p>{{ item.content }}</p>
        </div>
        <div class="queue-panel__actions">
          <button class="button button--ghost" @click="$emit('promote', item.id)">转 /btw</button>
          <button class="button button--ghost" @click="$emit('cancel', item.id)">取消</button>
        </div>
      </li>
    </ul>

    <p v-else class="muted">当前没有排队消息。</p>
  </section>
</template>

<script setup lang="ts">
import type { QueuedMessage } from "@agentaction/shared";

defineProps<{
  queue: QueuedMessage[];
}>();

defineEmits<{
  (event: "promote", id: string): void;
  (event: "cancel", id: string): void;
}>();
</script>
