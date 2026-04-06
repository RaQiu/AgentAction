<template>
  <section class="page">
    <header class="control-hero">
      <div class="control-hero__copy">
        <p class="eyebrow">任务大厅</p>
        <h1>角色、任务和默认智能体都在这一页。</h1>
        <p class="page__lead">
          先看当前任务和角色状态，再进入编队和执行。首页重点是可读性和操作效率。
        </p>
        <div class="hero-actions hero-actions--inline">
          <RouterLink to="/runtimes" class="button button--primary">检查默认智能体</RouterLink>
          <RouterLink to="/roles" class="button button--ghost">查看角色编队</RouterLink>
        </div>
      </div>

      <div class="control-hero__board">
        <article class="control-hero__panel">
          <p class="eyebrow">运行概览</p>
          <div class="ops-grid">
            <div class="ops-cell">
              <strong>{{ tasks.length }}</strong>
              <span>任务容器</span>
            </div>
            <div class="ops-cell">
              <strong>{{ runningTasks }}</strong>
              <span>执行中</span>
            </div>
            <div class="ops-cell">
              <strong>{{ reviewTasks }}</strong>
              <span>待验收</span>
            </div>
            <div class="ops-cell">
              <strong>{{ defaultRuntimeName }}</strong>
              <span>默认智能体</span>
            </div>
          </div>
        </article>

        <article class="control-hero__panel control-hero__panel--log">
          <p class="eyebrow">默认智能体</p>
          <ul class="watch-list">
            <li>
              <span class="watch-list__call">{{ defaultRuntimeReady ? "READY" : "CHECK" }}</span>
              <strong>{{ defaultRuntimeName }}</strong>
              <span>{{ defaultRuntimeReady ? "已通过真实检查" : "等待运行时检查" }}</span>
            </li>
            <li>
              <span class="watch-list__call">TASK</span>
              <strong>{{ latestTasks[0]?.title || "暂无任务" }}</strong>
              <span>{{ latestTasks[0] ? statusLabelMap[latestTasks[0].status] : "创建任务后会显示在这里" }}</span>
            </li>
          </ul>
        </article>
      </div>
    </header>

    <section class="dashboard-grid">
      <section class="mission-section">
      <div class="section-heading section-heading--wide">
        <div>
          <p class="eyebrow">角色</p>
          <h3>常用角色入口</h3>
        </div>
        <span class="tag tag--live">{{ defaultRuntimeReady ? "Codex 已在线" : "Codex 待检查" }}</span>
      </div>
      <div class="roster-grid">
        <RoleCard v-for="role in heroRoles" :key="role.id" :role="role" />
      </div>
      </section>

      <section class="mission-section">
      <div class="section-heading section-heading--wide">
        <div>
          <p class="eyebrow">任务模板</p>
          <h3>先选任务，再进入轻量编队</h3>
        </div>
        <span class="tag">{{ templates.length }} 张任务海报</span>
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
import RoleCard from "@/components/RoleCard.vue";
import TaskTemplateCard from "@/components/TaskTemplateCard.vue";
import { useWorkbenchStore } from "@/stores/workbench";

const store = useWorkbenchStore();

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
  return runtime?.name ?? "未设";
});
const defaultRuntimeReady = computed(() => {
  const runtime = runtimes.value.find((item) => item.id === store.settings?.defaultRuntimeId);
  return runtime?.status === "ready";
});
</script>
