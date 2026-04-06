<template>
  <section class="gate-shell">
    <article class="onboarding-shell">
      <aside class="onboarding-sidebar">
        <div class="brand__copy">
          <div class="brand__title">{{ t("app.name") }}</div>
          <div class="brand__subtitle">{{ t("onboarding.step", { current: currentStep + 1, total: steps.length }) }}</div>
        </div>
        <div class="onboarding-progress">
          <div class="onboarding-progress__bar" :style="{ width: `${((currentStep + 1) / steps.length) * 100}%` }"></div>
        </div>
        <button class="button button--ghost onboarding-sidebar__skip" @click="$emit('skip')">
          {{ t("onboarding.skip") }}
        </button>
      </aside>

      <div class="onboarding-main">
        <div v-if="currentStep === 0" class="onboarding-stage onboarding-stage--battle">
          <div class="onboarding-hero">
            <p class="eyebrow">{{ t("onboarding.hero.recording") }}</p>
            <h1>{{ t("onboarding.hero.title") }}</h1>
            <p class="page__lead">{{ t("onboarding.hero.subtitle") }}</p>
          </div>

          <section class="battle-demo">
            <header class="battle-demo__header">
              <span class="battle-demo__recording">● Recording</span>
              <strong>{{ t("onboarding.hero.battle") }}</strong>
              <div class="battle-demo__outputs">
                <span>{{ t("onboarding.hero.outputs") }}</span>
                <ul>
                  <li>{{ t("onboarding.hero.output1") }}</li>
                  <li>{{ t("onboarding.hero.output2") }}</li>
                  <li>{{ t("onboarding.hero.output3") }}</li>
                </ul>
              </div>
            </header>

            <div class="battle-demo__body">
              <article class="battle-role battle-role--review">
                <span class="battle-role__badge">PM</span>
                <strong>Product Manager</strong>
                <span>{{ t("task.requestReview") }}</span>
              </article>

              <div class="battle-track">
                <div class="battle-track__node done"></div>
                <div class="battle-track__node done"></div>
                <div class="battle-track__node active"></div>
                <div class="battle-track__node done"></div>
                <div class="battle-track__node pending"></div>
              </div>

              <article class="battle-role battle-role--build">
                <span class="battle-role__badge">DEV</span>
                <strong>Programmer</strong>
                <span>{{ t("task.runtime") }}</span>
              </article>
            </div>
          </section>

          <div class="onboarding-points">
            <article><strong>1.</strong><span>{{ t("onboarding.hero.tip1") }}</span></article>
            <article><strong>2.</strong><span>{{ t("onboarding.hero.tip2") }}</span></article>
            <article><strong>3.</strong><span>{{ t("onboarding.hero.tip3") }}</span></article>
          </div>
        </div>

        <div v-else-if="currentStep === 1" class="onboarding-stage">
          <header class="section-heading section-heading--wide">
            <div>
              <p class="eyebrow">{{ t("onboarding.why.title") }}</p>
              <h3>{{ t("onboarding.why.title") }}</h3>
            </div>
          </header>

          <div class="onboarding-detail-grid">
            <article class="mission-stack">
              <strong>{{ t("onboarding.why.point1") }}</strong>
              <p class="muted">{{ t("onboarding.why.point1Desc") }}</p>
            </article>
            <article class="mission-stack">
              <strong>{{ t("onboarding.why.point2") }}</strong>
              <p class="muted">{{ t("onboarding.why.point2Desc") }}</p>
            </article>
            <article class="mission-stack">
              <strong>{{ t("onboarding.why.point3") }}</strong>
              <p class="muted">{{ t("onboarding.why.point3Desc") }}</p>
            </article>
          </div>
        </div>

        <div v-else-if="currentStep === 2" class="onboarding-stage">
          <header class="section-heading section-heading--wide">
            <div>
              <p class="eyebrow">{{ t("onboarding.tasks.title") }}</p>
              <h3>{{ t("onboarding.tasks.title") }}</h3>
              <p class="page__lead">{{ t("onboarding.tasks.subtitle") }}</p>
            </div>
          </header>

          <div class="template-grid">
            <article v-for="template in templates" :key="template.id" class="mission-poster">
              <div class="mission-poster__frame">
                <div class="mission-poster__topline">
                  <p class="eyebrow">{{ t("nav.dashboard") }}</p>
                </div>
                <h3>{{ templateField(template.id, "title", template.title) }}</h3>
                <p class="mission-poster__tagline">
                  {{ templateField(template.id, "description", template.description) }}
                </p>
                <div class="mission-poster__footer">
                  <div>
                    <span class="mission-poster__label">{{ t("result.card") }}</span>
                    <strong>{{ templateField(template.id, "outcomeTitle", template.outcomeTitle) }}</strong>
                  </div>
                </div>
              </div>
            </article>
          </div>
        </div>

        <div v-else class="onboarding-stage">
          <header class="section-heading section-heading--wide">
            <div>
              <p class="eyebrow">{{ t("onboarding.cta.title") }}</p>
              <h3>{{ t("onboarding.cta.title") }}</h3>
              <p class="page__lead">{{ t("onboarding.cta.subtitle") }}</p>
            </div>
          </header>

          <div class="mission-stack">
            <p class="muted">{{ t("home.subtitle") }}</p>
            <div class="hero-actions hero-actions--inline">
              <button class="button button--primary" @click="$emit('complete')">{{ t("onboarding.finish") }}</button>
            </div>
          </div>
        </div>

        <div class="hero-actions onboarding-actions">
          <button v-if="currentStep > 0" class="button button--ghost" @click="$emit('step', currentStep - 1)">
            Back
          </button>
          <button
            v-if="currentStep < steps.length - 1"
            class="button button--primary"
            @click="$emit('step', currentStep + 1)"
          >
            {{ t("onboarding.next") }}
          </button>
          <button
            v-else
            class="button button--primary"
            @click="$emit('complete')"
          >
            {{ t("onboarding.finish") }}
          </button>
        </div>
      </div>
    </article>
  </section>
</template>

<script setup lang="ts">
import type { TaskTemplatePlugin } from "@agentaction/shared";
import { computed } from "vue";
import { useI18n } from "@/i18n";

const props = defineProps<{
  currentStep: number;
  templates: TaskTemplatePlugin[];
}>();

defineEmits<{
  (event: "step", step: number): void;
  (event: "skip"): void;
  (event: "complete"): void;
}>();

const { t, templateField } = useI18n();

const steps = computed(() => [0, 1, 2, 3]);
void props;
</script>
