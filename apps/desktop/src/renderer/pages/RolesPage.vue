<template>
  <section class="page">
    <header class="page__hero page__hero--compact">
      <div>
        <p class="eyebrow">角色</p>
        <h1>当前可派遣的角色</h1>
      </div>
    </header>

    <div class="role-stack">
      <RoleCard
        v-for="role in roles"
        :key="role.id"
        :role="role"
        show-actions
        @clone="cloneRole"
        @sync-back="syncRole"
      />
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted } from "vue";
import RoleCard from "@/components/RoleCard.vue";
import { useWorkbenchStore } from "@/stores/workbench";

const store = useWorkbenchStore();

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
