<template>
  <section class="page">
    <header class="page__hero page__hero--compact">
      <div>
        <p class="eyebrow">角色</p>
        <h1>当前可派遣的角色</h1>
      </div>
    </header>

    <article class="flat-panel">
      <ul class="flat-list">
        <li v-for="role in roles" :key="role.id" class="flat-list__row">
          <div>
            <strong>{{ role.displayName }}</strong>
            <span>{{ role.persona }}</span>
          </div>
          <div class="flat-list__actions">
            <button class="button button--ghost" @click="cloneRole(role.id)">复制角色</button>
            <button v-if="role.isClone" class="button button--ghost" @click="syncRole(role.id)">回流经验</button>
          </div>
        </li>
      </ul>
    </article>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted } from "vue";
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
