<template>
  <section class="page">
    <header class="control-hero">
      <div class="control-hero__copy">
        <p class="eyebrow">{{ t("nav.dashboard") }}</p>
        <h1>{{ t("home.title") }}</h1>
        <p class="page__lead">{{ t("home.subtitle") }}</p>
        <div class="hero-actions hero-actions--inline">
          <RouterLink to="/runtimes" class="button button--primary">{{ t("home.primaryCta") }}</RouterLink>
          <RouterLink to="/roles" class="button button--ghost">{{ t("home.secondaryCta") }}</RouterLink>
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

    <section class="dashboard-grid">
      <section class="mission-section">
      <div class="section-heading section-heading--wide">
        <div>
          <p class="eyebrow">{{ t("home.roles") }}</p>
          <h3>{{ t("home.rolesSubtitle") }}</h3>
        </div>
        <span class="tag tag--live">{{ defaultRuntimeReady ? t("home.runtimeReady") : t("home.runtimePending") }}</span>
      </div>
      <div class="roster-grid">
        <RoleCard v-for="role in heroRoles" :key="role.id" :role="role" />
      </div>
      </section>

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
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted } from "vue";
import type { TaskStatus } from "@agentaction/shared";
import { RouterLink } from "vue-router";
import { useI18n } from "@/i18n";
import RoleCard from "@/components/RoleCard.vue";
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
const roles = computed(() => store.roles);
const runtimes = computed(() => store.runtimes);
const tasks = computed(() => store.tasks);
const heroRoles = computed(() => roles.value.slice(0, 4));
const runningTasks = computed(() => tasks.value.filter((task) => task.status === "running").length);
const reviewTasks = computed(() => tasks.value.filter((task) => task.status === "review").length);
const latestTasks = computed(() => tasks.value.slice(0, 4));
const defaultRuntimeName = computed(() => {
  const runtime = runtimes.value.find((item) => item.id === store.settings?.defaultRuntimeId);
  return runtime ? runtimeField(runtime.id, "name", runtime.name) : "—";
});
const defaultRuntimeReady = computed(() => {
  const runtime = runtimes.value.find((item) => item.id === store.settings?.defaultRuntimeId);
  return runtime?.status === "ready";
});
</script>
