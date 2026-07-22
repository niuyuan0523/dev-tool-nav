<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import ToolShell from '@/components/ToolShell.vue'

const pattern = ref('\\b\\w+@\\w+\\.\\w+\\b')
const testText = ref('联系我们：hi@devnav.com 或 support@example.org，其它无效 abc@ 。')

const flags = reactive({
  g: true,
  i: false,
  m: false,
  s: false,
})

const flagStr = computed(() =>
  Object.entries(flags)
    .filter(([, v]) => v)
    .map(([k]) => k)
    .join(''),
)

interface MatchItem {
  match: string
  index: number
  groups: string[]
}

const result = computed<{ error: string; matches: MatchItem[] }>(() => {
  if (!pattern.value) return { error: '', matches: [] }
  let re: RegExp
  try {
    // 匹配收集需要 g 标志，这里补上以遍历全部
    const f = flagStr.value.includes('g') ? flagStr.value : flagStr.value + 'g'
    re = new RegExp(pattern.value, f)
  } catch (e) {
    return { error: e instanceof Error ? e.message : '无效的正则表达式', matches: [] }
  }
  const matches: MatchItem[] = []
  let m: RegExpExecArray | null
  let guard = 0
  while ((m = re.exec(testText.value)) !== null) {
    matches.push({ match: m[0], index: m.index, groups: m.slice(1) })
    if (m.index === re.lastIndex) re.lastIndex++
    if (++guard > 10000) break
  }
  return { error: '', matches }
})

/** 生成带高亮标记的分段，用于渲染匹配结果 */
const segments = computed(() => {
  const text = testText.value
  const ms = result.value.matches
  if (result.value.error || ms.length === 0) {
    return [{ text, hit: false }]
  }
  const parts: { text: string; hit: boolean }[] = []
  let cursor = 0
  for (const m of ms) {
    if (m.index > cursor) parts.push({ text: text.slice(cursor, m.index), hit: false })
    parts.push({ text: text.slice(m.index, m.index + m.match.length), hit: true })
    cursor = m.index + m.match.length
  }
  if (cursor < text.length) parts.push({ text: text.slice(cursor), hit: false })
  return parts
})
</script>

<template>
  <ToolShell emoji="🧪" title="正则表达式测试" desc="实时匹配与高亮，支持 g / i / m / s 常用标志。">
    <div class="pattern-row">
      <span class="slash">/</span>
      <input v-model="pattern" class="field pat" spellcheck="false" placeholder="正则表达式…" />
      <span class="slash">/{{ flagStr }}</span>
    </div>

    <div class="flags">
      <label><input type="checkbox" v-model="flags.g" /> g 全局</label>
      <label><input type="checkbox" v-model="flags.i" /> i 忽略大小写</label>
      <label><input type="checkbox" v-model="flags.m" /> m 多行</label>
      <label><input type="checkbox" v-model="flags.s" /> s 单行(.匹配换行)</label>
    </div>

    <label class="lbl">测试文本</label>
    <textarea
      v-model="testText"
      class="field editor"
      spellcheck="false"
      placeholder="输入用于测试的文本…"
    />

    <p v-if="result.error" class="err">⚠ {{ result.error }}</p>

    <template v-else>
      <div class="preview">
        <div class="preview-head">
          高亮预览
          <span class="badge">{{ result.matches.length }} 处匹配</span>
        </div>
        <p class="preview-body">
          <template v-for="(seg, i) in segments" :key="i">
            <mark v-if="seg.hit">{{ seg.text }}</mark>
            <span v-else>{{ seg.text }}</span>
          </template>
        </p>
      </div>

      <div v-if="result.matches.length" class="matches">
        <div v-for="(m, i) in result.matches" :key="i" class="match-item">
          <span class="m-idx">#{{ i + 1 }}</span>
          <code class="m-val">{{ m.match }}</code>
          <span class="m-pos">位置 {{ m.index }}</span>
          <span v-if="m.groups.length" class="m-groups">
            分组: <code v-for="(g, gi) in m.groups" :key="gi">{{ g ?? '∅' }}</code>
          </span>
        </div>
      </div>
    </template>
  </ToolShell>
</template>

<style scoped>
.pattern-row {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 14px;
}
.slash {
  color: var(--text-mute);
  font-family: ui-monospace, monospace;
  font-size: 16px;
}
.pat {
  font-family: ui-monospace, Menlo, Consolas, monospace;
}
.flags {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin-bottom: 18px;
  font-size: 13px;
  color: var(--text-soft);
}
.flags label {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
}
.lbl {
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-soft);
  margin-bottom: 6px;
}
.editor {
  min-height: 130px;
  font-size: 13px;
}
.preview {
  margin-top: 18px;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  overflow: hidden;
}
.preview-head {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  background: var(--bg-soft);
  font-size: 13px;
  font-weight: 600;
}
.badge {
  font-weight: 500;
  font-size: 12px;
  color: var(--primary);
  background: var(--primary-soft);
  border-radius: 999px;
  padding: 2px 10px;
}
.preview-body {
  margin: 0;
  padding: 14px;
  white-space: pre-wrap;
  word-break: break-word;
  font-size: 14px;
  line-height: 1.8;
}
.preview-body mark {
  background: #fde68a;
  color: #78350f;
  border-radius: 3px;
  padding: 1px 2px;
}
:root[data-theme='dark'] .preview-body mark {
  background: #78600f;
  color: #fef3c7;
}
.matches {
  margin-top: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.match-item {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--bg-elev);
  font-size: 13px;
}
.m-idx {
  color: var(--primary);
  font-weight: 700;
}
.m-val {
  font-family: ui-monospace, monospace;
  background: var(--bg-soft);
  padding: 2px 8px;
  border-radius: 6px;
}
.m-pos {
  color: var(--text-mute);
}
.m-groups code {
  font-family: ui-monospace, monospace;
  margin-left: 4px;
  background: var(--bg-soft);
  padding: 1px 6px;
  border-radius: 5px;
}
.err {
  margin-top: 16px;
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
</style>
