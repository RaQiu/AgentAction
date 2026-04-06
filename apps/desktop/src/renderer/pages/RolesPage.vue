<template>
  <section class="page">
    <header class="page__hero page__hero--compact">
      <div>
        <p class="eyebrow">{{ t("roles.title") }}</p>
        <h1>{{ t("roles.subtitle") }}</h1>
      </div>
      <div class="role-toolbar">
        <span class="tag">{{ t("roles.stockCount", { count: roles.length }) }}</span>
        <div class="view-toggle" role="tablist" :aria-label="t('roles.title')">
          <button
            class="view-toggle__button"
            :class="{ 'view-toggle__button--active': viewMode === 'cards' }"
            type="button"
            @click="viewMode = 'cards'"
          >
            {{ t("roles.viewCards") }}
          </button>
          <button
            class="view-toggle__button"
            :class="{ 'view-toggle__button--active': viewMode === 'avatars' }"
            type="button"
            @click="viewMode = 'avatars'"
          >
            {{ t("roles.viewThumbs") }}
          </button>
        </div>
      </div>
    </header>

    <section v-if="viewMode === 'cards'" class="role-stock role-stock--cards">
      <article v-for="role in roles" :key="role.id" class="role-stock-card">
        <div class="role-stock-card__top">
          <span class="eyebrow">{{ t("roles.cardLabel") }}</span>
          <span v-if="role.isClone" class="tag tag--alert">{{ t("role.cloneTag") }}</span>
        </div>

        <div class="role-stock-card__avatar">
          <span>{{ roleNickname(role.id, role.nickname).slice(0, 1) }}</span>
        </div>

        <div class="role-stock-card__body">
          <strong>{{ roleDisplayName(role.id, role.displayName) }}</strong>
          <span>{{ rolePersona(role.id, role.persona) }}</span>
        </div>

        <div class="role-stock-card__meta">
          <span class="tag">{{ t("common.items", { count: role.currentEquipmentIds.length }) }}</span>
          <span class="tag">{{ t("role.lineage", { lineage: role.cloneLineageId }) }}</span>
        </div>

        <div class="role-stock-card__actions">
          <button class="button button--ghost" @click="cloneRole(role.id)">{{ t("roles.clone") }}</button>
          <button v-if="role.isClone" class="button button--ghost" @click="syncRole(role.id)">{{ t("roles.sync") }}</button>
        </div>
      </article>
    </section>

    <section v-else class="role-stock role-stock--avatars">
      <button
        v-for="role in roles"
        :key="role.id"
        type="button"
        class="role-avatar-chip"
        :aria-label="roleDisplayName(role.id, role.displayName)"
      >
        <span class="role-avatar-chip__image">{{ roleNickname(role.id, role.nickname).slice(0, 1) }}</span>
        <span class="role-avatar-chip__label">{{ roleDisplayName(role.id, role.displayName) }}</span>
      </button>
    </section>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useI18n } from "@/i18n";
import { useWorkbenchStore } from "@/stores/workbench";

const store = useWorkbenchStore();
const { t, roleDisplayName, roleNickname, rolePersona } = useI18n();
const viewMode = ref<"cards" | "avatars">("cards");

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
