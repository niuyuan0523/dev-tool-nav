<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { tools } from '@/data/tools'
</script>

<template>
  <div class="tools-hub">
    <section class="hero">
      <h2 class="hero-title">🧰 在线工具箱</h2>
      <p class="hero-sub">
        无需切换网站，常用小工具直接内置于此，全部在浏览器本地运行，数据不外传。
      </p>
    </section>

    <div class="grid">
      <RouterLink v-for="t in tools" :key="t.id" :to="t.path" class="tool-card">
        <span class="tool-emoji">{{ t.emoji }}</span>
        <div class="tool-meta">
          <span class="tool-name">{{ t.name }}</span>
          <span class="tool-desc">{{ t.desc }}</span>
        </div>
        <span class="tool-arrow">→</span>
      </RouterLink>
    </div>
  </div>
</template>

<style scoped>
.tools-hub {
  max-width: 1000px;
  margin: 0 auto;
}
.hero-title {
  font-size: 26px;
  margin: 4px 0 6px;
}
.hero-sub {
  color: var(--text-soft);
  margin: 0 0 24px;
}
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}
.tool-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 20px;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--bg-elev);
  box-shadow: var(--shadow);
  transition:
    transform 0.16s ease,
    box-shadow 0.16s ease,
    border-color 0.16s ease;
}
.tool-card:hover {
  transform: translateY(-3px);
  border-color: var(--primary);
  box-shadow: var(--shadow-hover);
}
.tool-emoji {
  font-size: 30px;
}
.tool-meta {
  display: flex;
  flex-direction: column;
  min-width: 0;
}
.tool-name {
  font-weight: 600;
  font-size: 16px;
}
.tool-desc {
  font-size: 13px;
  color: var(--text-mute);
}
.tool-arrow {
  margin-left: auto;
  color: var(--text-mute);
  font-size: 18px;
  transition:
    transform 0.16s ease,
    color 0.16s ease;
}
.tool-card:hover .tool-arrow {
  color: var(--primary);
  transform: translateX(3px);
}
</style>
