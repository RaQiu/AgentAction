<template>
  <section v-if="task.resultCard" class="result-card">
    <div class="result-card__header">
      <div>
        <p class="eyebrow">{{ t("result.card") }}</p>
        <h3>{{ task.resultCard.title }}</h3>
      </div>
      <span class="tag">{{ t("result.attachments") }} {{ task.resultCard.attachments.length }}</span>
    </div>

    <p>{{ task.resultCard.summary }}</p>

    <ul class="result-card__attachments">
      <li v-for="attachment in task.resultCard.attachments" :key="attachment.id">
        <strong>{{ attachment.title }}</strong>
        <span>{{ attachment.summary }}</span>
      </li>
    </ul>

    <div class="result-card__actions">
      <button class="button button--ghost" @click="$emit('extract', 'artifact')">{{ t("result.extractArtifact") }}</button>
      <button class="button button--ghost" @click="$emit('extract', 'memory')">{{ t("result.extractMemory") }}</button>
      <button class="button button--ghost" @click="$emit('extract', 'skill')">{{ t("result.extractSkill") }}</button>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { Task } from "@agentaction/shared";
import { useI18n } from "@/i18n";

defineProps<{
  task: Task;
}>();

defineEmits<{
  (event: "extract", kind: "artifact" | "memory" | "skill"): void;
}>();

const { t } = useI18n();
</script>
