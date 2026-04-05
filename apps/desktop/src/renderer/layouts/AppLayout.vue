<template>
  <div class="shell">
    <aside class="shell__sidebar">
      <div class="brand">
        <div class="brand__badge">AA</div>
        <div>
          <div class="brand__title">AgentAction</div>
          <div class="brand__subtitle">本地任务宿主</div>
        </div>
      </div>

      <nav class="nav">
        <RouterLink to="/" class="nav__item">任务大厅</RouterLink>
        <RouterLink to="/roles" class="nav__item">角色库</RouterLink>
        <RouterLink to="/equipment" class="nav__item">装备库</RouterLink>
        <RouterLink to="/runtimes" class="nav__item">运行时</RouterLink>
        <RouterLink to="/assets" class="nav__item">结果与资产</RouterLink>
        <RouterLink to="/settings" class="nav__item">设置</RouterLink>
      </nav>

      <div class="sidebar__footer">
        <p>四张任务卡、轻量编队、任务容器、结果卡闭环。</p>
      </div>
    </aside>

    <main class="shell__main">
      <slot />
    </main>
  </div>
</template>

<script setup lang="ts">
import { RouterLink } from "vue-router";
</script>
