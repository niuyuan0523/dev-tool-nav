<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import ToolShell from '@/components/ToolShell.vue'

interface Zone {
  city: string
  tz: string
}

// 预置常用时区
const zones: Zone[] = [
  { city: '北京 / 上海', tz: 'Asia/Shanghai' },
  { city: '东京', tz: 'Asia/Tokyo' },
  { city: '新加坡', tz: 'Asia/Singapore' },
  { city: '迪拜', tz: 'Asia/Dubai' },
  { city: '伦敦', tz: 'Europe/London' },
  { city: '巴黎 / 柏林', tz: 'Europe/Paris' },
  { city: '纽约', tz: 'America/New_York' },
  { city: '洛杉矶', tz: 'America/Los_Angeles' },
  { city: '悉尼', tz: 'Australia/Sydney' },
  { city: 'UTC', tz: 'UTC' },
]

const now = ref(new Date())
let timer: number | undefined

const localZone = Intl.DateTimeFormat().resolvedOptions().timeZone

function timeIn(tz: string): string {
  return new Intl.DateTimeFormat('zh-CN', {
    timeZone: tz,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(now.value)
}

function dateIn(tz: string): string {
  return new Intl.DateTimeFormat('zh-CN', {
    timeZone: tz,
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  }).format(now.value)
}

/** 相对本地时区的偏移小时数（正数表示更快） */
function offsetLabel(tz: string): string {
  const d = now.value
  const asTz = new Date(d.toLocaleString('en-US', { timeZone: tz }))
  const asLocal = new Date(d.toLocaleString('en-US', { timeZone: localZone }))
  const diff = Math.round((asTz.getTime() - asLocal.getTime()) / 3600000)
  if (diff === 0) return '与本地相同'
  return diff > 0 ? `本地 +${diff}h` : `本地 ${diff}h`
}

onMounted(() => {
  timer = window.setInterval(() => (now.value = new Date()), 1000)
})
onUnmounted(() => {
  if (timer) window.clearInterval(timer)
})
</script>

<template>
  <ToolShell emoji="🌐" title="世界时间" desc="常用时区实时对照，含与本地时区的时差。">
    <p class="local">
      本地时区：<code>{{ localZone }}</code>
    </p>
    <div class="grid">
      <div v-for="z in zones" :key="z.tz" class="clock">
        <div class="clock-head">
          <span class="city">{{ z.city }}</span>
          <span class="offset">{{ offsetLabel(z.tz) }}</span>
        </div>
        <div class="time">{{ timeIn(z.tz) }}</div>
        <div class="date">{{ dateIn(z.tz) }}</div>
      </div>
    </div>
  </ToolShell>
</template>

<style scoped>
.local {
  margin: 0 0 18px;
  font-size: 13px;
  color: var(--text-soft);
}
.local code {
  color: var(--primary);
  font-family: ui-monospace, monospace;
}
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(230px, 1fr));
  gap: 14px;
}
.clock {
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--bg-elev);
  padding: 18px;
  box-shadow: var(--shadow);
  transition:
    transform 0.16s ease,
    box-shadow 0.16s ease;
}
.clock:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-hover);
}
.clock-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 10px;
}
.city {
  font-weight: 600;
  font-size: 14px;
}
.offset {
  font-size: 11px;
  color: var(--text-mute);
  background: var(--bg-soft);
  border-radius: 999px;
  padding: 2px 8px;
  white-space: nowrap;
}
.time {
  font-family: ui-monospace, Menlo, Consolas, monospace;
  font-size: 30px;
  font-weight: 700;
  color: var(--primary);
  line-height: 1.1;
}
.date {
  margin-top: 4px;
  font-size: 12px;
  color: var(--text-mute);
}
</style>
