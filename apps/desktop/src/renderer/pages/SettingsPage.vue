<template>
  <section class="page">
    <header class="page__hero page__hero--compact">
      <div>
        <p class="eyebrow">{{ t("settings.title") }}</p>
        <h1>{{ t("settings.title") }}</h1>
        <p class="page__lead">{{ t("settings.subtitle") }}</p>
      </div>
    </header>

    <section class="utility-layout">
      <article class="flat-panel">
        <ul class="flat-list">
          <li class="flat-list__row">
            <div>
              <strong>{{ t("settings.language") }}</strong>
              <span>{{ t("settings.languageDesc") }}</span>
            </div>
            <div class="flat-list__actions">
              <button class="button button--ghost" @click="shell.setLocale('zh-CN')">中文</button>
              <button class="button button--ghost" @click="shell.setLocale('en-US')">English</button>
            </div>
          </li>
          <li class="flat-list__row">
            <div>
              <strong>{{ t("settings.onboarding") }}</strong>
              <span>{{ t("settings.onboardingDesc") }}</span>
            </div>
            <div class="flat-list__actions">
              <button class="button button--primary" @click="shell.resetOnboarding()">
                {{ t("settings.onboardingReset") }}
              </button>
            </div>
          </li>
          <li v-for="provider in providers" :key="provider.id" class="flat-list__row">
            <div>
              <strong>{{ provider.name }}</strong>
              <span>{{ provider.note }}</span>
            </div>
            <div class="flat-meta">
              <span>{{ provider.role }}</span>
              <span>{{ provider.proxyMode }}</span>
              <span>{{ provider.enabled ? "启用" : "未启用" }}</span>
            </div>
          </li>
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
