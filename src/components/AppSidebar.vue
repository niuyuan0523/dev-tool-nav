<script setup lang="ts">
import { RouterLink, useRoute } from 'vue-router'
import { navCategories } from '@/data/navigation'

defineProps<{ open: boolean; collapsed: boolean }>()
const emit = defineEmits<{
  (e: 'close'): void
  (e: 'toggle-collapse'): void
}>()

const route = useRoute()

/**
 * 分类锚点链接全部指向 `/` 路由，无法用 router-link-exact-active 精确高亮，
 * 因此改为根据当前 hash 手动判断激活项（仅在首页时生效）。
 */
const isCategoryActive = (id: string) => route.path === '/' && route.hash === `#${id}`
</script>

<template>
  <aside class="sidebar" :class="{ open, collapsed }">
    <RouterLink to="/" class="brand" title="DevNav · 程序员导航站" @click="emit('close')">
      <img class="brand-logo" src="/logo.png" alt="niuyuan" />
      <span class="brand-text">
        <strong>DevNav</strong>
        <small>程序员导航站</small>
      </span>
    </RouterLink>

    <nav class="nav">
      <div class="nav-group">
        <RouterLink to="/tools" class="nav-item" title="在线工具箱" @click="emit('close')">
          <span class="nav-emoji">🧰</span>
          <span class="nav-text">在线工具箱</span>
        </RouterLink>
      </div>

      <p class="nav-label">🧭 网址导航</p>
      <div class="nav-group">
        <RouterLink
          v-for="c in navCategories"
          :key="c.id"
          :to="{ path: '/', hash: `#${c.id}` }"
          class="nav-item"
          active-class=""
          exact-active-class=""
          :class="{ 'is-active': isCategoryActive(c.id) }"
          :title="c.title"
          @click="emit('close')"
        >
          <span class="nav-emoji">{{ c.emoji }}</span>
          <span class="nav-text">{{ c.title }}</span>
        </RouterLink>
      </div>
    </nav>

    <footer class="side-foot">
      <span class="nav-text">MVP · Vue 3 + Vite + TS</span>
      <span class="foot-mini">v0.1</span>
    </footer>

    <button
      class="collapse-handle"
      :aria-label="collapsed ? '展开侧边栏' : '收起侧边栏'"
      :title="collapsed ? '展开侧边栏' : '收起侧边栏'"
      :class="{ 'is-collapsed': collapsed }"
      @click="emit('toggle-collapse')"
    >
      <svg
        class="handle-icon"
        :class="{ flip: !collapsed }"
        width="14"
        height="14"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          fill="currentColor"
          d="m15.632 12l-4.748-8.968l-1.768.936L13.368 12l-4.252 8.032l1.768.936z"
        ></path>
      </svg>
    </button>
  </aside>
</template>

<style scoped>
.sidebar {
  position: fixed;
  top: 0;
  left: 0;
  z-index: 50;
  width: var(--sidebar-w);
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--bg-elev);
  border-right: 1px solid var(--border);
  overflow-x: hidden;
  overflow-y: auto;
  transition: width 0.24s ease;
}

.brand {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 12px;
  height: var(--header-h);
  padding: 0 18px;
  border-bottom: 1px solid var(--border);
}
.brand-logo {
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  border-radius: 10px;
  object-fit: cover;
  box-shadow: var(--shadow);
}
.brand-text {
  display: flex;
  flex-direction: column;
  line-height: 1.2;
  white-space: nowrap;
  overflow: hidden;
}
.brand-text strong {
  font-size: 16px;
}
.brand-text small {
  color: var(--text-mute);
  font-size: 12px;
}

.nav {
  flex: 1;
  padding: 8px 12px 20px;
}
.nav-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.nav-label {
  margin: 18px 8px 8px;
  font-size: 11px;
  font-weight: 600;
  color: var(--text-mute);
  letter-spacing: 0.06em;
  text-transform: uppercase;
  white-space: nowrap;
  overflow: hidden;
}
.nav-label:first-child {
  margin-top: 6px;
}
.nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: var(--radius-sm);
  color: var(--text-soft);
  font-size: 14px;
  line-height: 1.2;
  white-space: nowrap;
  overflow: hidden;
  transition:
    background 0.15s ease,
    color 0.15s ease;
}
.nav-item.sub {
  font-size: 13px;
  padding-left: 16px;
}
.nav-item:hover {
  background: var(--bg-soft);
  color: var(--text);
}
.nav-item.router-link-active,
.nav-item.router-link-exact-active,
.nav-item.is-active {
  background: var(--primary-soft);
  color: var(--primary);
  font-weight: 600;
}
.nav-emoji {
  flex-shrink: 0;
  width: 20px;
  text-align: center;
}
.nav-text {
  overflow: hidden;
  text-overflow: ellipsis;
}

.side-foot {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 20px;
  border-top: 1px solid var(--border);
  color: var(--text-mute);
  font-size: 12px;
}
.foot-mini {
  display: none;
}

/* 贴在侧边栏右侧边缘的收起/展开手柄，随侧栏宽度移动 */
.collapse-handle {
  position: fixed;
  top: 50%;
  left: var(--sidebar-w);

  z-index: 60;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 64px;
  padding: 0;
  border: 1px solid var(--border);
  border-radius: 10px;
  background: var(--bg-elev);
  color: var(--text-mute);
  cursor: pointer;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.12);
  transition:
    left 0.24s ease,
    color 0.15s ease,
    border-color 0.15s ease,
    background 0.15s ease;

  &.is-collapsed {
    transform: translate(-1px, -50%);
    border-top-left-radius: 0 !important;
    border-bottom-left-radius: 0 !important;
  }
  &:not(.is-collapsed) {
    transform: translate(-100%, -50%);
    border-top-right-radius: 0 !important;
    border-bottom-right-radius: 0 !important;
  }
}
.collapse-handle:hover {
  color: var(--primary);
  border-color: var(--primary);
  background: var(--bg-soft);
}
.handle-icon {
  transition: transform 0.24s ease;
}
.handle-icon.flip {
  transform: scaleX(-1);
}

/* ===== 桌面端：收起状态（仅图标） ===== */
@media (min-width: 861px) {
  .sidebar.collapsed .brand {
    justify-content: center;
    padding: 0;
  }
  .sidebar.collapsed .brand-text,
  .sidebar.collapsed .nav-text,
  .sidebar.collapsed .nav-label {
    display: none;
  }
  .sidebar.collapsed .nav-group {
    gap: 6px;
  }
  .sidebar.collapsed .nav-item {
    justify-content: center;
    padding: 11px 0;
    gap: 0;
  }
  .sidebar.collapsed .nav-item.sub {
    padding-left: 0;
  }
  .sidebar.collapsed .nav-emoji {
    width: auto;
    font-size: 18px;
  }
  /* 收起时用一条分隔线代替分组标题 */
  .sidebar.collapsed .nav-label {
    display: block;
    height: 1px;
    margin: 12px 14px;
    padding: 0;
    font-size: 0;
    background: var(--border);
    overflow: hidden;
  }
  .sidebar.collapsed .nav-label:first-child {
    margin-top: 8px;
  }
  .sidebar.collapsed .side-foot {
    justify-content: center;
    padding: 14px 0;
  }
  .sidebar.collapsed .foot-mini {
    display: inline;
  }
}

/* ===== 移动端：抽屉，始终展开 ===== */
@media (max-width: 860px) {
  .sidebar {
    width: min(82vw, 300px);
    transform: translateX(-100%);
    transition: transform 0.24s ease;
    box-shadow: var(--shadow);
  }
  .sidebar.open {
    transform: translateX(0);
  }
  .collapse-handle {
    display: none;
  }
}
</style>
