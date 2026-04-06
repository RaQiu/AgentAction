import { computed, ref } from "vue";
import { defineStore } from "pinia";

export type AppLocale = "zh-CN" | "en-US";

interface PersistedShellState {
  locale: AppLocale | null;
  onboardingCompleted: boolean;
  onboardingStep: number;
}

const SHELL_STORAGE_KEY = "agentaction-shell-state-v1";

function loadState(): PersistedShellState {
  if (typeof window === "undefined") {
    return {
      locale: null,
      onboardingCompleted: false,
      onboardingStep: 0
    };
  }

  const raw = window.localStorage.getItem(SHELL_STORAGE_KEY);
  if (!raw) {
    return {
      locale: null,
      onboardingCompleted: false,
      onboardingStep: 0
    };
  }

  try {
    const parsed = JSON.parse(raw) as Partial<PersistedShellState>;
    return {
      locale: parsed.locale === "en-US" ? "en-US" : parsed.locale === "zh-CN" ? "zh-CN" : null,
      onboardingCompleted: parsed.onboardingCompleted ?? false,
      onboardingStep: parsed.onboardingStep ?? 0
    };
  } catch {
    return {
      locale: null,
      onboardingCompleted: false,
      onboardingStep: 0
    };
  }
}

function persistState(state: PersistedShellState): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(SHELL_STORAGE_KEY, JSON.stringify(state));
}

export const useShellStore = defineStore("shell", () => {
  const state = ref<PersistedShellState>(loadState());

  const locale = computed(() => state.value.locale);
  const onboardingCompleted = computed(() => state.value.onboardingCompleted);
  const onboardingStep = computed(() => state.value.onboardingStep);
  const needsLanguageSelection = computed(() => !state.value.locale);
  const needsOnboarding = computed(
    () => Boolean(state.value.locale) && !state.value.onboardingCompleted
  );

  function setLocale(nextLocale: AppLocale): void {
    state.value = {
      ...state.value,
      locale: nextLocale,
      onboardingCompleted: false,
      onboardingStep: 0
    };
    persistState(state.value);
  }

  function goToOnboardingStep(step: number): void {
    state.value = {
      ...state.value,
      onboardingStep: step
    };
    persistState(state.value);
  }

  function completeOnboarding(): void {
    state.value = {
      ...state.value,
      onboardingCompleted: true
    };
    persistState(state.value);
  }

  function skipOnboarding(): void {
    completeOnboarding();
  }

  function resetOnboarding(): void {
    state.value = {
      ...state.value,
      onboardingCompleted: false,
      onboardingStep: 0
    };
    persistState(state.value);
  }

  return {
    locale,
    onboardingCompleted,
    onboardingStep,
    needsLanguageSelection,
    needsOnboarding,
    setLocale,
    goToOnboardingStep,
    completeOnboarding,
    skipOnboarding,
    resetOnboarding
  };
});
