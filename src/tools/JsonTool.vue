<script setup lang="ts">
import { ref } from 'vue'
import ToolShell from '@/components/ToolShell.vue'

const input = ref('')
const output = ref('')
const error = ref('')
const copied = ref(false)

function format(indent: number | 0) {
  error.value = ''
  copied.value = false
  if (!input.value.trim()) {
    output.value = ''
    return
  }
  try {
    const parsed = JSON.parse(input.value)
    output.value = JSON.stringify(parsed, null, indent)
  } catch (e) {
    output.value = ''
    error.value = e instanceof Error ? e.message : '无效的 JSON'
  }
}

function beautify() {
  format(2)
}

function minify() {
  format(0)
}

function clearAll() {
  input.value = ''
  output.value = ''
  error.value = ''
  copied.value = false
}

async function copyOutput() {
  if (!output.value) return
  await navigator.clipboard.writeText(output.value)
  copied.value = true
  setTimeout(() => (copied.value = false), 1500)
}

const sample = '{"name":"DevNav","version":1,"tags":["vue","vite","ts"],"nested":{"ok":true}}'
function loadSample() {
  input.value = sample
  beautify()
}
</script>

<template>
  <ToolShell
    emoji="🧾"
    title="JSON 格式化 / 校验"
    desc="美化、压缩与语法校验 JSON，本地运行，数据不外传。"
  >
    <div class="toolbar">
      <button class="btn btn-primary" @click="beautify">美化 (缩进 2)</button>
      <button class="btn" @click="minify">压缩</button>
      <button class="btn" @click="loadSample">示例</button>
      <button class="btn" @click="clearAll">清空</button>
    </div>

    <div class="panes">
      <div class="pane">
        <label class="pane-label">输入</label>
        <textarea
          v-model="input"
          class="field editor"
          spellcheck="false"
          placeholder="在此粘贴 JSON…"
          @input="error = ''"
        />
      </div>
      <div class="pane">
        <div class="pane-head">
          <label class="pane-label">结果</label>
          <button v-if="output" class="mini" @click="copyOutput">
            {{ copied ? '已复制 ✓' : '复制' }}
          </button>
        </div>
        <textarea :value="output" class="field editor" readonly placeholder="格式化结果显示在此…" />
      </div>
    </div>

    <p v-if="error" class="err">⚠ {{ error }}</p>
    <p v-else-if="output" class="ok">✓ JSON 格式有效</p>
  </ToolShell>
</template>

<style scoped>
.toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 14px;
}
.panes {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}
.pane {
  display: flex;
  flex-direction: column;
}
.pane-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.pane-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-soft);
  margin-bottom: 6px;
}
.editor {
  min-height: 380px;
  font-size: 13px;
}
.mini {
  border: 1px solid var(--border);
  background: var(--bg-elev);
  color: var(--text-soft);
  border-radius: 8px;
  padding: 3px 10px;
  font-size: 12px;
  margin-bottom: 6px;
}
.mini:hover {
  color: var(--primary);
  border-color: var(--primary);
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
.ok {
  margin-top: 14px;
  color: #16a34a;
  font-size: 13px;
}

@media (max-width: 720px) {
  .panes {
    grid-template-columns: 1fr;
  }
  .editor {
    min-height: 220px;
  }
}
</style>
