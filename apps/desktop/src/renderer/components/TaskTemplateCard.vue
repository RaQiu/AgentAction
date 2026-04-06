<template>
  <article class="mission-poster">
    <div class="mission-poster__frame">
      <div class="mission-poster__topline">
        <p class="eyebrow">{{ t("home.templates") }}</p>
        <span class="tag">{{ t("dispatch.recommendedOnly") }}</span>
      </div>

      <h3>{{ templateField(template.id, "title", template.title) }}</h3>
      <p class="mission-poster__tagline">{{ templateField(template.id, "tagline", template.tagline) }}</p>

      <ul class="mission-poster__steps">
        <li v-for="step in templateField(template.id, 'scenarioSteps', template.scenarioSteps)" :key="step">{{ step }}</li>
      </ul>

      <div class="mission-poster__footer">
        <div>
          <span class="mission-poster__label">{{ t("result.card") }}</span>
          <strong>{{ templateField(template.id, "outcomeTitle", template.outcomeTitle) }}</strong>
        </div>
        <RouterLink :to="`/templates/${template.id}`" class="button button--primary">{{ t("dispatch.start") }}</RouterLink>
      </div>
    </div>
  </article>
</template>

<script setup lang="ts">
import type { TaskTemplatePlugin } from "@agentaction/shared";
import { RouterLink } from "vue-router";
import { useI18n } from "@/i18n";

defineProps<{
  template: TaskTemplatePlugin;
}>();

const { t, templateField } = useI18n();
</script>
