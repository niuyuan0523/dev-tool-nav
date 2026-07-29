<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { navCategories } from '@/data/navigation'
import { tools } from '@/data/tools'
import LinkCard from '@/components/LinkCard.vue'
import { useFavorites } from '@/composables/useFavorites'

const { favorites, remove, addCustom } = useFavorites()

/** 自定义收藏站点表单 */
const showFavForm = ref(false)
const favForm = ref({ name: '', url: '', desc: '', icon: '' })
const favError = ref('')

const submitFav = () => {
  favError.value = ''
  const ok = addCustom(favForm.value)
  if (!ok) {
    favError.value = !favForm.value.name.trim()
      ? '请填写站点名称'
      : !favForm.value.url.trim()
        ? '请填写站点地址'
        : '该站点已在收藏中'
    return
  }
  favForm.value = { name: '', url: '', desc: '', icon: '' }
  showFavForm.value = false
}

type SourceId = 'local' | 'baidu' | 'google' | 'bing'
interface SearchSource {
  id: SourceId
  label: string
  icon: string
  /** 搜索引擎地址模板（本地搜索为空） */
  url?: string
}

const sources: SearchSource[] = [
  { id: 'local', label: '本地搜索', icon: '🔍' },
  { id: 'baidu', label: '百度', icon: '🐾', url: 'https://www.baidu.com/s?wd=' },
  { id: 'google', label: '谷歌', icon: '🌐', url: 'https://www.google.com/search?q=' },
  { id: 'bing', label: '必应', icon: '🔎', url: 'https://www.bing.com/search?q=' },
]

const STORAGE_KEY = 'devnav-search-source'
const readSource = (): SourceId => {
  const saved = localStorage.getItem(STORAGE_KEY)
  return sources.some((s) => s.id === saved) ? (saved as SourceId) : 'local'
}

const keyword = ref('')
const source = ref<SourceId>(readSource())
const menuOpen = ref(false)
const sourceEl = ref<HTMLElement | null>(null)

/** 记住用户选择，下次自动恢复 */
watch(source, (v) => localStorage.setItem(STORAGE_KEY, v))

const current = computed(() => sources.find((s) => s.id === source.value) ?? sources[0])
const isLocal = computed(() => source.value === 'local')

const selectSource = (id: SourceId) => {
  source.value = id
  menuOpen.value = false
}

/** 点击下拉外部时关闭菜单 */
const onDocClick = (e: MouseEvent) => {
  if (sourceEl.value && !sourceEl.value.contains(e.target as Node)) {
    menuOpen.value = false
  }
}
onMounted(() => document.addEventListener('click', onDocClick))
onBeforeUnmount(() => document.removeEventListener('click', onDocClick))

/** 是否处于本地过滤状态（搜索引擎模式下始终展示完整导航） */
const isFiltering = computed(() => isLocal.value && keyword.value.trim() !== '')

/** 根据关键字过滤链接，同时保留分类结构；非过滤态返回全部 */
const filteredCategories = computed(() => {
  if (!isFiltering.value) return navCategories
  const kw = keyword.value.trim().toLowerCase()
  return navCategories
    .map((c) => ({
      ...c,
      links: c.links.filter(
        (l) =>
          l.name.toLowerCase().includes(kw) ||
          (l.desc ?? '').toLowerCase().includes(kw) ||
          l.url.toLowerCase().includes(kw),
      ),
    }))
    .filter((c) => c.links.length > 0)
})

const totalLinks = computed(() => navCategories.reduce((sum, c) => sum + c.links.length, 0))
const hasResult = computed(() => filteredCategories.value.length > 0)

/** 提交搜索：搜索引擎模式下用对应引擎打开新标签页 */
const onSubmit = () => {
  const kw = keyword.value.trim()
  if (!isLocal.value && kw && current.value.url) {
    window.open(current.value.url + encodeURIComponent(kw), '_blank', 'noopener')
  }
}
</script>

<template>
  <div class="home">
    <section class="hero">
      <h2 class="hero-title">常用开发导航</h2>
      <p class="hero-sub">
        聚合 {{ totalLinks }}+ 常用开发站点与 {{ tools.length }} 个内置在线工具，一站直达。
      </p>
      <form class="search" @submit.prevent="onSubmit">
        <div class="search-source" ref="sourceEl">
          <button
            type="button"
            class="source-btn"
            :title="`搜索方式：${current.label}`"
            @click="menuOpen = !menuOpen"
          >
            <span class="source-icon">{{ current.icon }}</span>
            <span class="source-caret">▾</span>
          </button>
          <ul v-if="menuOpen" class="source-menu">
            <li v-for="s in sources" :key="s.id">
              <button
                type="button"
                class="source-item"
                :class="{ active: s.id === source }"
                @click="selectSource(s.id)"
              >
                <span class="source-icon">{{ s.icon }}</span>
                <span>{{ s.label }}</span>
              </button>
            </li>
          </ul>
        </div>
        <input
          v-model="keyword"
          class="search-input"
          type="text"
          :placeholder="
            isLocal ? '搜索导航（名称 / 描述 / 网址）…' : `用${current.label}搜索，回车打开结果…`
          "
        />
        <button
          v-if="keyword"
          type="button"
          class="search-clear"
          title="清除"
          @click="keyword = ''"
        >
          ✕
        </button>
        <button v-if="!isLocal" type="submit" class="search-go">搜索</button>
      </form>
    </section>

    <!-- 收藏置顶：自定义 + 已收藏站点 -->
    <section v-if="!isFiltering" id="favorites" class="block">
      <div class="block-head">
        <h3><span class="block-emoji">⭐</span> 我的收藏</h3>
        <span class="count">{{ favorites.length }}</span>
        <button type="button" class="fav-add-btn" @click="showFavForm = !showFavForm">
          {{ showFavForm ? '✕ 取消' : '＋ 添加收藏' }}
        </button>
      </div>

      <form v-if="showFavForm" class="fav-form" @submit.prevent="submitFav">
        <input v-model="favForm.name" class="field" type="text" placeholder="站点名称 *" />
        <input v-model="favForm.url" class="field" type="text" placeholder="站点地址（如 example.com）*" />
        <input v-model="favForm.icon" class="field fav-form-icon" type="text" placeholder="图标 emoji" />
        <input v-model="favForm.desc" class="field" type="text" placeholder="描述（选填）" />
        <button type="submit" class="btn btn-primary fav-form-submit">添加</button>
        <span v-if="favError" class="fav-form-err">{{ favError }}</span>
      </form>

      <div v-if="favorites.length" class="grid">
        <div v-for="l in favorites" :key="l.url" class="fav-item">
          <LinkCard :link="l" />
          <button
            type="button"
            class="fav-del"
            title="移除收藏"
            aria-label="移除收藏"
            @click="remove(l.url)"
          >
            ✕
          </button>
        </div>
      </div>
      <p v-else class="fav-empty">
        还没有收藏——点击任意导航卡片右上角的 ☆，或“＋ 添加收藏”自定义站点。
      </p>
    </section>

    <!-- 在线工具入口 -->
    <section v-if="!isFiltering" class="block">
      <div class="block-head">
        <h3 id="tools"><span class="block-emoji">🧰</span> 在线工具</h3>
        <RouterLink to="/tools" class="more-link">全部工具 →</RouterLink>
      </div>
      <div class="grid">
        <RouterLink v-for="t in tools" :key="t.id" :to="t.path" class="tool-card">
          <span class="tool-icon">{{ t.emoji }}</span>
          <span class="tool-body">
            <span class="tool-name">{{ t.name }}</span>
            <span class="tool-desc">{{ t.desc }}</span>
          </span>
          <span class="tool-arrow">→</span>
        </RouterLink>
      </div>
    </section>

    <!-- 分类导航 -->
    <section v-for="c in filteredCategories" :key="c.id" class="block">
      <div class="block-head">
        <h3 :id="c.id">
          <span class="block-emoji">{{ c.emoji }}</span> {{ c.title }}
        </h3>
        <span class="count">{{ c.links.length }}</span>
      </div>
      <div class="grid">
        <LinkCard v-for="l in c.links" :key="l.url" :link="l" />
      </div>
    </section>

    <p v-if="isFiltering && !hasResult" class="empty">没有找到与 “{{ keyword }}” 匹配的导航项。</p>
  </div>
</template>

<style scoped>
.home {
  max-width: 1200px;
  margin: 0 auto;
}
.hero {
  margin-bottom: 8px;
}
.hero-title {
  font-size: 28px;
  margin: 4px 0 6px;
}
.hero-sub {
  color: var(--text-soft);
  margin: 0 0 20px;
}
.search {
  position: relative;
  display: flex;
  align-items: center;
  max-width: 560px;
}
.search-source {
  position: absolute;
  left: 6px;
  z-index: 5;
}
.source-btn {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  height: 34px;
  padding: 0 8px 0 10px;
  border: none;
  border-radius: 999px;
  background: var(--bg-soft);
  color: var(--text-soft);
  cursor: pointer;
  transition:
    background 0.15s ease,
    color 0.15s ease;
}
.source-btn:hover {
  background: var(--border);
  color: var(--text);
}
.source-icon {
  font-size: 15px;
}
.source-caret {
  font-size: 10px;
  opacity: 0.7;
}
.source-menu {
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  min-width: 148px;
  margin: 0;
  padding: 6px;
  list-style: none;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--bg-elev);
  box-shadow: var(--shadow-hover);
}
.source-item {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 8px 12px;
  border: none;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--text);
  font-size: 14px;
  text-align: left;
  cursor: pointer;
}
.source-item:hover {
  background: var(--bg-soft);
}
.source-item.active {
  color: var(--primary);
  font-weight: 600;
}
.search-input {
  width: 100%;
  padding: 13px 44px 13px 58px;
  border: 1px solid var(--border);
  border-radius: 999px;
  background: var(--bg-elev);
  color: var(--text);
  font-size: 15px;
  outline: none;
  box-shadow: var(--shadow);
  transition:
    border-color 0.18s ease,
    box-shadow 0.18s ease;
}
.search-input:focus {
  border-color: var(--primary);
  box-shadow: 0 0 0 3px var(--primary-soft);
}
.search-clear {
  position: absolute;
  right: 12px;
  width: 24px;
  height: 24px;
  border: none;
  border-radius: 50%;
  background: var(--bg-soft);
  color: var(--text-soft);
  font-size: 12px;
  cursor: pointer;
}
/* web 模式下搜索按钮占位，清除按钮左移避免重叠 */
.search:has(.search-go) .search-input {
  padding-right: 92px;
}
.search:has(.search-go) .search-clear {
  right: 74px;
}
.search-go {
  position: absolute;
  right: 6px;
  height: 34px;
  padding: 0 16px;
  border: none;
  border-radius: 999px;
  background: var(--primary);
  color: #fff;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}
.search-go:hover {
  filter: brightness(1.05);
}

.block {
  margin-top: 32px;
  scroll-margin-top: 80px;
}
.block-head {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 14px;
}
.block-head h3 {
  font-size: 18px;
  margin: 0;
  scroll-margin-top: 80px;
}
.block-emoji {
  margin-right: 4px;
}
.count {
  font-size: 12px;
  color: var(--text-mute);
  background: var(--bg-soft);
  border-radius: 999px;
  padding: 2px 9px;
}
.more-link {
  margin-left: auto;
  font-size: 13px;
  color: var(--primary);
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 14px;
}

.tool-card {
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
.tool-card:hover {
  transform: translateY(-3px);
  border-color: var(--primary);
  box-shadow: var(--shadow-hover);
}
.tool-icon {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 11px;
  background: var(--primary-soft);
  font-size: 20px;
}
.tool-body {
  display: flex;
  flex-direction: column;
  min-width: 0;
}
.tool-name {
  font-size: 14px;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.tool-desc {
  font-size: 12px;
  color: var(--text-mute);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.tool-arrow {
  margin-left: auto;
  color: var(--text-mute);
  opacity: 0;
  transition: opacity 0.16s ease;
}
.tool-card:hover .tool-arrow {
  opacity: 1;
  color: var(--primary);
}

.empty {
  margin-top: 40px;
  text-align: center;
  color: var(--text-mute);
}

/* ===== 收藏区 ===== */
.fav-add-btn {
  margin-left: auto;
  padding: 5px 12px;
  border: 1px solid var(--border);
  border-radius: 999px;
  background: var(--bg-elev);
  color: var(--text-soft);
  font-size: 13px;
  transition:
    color 0.16s ease,
    border-color 0.16s ease;
}
.fav-add-btn:hover {
  color: var(--primary);
  border-color: var(--primary);
}
.fav-form {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
  margin-bottom: 16px;
  padding: 14px;
  border: 1px dashed var(--border);
  border-radius: var(--radius);
  background: var(--bg-elev);
}
.fav-form .field {
  width: auto;
  flex: 1 1 160px;
}
.fav-form-icon {
  flex: 0 0 96px !important;
}
.fav-form-submit {
  flex: 0 0 auto;
}
.fav-form-err {
  flex-basis: 100%;
  color: #e5484d;
  font-size: 12px;
}
.fav-item {
  position: relative;
}
.fav-del {
  position: absolute;
  top: -6px;
  right: -6px;
  z-index: 2;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border: 1px solid var(--border);
  border-radius: 50%;
  background: var(--bg-elev);
  color: var(--text-mute);
  font-size: 11px;
  line-height: 1;
  opacity: 0;
  box-shadow: var(--shadow);
  transition:
    opacity 0.16s ease,
    color 0.16s ease,
    border-color 0.16s ease;
}
.fav-item:hover .fav-del {
  opacity: 1;
}
.fav-del:hover {
  color: #e5484d;
  border-color: #e5484d;
}
.fav-empty {
  margin: 4px 0 0;
  color: var(--text-mute);
  font-size: 13px;
}
</style>
