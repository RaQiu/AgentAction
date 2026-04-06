<template>
  <article class="agent-card" :class="`agent-card--${role.profession}`">
    <div class="agent-card__visual">
      <div class="agent-card__portrait">
        <span class="agent-card__callsign">{{ roleNickname(role.id, role.nickname).slice(0, 1) }}</span>
        <span class="agent-card__ring"></span>
      </div>
      <div class="agent-card__identity">
        <span class="agent-card__profession">{{ role.profession }}</span>
        <h3>{{ roleDisplayName(role.id, role.displayName) }}</h3>
        <p>{{ rolePersona(role.id, role.persona) }}</p>
      </div>
    </div>

    <div class="agent-card__meta">
      <span class="tag">{{ t("common.items", { count: role.currentEquipmentIds.length }) }}</span>
      <span class="tag">{{ t("role.lineage", { lineage: role.cloneLineageId }) }}</span>
      <span v-if="role.isClone" class="tag tag--alert">{{ t("role.cloneTag") }}</span>
    </div>

    <div v-if="showActions" class="composer__actions">
      <button class="button button--ghost" @click="$emit('clone', role.id)">{{ t("roles.clone") }}</button>
      <button v-if="role.isClone" class="button button--ghost" @click="$emit('sync-back', role.id)">
        {{ t("roles.sync") }}
      </button>
    </div>
  </article>
</template>

<script setup lang="ts">
import type { Role } from "@agentaction/shared";
import { useI18n } from "@/i18n";

defineProps<{
  role: Role;
  showActions?: boolean;
}>();

defineEmits<{
  (event: "clone", roleId: string): void;
  (event: "sync-back", roleId: string): void;
}>();

const { t, roleDisplayName, roleNickname, rolePersona } = useI18n();
</script>
