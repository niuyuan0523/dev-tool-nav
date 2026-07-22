<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterView } from 'vue-router'
import AppSidebar from '@/components/AppSidebar.vue'

const theme = ref<'light' | 'dark'>('light')
const sidebarOpen = ref(false)
const collapsed = ref(false)

interface Weather {
  temp: number
  code: number
  city: string
}
const weather = ref<Weather | null>(null)
const weatherError = ref(false)

/** WMO weather code → 图标与中文描述 */
const WEATHER_MAP: Record<number, { icon: string; label: string }> = {
  0: { icon: '☀️', label: '晴' },
  1: { icon: '🌤️', label: '晴间多云' },
  2: { icon: '⛅', label: '多云' },
  3: { icon: '☁️', label: '阴' },
  45: { icon: '🌫️', label: '雾' },
  48: { icon: '🌫️', label: '雾凇' },
  51: { icon: '🌦️', label: '小毛雨' },
  53: { icon: '🌦️', label: '毛雨' },
  55: { icon: '🌦️', label: '大毛雨' },
  61: { icon: '🌧️', label: '小雨' },
  63: { icon: '🌧️', label: '中雨' },
  65: { icon: '🌧️', label: '大雨' },
  66: { icon: '🌧️', label: '冻雨' },
  67: { icon: '🌧️', label: '强冻雨' },
  71: { icon: '🌨️', label: '小雪' },
  73: { icon: '🌨️', label: '中雪' },
  75: { icon: '🌨️', label: '大雪' },
  77: { icon: '🌨️', label: '雪粒' },
  80: { icon: '🌦️', label: '阵雨' },
  81: { icon: '🌦️', label: '强阵雨' },
  82: { icon: '⛈️', label: '暴雨' },
  85: { icon: '🌨️', label: '阵雪' },
  86: { icon: '🌨️', label: '强阵雪' },
  95: { icon: '⛈️', label: '雷雨' },
  96: { icon: '⛈️', label: '雷雨伴冰雹' },
  99: { icon: '⛈️', label: '强雷雨冰雹' },
}
const weatherInfo = computed(() =>
  weather.value ? (WEATHER_MAP[weather.value.code] ?? { icon: '🌡️', label: '' }) : null,
)

function applyTheme(t: 'light' | 'dark') {
  theme.value = t
  document.documentElement.setAttribute('data-theme', t)
  localStorage.setItem('devnav-theme', t)
}

function toggleTheme() {
  applyTheme(theme.value === 'light' ? 'dark' : 'light')
}

function toggleCollapse() {
  collapsed.value = !collapsed.value
  localStorage.setItem('devnav-collapsed', String(collapsed.value))
}

/** Open-Meteo 免费无 Key 天气接口 */
async function fetchWeather(lat: number, lon: number, city: string) {
  try {
    const res = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code`,
    )
    const data = await res.json()
    weather.value = {
      temp: Math.round(data.current.temperature_2m),
      code: data.current.weather_code,
      city,
    }
  } catch {
    weatherError.value = true
  }
}

/** BigDataCloud 免费无 Key 逆地理编码，取城市名 */
async function reverseCity(lat: number, lon: number): Promise<string> {
  try {
    const res = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=zh`,
    )
    const d = await res.json()
    return d.city || d.locality || d.principalSubdivision || ''
  } catch {
    return ''
  }
}

function loadWeather() {
  const fallback = () => fetchWeather(39.9042, 116.4074, '北京')
  if (!navigator.geolocation) return fallback()
  navigator.geolocation.getCurrentPosition(
    async (pos) => {
      const { latitude, longitude } = pos.coords
      const city = await reverseCity(latitude, longitude)
      fetchWeather(latitude, longitude, city || '当前位置')
    },
    () => fallback(),
    { timeout: 8000, maximumAge: 600000 },
  )
}

onMounted(() => {
  const saved = localStorage.getItem('devnav-theme') as 'light' | 'dark' | null
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  applyTheme(saved ?? (prefersDark ? 'dark' : 'light'))
  collapsed.value = localStorage.getItem('devnav-collapsed') === 'true'
  loadWeather()
})
</script>

<template>
  <div
    class="app-shell"
    :class="{ collapsed }"
    :style="collapsed ? { '--sidebar-w': 'var(--sidebar-w-collapsed)' } : undefined"
  >
    <AppSidebar
      :open="sidebarOpen"
      :collapsed="collapsed"
      @close="sidebarOpen = false"
      @toggle-collapse="toggleCollapse"
    />

    <div v-if="sidebarOpen" class="scrim" @click="sidebarOpen = false" />

    <div class="main">
      <header class="topbar">
        <button class="icon-btn menu-btn" aria-label="菜单" @click="sidebarOpen = true">☰</button>
        <div v-if="weather" class="weather" :title="`${weatherInfo?.label} · ${weather.city}`">
          <span class="weather-icon">{{ weatherInfo?.icon }}</span>
          <span class="weather-temp">{{ weather.temp }}°C</span>
          <span class="weather-meta">{{ weatherInfo?.label }} · {{ weather.city }}</span>
        </div>
        <span v-else class="weather weather-loading">
          {{ weatherError ? '天气获取失败' : '获取天气中…' }}
        </span>
        <div class="spacer" />
        <a
          class="icon-btn"
          href="https://github.com/"
          target="_blank"
          rel="noreferrer"
          title="GitHub"
          >🐙</a
        >
        <button
          class="icon-btn"
          :title="theme === 'light' ? '切换到深色' : '切换到浅色'"
          @click="toggleTheme"
        >
          {{ theme === 'light' ? '🌙' : '☀️' }}
        </button>
      </header>

      <main class="content">
        <RouterView v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </RouterView>
      </main>
    </div>
  </div>
</template>

<style scoped>
.app-shell {
  display: flex;
  min-height: 100vh;
}

.main {
  flex: 1;
  min-width: 0;
  margin-left: var(--sidebar-w);
  display: flex;
  flex-direction: column;
  transition: margin-left 0.24s ease;
}

.topbar {
  position: sticky;
  top: 0;
  z-index: 20;
  height: var(--header-h);
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 24px;
  background: color-mix(in srgb, var(--bg) 82%, transparent);
  backdrop-filter: saturate(180%) blur(12px);
  border-bottom: 1px solid var(--border);
}

.weather {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  height: 38px;
}
.weather-icon {
  font-size: 18px;
  line-height: 1;
}
.weather-temp {
  font-size: 15px;
  font-weight: 600;
}
.weather-meta {
  font-size: 12px;
  color: var(--text-mute);
}
.weather-loading {
  color: var(--text-mute);
  font-size: 13px;
}

.spacer {
  flex: 1;
}

.icon-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--bg-elev);
  font-size: 16px;
  color: var(--text);
  transition: all 0.18s ease;
}
.icon-btn:hover {
  border-color: var(--primary);
  transform: translateY(-1px);
}

.menu-btn {
  display: none;
}

.content {
  padding: 28px;
  flex: 1;
}

.scrim {
  display: none;
}

.fade-enter-active,
.fade-leave-active {
  transition:
    opacity 0.18s ease,
    transform 0.18s ease;
}
.fade-enter-from {
  opacity: 0;
  transform: translateY(6px);
}
.fade-leave-to {
  opacity: 0;
}

@media (max-width: 860px) {
  .main {
    margin-left: 0;
  }
  .menu-btn {
    display: inline-flex;
  }
  .scrim {
    display: block;
    position: fixed;
    inset: 0;
    z-index: 40;
    background: rgba(0, 0, 0, 0.45);
  }
  .content {
    padding: 18px;
  }
  .weather-meta {
    display: none;
  }
}
</style>
