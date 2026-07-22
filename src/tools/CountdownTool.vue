<script setup lang="ts">
import { computed, onUnmounted, ref } from 'vue'
import ToolShell from '@/components/ToolShell.vue'

// 目标时间输入（datetime-local）
function defaultTarget(): string {
  const d = new Date(Date.now() + 5 * 60 * 1000)
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`
}

const targetInput = ref(defaultTarget())
const remaining = ref(0) // 剩余毫秒
const running = ref(false)
const finished = ref(false)
let timer: number | undefined

const parts = computed(() => {
  const total = Math.max(0, remaining.value)
  const s = Math.floor(total / 1000)
  return {
    days: Math.floor(s / 86400),
    hours: Math.floor((s % 86400) / 3600),
    minutes: Math.floor((s % 3600) / 60),
    seconds: s % 60,
  }
})

function tick() {
  const target = new Date(targetInput.value).getTime()
  remaining.value = target - Date.now()
  if (remaining.value <= 0) {
    remaining.value = 0
    stop()
    finished.value = true
  }
}

function start() {
  const target = new Date(targetInput.value).getTime()
  if (Number.isNaN(target)) return
  finished.value = false
  running.value = true
  tick()
  timer = window.setInterval(tick, 250)
}

function stop() {
  running.value = false
  if (timer) {
    window.clearInterval(timer)
    timer = undefined
  }
}

function reset() {
  stop()
  finished.value = false
  remaining.value = 0
}

/** 快捷计时器：从现在起 N 分钟 */
function quick(minutes: number) {
  const d = new Date(Date.now() + minutes * 60 * 1000)
  const p = (n: number) => String(n).padStart(2, '0')
  targetInput.value = `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`
  start()
}

const pad = (n: number) => String(n).padStart(2, '0')

onUnmounted(stop)
</script>

<template>
  <ToolShell emoji="⏳" title="倒计时" desc="设置目标时间进行倒计时，或使用快捷计时器。">
    <div class="setup">
      <input v-model="targetInput" type="datetime-local" step="1" class="field target" />
      <button v-if="!running" class="btn btn-primary" @click="start">开始</button>
      <button v-else class="btn" @click="stop">暂停</button>
      <button class="btn" @click="reset">重置</button>
    </div>

    <div class="quick">
      <span class="quick-label">快捷：</span>
      <button class="chip" @click="quick(1)">1 分钟</button>
      <button class="chip" @click="quick(5)">5 分钟</button>
      <button class="chip" @click="quick(10)">10 分钟</button>
      <button class="chip" @click="quick(25)">25 分钟（番茄钟）</button>
      <button class="chip" @click="quick(60)">1 小时</button>
    </div>

    <div class="display" :class="{ done: finished }">
      <div class="unit">
        <span class="num">{{ pad(parts.days) }}</span>
        <span class="lbl">天</span>
      </div>
      <span class="colon">:</span>
      <div class="unit">
        <span class="num">{{ pad(parts.hours) }}</span>
        <span class="lbl">时</span>
      </div>
      <span class="colon">:</span>
      <div class="unit">
        <span class="num">{{ pad(parts.minutes) }}</span>
        <span class="lbl">分</span>
      </div>
      <span class="colon">:</span>
      <div class="unit">
        <span class="num">{{ pad(parts.seconds) }}</span>
        <span class="lbl">秒</span>
      </div>
    </div>

    <p v-if="finished" class="done-tip">⏰ 时间到！</p>
  </ToolShell>
</template>

<style scoped>
.setup {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
  margin-bottom: 14px;
}
.target {
  max-width: 260px;
}
.quick {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin-bottom: 26px;
}
.quick-label {
  font-size: 13px;
  color: var(--text-mute);
}
.chip {
  border: 1px solid var(--border);
  background: var(--bg-elev);
  color: var(--text-soft);
  border-radius: 999px;
  padding: 6px 14px;
  font-size: 13px;
  transition: all 0.15s ease;
}
.chip:hover {
  border-color: var(--primary);
  color: var(--primary);
}
.display {
  display: flex;
  align-items: flex-end;
  justify-content: center;
  gap: 12px;
  padding: 40px 20px;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: linear-gradient(160deg, var(--primary-soft), var(--bg-elev) 75%);
  box-shadow: var(--shadow);
}
.display.done {
  animation: pulse 0.6s ease infinite alternate;
}
@keyframes pulse {
  to {
    box-shadow: var(--shadow-hover);
  }
}
.unit {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}
.num {
  font-family: ui-monospace, Menlo, Consolas, monospace;
  font-size: 56px;
  font-weight: 700;
  line-height: 1;
  color: var(--primary);
}
.lbl {
  font-size: 13px;
  color: var(--text-mute);
}
.colon {
  font-size: 44px;
  font-weight: 700;
  color: var(--text-mute);
  padding-bottom: 22px;
}
.done-tip {
  margin-top: 18px;
  text-align: center;
  font-size: 18px;
  font-weight: 600;
  color: var(--primary);
}

@media (max-width: 620px) {
  .num {
    font-size: 38px;
  }
  .colon {
    font-size: 30px;
    padding-bottom: 18px;
  }
}
</style>
