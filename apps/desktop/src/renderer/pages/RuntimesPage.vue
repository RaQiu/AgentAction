<template>
  <section class="page">
    <header class="page__hero page__hero--compact">
      <div>
        <p class="eyebrow">{{ t("nav.runtimes") }}</p>
        <h1>{{ t("runtimes.title") }}</h1>
      </div>
    </header>

    <section class="utility-layout">
      <article class="flat-panel">
        <ul class="flat-list">
          <li v-for="runtime in runtimes" :key="runtime.id" class="flat-list__row flat-list__row--stacked">
            <div class="flat-list__head">
              <div>
                <strong>{{ runtimeField(runtime.id, "name", runtime.name) }}</strong>
                <span>{{ runtimeField(runtime.id, "description", runtime.description) }}</span>
              </div>
              <span class="tag">{{ runtime.status }}</span>
            </div>
            <div class="flat-meta">
              <span>{{ runtime.targetRuntime }}</span>
              <span>{{ runtime.source }}</span>
              <span v-if="runtime.detectedVersion">{{ runtime.detectedVersion }}</span>
            </div>
            <div class="flat-list__actions">
              <button class="button button--ghost" @click="check(runtime.id)">{{ t("runtimes.check") }}</button>
              <button v-if="runtime.installMode === 'clone' || runtime.supportsCloneInstall" class="button button--primary" @click="installClone(runtime.id)">
                {{ t("runtimes.clone") }}
              </button>
              <a v-if="runtime.githubUrl" class="button button--ghost" :href="runtime.githubUrl" target="_blank" rel="noreferrer">
                {{ t("runtimes.github") }}
              </a>
            </div>
          </li>
        </ul>
      </article>

      <article class="flat-panel flat-panel--narrow">
        <div class="flat-panel__header">
          <div>
            <p class="eyebrow">{{ t("runtimes.directory") }}</p>
          </div>
        </div>
        <ul class="flat-list flat-list--compact">
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
import { useI18n } from "@/i18n";
import { useWorkbenchStore } from "@/stores/workbench";

const store = useWorkbenchStore();
const { t, runtimeField } = useI18n();

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
