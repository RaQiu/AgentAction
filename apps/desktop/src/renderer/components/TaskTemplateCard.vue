<template>
  <article class="mission-poster">
    <div class="mission-poster__frame">
      <div class="mission-poster__topline">
        <p class="eyebrow">官方任务海报</p>
        <span class="tag">只读模板</span>
      </div>

      <h3>{{ template.title }}</h3>
      <p class="mission-poster__tagline">{{ template.tagline }}</p>

      <ul class="mission-poster__steps">
        <li v-for="step in template.scenarioSteps" :key="step">{{ step }}</li>
      </ul>

      <div class="mission-poster__footer">
        <div>
          <span class="mission-poster__label">预期主结果</span>
          <strong>{{ template.outcomeTitle }}</strong>
        </div>
        <RouterLink :to="`/templates/${template.id}`" class="button button--primary">进入编队</RouterLink>
      </div>
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
