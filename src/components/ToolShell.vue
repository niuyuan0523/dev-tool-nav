<script setup lang="ts">
import { RouterLink } from 'vue-router'

defineProps<{
  emoji: string
  title: string
  desc?: string
}>()
</script>

<template>
  <div class="tool-shell">
    <RouterLink to="/tools" class="back">← 返回工具箱</RouterLink>
    <header class="tool-header">
      <span class="tool-emoji">{{ emoji }}</span>
      <div>
        <h2 class="tool-title">{{ title }}</h2>
        <p v-if="desc" class="tool-desc">{{ desc }}</p>
      </div>
    </header>
    <div class="tool-content">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.tool-shell {
  max-width: 980px;
  margin: 0 auto;
}
.back {
  display: inline-block;
  font-size: 13px;
  color: var(--text-soft);
  margin-bottom: 16px;
}
.back:hover {
  color: var(--primary);
}
.tool-header {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 22px;
}
.tool-emoji {
  font-size: 34px;
}
.tool-title {
  margin: 0;
  font-size: 22px;
}
.tool-desc {
  margin: 2px 0 0;
  color: var(--text-mute);
  font-size: 13px;
}
</style>
