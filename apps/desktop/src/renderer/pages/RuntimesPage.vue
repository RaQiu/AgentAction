<template>
  <section class="page">
    <header class="page__hero page__hero--compact">
      <div>
        <p class="eyebrow">运行时接入</p>
        <h1>已有安装 + hack 注入为主，clone 接入为补充。</h1>
        <p class="page__lead">clone 和 hack 不是装备，它们属于平台的运行时插件。</p>
      </div>
    </header>

    <section class="template-grid">
      <article v-for="runtime in runtimes" :key="runtime.id" class="card">
        <div class="section-heading">
          <div>
            <p class="eyebrow">{{ runtime.pluginKind }}</p>
            <h3>{{ runtime.name }}</h3>
          </div>
          <span class="tag">{{ runtime.status }}</span>
        </div>
        <p>{{ runtime.description }}</p>
        <ul class="list">
          <li><strong>目标运行时</strong><span>{{ runtime.targetRuntime }}</span></li>
          <li><strong>来源</strong><span>{{ runtime.source }}</span></li>
          <li><strong>能力</strong><span>{{ runtime.capabilities.join("、") }}</span></li>
        </ul>
      </article>
    </section>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted } from "vue";
import { useWorkbenchStore } from "@/stores/workbench";

const store = useWorkbenchStore();

onMounted(() => {
  store.ensureInitialized();
});

const runtimes = computed(() => store.runtimes);
</script>
