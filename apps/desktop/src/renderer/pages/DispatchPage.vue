<template>
  <section v-if="template" class="page">
    <header class="page__hero page__hero--compact">
      <div>
        <p class="eyebrow">{{ t("dispatch.title") }}</p>
        <h1>{{ templateField(template.id, "title", template.title) }}</h1>
        <p class="page__lead">{{ templateField(template.id, "description", template.description) }}</p>
      </div>
      <button class="button button--primary" :disabled="submitting" @click="startTask">
        {{ submitting ? t("dispatch.starting") : t("dispatch.start") }}
      </button>
    </header>

    <section class="setup-layout">
      <article class="setup-panel setup-panel--main">
        <div class="setup-block">
          <p class="eyebrow">{{ t("dispatch.roles") }}</p>
          <h3>{{ t("dispatch.rolesSubtitle") }}</h3>
          <ul class="setup-list">
            <li v-for="role in recommendedRoles" :key="role.id">
              <strong>{{ roleDisplayName(role.id, role.displayName) }}</strong>
              <span>{{ rolePersona(role.id, role.persona) }}</span>
            </li>
          </ul>
        </div>

        <div class="setup-block">
          <p class="eyebrow">{{ t("dispatch.equipment") }}</p>
          <h3>{{ t("dispatch.equipmentSubtitle") }}</h3>
          <ul class="setup-list">
            <li v-for="item in recommendedEquipment" :key="item.id">
              <strong>{{ item.name }}</strong>
              <span>{{ item.slot }} · {{ item.kind }}</span>
            </li>
          </ul>
        </div>
      </article>

      <article class="setup-panel setup-panel--side">
        <div class="setup-block">
          <p class="eyebrow">{{ t("dispatch.materials") }}</p>
          <h3>{{ t("dispatch.materialsSubtitle") }}</h3>
          <ul class="setup-list">
            <li v-for="item in templateField(template.id, 'requiredMaterials', template.requiredMaterials)" :key="item">
              <strong>{{ item }}</strong>
            </li>
          </ul>
        </div>
        <div class="setup-actions">
          <span class="tag">{{ t("dispatch.recommendedOnly") }}</span>
          <button class="button button--primary" :disabled="submitting" @click="startTask">
            {{ submitting ? t("dispatch.starting") : t("dispatch.start") }}
          </button>
        </div>
      </article>
    </section>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import type { EquipmentPlugin, Role, TaskTemplatePlugin } from "@agentaction/shared";
import { useRoute, useRouter } from "vue-router";
import { useI18n } from "@/i18n";
import { useWorkbenchStore } from "@/stores/workbench";

const route = useRoute();
const router = useRouter();
const store = useWorkbenchStore();
const { t, templateField, roleDisplayName, rolePersona } = useI18n();
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
