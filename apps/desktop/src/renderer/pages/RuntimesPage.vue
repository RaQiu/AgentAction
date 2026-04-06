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
          <li v-if="runtime.checkSummary"><strong>检查摘要</strong><span>{{ runtime.checkSummary }}</span></li>
          <li v-if="runtime.detectedCommandPath"><strong>命令路径</strong><span>{{ runtime.detectedCommandPath }}</span></li>
          <li v-if="runtime.detectedVersion"><strong>命令输出</strong><span>{{ runtime.detectedVersion }}</span></li>
          <li v-if="runtime.githubUrl"><strong>GitHub</strong><a :href="runtime.githubUrl" target="_blank" rel="noreferrer">{{ runtime.githubUrl }}</a></li>
          <li v-if="runtime.pathHint"><strong>接入路径</strong><span>{{ runtime.pathHint }}</span></li>
          <li><strong>能力</strong><span>{{ runtime.capabilities.join("、") }}</span></li>
        </ul>
        <div class="composer__actions">
          <button class="button button--ghost" @click="check(runtime.id)">真实检查</button>
          <button v-if="runtime.installMode === 'clone' || runtime.supportsCloneInstall" class="button button--primary" @click="installClone(runtime.id)">
            一键 clone 接入
          </button>
          <a v-if="runtime.githubUrl" class="button button--ghost" :href="runtime.githubUrl" target="_blank" rel="noreferrer">
            打开 GitHub
          </a>
        </div>
        <ul v-if="runtime.checkDetails?.length" class="list">
          <li v-for="detail in runtime.checkDetails" :key="detail">
            <span>{{ detail }}</span>
          </li>
        </ul>
        <p v-if="runtime.installLabel" class="muted">{{ runtime.installLabel }}</p>
      </article>

      <article class="card">
        <div class="section-heading">
          <div>
            <p class="eyebrow">运行时插件目录</p>
            <h3>clone / hack 不进装备栏，只在平台接入层出现</h3>
          </div>
        </div>
        <ul class="list">
          <li v-for="entry in pluginInventory.runtimeFiles" :key="entry.relativePath">
            <strong>{{ entry.name }}</strong>
            <span>{{ entry.family }} · {{ entry.containerType }}</span>
          </li>
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
const pluginInventory = computed(() => store.pluginInventory);

async function installClone(runtimeId: string) {
  await store.installRuntimeFromGitHub(runtimeId);
}

async function check(runtimeId: string) {
  await store.checkRuntime(runtimeId);
}
</script>
