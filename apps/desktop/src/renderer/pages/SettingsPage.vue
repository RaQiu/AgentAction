<template>
  <section class="page">
    <header class="page__hero page__hero--compact">
      <div>
        <p class="eyebrow">{{ t("settings.title") }}</p>
        <h1>{{ t("settings.title") }}</h1>
        <p class="page__lead">{{ t("settings.subtitle") }}</p>
      </div>
    </header>

    <section class="template-grid">
      <article class="card">
        <div class="section-heading">
          <div>
            <p class="eyebrow">{{ t("settings.language") }}</p>
            <h3>{{ t("settings.language") }}</h3>
          </div>
        </div>
        <p class="muted">{{ t("settings.languageDesc") }}</p>
        <div class="composer__actions">
          <button class="button button--ghost" @click="shell.setLocale('zh-CN')">中文</button>
          <button class="button button--ghost" @click="shell.setLocale('en-US')">English</button>
        </div>
      </article>

      <article class="card">
        <div class="section-heading">
          <div>
            <p class="eyebrow">{{ t("settings.onboarding") }}</p>
            <h3>{{ t("settings.onboarding") }}</h3>
          </div>
        </div>
        <p class="muted">{{ t("settings.onboardingDesc") }}</p>
        <div class="composer__actions">
          <button class="button button--primary" @click="shell.resetOnboarding()">
            {{ t("settings.onboardingReset") }}
          </button>
        </div>
      </article>

      <article v-for="provider in providers" :key="provider.id" class="card">
        <div class="section-heading">
          <div>
            <p class="eyebrow">{{ t("settings.providers") }}</p>
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
import { useI18n } from "@/i18n";
import { useShellStore } from "@/stores/shell";
import { useWorkbenchStore } from "@/stores/workbench";

const store = useWorkbenchStore();
const shell = useShellStore();
const { t } = useI18n();

onMounted(() => {
  store.ensureInitialized();
});

const providers = computed(() => store.providers);
</script>
