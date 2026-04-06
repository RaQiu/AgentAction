<template>
  <div class="shell">
    <aside class="shell__sidebar">
      <div class="brand brand--stacked">
        <div class="brand__crest">
          <div class="brand__badge">AA</div>
        </div>
        <div class="brand__copy">
          <div class="brand__title">{{ t("app.name") }}</div>
          <div class="brand__subtitle">{{ t("app.subtitle") }}</div>
        </div>
      </div>

      <nav class="nav">
        <RouterLink to="/" class="nav__item">{{ t("nav.dashboard") }}</RouterLink>
        <RouterLink to="/roles" class="nav__item">{{ t("nav.roles") }}</RouterLink>
        <RouterLink to="/equipment" class="nav__item">{{ t("nav.equipment") }}</RouterLink>
        <RouterLink to="/runtimes" class="nav__item">{{ t("nav.runtimes") }}</RouterLink>
        <RouterLink to="/assets" class="nav__item">{{ t("nav.assets") }}</RouterLink>
        <RouterLink to="/settings" class="nav__item">{{ t("nav.settings") }}</RouterLink>
      </nav>

      <div class="sidebar__footer">
        <div class="sidebar__status">
          <span class="sidebar__status-dot" :class="{ 'sidebar__status-dot--on': socketConnected }"></span>
          <span>{{ socketConnected ? t("shell.connected") : t("shell.connecting") }}</span>
        </div>
        <p>{{ t("shell.footer", { runtime: activeRuntimeName }) }}</p>
      </div>
    </aside>

    <main class="shell__main">
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

const socketConnected = computed(() => store.socketConnected);
const activeRuntimeName = computed(() => {
  const runtime = store.runtimes.find((item) => item.id === store.settings?.defaultRuntimeId);
  return runtime ? runtimeField(runtime.id, "name", runtime.name) : "—";
});
</script>
