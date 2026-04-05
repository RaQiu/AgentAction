import { createRouter, createWebHashHistory } from "vue-router";
import DashboardPage from "./pages/DashboardPage.vue";
import DispatchPage from "./pages/DispatchPage.vue";
import TaskPage from "./pages/TaskPage.vue";
import RolesPage from "./pages/RolesPage.vue";
import EquipmentPage from "./pages/EquipmentPage.vue";
import RuntimesPage from "./pages/RuntimesPage.vue";
import AssetsPage from "./pages/AssetsPage.vue";
import SettingsPage from "./pages/SettingsPage.vue";

export const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: "/",
      name: "dashboard",
      component: DashboardPage
    },
    {
      path: "/templates/:templateId",
      name: "dispatch",
      component: DispatchPage
    },
    {
      path: "/tasks/:taskId",
      name: "task",
      component: TaskPage
    },
    {
      path: "/roles",
      name: "roles",
      component: RolesPage
    },
    {
      path: "/equipment",
      name: "equipment",
      component: EquipmentPage
    },
    {
      path: "/runtimes",
      name: "runtimes",
      component: RuntimesPage
    },
    {
      path: "/assets",
      name: "assets",
      component: AssetsPage
    },
    {
      path: "/settings",
      name: "settings",
      component: SettingsPage
    }
  ]
});
