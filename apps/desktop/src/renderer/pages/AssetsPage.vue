<template>
  <section class="page">
    <header class="page__hero page__hero--compact">
      <div>
        <p class="eyebrow">{{ t("assets.title") }}</p>
        <h1>{{ t("assets.subtitle") }}</h1>
      </div>
    </header>

    <article class="flat-panel">
      <div class="flat-panel__header flat-panel__header--between">
        <p class="eyebrow">{{ t("assets.title") }}</p>
        <span class="tag">{{ filteredAssets.length }} / {{ assets.length }}</span>
      </div>
      <div class="composer__actions">
        <select v-model="taskFilter" class="select">
          <option value="">{{ t("assets.filters.tasks") }}</option>
          <option v-for="task in tasks" :key="task.id" :value="task.id">{{ task.title }}</option>
        </select>
        <select v-model="roleFilter" class="select">
          <option value="">{{ t("assets.filters.roles") }}</option>
          <option v-for="role in roles" :key="role.id" :value="role.id">{{ roleDisplayName(role.id, role.displayName) }}</option>
        </select>
        <select v-model="kindFilter" class="select">
          <option value="">{{ t("assets.filters.kinds") }}</option>
          <option value="artifact">{{ t("assets.kind.artifact") }}</option>
          <option value="memory">{{ t("assets.kind.memory") }}</option>
          <option value="skill">{{ t("assets.kind.skill") }}</option>
        </select>
      </div>
      <ul class="flat-list">
        <li v-for="asset in filteredAssets" :key="asset.id">
          <strong>{{ asset.title }}</strong>
          <span>{{ asset.kind }} · {{ asset.summary }}</span>
        </li>
      </ul>
    </article>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useI18n } from "@/i18n";
import { useWorkbenchStore } from "@/stores/workbench";

const store = useWorkbenchStore();
const { t, roleDisplayName } = useI18n();
const taskFilter = ref("");
const roleFilter = ref("");
const kindFilter = ref("");

onMounted(() => {
  store.ensureInitialized();
});

const assets = computed(() => store.assets);
const tasks = computed(() => store.tasks);
const roles = computed(() => store.roles);
const filteredAssets = computed(() =>
  assets.value.filter((asset) => {
    const taskOk = !taskFilter.value || asset.taskId === taskFilter.value;
    const roleOk = !roleFilter.value || asset.roleId === roleFilter.value;
    const kindOk = !kindFilter.value || asset.kind === kindFilter.value;
    return taskOk && roleOk && kindOk;
  })
);
</script>
