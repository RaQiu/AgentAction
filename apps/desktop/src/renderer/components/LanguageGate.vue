<template>
  <section class="gate-shell">
    <article class="gate-panel">
      <p class="eyebrow">{{ t("language.title") }}</p>
      <h1>{{ t("language.title") }}</h1>
      <p class="page__lead">{{ t("language.subtitle") }}</p>

      <div class="language-grid">
        <button class="language-card" @click="$emit('select', 'zh-CN')">
          <strong>{{ t("language.zh") }}</strong>
          <span>简体中文</span>
        </button>
        <button class="language-card" @click="$emit('select', 'en-US')">
          <strong>{{ t("language.en") }}</strong>
          <span>English</span>
        </button>
      </div>
    </article>
  </section>
</template>

<script setup lang="ts">
import type { AppLocale } from "@/stores/shell";
import { useI18n } from "@/i18n";

defineEmits<{
  (event: "select", locale: AppLocale): void;
}>();

const { t } = useI18n();
</script>
