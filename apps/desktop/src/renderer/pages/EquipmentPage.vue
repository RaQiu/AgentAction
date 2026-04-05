<template>
  <section class="page">
    <header class="page__hero page__hero--compact">
      <div>
        <p class="eyebrow">装备库</p>
        <h1>Skill 与 MCP 都作为装备存入全局库存。</h1>
        <p class="page__lead">支持本地文件夹/压缩包/纯文本导入。当前先把纯文本预览做出来。</p>
      </div>
    </header>

    <section class="dispatch-grid">
      <article class="card">
        <div class="section-heading">
          <div>
            <p class="eyebrow">全局装备</p>
            <h3>统一展示为装备卡，轻量标出类型</h3>
          </div>
        </div>
        <ul class="list">
          <li v-for="item in equipment" :key="item.id">
            <strong>{{ item.name }}</strong>
            <span>{{ item.slot }} · {{ item.typeTag }} · {{ item.description }}</span>
          </li>
        </ul>
      </article>

      <article class="card">
        <div class="section-heading">
          <div>
            <p class="eyebrow">纯文本导入预览</p>
            <h3>先解析，再安装</h3>
          </div>
        </div>

        <textarea v-model="importText" class="import-area" placeholder="粘贴 skill 文本或 MCP JSON..." />
        <div class="composer__actions">
          <button class="button button--primary" @click="preview">解析预览</button>
        </div>

        <pre v-if="previewResult" class="preview-box">{{ JSON.stringify(previewResult, null, 2) }}</pre>
      </article>

      <article class="card">
        <div class="section-heading">
          <div>
            <p class="eyebrow">文件夹插件</p>
            <h3>单文件和文件夹都能作为装备载体</h3>
          </div>
        </div>
        <ul class="list">
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
