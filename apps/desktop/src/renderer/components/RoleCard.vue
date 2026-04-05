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
    </div>
  </article>
</template>

<script setup lang="ts">
import type { Role } from "@agentaction/shared";

defineProps<{
  role: Role;
}>();
</script>
