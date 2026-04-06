<template>
  <section class="page">
    <header class="dashboard-header">
      <div>
        <p class="eyebrow">{{ t("nav.dashboard") }}</p>
        <h1>{{ t("home.title") }}</h1>
        <p class="page__lead">{{ t("home.subtitle") }}</p>
      </div>
      <RouterLink :to="firstTemplateRoute" class="button button--primary">{{ t("home.primaryCta") }}</RouterLink>
    </header>

    <section class="dashboard-workbench">
      <article class="dashboard-panel dashboard-panel--summary">
        <div class="section-heading">
          <div>
            <p class="eyebrow">{{ t("home.overview") }}</p>
            <h3>{{ latestTaskTitle }}</h3>
          </div>
          <span class="dashboard-status">{{ latestTask ? statusLabelMap[latestTask.status] : t("home.noTask") }}</span>
        </div>

        <dl class="dashboard-stats">
          <div>
            <dt>{{ t("shell.tasks") }}</dt>
            <dd>{{ tasks.length }}</dd>
          </div>
          <div>
            <dt>{{ t("home.running") }}</dt>
            <dd>{{ runningTasks }}</dd>
          </div>
          <div>
            <dt>{{ t("home.review") }}</dt>
            <dd>{{ reviewTasks }}</dd>
          </div>
        </dl>

        <ul class="dashboard-summary-list">
          <li>
            <strong>{{ t("shell.defaultRuntime") }}</strong>
            <span>{{ defaultRuntimeName }}</span>
          </li>
          <li>
            <strong>{{ t("task.contractTitle") }}</strong>
            <span>{{ latestTask?.runtimeState?.pendingFinish?.resultTitle || "—" }}</span>
          </li>
        </ul>
      </article>

      <article class="dashboard-panel dashboard-panel--focus">
        <div class="section-heading">
          <div>
            <p class="eyebrow">Battle</p>
            <h3>{{ latestTaskTitle }}</h3>
          </div>
          <span class="focus-badge">{{ t("home.runtimeReady") }}</span>
        </div>

        <div class="focus-roles">
          <div class="focus-role">
            <span class="focus-role__avatar">🐎</span>
            <div>
              <strong>产品经理</strong>
              <span>{{ t("task.requestReview") }}</span>
            </div>
          </div>
          <div class="focus-role">
            <span class="focus-role__avatar">🐮</span>
            <div>
              <strong>程序员</strong>
              <span>{{ t("home.running") }}</span>
            </div>
          </div>
        </div>

        <ol class="battle-timeline">
          <li class="battle-timeline__item battle-timeline__item--done">
            <span class="battle-timeline__dot"></span>
            <div>
              <strong>接到任务</strong>
              <p>{{ latestTaskTitle }}</p>
            </div>
          </li>
          <li class="battle-timeline__item battle-timeline__item--done">
            <span class="battle-timeline__dot"></span>
            <div>
              <strong>补齐资料</strong>
              <p>{{ latestTask?.collectedMaterials?.length || 0 }} 项已记录</p>
            </div>
          </li>
          <li class="battle-timeline__item battle-timeline__item--active">
            <span class="battle-timeline__dot"></span>
            <div>
              <strong>结对 battle</strong>
              <p>{{ latestTask?.runtimeState?.pendingFinish?.summary || "当前正在推进" }}</p>
            </div>
          </li>
          <li class="battle-timeline__item">
            <span class="battle-timeline__dot"></span>
            <div>
              <strong>准备交付</strong>
              <p>{{ latestTask?.resultCard?.title || "等待结果" }}</p>
            </div>
          </li>
        </ol>
      </article>

      <div class="dashboard-side">
        <article class="dashboard-note">
          <p class="eyebrow">{{ t("home.defaultRuntimePanel") }}</p>
          <strong>{{ defaultRuntimeName }}</strong>
          <span>{{ defaultRuntimeReady ? t("home.runtimeReady") : t("home.runtimePending") }}</span>
        </article>
        <article class="dashboard-note">
          <p class="eyebrow">{{ t("result.card") }}</p>
          <strong>{{ latestTask?.resultCard?.title || "等待交付" }}</strong>
          <span>{{ latestTask?.resultCard?.summary || "任务完成后会在这里出现。" }}</span>
        </article>
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
const latestTask = computed(() => latestTasks.value[0]);
const latestTaskTitle = computed(() => {
  const task = latestTask.value;
  if (!task) {
    return t("home.noTask");
  }
  return task.templateId ? templateField(task.templateId, "title", task.title) : task.title;
});
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
