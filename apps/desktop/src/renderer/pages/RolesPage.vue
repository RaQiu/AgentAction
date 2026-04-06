<template>
  <section class="page">
    <header class="page__hero page__hero--compact">
      <div>
        <p class="eyebrow">{{ t("roles.title") }}</p>
        <h1>{{ t("roles.subtitle") }}</h1>
      </div>
    </header>

    <article class="flat-panel">
      <ul class="flat-list">
        <li v-for="role in roles" :key="role.id" class="flat-list__row">
          <div>
            <strong>{{ roleDisplayName(role.id, role.displayName) }}</strong>
            <span>{{ rolePersona(role.id, role.persona) }}</span>
          </div>
          <div class="flat-list__actions">
            <button class="button button--ghost" @click="cloneRole(role.id)">{{ t("roles.clone") }}</button>
            <button v-if="role.isClone" class="button button--ghost" @click="syncRole(role.id)">{{ t("roles.sync") }}</button>
          </div>
        </li>
      </ul>
    </article>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted } from "vue";
import { useI18n } from "@/i18n";
import { useWorkbenchStore } from "@/stores/workbench";

const store = useWorkbenchStore();
const { t, roleDisplayName, rolePersona } = useI18n();

onMounted(() => {
  store.ensureInitialized();
});

const roles = computed(() => store.roles);

async function cloneRole(roleId: string) {
  await store.cloneRole(roleId);
}

async function syncRole(roleId: string) {
  await store.syncCloneBack(roleId);
}
</script>
