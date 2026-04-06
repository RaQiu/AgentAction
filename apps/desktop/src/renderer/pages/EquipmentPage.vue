<template>
  <section class="page">
    <header class="page__hero page__hero--compact">
      <div>
        <p class="eyebrow">装备库</p>
        <h1>当前可用的配置与导入入口</h1>
      </div>
    </header>

    <section class="utility-layout">
      <article class="flat-panel">
        <div class="flat-panel__header">
          <p class="eyebrow">当前配置</p>
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
          <p class="eyebrow">导入预览</p>
        </div>
        <textarea v-model="importText" class="import-area" placeholder="粘贴 skill 文本或 MCP JSON..." />
        <div class="composer__actions">
          <button class="button button--primary" @click="preview">解析预览</button>
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
import { api } from "@/api/client";
import { useWorkbenchStore } from "@/stores/workbench";

const store = useWorkbenchStore();
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
