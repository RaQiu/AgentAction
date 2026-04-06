<template>
  <article class="agent-card" :class="`agent-card--${role.profession}`">
    <div class="agent-card__visual">
      <div class="agent-card__portrait">
        <span class="agent-card__callsign">{{ role.nickname.slice(0, 1) }}</span>
        <span class="agent-card__ring"></span>
      </div>
      <div class="agent-card__identity">
        <span class="agent-card__profession">{{ role.profession }}</span>
        <h3>{{ role.displayName }}</h3>
        <p>{{ role.persona }}</p>
      </div>
    </div>

    <div class="agent-card__meta">
      <span class="tag">{{ role.currentEquipmentIds.length }} 件装备</span>
      <span class="tag">谱系 {{ role.cloneLineageId }}</span>
      <span v-if="role.isClone" class="tag tag--alert">分身</span>
    </div>

    <div v-if="showActions" class="composer__actions">
      <button class="button button--ghost" @click="$emit('clone', role.id)">复制角色</button>
      <button v-if="role.isClone" class="button button--ghost" @click="$emit('sync-back', role.id)">
        回流经验
      </button>
    </div>
  </article>
</template>

<script setup lang="ts">
import type { Role } from "@agentaction/shared";

defineProps<{
  role: Role;
  showActions?: boolean;
}>();

defineEmits<{
  (event: "clone", roleId: string): void;
  (event: "sync-back", roleId: string): void;
}>();
</script>
