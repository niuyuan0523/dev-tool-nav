<script setup lang="ts">
import { computed, ref } from 'vue'
import ToolShell from '@/components/ToolShell.vue'

const decoded = ref('')
const encoded = ref('')
const error = ref('')

function doEncode() {
  error.value = ''
  try {
    encoded.value = encodeURIComponent(decoded.value)
  } catch (e) {
    error.value = e instanceof Error ? e.message : '编码失败'
  }
}

function doDecode() {
  error.value = ''
  try {
    decoded.value = decodeURIComponent(encoded.value.trim())
  } catch {
    error.value = '无法解码：包含非法的百分号转义序列'
  }
}

function clearAll() {
  decoded.value = ''
  encoded.value = ''
  error.value = ''
}

/** 解析查询参数（自动识别 ? 后内容或整串 key=value&... ） */
const params = computed(() => {
  const raw = decoded.value || encoded.value
  if (!raw) return []
  let qs = raw
  const qIdx = raw.indexOf('?')
  if (qIdx >= 0) qs = raw.slice(qIdx + 1)
  const hIdx = qs.indexOf('#')
  if (hIdx >= 0) qs = qs.slice(0, hIdx)
  if (!qs.includes('=')) return []
  try {
    return [...new URLSearchParams(qs).entries()].map(([key, value]) => ({ key, value }))
  } catch {
    return []
  }
})
</script>

<template>
  <ToolShell
    emoji="🔗"
    title="URL 编解码"
    desc="encodeURIComponent / decodeURIComponent 互转，并解析查询参数。"
  >
    <div class="grid">
      <div class="pane">
        <label class="pane-label">原文 / URL</label>
        <textarea
          v-model="decoded"
          class="field editor"
          spellcheck="false"
          placeholder="https://example.com/搜索?q=你好 世界&page=1"
        />
      </div>

      <div class="mid">
        <button class="btn btn-primary" @click="doEncode">编码 ↓</button>
        <button class="btn btn-primary" @click="doDecode">↑ 解码</button>
        <button class="btn" @click="clearAll">清空</button>
      </div>

      <div class="pane">
        <label class="pane-label">编码后</label>
        <textarea
          v-model="encoded"
          class="field editor"
          spellcheck="false"
          placeholder="编码结果…"
        />
      </div>
    </div>

    <p v-if="error" class="err">⚠ {{ error }}</p>

    <section v-if="params.length" class="params">
      <h3>查询参数解析（{{ params.length }}）</h3>
      <table>
        <thead>
          <tr>
            <th>参数名</th>
            <th>值</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(p, i) in params" :key="i">
            <td>
              <code>{{ p.key }}</code>
            </td>
            <td>
              <code>{{ p.value }}</code>
            </td>
          </tr>
        </tbody>
      </table>
    </section>
  </ToolShell>
</template>

<style scoped>
.grid {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  gap: 16px;
  align-items: stretch;
}
.pane {
  display: flex;
  flex-direction: column;
}
.pane-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-soft);
  margin-bottom: 6px;
}
.editor {
  min-height: 200px;
  font-size: 13px;
  flex: 1;
}
.mid {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 10px;
}
.mid .btn {
  justify-content: center;
  white-space: nowrap;
}
.err {
  margin-top: 14px;
  padding: 10px 14px;
  border-radius: var(--radius-sm);
  background: #fef2f2;
  color: #b91c1c;
  font-size: 13px;
}
:root[data-theme='dark'] .err {
  background: #2a1414;
  color: #fca5a5;
}
.params {
  margin-top: 22px;
}
.params h3 {
  font-size: 15px;
  margin: 0 0 12px;
}
table {
  width: 100%;
  border-collapse: collapse;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  overflow: hidden;
  font-size: 13px;
}
th,
td {
  text-align: left;
  padding: 10px 14px;
  border-bottom: 1px solid var(--border);
}
th {
  background: var(--bg-soft);
  color: var(--text-soft);
  font-weight: 600;
}
tr:last-child td {
  border-bottom: none;
}
td code {
  font-family: ui-monospace, Menlo, Consolas, monospace;
  word-break: break-all;
}

@media (max-width: 720px) {
  .grid {
    grid-template-columns: 1fr;
  }
  .mid {
    flex-direction: row;
    flex-wrap: wrap;
  }
}
</style>
