<template>
  <section class="page">
    <header class="page__hero">
      <div>
        <p class="eyebrow">任务大厅</p>
        <h1>让具体角色替你把事做完，而不是只回答一段话。</h1>
        <p class="page__lead">
          首页四张案例卡就是四条 Day 1 主链路。点进去后先编队，再收资料，再收束成主结果卡。
        </p>
      </div>
      <div class="hero-metrics">
        <div class="metric">
          <strong>{{ templates.length }}</strong>
          <span>首发任务卡</span>
        </div>
        <div class="metric">
          <strong>{{ roles.length }}</strong>
          <span>官方角色</span>
        </div>
        <div class="metric">
          <strong>{{ runtimes.length }}</strong>
          <span>接入运行时</span>
        </div>
      </div>
    </header>

    <section class="template-grid">
      <TaskTemplateCard v-for="template in templates" :key="template.id" :template="template" />
    </section>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted } from "vue";
import TaskTemplateCard from "@/components/TaskTemplateCard.vue";
import { useWorkbenchStore } from "@/stores/workbench";

const store = useWorkbenchStore();

onMounted(() => {
  store.ensureInitialized();
});

const templates = computed(() => store.templates);
const roles = computed(() => store.roles);
const runtimes = computed(() => store.runtimes);
</script>
