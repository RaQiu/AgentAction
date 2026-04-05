<template>
  <section class="page">
    <header class="page__hero page__hero--compact">
      <div>
        <p class="eyebrow">设置</p>
        <h1>provider 抽象、代理分流和升级边界都在这里落说明。</h1>
        <p class="page__lead">
          首发优先远程模型作为后台机械工，Ollama 与 ktransformers 先作为可配置 provider 保留入口。
        </p>
      </div>
    </header>

    <section class="template-grid">
      <article v-for="provider in providers" :key="provider.id" class="card">
        <div class="section-heading">
          <div>
            <p class="eyebrow">{{ provider.kind }}</p>
            <h3>{{ provider.name }}</h3>
          </div>
          <span class="tag">{{ provider.enabled ? "启用" : "未启用" }}</span>
        </div>
        <p>{{ provider.note }}</p>
        <ul class="list">
          <li><strong>职责</strong><span>{{ provider.role }}</span></li>
          <li><strong>代理模式</strong><span>{{ provider.proxyMode }}</span></li>
        </ul>
      </article>

      <article class="card">
        <div class="section-heading">
          <div>
            <p class="eyebrow">网络策略</p>
            <h3>本地永远直连，外部 provider 按目标分流</h3>
          </div>
        </div>
        <ul class="list">
          <li><strong>本地 daemon</strong><span>不走代理，避免被梯子拦截</span></li>
          <li><strong>远程模型 / IM</strong><span>按 provider 单独配置是否走代理</span></li>
          <li><strong>升级策略</strong><span>只自动升级官方部分，用户插件保守保留</span></li>
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

const providers = computed(() => store.providers);
</script>
