<template>
  <section class="page">
    <header class="page__hero page__hero--compact">
      <div>
        <p class="eyebrow">结果与资产</p>
        <h1>主视角按任务，但也能按角色和类型继续找回资产。</h1>
      </div>
    </header>

    <article class="card">
      <div class="section-heading">
        <div>
          <p class="eyebrow">资产索引</p>
          <h3>默认按任务找，也能按角色和类型过滤</h3>
        </div>
        <span class="tag">{{ filteredAssets.length }} / {{ assets.length }} 项</span>
      </div>
      <div class="composer__actions">
        <select v-model="taskFilter" class="select">
          <option value="">全部任务</option>
          <option v-for="task in tasks" :key="task.id" :value="task.id">{{ task.title }}</option>
        </select>
        <select v-model="roleFilter" class="select">
          <option value="">全部角色</option>
          <option v-for="role in roles" :key="role.id" :value="role.id">{{ role.displayName }}</option>
        </select>
        <select v-model="kindFilter" class="select">
          <option value="">全部类型</option>
          <option value="artifact">产物</option>
          <option value="memory">记忆</option>
          <option value="skill">技能</option>
        </select>
      </div>
      <ul class="list">
        <li v-for="asset in filteredAssets" :key="asset.id">
          <strong>{{ asset.title }}</strong>
          <span>{{ asset.kind }} · {{ asset.summary }}</span>
        </li>
      </ul>
    </article>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useWorkbenchStore } from "@/stores/workbench";

const store = useWorkbenchStore();
const taskFilter = ref("");
const roleFilter = ref("");
const kindFilter = ref("");

onMounted(() => {
  store.ensureInitialized();
});

const assets = computed(() => store.assets);
const tasks = computed(() => store.tasks);
const roles = computed(() => store.roles);
const filteredAssets = computed(() =>
  assets.value.filter((asset) => {
    const taskOk = !taskFilter.value || asset.taskId === taskFilter.value;
    const roleOk = !roleFilter.value || asset.roleId === roleFilter.value;
    const kindOk = !kindFilter.value || asset.kind === kindFilter.value;
    return taskOk && roleOk && kindOk;
  })
);
</script>
