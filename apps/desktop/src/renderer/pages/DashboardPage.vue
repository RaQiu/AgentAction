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
        <template v-if="latestTask">
          <div class="launch-stage__meta">
            <span class="launch-stage__pill">{{ taskRuntimeName }}</span>
            <span class="launch-stage__pill">{{ statusLabel(latestTask.status) }}</span>
          </div>

          <div v-if="taskRoles.length" class="launch-stage__roles">
            <div v-for="role in taskRoles" :key="role.id" class="launch-stage__role">
              <span class="launch-stage__avatar">{{ roleNickname(role.id, role.nickname) }}</span>
              <div>
                <strong>{{ roleDisplayName(role.id, role.displayName) }}</strong>
                <span>{{ roleStatusLabel(role.id) }}</span>
              </div>
            </div>
          </div>

          <ol class="launch-stage__timeline">
            <li class="launch-stage__step" :class="stepTone('assigned')">
              <span class="launch-stage__dot"></span>
              <div>
                <strong>{{ t("home.stepAssigned") }}</strong>
                <p>{{ latestTaskTitle }}</p>
              </div>
            </li>
            <li class="launch-stage__step" :class="stepTone('materials')">
              <span class="launch-stage__dot"></span>
              <div>
                <strong>{{ t("home.stepMaterials") }}</strong>
                <p>{{ t("home.materialCount", { count: latestTask.collectedMaterials.length }) }}</p>
              </div>
            </li>
            <li class="launch-stage__step" :class="stepTone('battle')">
              <span class="launch-stage__dot"></span>
              <div>
                <strong>{{ t("home.stepBattle") }}</strong>
                <p>{{ latestTaskSummary }}</p>
              </div>
            </li>
            <li class="launch-stage__step" :class="stepTone('deliver')">
              <span class="launch-stage__dot"></span>
              <div>
                <strong>{{ t("home.stepDeliver") }}</strong>
                <p>{{ latestTask.resultCard?.title || t("home.waitingResult") }}</p>
              </div>
            </li>
          </ol>
        </template>

        <div v-else class="launch-stage__empty">
          <strong>{{ t("home.noTask") }}</strong>
          <p>{{ t("home.noTaskDesc") }}</p>
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
const { t, templateField, runtimeField, roleDisplayName, roleNickname } = useI18n();

function statusLabel(status: TaskStatus) {
  return t(`status.${status}`);
}

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
const taskRuntimeName = computed(() => {
  const runtimeId = latestTask.value?.runtimeState?.runtimeId;
  const runtime = runtimes.value.find((item) => item.id === runtimeId);
  return runtime ? runtimeField(runtime.id, "name", runtime.name) : defaultRuntimeName.value;
});
const taskRoles = computed(() =>
  (latestTask.value?.roleSelections ?? [])
    .map((selection) => store.roles.find((role) => role.id === selection.roleId))
    .filter((role): role is NonNullable<typeof role> => Boolean(role))
);
const latestTaskSummary = computed(() => {
  const task = latestTask.value;
  if (!task) {
    return t("home.noTaskDesc");
  }
  const latestAssistant = [...task.mainConversation.messages]
    .reverse()
    .find((message) => message.role !== "user");
  return latestAssistant?.content || t("home.progressing");
});

function roleStatusLabel(roleId: string) {
  if (roleId === "role_product_xiaoce") {
    return latestTask.value?.status === "review" ? t("task.requestReview") : t("home.stepBattle");
  }
  return latestTask.value?.status === "collecting" ? t("home.stepMaterials") : t("home.running");
}

function stepTone(step: "assigned" | "materials" | "battle" | "deliver") {
  const status = latestTask.value?.status;
  if (!status) {
    return "";
  }

  if (step === "assigned") {
    return "launch-stage__step--done";
  }
  if (step === "materials") {
    return status === "collecting" ? "launch-stage__step--active" : "launch-stage__step--done";
  }
  if (step === "battle") {
    return status === "running" || status === "review" || status === "done"
      ? status === "running"
        ? "launch-stage__step--active"
        : "launch-stage__step--done"
      : "";
  }
  if (step === "deliver") {
    return status === "done"
      ? "launch-stage__step--done"
      : status === "review"
        ? "launch-stage__step--active"
        : "";
  }
  return "";
}
</script>
