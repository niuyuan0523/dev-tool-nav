<script setup lang="ts">
import { ref } from 'vue'
import ToolShell from '@/components/ToolShell.vue'

const text = ref('')
const encoded = ref('')
const error = ref('')

/** UTF-8 安全的 Base64 编码（支持中文） */
function encode() {
  error.value = ''
  try {
    const bytes = new TextEncoder().encode(text.value)
    let binary = ''
    bytes.forEach((b) => (binary += String.fromCharCode(b)))
    encoded.value = btoa(binary)
  } catch (e) {
    error.value = e instanceof Error ? e.message : '编码失败'
  }
}

/** UTF-8 安全的 Base64 解码 */
function decode() {
  error.value = ''
  try {
    const binary = atob(encoded.value.trim())
    const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0))
    text.value = new TextDecoder().decode(bytes)
  } catch {
    error.value = '无效的 Base64 字符串'
  }
}

function swap() {
  const t = text.value
  text.value = encoded.value
  encoded.value = t
}

function clearAll() {
  text.value = ''
  encoded.value = ''
  error.value = ''
}
</script>

<template>
  <ToolShell emoji="🔐" title="Base64 编解码" desc="文本与 Base64 互转，UTF-8 安全，完整支持中文。">
    <div class="grid">
      <div class="pane">
        <label class="pane-label">明文 / 文本</label>
        <textarea
          v-model="text"
          class="field editor"
          spellcheck="false"
          placeholder="输入要编码的文本…"
        />
      </div>

      <div class="mid">
        <button class="btn btn-primary" @click="encode">编码 ↓</button>
        <button class="btn btn-primary" @click="decode">↑ 解码</button>
        <button class="btn" @click="swap">⇅ 互换</button>
        <button class="btn" @click="clearAll">清空</button>
      </div>

      <div class="pane">
        <label class="pane-label">Base64</label>
        <textarea
          v-model="encoded"
          class="field editor"
          spellcheck="false"
          placeholder="Base64 字符串…"
        />
      </div>
    </div>

    <p v-if="error" class="err">⚠ {{ error }}</p>
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
  min-height: 320px;
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

@media (max-width: 720px) {
  .grid {
    grid-template-columns: 1fr;
  }
  .mid {
    flex-direction: row;
    flex-wrap: wrap;
  }
  .editor {
    min-height: 180px;
  }
}
</style>
