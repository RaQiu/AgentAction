<template>
  <section class="page">
    <header class="page__hero page__hero--compact">
      <div>
        <p class="eyebrow">角色库</p>
        <h1>职业模板 + 昵称，支持完整分身复制与后续回流。</h1>
      </div>
    </header>

    <div class="role-stack">
      <RoleCard v-for="role in roles" :key="role.id" :role="role" />
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
</script>
