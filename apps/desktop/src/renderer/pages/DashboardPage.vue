<template>
  <section class="page">
    <header class="control-hero">
      <div class="control-hero__copy">
        <p class="eyebrow">总控大屏</p>
        <h1>派遣角色、盯住任务、让默认智能体在后台持续接管。</h1>
        <p class="page__lead">
          AgentAction 不是普通问答页，而是一块正在值班的多智能体控制台。你先看到谁在值班、哪些任务在推进、哪个结果准备收束。
        </p>
        <div class="hero-actions hero-actions--inline">
          <RouterLink to="/runtimes" class="button button--primary">检查默认智能体</RouterLink>
          <RouterLink to="/roles" class="button button--ghost">查看角色编队</RouterLink>
        </div>
      </div>

      <div class="control-hero__board">
        <article class="control-hero__panel">
          <p class="eyebrow">值班态势</p>
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
          <p class="eyebrow">当前值班</p>
          <ul class="watch-list">
            <li v-for="role in heroRoles" :key="role.id">
              <span class="watch-list__call">{{ role.nickname }}</span>
              <strong>{{ role.displayName }}</strong>
              <span>{{ role.persona }}</span>
            </li>
          </ul>
        </article>
      </div>
    </header>

    <section class="mission-section">
      <div class="section-heading section-heading--wide">
        <div>
          <p class="eyebrow">角色值班带</p>
          <h3>这些角色不是头像列表，而是当前可派遣的值班席位。</h3>
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
          <p class="eyebrow">派遣任务海报</p>
          <h3>先挑要完成的结果，再进轻量编队卡，不是先学命令。</h3>
        </div>
        <span class="tag">{{ templates.length }} 张任务海报</span>
      </div>
      <div class="template-grid">
        <TaskTemplateCard v-for="template in templates" :key="template.id" :template="template" />
      </div>
    </section>

    <section class="mission-section mission-section--summary">
      <article class="summary-rail">
        <p class="eyebrow">运行时总览</p>
        <ul class="summary-rail__list">
          <li v-for="runtime in runtimes" :key="runtime.id">
            <strong>{{ runtime.name }}</strong>
            <span>{{ runtime.checkSummary || runtime.status }}</span>
          </li>
        </ul>
      </article>
      <article class="summary-rail">
        <p class="eyebrow">最新任务</p>
        <ul class="summary-rail__list">
          <li v-for="task in latestTasks" :key="task.id">
            <strong>{{ task.title }}</strong>
            <span>{{ statusLabelMap[task.status] }}</span>
          </li>
        </ul>
      </article>
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
