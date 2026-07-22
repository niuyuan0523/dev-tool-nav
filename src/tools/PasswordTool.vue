<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import ToolShell from '@/components/ToolShell.vue'

// ===== 随机密码 =====
const opts = reactive({
  length: 16,
  upper: true,
  lower: true,
  digits: true,
  symbols: true,
  excludeAmbiguous: true, // 排除易混淆字符 O0 l1I 等
})

const password = ref('')
const copiedPwd = ref(false)

const SETS = {
  upper: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  lower: 'abcdefghijklmnopqrstuvwxyz',
  digits: '0123456789',
  symbols: '!@#$%^&*()-_=+[]{};:,.<>?',
}
const AMBIGUOUS = 'O0oIl1|`'

/** 使用 crypto.getRandomValues 做无偏随机选择 */
function pick(chars: string): string {
  const arr = new Uint32Array(1)
  const max = Math.floor(0xffffffff / chars.length) * chars.length
  let v: number
  do {
    crypto.getRandomValues(arr)
    v = arr[0]
  } while (v >= max)
  return chars[v % chars.length]
}

function buildPool(): string {
  let pool = ''
  if (opts.upper) pool += SETS.upper
  if (opts.lower) pool += SETS.lower
  if (opts.digits) pool += SETS.digits
  if (opts.symbols) pool += SETS.symbols
  if (opts.excludeAmbiguous) {
    pool = [...pool].filter((c) => !AMBIGUOUS.includes(c)).join('')
  }
  return pool
}

function generate() {
  const pool = buildPool()
  copiedPwd.value = false
  if (!pool) {
    password.value = ''
    return
  }
  let out = ''
  for (let i = 0; i < opts.length; i++) out += pick(pool)
  password.value = out
}

/** 简易强度评估 */
const strength = computed(() => {
  const p = password.value
  if (!p) return { label: '—', level: 0 }
  let variety = 0
  if (/[A-Z]/.test(p)) variety++
  if (/[a-z]/.test(p)) variety++
  if (/[0-9]/.test(p)) variety++
  if (/[^A-Za-z0-9]/.test(p)) variety++
  const score = p.length * variety
  if (score >= 64) return { label: '很强', level: 4 }
  if (score >= 40) return { label: '强', level: 3 }
  if (score >= 24) return { label: '中等', level: 2 }
  return { label: '弱', level: 1 }
})

async function copyPwd() {
  if (!password.value) return
  await navigator.clipboard.writeText(password.value)
  copiedPwd.value = true
  setTimeout(() => (copiedPwd.value = false), 1500)
}

// ===== UUID v4 =====
const uuids = ref<string[]>([])
const uuidCount = ref(5)

function genUuids() {
  const n = Math.min(50, Math.max(1, uuidCount.value || 1))
  uuids.value = Array.from({ length: n }, () =>
    typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : fallbackUuid(),
  )
}

/** crypto.randomUUID 不可用时的兜底实现 */
function fallbackUuid(): string {
  const b = new Uint8Array(16)
  crypto.getRandomValues(b)
  b[6] = (b[6] & 0x0f) | 0x40
  b[8] = (b[8] & 0x3f) | 0x80
  const hex = [...b].map((x) => x.toString(16).padStart(2, '0'))
  return `${hex.slice(0, 4).join('')}-${hex.slice(4, 6).join('')}-${hex.slice(6, 8).join('')}-${hex.slice(8, 10).join('')}-${hex.slice(10, 16).join('')}`
}

const copiedUuid = ref(false)
async function copyUuids() {
  if (!uuids.value.length) return
  await navigator.clipboard.writeText(uuids.value.join('\n'))
  copiedUuid.value = true
  setTimeout(() => (copiedUuid.value = false), 1500)
}

onMounted(() => {
  generate()
  genUuids()
})
</script>

<template>
  <ToolShell
    emoji="🔑"
    title="密码 & UUID 生成"
    desc="基于 Web Crypto 的安全随机生成，全部本地运行。"
  >
    <!-- 随机密码 -->
    <section class="card">
      <h3>随机密码</h3>
      <div class="pwd-out">
        <input :value="password" class="field pwd" readonly placeholder="点击生成…" />
        <button class="btn" @click="copyPwd">{{ copiedPwd ? '已复制 ✓' : '复制' }}</button>
        <button class="btn btn-primary" @click="generate">重新生成</button>
      </div>

      <div class="strength">
        强度：<b :class="`lv-${strength.level}`">{{ strength.label }}</b>
        <span class="bar"
          ><i :class="`lv-${strength.level}`" :style="{ width: strength.level * 25 + '%' }"
        /></span>
      </div>

      <div class="len">
        <label
          >长度：<b>{{ opts.length }}</b></label
        >
        <input v-model.number="opts.length" type="range" min="6" max="64" @input="generate" />
      </div>

      <div class="checks">
        <label><input type="checkbox" v-model="opts.upper" @change="generate" /> 大写 A-Z</label>
        <label><input type="checkbox" v-model="opts.lower" @change="generate" /> 小写 a-z</label>
        <label><input type="checkbox" v-model="opts.digits" @change="generate" /> 数字 0-9</label>
        <label><input type="checkbox" v-model="opts.symbols" @change="generate" /> 符号 !@#</label>
        <label
          ><input type="checkbox" v-model="opts.excludeAmbiguous" @change="generate" />
          排除易混淆字符</label
        >
      </div>
    </section>

    <!-- UUID -->
    <section class="card">
      <div class="uuid-head">
        <h3>UUID v4</h3>
        <div class="uuid-ctrl">
          <label
            >数量
            <input v-model.number="uuidCount" type="number" min="1" max="50" class="field num"
          /></label>
          <button class="btn btn-primary" @click="genUuids">生成</button>
          <button class="btn" @click="copyUuids">{{ copiedUuid ? '已复制 ✓' : '复制全部' }}</button>
        </div>
      </div>
      <ul class="uuid-list">
        <li v-for="(u, i) in uuids" :key="i">
          <code>{{ u }}</code>
        </li>
      </ul>
    </section>
  </ToolShell>
</template>

<style scoped>
.card {
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--bg-elev);
  padding: 20px;
  box-shadow: var(--shadow);
  margin-bottom: 16px;
}
.card h3 {
  margin: 0 0 14px;
  font-size: 15px;
}
.pwd-out {
  display: flex;
  gap: 10px;
  margin-bottom: 14px;
}
.pwd {
  font-family: ui-monospace, Menlo, Consolas, monospace;
  font-size: 16px;
  letter-spacing: 0.5px;
}
.strength {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 13px;
  color: var(--text-soft);
  margin-bottom: 16px;
}
.strength b.lv-1 {
  color: #ef4444;
}
.strength b.lv-2 {
  color: #f59e0b;
}
.strength b.lv-3 {
  color: #3b82f6;
}
.strength b.lv-4 {
  color: #16a34a;
}
.bar {
  flex: 1;
  max-width: 220px;
  height: 6px;
  background: var(--bg-soft);
  border-radius: 999px;
  overflow: hidden;
}
.bar i {
  display: block;
  height: 100%;
  transition: width 0.2s ease;
}
.bar i.lv-1 {
  background: #ef4444;
}
.bar i.lv-2 {
  background: #f59e0b;
}
.bar i.lv-3 {
  background: #3b82f6;
}
.bar i.lv-4 {
  background: #16a34a;
}
.len {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 14px;
}
.len input[type='range'] {
  flex: 1;
  max-width: 320px;
  accent-color: var(--primary);
}
.checks {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  font-size: 13px;
  color: var(--text-soft);
}
.checks label {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
}
.uuid-head {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}
.uuid-head h3 {
  margin: 0;
}
.uuid-ctrl {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 13px;
  color: var(--text-soft);
}
.num {
  width: 64px;
  display: inline-block;
}
.uuid-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.uuid-list li {
  padding: 8px 12px;
  background: var(--bg-soft);
  border-radius: var(--radius-sm);
}
.uuid-list code {
  font-family: ui-monospace, Menlo, Consolas, monospace;
  font-size: 13px;
  word-break: break-all;
}

@media (max-width: 620px) {
  .pwd-out {
    flex-wrap: wrap;
  }
}
</style>
