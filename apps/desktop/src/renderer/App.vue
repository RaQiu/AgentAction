<template>
  <LanguageGate v-if="shell.needsLanguageSelection" @select="selectLocale" />
  <OnboardingFlow
    v-else-if="shell.needsOnboarding"
    :current-step="shell.onboardingStep"
    :templates="workbench.templates"
    @step="shell.goToOnboardingStep"
    @skip="shell.skipOnboarding"
    @complete="shell.completeOnboarding"
  />
  <AppLayout v-else>
    <RouterView />
  </AppLayout>
</template>

<script setup lang="ts">
import { RouterView } from "vue-router";
import AppLayout from "./layouts/AppLayout.vue";
import LanguageGate from "./components/LanguageGate.vue";
import OnboardingFlow from "./components/OnboardingFlow.vue";
import type { AppLocale } from "./stores/shell";
import { useShellStore } from "./stores/shell";
import { useWorkbenchStore } from "./stores/workbench";

const shell = useShellStore();
const workbench = useWorkbenchStore();

function selectLocale(locale: AppLocale) {
  shell.setLocale(locale);
}
</script>
