<template>
  <section class="page">
    <header class="page__hero page__hero--compact">
      <div>
        <p class="eyebrow">{{ t("equipment.title") }}</p>
        <h1>{{ t("equipment.subtitle") }}</h1>
      </div>
    </header>

    <section class="utility-layout">
      <article class="flat-panel">
        <div class="flat-panel__header">
          <p class="eyebrow">{{ t("equipment.current") }}</p>
        </div>
        <ul class="flat-list">
          <li v-for="item in equipment" :key="item.id">
            <strong>{{ item.name }}</strong>
            <span>{{ item.slot }} · {{ item.typeTag }} · {{ item.description }}</span>
          </li>
        </ul>
      </article>

      <article class="flat-panel flat-panel--narrow">
        <div class="flat-panel__header">
          <p class="eyebrow">{{ t("equipment.preview") }}</p>
        </div>
        <textarea v-model="importText" class="import-area" :placeholder="t('equipment.placeholder')" />
        <div class="composer__actions">
          <button class="button button--primary" @click="preview">{{ t("equipment.previewAction") }}</button>
        </div>
        <pre v-if="previewResult" class="preview-box">{{ JSON.stringify(previewResult, null, 2) }}</pre>
        <ul class="flat-list flat-list--compact">
          <li v-for="entry in pluginInventory.equipmentFiles" :key="entry.relativePath">
            <strong>{{ entry.name }}</strong>
            <span>{{ entry.family }} · {{ entry.containerType }}</span>
          </li>
        </ul>
      </article>
    </section>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useI18n } from "@/i18n";
import { api } from "@/api/client";
import { useWorkbenchStore } from "@/stores/workbench";

const store = useWorkbenchStore();
const { t } = useI18n();
const importText = ref(`{
  "args": [
    "-y",
    "@upstash/context7-mcp"
  ],
  "command": "npx",
  "startup_timeout_sec": 600,
  "type": "stdio"
}`);
const previewResult = ref<Record<string, unknown> | null>(null);

onMounted(() => {
  store.ensureInitialized();
});

const equipment = computed(() => store.equipment);
const pluginInventory = computed(() => store.pluginInventory);

async function preview() {
  previewResult.value = await api.previewImport(importText.value);
}
</script>
