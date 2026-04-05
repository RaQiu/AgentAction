<template>
  <section class="page">
    <header class="page__hero page__hero--compact">
      <div>
        <p class="eyebrow">结果与资产</p>
        <h1>主视角按任务，但也能按角色和类型继续找回资产。</h1>
      </div>
    </header>

    <article class="card">
      <div class="section-heading">
        <div>
          <p class="eyebrow">资产索引</p>
          <h3>首发先做统一索引与任务视角</h3>
        </div>
        <span class="tag">{{ assets.length }} 项</span>
      </div>
      <ul class="list">
        <li v-for="asset in assets" :key="asset.id">
          <strong>{{ asset.title }}</strong>
          <span>{{ asset.kind }} · {{ asset.summary }}</span>
        </li>
      </ul>
    </article>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted } from "vue";
import { useWorkbenchStore } from "@/stores/workbench";

const store = useWorkbenchStore();

onMounted(() => {
  store.ensureInitialized();
});

const assets = computed(() => store.assets);
</script>
