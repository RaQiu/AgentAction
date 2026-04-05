<template>
  <article class="card template-card">
    <div class="template-card__header">
      <div>
        <p class="eyebrow">官方任务模板</p>
        <h3>{{ template.title }}</h3>
      </div>
      <span class="tag">只读模板</span>
    </div>

    <p class="template-card__tagline">{{ template.tagline }}</p>
    <p class="template-card__description">{{ template.description }}</p>

    <ul class="template-card__steps">
      <li v-for="step in template.scenarioSteps" :key="step">{{ step }}</li>
    </ul>

    <div class="template-card__footer">
      <span>{{ template.outcomeTitle }}</span>
      <RouterLink :to="`/templates/${template.id}`" class="button button--primary">进入编队</RouterLink>
    </div>
  </article>
</template>

<script setup lang="ts">
import type { TaskTemplatePlugin } from "@agentaction/shared";
import { RouterLink } from "vue-router";

defineProps<{
  template: TaskTemplatePlugin;
}>();
</script>
