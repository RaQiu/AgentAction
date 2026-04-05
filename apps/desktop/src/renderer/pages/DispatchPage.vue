<template>
  <section v-if="template" class="page">
    <header class="page__hero page__hero--compact">
      <div>
        <p class="eyebrow">轻量编队卡</p>
        <h1>{{ template.title }}</h1>
        <p class="page__lead">{{ template.description }}</p>
      </div>
      <button class="button button--primary" :disabled="submitting" @click="startTask">
        {{ submitting ? "正在创建任务..." : "一键配置并开始" }}
      </button>
    </header>

    <section class="dispatch-grid">
      <article class="card">
        <div class="section-heading">
          <div>
            <p class="eyebrow">推荐角色</p>
            <h3>先摆好阵容，再决定是否微调</h3>
          </div>
          <span class="tag">只推荐，不自动装</span>
        </div>
        <div class="role-stack">
          <RoleCard v-for="role in recommendedRoles" :key="role.id" :role="role" />
        </div>
      </article>

      <article class="card">
        <div class="section-heading">
          <div>
            <p class="eyebrow">推荐装备</p>
            <h3>用户可一键配置，也可继续微调</h3>
          </div>
          <span class="tag">{{ recommendedEquipment.length }} 件</span>
        </div>
        <ul class="list">
          <li v-for="item in recommendedEquipment" :key="item.id">
            <strong>{{ item.name }}</strong>
            <span>{{ item.slot }} · {{ item.kind }}</span>
          </li>
        </ul>
      </article>

      <article class="card">
        <div class="section-heading">
          <div>
            <p class="eyebrow">任务所需资料</p>
            <h3>点击开始后，角色会按说明 skill 主动继续追问</h3>
          </div>
        </div>
        <ul class="list">
          <li v-for="item in template.requiredMaterials" :key="item">{{ item }}</li>
        </ul>
      </article>
    </section>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import type { EquipmentPlugin, Role, TaskTemplatePlugin } from "@agentaction/shared";
import { useRoute, useRouter } from "vue-router";
import RoleCard from "@/components/RoleCard.vue";
import { useWorkbenchStore } from "@/stores/workbench";

const route = useRoute();
const router = useRouter();
const store = useWorkbenchStore();
const submitting = ref(false);

onMounted(() => {
  store.ensureInitialized();
});

const template = computed(() =>
  store.templates.find((item: TaskTemplatePlugin) => item.id === route.params.templateId)
);

const recommendedRoles = computed(() =>
  store.roles.filter((role: Role) => template.value?.recommendedRoleIds.includes(role.id))
);

const recommendedEquipment = computed(() =>
  store.equipment.filter((equipment: EquipmentPlugin) =>
    template.value?.recommendedEquipmentIds.includes(equipment.id)
  )
);

async function startTask() {
  if (!template.value) {
    return;
  }

  submitting.value = true;

  try {
    const task = await store.createTaskFromTemplate(template.value);
    await router.push(`/tasks/${task.id}`);
  } finally {
    submitting.value = false;
  }
}
</script>
