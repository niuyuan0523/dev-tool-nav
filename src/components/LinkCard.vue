<script setup lang="ts">
import type { NavLink } from '@/types'

defineProps<{ link: NavLink }>()

function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}
</script>

<template>
  <a class="card" :href="link.url" target="_blank" rel="noreferrer">
    <span class="card-icon">{{ link.icon ?? '🔗' }}</span>
    <span class="card-body">
      <span class="card-name">{{ link.name }}</span>
      <span class="card-desc">{{ link.desc ?? hostOf(link.url) }}</span>
    </span>
    <span class="card-arrow">↗</span>
  </a>
</template>

<style scoped>
.card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--bg-elev);
  box-shadow: var(--shadow);
  transition:
    transform 0.16s ease,
    box-shadow 0.16s ease,
    border-color 0.16s ease;
}
.card:hover {
  transform: translateY(-3px);
  border-color: var(--primary);
  box-shadow: var(--shadow-hover);
}
.card-icon {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 11px;
  background: var(--bg-soft);
  font-size: 20px;
}
.card-body {
  display: flex;
  flex-direction: column;
  min-width: 0;
}
.card-name {
  font-size: 14px;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.card-desc {
  font-size: 12px;
  color: var(--text-mute);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.card-arrow {
  margin-left: auto;
  color: var(--text-mute);
  opacity: 0;
  transition: opacity 0.16s ease;
}
.card:hover .card-arrow {
  opacity: 1;
  color: var(--primary);
}
</style>
