<template>
  <section class="page page--dashboard">
    <article class="launch-hero launch-hero--single">
      <div class="launch-hero__copy launch-hero__copy--wide">
        <p class="eyebrow">{{ t("nav.dashboard") }}</p>
        <h1>{{ t("home.title") }}</h1>
        <p class="page__lead">{{ t("home.subtitle") }}</p>

        <ul class="launch-case-list">
          <li
            v-for="template in heroTemplates"
            :key="template.id"
            class="launch-case-list__item"
          >
            <span class="launch-case-list__index">{{ caseNumber(template.id) }}</span>
            <span class="launch-case-list__text">{{ templateField(template.id, "title", template.title) }}</span>
          </li>
        </ul>

        <div class="launch-hero__actions">
          <RouterLink :to="firstTemplateRoute" class="button button--primary">{{ t("home.primaryCta") }}</RouterLink>
        </div>

        <div v-if="latestTask" class="launch-hero__footnote">
          <span class="tag">{{ statusLabel(latestTask.status) }}</span>
          <span>{{ latestTaskTitle }}</span>
        </div>
      </div>
    </article>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted } from "vue";
import type { TaskStatus } from "@agentaction/shared";
import { RouterLink } from "vue-router";
import { useI18n } from "@/i18n";
import { useWorkbenchStore } from "@/stores/workbench";

const store = useWorkbenchStore();
const { t, templateField } = useI18n();

function statusLabel(status: TaskStatus) {
  return t(`status.${status}`);
}

onMounted(() => {
  store.ensureInitialized();
});

const templates = computed(() => store.templates);
const heroTemplates = computed(() => templates.value.slice(0, 4));
const tasks = computed(() => store.tasks);
const latestTask = computed(() => tasks.value[0]);
const latestTaskTitle = computed(() => {
  const task = latestTask.value;
  if (!task) {
    return t("home.noTask");
  }
  return task.templateId ? templateField(task.templateId, "title", task.title) : task.title;
});
const firstTemplateRoute = computed(() => `/templates/${templates.value[0]?.id ?? "tpl_build_feature"}`);

function caseNumber(templateId: string) {
  return heroTemplates.value.findIndex((item) => item.id === templateId) + 1;
}
</script>
