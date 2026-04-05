<template>
  <article class="card role-card">
    <div class="role-card__title">
      <div class="avatar">{{ role.nickname.slice(0, 1) }}</div>
      <div>
        <h3>{{ role.displayName }}</h3>
        <p>{{ role.persona }}</p>
      </div>
    </div>

    <div class="role-card__meta">
      <span class="tag">{{ role.profession }}</span>
      <span class="tag">装备 {{ role.currentEquipmentIds.length }}</span>
      <span class="tag">谱系 {{ role.cloneLineageId }}</span>
      <span v-if="role.isClone" class="tag">分身</span>
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
