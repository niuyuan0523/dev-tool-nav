<script setup lang="ts">
import type { NavLink } from '@/types'
import { useFavorites } from '@/composables/useFavorites'

const props = defineProps<{ link: NavLink }>()

const { isFavorite, toggle } = useFavorites()

function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}

/** 阻止冒泡与默认跳转，仅切换收藏状态 */
function onToggle(e: MouseEvent) {
  e.preventDefault()
  e.stopPropagation()
  toggle({ ...props.link })
}
</script>

<template>
  <a class="card" :href="link.url" target="_blank" rel="noreferrer">
    <span class="card-icon">{{ link.icon ?? '🔗' }}</span>
    <span class="card-body">
      <span class="card-name">{{ link.name }}</span>
      <span class="card-desc">{{ link.desc ?? hostOf(link.url) }}</span>
    </span>
    <button
      type="button"
      class="card-fav"
      :class="{ active: isFavorite(link.url) }"
      :title="isFavorite(link.url) ? '取消收藏' : '收藏'"
      :aria-label="isFavorite(link.url) ? '取消收藏' : '收藏'"
      @click="onToggle"
    >
      {{ isFavorite(link.url) ? '★' : '☆' }}
    </button>
    <span class="card-arrow">↗</span>
  </a>
</template>

<style scoped>
.card {
  position: relative;
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

.card-fav {
  position: absolute;
  top: 6px;
  right: 6px;
  z-index: 2;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  padding: 0;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: var(--text-mute);
  font-size: 16px;
  line-height: 1;
  opacity: 0;
  transition:
    opacity 0.16s ease,
    color 0.16s ease,
    background 0.16s ease;
}
.card:hover .card-fav,
.card-fav.active {
  opacity: 1;
}
.card-fav:hover {
  background: var(--bg-soft);
  color: #f5a623;
}
.card-fav.active {
  color: #f5a623;
}
</style>
