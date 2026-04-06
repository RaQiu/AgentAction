<template>
  <section class="page">
    <header class="control-hero">
      <div class="control-hero__copy">
        <p class="eyebrow">{{ t("nav.dashboard") }}</p>
        <h1>{{ t("home.title") }}</h1>
        <p class="page__lead">{{ t("home.subtitle") }}</p>
        <div class="hero-actions hero-actions--inline">
          <RouterLink :to="firstTemplateRoute" class="button button--primary">{{ t("home.primaryCta") }}</RouterLink>
        </div>
      </div>

      <div class="control-hero__board">
        <article class="control-hero__panel">
          <p class="eyebrow">{{ t("home.overview") }}</p>
          <div class="ops-grid">
            <div class="ops-cell">
              <strong>{{ tasks.length }}</strong>
              <span>任务容器</span>
            </div>
            <div class="ops-cell">
              <strong>{{ runningTasks }}</strong>
              <span>{{ t("home.running") }}</span>
            </div>
            <div class="ops-cell">
              <strong>{{ reviewTasks }}</strong>
              <span>{{ t("home.review") }}</span>
            </div>
            <div class="ops-cell">
              <strong>{{ defaultRuntimeName }}</strong>
              <span>{{ t("shell.defaultRuntime") }}</span>
            </div>
          </div>
        </article>

        <article class="control-hero__panel control-hero__panel--log">
          <p class="eyebrow">{{ t("home.defaultRuntimePanel") }}</p>
          <ul class="watch-list">
            <li>
              <span class="watch-list__call">{{ defaultRuntimeReady ? "READY" : "CHECK" }}</span>
              <strong>{{ defaultRuntimeName }}</strong>
              <span>{{ defaultRuntimeReady ? t("home.runtimeReady") : t("home.runtimePending") }}</span>
            </li>
            <li>
              <span class="watch-list__call">TASK</span>
              <strong>{{ latestTasks[0]?.templateId ? templateField(latestTasks[0].templateId, "title", latestTasks[0].title) : (latestTasks[0]?.title || t("home.noTask")) }}</strong>
              <span>{{ latestTasks[0] ? statusLabelMap[latestTasks[0].status] : t("home.noTaskDesc") }}</span>
            </li>
          </ul>
        </article>
      </div>
    </header>

    <section class="mission-section">
      <div class="section-heading section-heading--wide">
        <div>
          <p class="eyebrow">{{ t("home.templates") }}</p>
          <h3>{{ t("home.templatesSubtitle") }}</h3>
        </div>
        <span class="tag">{{ templates.length }}</span>
      </div>
      <div class="template-grid">
        <TaskTemplateCard v-for="template in templates" :key="template.id" :template="template" />
      </div>
    </section>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted } from "vue";
import type { TaskStatus } from "@agentaction/shared";
import { RouterLink } from "vue-router";
import { useI18n } from "@/i18n";
import TaskTemplateCard from "@/components/TaskTemplateCard.vue";
import { useWorkbenchStore } from "@/stores/workbench";

const store = useWorkbenchStore();
const { t, templateField, runtimeField } = useI18n();

const statusLabelMap: Record<TaskStatus, string> = {
  collecting: "收资料",
  running: "执行中",
  review: "待验收",
  done: "已完成"
};

onMounted(() => {
  store.ensureInitialized();
});

const templates = computed(() => store.templates);
const runtimes = computed(() => store.runtimes);
const tasks = computed(() => store.tasks);
const runningTasks = computed(() => tasks.value.filter((task) => task.status === "running").length);
const reviewTasks = computed(() => tasks.value.filter((task) => task.status === "review").length);
const latestTasks = computed(() => tasks.value.slice(0, 4));
const firstTemplateRoute = computed(() => `/templates/${templates.value[0]?.id ?? "tpl_build_feature"}`);
const defaultRuntimeName = computed(() => {
  const runtime = runtimes.value.find((item) => item.id === store.settings?.defaultRuntimeId);
  return runtime ? runtimeField(runtime.id, "name", runtime.name) : "—";
});
const defaultRuntimeReady = computed(() => {
  const runtime = runtimes.value.find((item) => item.id === store.settings?.defaultRuntimeId);
  return runtime?.status === "ready";
});
</script>
