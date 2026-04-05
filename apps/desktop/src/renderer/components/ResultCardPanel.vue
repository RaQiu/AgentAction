<template>
  <section v-if="task.resultCard" class="card result-card">
    <div class="result-card__header">
      <div>
        <p class="eyebrow">主结果卡</p>
        <h3>{{ task.resultCard.title }}</h3>
      </div>
      <span class="tag">附属产物 {{ task.resultCard.attachments.length }}</span>
    </div>

    <p>{{ task.resultCard.summary }}</p>

    <ul class="result-card__attachments">
      <li v-for="attachment in task.resultCard.attachments" :key="attachment.id">
        <strong>{{ attachment.title }}</strong>
        <span>{{ attachment.summary }}</span>
      </li>
    </ul>

    <div class="result-card__actions">
      <button class="button button--ghost" @click="$emit('extract', 'artifact')">提炼产物</button>
      <button class="button button--ghost" @click="$emit('extract', 'memory')">提炼记忆</button>
      <button class="button button--ghost" @click="$emit('extract', 'skill')">提炼技能</button>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { Task } from "@agentaction/shared";

defineProps<{
  task: Task;
}>();

defineEmits<{
  (event: "extract", kind: "artifact" | "memory" | "skill"): void;
}>();
</script>
