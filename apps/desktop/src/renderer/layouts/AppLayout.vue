<template>
  <div class="shell">
    <aside class="shell__sidebar">
      <div class="brand brand--stacked">
        <div class="brand__crest">
          <div class="brand__badge">AA</div>
          <span class="brand__signal"></span>
        </div>
        <div class="brand__copy">
          <div class="brand__title">{{ t("app.name") }}</div>
          <div class="brand__subtitle">{{ t("app.subtitle") }}</div>
          <p class="brand__summary">{{ t("app.summary") }}</p>
        </div>
      </div>

      <section class="sidebar-cluster">
        <div class="sidebar-cluster__header">
          <p class="eyebrow">{{ t("shell.status") }}</p>
          <span class="tag tag--live">{{ socketConnected ? t("shell.connected") : t("shell.connecting") }}</span>
        </div>
        <div class="sidebar-metrics">
          <article class="sidebar-metric">
            <strong>{{ tasks.length }}</strong>
            <span>{{ t("shell.tasks") }}</span>
          </article>
          <article class="sidebar-metric">
            <strong>{{ roles.length }}</strong>
            <span>{{ t("shell.roles") }}</span>
          </article>
          <article class="sidebar-metric">
            <strong>{{ activeRuntimeName }}</strong>
            <span>{{ t("shell.defaultRuntime") }}</span>
          </article>
        </div>
      </section>

      <nav class="nav">
        <RouterLink to="/" class="nav__item">{{ t("nav.dashboard") }}</RouterLink>
        <RouterLink to="/roles" class="nav__item">{{ t("nav.roles") }}</RouterLink>
        <RouterLink to="/equipment" class="nav__item">{{ t("nav.equipment") }}</RouterLink>
        <RouterLink to="/runtimes" class="nav__item">{{ t("nav.runtimes") }}</RouterLink>
        <RouterLink to="/assets" class="nav__item">{{ t("nav.assets") }}</RouterLink>
        <RouterLink to="/settings" class="nav__item">{{ t("nav.settings") }}</RouterLink>
      </nav>

      <div class="sidebar__footer">
        <p>{{ t("shell.footer", { runtime: activeRuntimeName }) }}</p>
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
import { useI18n } from "@/i18n";
import { useWorkbenchStore } from "@/stores/workbench";

const store = useWorkbenchStore();
const { t, runtimeField } = useI18n();

onMounted(() => {
  store.ensureInitialized();
});

const tasks = computed(() => store.tasks);
const roles = computed(() => store.roles);
const socketConnected = computed(() => store.socketConnected);
const activeRuntimeName = computed(() => {
  const runtime = store.runtimes.find((item) => item.id === store.settings?.defaultRuntimeId);
  return runtime ? runtimeField(runtime.id, "name", runtime.name) : "—";
});
</script>
