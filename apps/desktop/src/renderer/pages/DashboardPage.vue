<template>
  <section class="page page--dashboard">
    <article class="launch-hero">
      <div class="launch-hero__copy">
        <p class="eyebrow">{{ t("nav.dashboard") }}</p>
        <h1>{{ t("home.title") }}</h1>
        <p class="page__lead">{{ t("home.subtitle") }}</p>
        <div class="launch-hero__actions">
          <RouterLink :to="firstTemplateRoute" class="button button--primary">{{ t("home.primaryCta") }}</RouterLink>
        </div>
      </div>

      <div class="launch-hero__stage">
        <div class="launch-stage__meta">
          <span class="launch-stage__pill">{{ defaultRuntimeName }}</span>
          <span class="launch-stage__pill">{{ latestTask ? statusLabelMap[latestTask.status] : t("home.noTask") }}</span>
        </div>

        <div class="launch-stage__roles">
          <div class="launch-stage__role">
            <span class="launch-stage__avatar">🐎</span>
            <div>
              <strong>产品经理</strong>
              <span>{{ t("task.requestReview") }}</span>
            </div>
          </div>
          <div class="launch-stage__role">
            <span class="launch-stage__avatar">🐮</span>
            <div>
              <strong>程序员</strong>
              <span>{{ t("home.running") }}</span>
            </div>
          </div>
        </div>

        <ol class="launch-stage__timeline">
          <li class="launch-stage__step launch-stage__step--done">
            <span class="launch-stage__dot"></span>
            <div>
              <strong>接到任务</strong>
              <p>{{ latestTaskTitle }}</p>
            </div>
          </li>
          <li class="launch-stage__step launch-stage__step--done">
            <span class="launch-stage__dot"></span>
            <div>
              <strong>补齐资料</strong>
              <p>{{ latestTask?.collectedMaterials?.length || 0 }} 项已记录</p>
            </div>
          </li>
          <li class="launch-stage__step launch-stage__step--active">
            <span class="launch-stage__dot"></span>
            <div>
              <strong>结对 battle</strong>
              <p>{{ latestTask?.runtimeState?.pendingFinish?.summary || "当前正在推进" }}</p>
            </div>
          </li>
          <li class="launch-stage__step">
            <span class="launch-stage__dot"></span>
            <div>
              <strong>准备交付</strong>
              <p>{{ latestTask?.resultCard?.title || "等待结果" }}</p>
            </div>
          </li>
        </ol>
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
const latestTask = computed(() => tasks.value[0]);
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
</script>
