<template>
  <div class="shell">
    <aside class="shell__sidebar">
      <div class="brand brand--stacked">
        <div class="brand__crest">
          <div class="brand__badge">AA</div>
          <span class="brand__signal"></span>
        </div>
        <div class="brand__copy">
          <div class="brand__title">AgentAction</div>
          <div class="brand__subtitle">多智能体任务工作台</div>
          <p class="brand__summary">角色、任务、运行时和结果集中展示。</p>
        </div>
      </div>

      <section class="sidebar-cluster">
        <div class="sidebar-cluster__header">
          <p class="eyebrow">当前状态</p>
          <span class="tag tag--live">{{ socketConnected ? "已连上 daemon" : "连接中" }}</span>
        </div>
        <div class="sidebar-metrics">
          <article class="sidebar-metric">
            <strong>{{ tasks.length }}</strong>
            <span>任务容器</span>
          </article>
          <article class="sidebar-metric">
            <strong>{{ roles.length }}</strong>
            <span>角色</span>
          </article>
          <article class="sidebar-metric">
            <strong>{{ activeRuntimeName }}</strong>
            <span>默认智能体</span>
          </article>
        </div>
      </section>

      <nav class="nav">
        <RouterLink to="/" class="nav__item">任务大厅</RouterLink>
        <RouterLink to="/roles" class="nav__item">角色库</RouterLink>
        <RouterLink to="/equipment" class="nav__item">装备库</RouterLink>
        <RouterLink to="/runtimes" class="nav__item">运行时</RouterLink>
        <RouterLink to="/assets" class="nav__item">结果与资产</RouterLink>
        <RouterLink to="/settings" class="nav__item">设置</RouterLink>
      </nav>

      <div class="sidebar__footer">
        <p>默认智能体：{{ activeRuntimeName }}</p>
      </div>
    </aside>

    <main class="shell__main">
      <div class="shell__glow shell__glow--north"></div>
      <div class="shell__glow shell__glow--east"></div>
      <slot />
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from "vue";
import { RouterLink } from "vue-router";
import { useWorkbenchStore } from "@/stores/workbench";

const store = useWorkbenchStore();

onMounted(() => {
  store.ensureInitialized();
});

const tasks = computed(() => store.tasks);
const roles = computed(() => store.roles);
const socketConnected = computed(() => store.socketConnected);
const activeRuntimeName = computed(() => {
  const runtime = store.runtimes.find((item) => item.id === store.settings?.defaultRuntimeId);
  return runtime?.name ?? "未设";
});
</script>
