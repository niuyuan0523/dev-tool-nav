import { computed, ref } from 'vue'
import type { NavLink } from '@/types'

/**
 * 收藏站点管理（localStorage 持久化）。
 * - 支持收藏内置导航项，也支持用户自定义收藏站点（custom 标记）。
 * - favorites 为模块级单例响应式数组，跨组件共享同一份状态。
 */
export interface FavoriteLink extends NavLink {
  /** 是否为用户手动添加的自定义站点 */
  custom?: boolean
}

const STORAGE_KEY = 'devnav-favorites'

function load(): FavoriteLink[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const arr = JSON.parse(raw)
    return Array.isArray(arr) ? arr.filter((x) => x && typeof x.url === 'string') : []
  } catch {
    return []
  }
}

const favorites = ref<FavoriteLink[]>(load())

function persist() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites.value))
}

/** 规范化 URL，补全协议，便于比对与打开 */
function normalizeUrl(url: string): string {
  const u = url.trim()
  if (!u) return ''
  return /^https?:\/\//i.test(u) ? u : `https://${u}`
}

export function useFavorites() {
  const isFavorite = (url: string) => favorites.value.some((f) => f.url === url)

  const add = (link: FavoriteLink) => {
    if (!link.url || isFavorite(link.url)) return
    favorites.value.push({ ...link })
    persist()
  }

  const remove = (url: string) => {
    favorites.value = favorites.value.filter((f) => f.url !== url)
    persist()
  }

  const toggle = (link: FavoriteLink) => {
    if (isFavorite(link.url)) remove(link.url)
    else add(link)
  }

  /** 添加自定义站点，返回是否成功（URL 非空且未重复） */
  const addCustom = (input: { name: string; url: string; desc?: string; icon?: string }) => {
    const url = normalizeUrl(input.url)
    const name = input.name.trim()
    if (!url || !name || isFavorite(url)) return false
    favorites.value.push({
      name,
      url,
      desc: input.desc?.trim() || undefined,
      icon: input.icon?.trim() || '⭐',
      custom: true,
    })
    persist()
    return true
  }

  /** 编辑收藏站点，返回是否成功（名称、URL 非空且不与其它收藏重复） */
  const update = (
    originalUrl: string,
    input: { name: string; url: string; desc?: string; icon?: string },
  ) => {
    const idx = favorites.value.findIndex((f) => f.url === originalUrl)
    if (idx === -1) return false
    const url = normalizeUrl(input.url)
    const name = input.name.trim()
    if (!url || !name) return false
    if (url !== originalUrl && isFavorite(url)) return false
    favorites.value[idx] = {
      ...favorites.value[idx],
      name,
      url,
      desc: input.desc?.trim() || undefined,
      icon: input.icon?.trim() || '⭐',
    }
    persist()
    return true
  }

  return {
    favorites: computed(() => favorites.value),
    isFavorite,
    add,
    remove,
    toggle,
    addCustom,
    update,
  }
}
