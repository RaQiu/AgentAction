<template>
  <section class="queue-panel">
    <div class="section-heading">
      <div>
        <p class="eyebrow">{{ t("queue.title") }}</p>
        <h3>{{ t("queue.subtitle") }}</h3>
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
          <button class="button button--ghost" @click="$emit('promote', item.id)">{{ t("queue.promote") }}</button>
          <button class="button button--ghost" @click="$emit('cancel', item.id)">{{ t("queue.cancel") }}</button>
        </div>
      </li>
    </ul>

    <p v-else class="muted">{{ t("queue.empty") }}</p>
  </section>
</template>

<script setup lang="ts">
import type { QueuedMessage } from "@agentaction/shared";
import { useI18n } from "@/i18n";

defineProps<{
  queue: QueuedMessage[];
}>();

defineEmits<{
  (event: "promote", id: string): void;
  (event: "cancel", id: string): void;
}>();

const { t } = useI18n();
</script>
