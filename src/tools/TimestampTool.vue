<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import ToolShell from '@/components/ToolShell.vue'

const now = ref(Date.now())
let timer: number | undefined

onMounted(() => {
  timer = window.setInterval(() => (now.value = Date.now()), 1000)
})
onUnmounted(() => {
  if (timer) window.clearInterval(timer)
})

const nowSeconds = computed(() => Math.floor(now.value / 1000))

// 时间戳 -> 日期
const tsInput = ref(String(Math.floor(Date.now() / 1000)))
const tsUnit = ref<'s' | 'ms'>('s')

const tsResult = computed(() => {
  const raw = tsInput.value.trim()
  if (!raw || !/^-?\d+$/.test(raw)) return null
  const num = Number(raw)
  const ms = tsUnit.value === 's' ? num * 1000 : num
  const d = new Date(ms)
  if (Number.isNaN(d.getTime())) return null
  return {
    local: formatLocal(d),
    iso: d.toISOString(),
    utc: d.toUTCString(),
  }
})

// 日期 -> 时间戳
const dateInput = ref(toDatetimeLocal(new Date()))
const dateResult = computed(() => {
  const d = new Date(dateInput.value)
  if (Number.isNaN(d.getTime())) return null
  return {
    seconds: Math.floor(d.getTime() / 1000),
    millis: d.getTime(),
  }
})

function formatLocal(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`
}

function toDatetimeLocal(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`
}

function useNow() {
  tsInput.value = tsUnit.value === 's' ? String(nowSeconds.value) : String(now.value)
}
</script>

<template>
  <ToolShell emoji="⏱️" title="时间戳转换" desc="Unix 时间戳与本地/UTC 时间互转。">
    <div class="live">
      当前时间戳（秒）：<code>{{ nowSeconds }}</code>
      <span class="live-ms">毫秒：{{ now }}</span>
    </div>

    <div class="cards">
      <section class="card">
        <h3>时间戳 → 日期</h3>
        <div class="row">
          <input v-model="tsInput" class="field" placeholder="输入时间戳…" />
          <div class="seg">
            <button :class="{ on: tsUnit === 's' }" @click="tsUnit = 's'">秒</button>
            <button :class="{ on: tsUnit === 'ms' }" @click="tsUnit = 'ms'">毫秒</button>
          </div>
          <button class="btn" @click="useNow">此刻</button>
        </div>
        <ul v-if="tsResult" class="result">
          <li>
            <span>本地时间</span><code>{{ tsResult.local }}</code>
          </li>
          <li>
            <span>ISO 8601</span><code>{{ tsResult.iso }}</code>
          </li>
          <li>
            <span>UTC</span><code>{{ tsResult.utc }}</code>
          </li>
        </ul>
        <p v-else class="hint">请输入有效的整数时间戳。</p>
      </section>

      <section class="card">
        <h3>日期 → 时间戳</h3>
        <div class="row">
          <input v-model="dateInput" type="datetime-local" step="1" class="field" />
        </div>
        <ul v-if="dateResult" class="result">
          <li>
            <span>秒</span><code>{{ dateResult.seconds }}</code>
          </li>
          <li>
            <span>毫秒</span><code>{{ dateResult.millis }}</code>
          </li>
        </ul>
        <p v-else class="hint">请选择有效日期时间。</p>
      </section>
    </div>
  </ToolShell>
</template>

<style scoped>
.live {
  padding: 12px 16px;
  border-radius: var(--radius-sm);
  background: var(--primary-soft);
  color: var(--text);
  font-size: 14px;
  margin-bottom: 20px;
}
.live code {
  font-weight: 700;
  color: var(--primary);
}
.live-ms {
  margin-left: 16px;
  color: var(--text-mute);
  font-size: 13px;
}
.cards {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}
.card {
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--bg-elev);
  padding: 18px;
  box-shadow: var(--shadow);
}
.card h3 {
  margin: 0 0 14px;
  font-size: 15px;
}
.row {
  display: flex;
  gap: 8px;
  align-items: center;
}
.seg {
  display: inline-flex;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  overflow: hidden;
}
.seg button {
  border: none;
  background: var(--bg-elev);
  color: var(--text-soft);
  padding: 8px 12px;
  font-size: 13px;
}
.seg button.on {
  background: var(--primary);
  color: #fff;
}
.result {
  list-style: none;
  padding: 0;
  margin: 16px 0 0;
}
.result li {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 9px 0;
  border-bottom: 1px dashed var(--border);
  font-size: 13px;
}
.result li:last-child {
  border-bottom: none;
}
.result span {
  color: var(--text-mute);
}
.result code {
  font-family: ui-monospace, Menlo, Consolas, monospace;
  color: var(--text);
  word-break: break-all;
  text-align: right;
}
.hint {
  margin-top: 16px;
  color: var(--text-mute);
  font-size: 13px;
}

@media (max-width: 720px) {
  .cards {
    grid-template-columns: 1fr;
  }
}
</style>
