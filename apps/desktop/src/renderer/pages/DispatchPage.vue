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

    <section class="dispatch-studio">
      <article class="dispatch-studio__hero">
        <div class="dispatch-studio__header">
          <div>
            <p class="eyebrow">{{ t("dispatch.previewTitle") }}</p>
            <h3>{{ t("dispatch.previewSubtitle") }}</h3>
          </div>
          <span class="tag">{{ t("dispatch.recommendedOnly") }}</span>
        </div>

        <div class="dispatch-pair">
          <article
            v-for="role in recommendedRoles"
            :key="role.id"
            class="dispatch-role-tile"
          >
            <div class="dispatch-role-tile__avatar">
              <span>{{ roleNickname(role.id, role.nickname) }}</span>
            </div>
            <div class="dispatch-role-tile__body">
              <strong>{{ roleDisplayName(role.id, role.displayName) }}</strong>
              <span>{{ dispatchRoleHint(role.id) }}</span>
            </div>
          </article>
        </div>

        <div class="dispatch-footer-strip">
          <div class="dispatch-output">
            <p class="eyebrow">{{ t("dispatch.outputTitle") }}</p>
            <strong>{{ templateField(template.id, "outcomeTitle", template.outcomeTitle) }}</strong>
          </div>

          <div class="dispatch-chip-cloud">
            <span
              v-for="item in recommendedEquipment"
              :key="item.id"
              class="dispatch-chip"
            >
              {{ item.name }}
            </span>
          </div>
        </div>
      </article>

      <aside class="dispatch-studio__side">
        <section class="dispatch-side-card">
          <div class="dispatch-side-card__header">
            <div>
              <p class="eyebrow">{{ t("dispatch.materials") }}</p>
              <h3>{{ t("dispatch.materialsSubtitle") }}</h3>
            </div>
          </div>
          <ul class="dispatch-side-list">
            <li
              v-for="item in templateField(template.id, 'requiredMaterials', template.requiredMaterials)"
              :key="item"
            >
              <span class="dispatch-side-list__dot"></span>
              <span>{{ item }}</span>
            </li>
          </ul>
        </section>

        <section class="dispatch-side-card">
          <p class="muted">{{ t("dispatch.followup") }}</p>
          <button class="button button--primary dispatch-side-card__button" :disabled="submitting" @click="startTask">
            {{ submitting ? t("dispatch.starting") : t("dispatch.start") }}
          </button>
        </section>
      </aside>
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
const { t, templateField, roleDisplayName, roleNickname, rolePersona } = useI18n();
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

function dispatchRoleHint(roleId: string) {
  if (roleId === "role_product_xiaoce") {
    return t("dispatch.roleProductHint");
  }
  return t("dispatch.roleEngineerHint");
}

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
