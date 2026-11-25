<script setup lang="ts">
import { ref } from 'vue'
import ToolShell from '@/components/ToolShell.vue'

/* ---------------- 类型定义 ---------------- */

/** YApi / Swagger 风格 JSON Schema 节点 */
interface SchemaNode {
  type?: string
  title?: string
  description?: string
  properties?: Record<string, SchemaNode>
  items?: SchemaNode
  required?: unknown
  enum?: unknown[]
}

/** YApi 接口详情(/api/interface/get 返回的 data)中用到的字段 */
interface YapiInterface {
  title?: string
  method?: string
  path?: string
  query_path?: { path?: string }
  req_query?: YapiReqQuery[]
  res_body?: string
}

interface YapiReqQuery {
  name: string
  desc?: string
  required?: string | number
  example?: string
}

/* ---------------- 通用小工具 ---------------- */

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

/** 名称段 → PascalCase(过滤非法字符,用于拼接类型名) */
function pascalName(s: string): string {
  const parts = String(s)
    .split(/[^A-Za-z0-9]+/)
    .filter(Boolean)
  let r = parts.map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join('')
  if (!r) r = 'Nested'
  if (/^\d/.test(r)) r = `N${r}`
  return r
}

/** 非法标识符的字段名加引号 */
function safeKey(k: string): string {
  return /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(k) ? k : JSON.stringify(k)
}

/** 描述文本 → 单行 JSDoc,空描述返回空串 */
function jsDoc(desc: string): string {
  const text = desc.replace(/\s+/g, ' ').trim()
  return text ? `/** ${text} */` : ''
}

/* ---------------- interface 生成器 ---------------- */

/**
 * 收集并输出 TypeScript interface 定义。
 * 两种输入:YApi JSON Schema 节点(schemaType)、普通 JSON 值(valueType)。
 * 嵌套对象生成独立命名 interface,重名自动追加序号。
 */
class InterfaceEmitter {
  private defs: string[] = []
  private usedNames = new Set<string>()
  private pathCache = new Map<string, string>()

  private uniqueName(base: string): string {
    let name = base
    let i = 2
    while (this.usedNames.has(name)) name = `${base}${i++}`
    this.usedNames.add(name)
    return name
  }

  /** 输出收集到的定义(根 interface 在前) */
  finish(): string[] {
    return [...this.defs].reverse()
  }

  /* ---- YApi JSON Schema ---- */

  /** schema 节点 → TS 类型;对象节点生成 interface 并返回其名称 */
  schemaType(node: SchemaNode | undefined, name: string): string {
    if (!node || typeof node !== 'object') return 'unknown'
    const t = String(node.type || '').toLowerCase()
    if (t === 'array') {
      const elem = this.schemaType(node.items, `${name}Item`)
      return elem.includes('|') ? `Array<${elem}>` : `${elem}[]`
    }
    if (t === 'object' || (!t && node.properties)) {
      if (!node.properties) return 'Record<string, unknown>'
      const iface = this.uniqueName(name)
      this.emitSchemaIface(iface, node)
      return iface
    }
    return schemaScalarType(node)
  }

  private emitSchemaIface(name: string, node: SchemaNode): void {
    const required = Array.isArray(node.required) ? node.required.map(String) : []
    const lines: string[] = []
    for (const [key, sub] of Object.entries(node.properties ?? {})) {
      const type = this.schemaType(sub, name + pascalName(key))
      const opt = required.includes(key) ? '' : '?'
      const doc = jsDoc(sub.description || sub.title || '')
      if (doc) lines.push(`  ${doc}`)
      lines.push(`  ${safeKey(key)}${opt}: ${type}`)
    }
    this.defs.push(`export interface ${name} {\n${lines.join('\n')}\n}`)
  }

  /* ---- 普通 JSON ---- */

  /** JSON 值 → TS 类型;对象生成 interface,同路径只生成一次 */
  valueType(value: unknown, name: string, path: string): string {
    if (value === null) return 'null'
    if (Array.isArray(value)) {
      const elem = this.arrayElemType(value, name, path)
      return elem.includes('|') ? `Array<${elem}>` : `${elem}[]`
    }
    if (isPlainObject(value)) {
      const cached = this.pathCache.get(path)
      if (cached) return cached
      const iface = this.uniqueName(name)
      this.pathCache.set(path, iface)
      this.emitObjectIface(iface, value, path)
      return iface
    }
    return typeof value
  }

  private emitObjectIface(name: string, obj: Record<string, unknown>, path: string): void {
    const lines: string[] = []
    for (const [key, v] of Object.entries(obj)) {
      const type = this.valueType(v, name + pascalName(key), `${path}.${key}`)
      lines.push(`  ${safeKey(key)}: ${type}`)
    }
    this.defs.push(`export interface ${name} {\n${lines.join('\n')}\n}`)
  }

  /** 数组元素类型:对象元素合并字段(缺失字段标可选),标量元素去重联合 */
  private arrayElemType(arr: unknown[], name: string, path: string): string {
    const objs = arr.filter(isPlainObject)
    const rest = arr.filter((x) => !isPlainObject(x))
    const parts: string[] = []
    if (objs.length) parts.push(this.emitMergedIface(`${name}Item`, objs, path))
    for (const v of rest) {
      const t = this.valueType(v, name, path)
      if (!parts.includes(t)) parts.push(t)
    }
    return parts.length ? parts.join(' | ') : 'unknown'
  }

  private emitMergedIface(name: string, objs: Record<string, unknown>[], path: string): string {
    const iface = this.uniqueName(name)
    const keys = [...new Set(objs.flatMap((o) => Object.keys(o)))]
    const lines: string[] = []
    for (const key of keys) {
      const present = objs.filter((o) => key in o)
      const opt = present.length < objs.length ? '?' : ''
      const types = [
        ...new Set(
          present.map((o) => this.valueType(o[key], iface + pascalName(key), `${path}[].${key}`)),
        ),
      ]
      lines.push(`  ${safeKey(key)}${opt}: ${types.join(' | ')}`)
    }
    this.defs.push(`export interface ${iface} {\n${lines.join('\n')}\n}`)
    return iface
  }
}

/** schema 标量节点 → TS 类型 */
function schemaScalarType(node: SchemaNode): string {
  const t = String(node.type || '').toLowerCase()
  if (Array.isArray(node.enum) && node.enum.length) {
    const lits = node.enum.map((v) => (typeof v === 'string' ? `'${v}'` : String(v)))
    if (lits.length) return lits.join(' | ')
  }
  if (['integer', 'number', 'int', 'long', 'float', 'double'].includes(t)) return 'number'
  if (t === 'boolean') return 'boolean'
  if (t === 'null') return 'null'
  return 'string'
}

/* ---------------- JSON 输入的 schema 形态识别 ---------------- */

/** schema 节点 type 的合法取值 */
const SCHEMA_TYPE_NAMES = new Set([
  'string',
  'integer',
  'number',
  'int',
  'long',
  'float',
  'double',
  'boolean',
  'object',
  'array',
  'null',
])

/** schema 节点上允许出现的键 */
const SCHEMA_NODE_KEYS = new Set([
  'type',
  'properties',
  'items',
  'required',
  'description',
  'title',
  'enum',
])

/** 判断 JSON 值是否长得像 schema 节点(键全部为 schema 键,且 type 取值合法) */
function looksLikeSchemaNode(v: unknown): boolean {
  if (!isPlainObject(v)) return false
  const keys = Object.keys(v)
  if (!keys.length) return false
  if (!keys.every((k) => SCHEMA_NODE_KEYS.has(k))) return false
  if (!('type' in v || 'properties' in v || 'items' in v)) return false
  const t = v.type
  return t === undefined || SCHEMA_TYPE_NAMES.has(String(t).toLowerCase())
}

/**
 * 识别 schema 形态输入,返回规整后的根节点;普通业务 JSON 返回 null。
 * - properties 字典:字段值均为 schema 节点(如 YApi res_body 剥出的属性集)
 * - 完整 schema 节点:{ type: 'object', properties: {...} } / { type: 'array', items: {...} }
 */
function asSchemaRoot(value: unknown): SchemaNode | null {
  if (!isPlainObject(value)) return null
  // 完整节点必须带结构键(properties / items),避免普通 {"type":"xxx"} 误判
  if (looksLikeSchemaNode(value) && ('properties' in value || 'items' in value)) {
    return value as unknown as SchemaNode
  }
  const entries = Object.entries(value)
  if (entries.length && entries.every(([, v]) => looksLikeSchemaNode(v))) {
    return { type: 'object', properties: value as unknown as Record<string, SchemaNode> }
  }
  return null
}

/* ---------------- YApi 结果组装 ---------------- */

/** req_query → 请求参数 interface;无参数返回空串 */
function reqQueryToInterface(list: YapiReqQuery[] | undefined): string {
  if (!list?.length) return ''
  const lines = list.map((q) => {
    const desc = [
      String(q.desc || '')
        .replace(/\s+/g, ' ')
        .trim(),
      q.example != null && String(q.example) !== '' ? `示例: ${q.example}` : '',
    ]
      .filter(Boolean)
      .join(' | ')
    const doc = desc ? `  /** ${desc} */\n` : ''
    const required = String(q.required) === '1'
    return `${doc}  ${safeKey(q.name)}${required ? '' : '?'}: string`
  })
  return `export interface IApiParams {\n${lines.join('\n')}\n}`
}

/** 把 YApi 接口数据整理为:URL 注释 + 请求参数 interface + 返回数据 interface */
function buildYapiResult(d: YapiInterface): string {
  const method = (d.method || 'GET').toUpperCase()
  const url = d.query_path?.path || d.path || ''
  const blocks: string[] = [`/** 接口: ${d.title || '未命名接口'} */\n// ${method} ${url}`]

  const params = reqQueryToInterface(d.req_query)
  if (params) blocks.push(`/** 请求参数(Query) */\n${params}`)

  let schema: SchemaNode | undefined
  try {
    schema = d.res_body ? (JSON.parse(d.res_body) as SchemaNode) : undefined
  } catch {
    schema = undefined
  }
  if (schema && typeof schema === 'object') {
    // res_body 为 schema:properties.data 为接口返回数据主体,无 data 层则取整体
    const dataNode = schema.properties?.data ?? schema
    const em = new InterfaceEmitter()
    const rootType = em.schemaType(dataNode, 'IApiData')
    const defs = em.finish()
    blocks.push(
      `/** 返回数据 */\n${defs.length ? defs.join('\n\n') : `export type IApiData = ${rootType}`}`,
    )
  }
  return blocks.join('\n\n')
}

/* ---------------- 组件状态与动作 ---------------- */

const mode = ref<'yapi' | 'json'>('yapi')
const output = ref('')
const error = ref('')
const copied = ref(false)
const loading = ref(false)

const yapiUrl = ref('')
const yapiToken = ref('')
const apiMeta = ref<{ title: string; method: string; url: string } | null>(null)

const jsonInput = ref('')
const rootName = ref('IRoot')

function resetResult() {
  output.value = ''
  error.value = ''
  copied.value = false
  apiMeta.value = null
}

function switchMode(m: 'yapi' | 'json') {
  if (mode.value === m) return
  mode.value = m
  resetResult()
}

function applyYapiData(data: YapiInterface) {
  apiMeta.value = {
    title: data.title || '未命名接口',
    method: (data.method || 'GET').toUpperCase(),
    url: data.query_path?.path || data.path || '',
  }
  output.value = buildYapiResult(data)
}

/** 请求 YApi 接口详情,整理出 TS interface */
async function fetchYapi() {
  resetResult()
  const m = yapiUrl.value.trim().match(/^(https?:\/\/[^/]+)\/project\/\d+\/interface\/api\/(\d+)/)
  if (!m) {
    error.value =
      '请输入 YApi 接口文档地址,形如 http://yapi.example.com/project/1234/interface/api/5678'
    return
  }
  const [, origin, id] = m
  const token = yapiToken.value.trim()
  const api = token
    ? `${origin}/api/open/api/interface/get?id=${id}&token=${encodeURIComponent(token)}`
    : `${origin}/api/interface/get?id=${id}`
  loading.value = true
  try {
    const res = await fetch(api)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const json = (await res.json()) as { errcode?: number; errmsg?: string; data?: YapiInterface }
    if (json.errcode !== 0 || !json.data) throw new Error(json.errmsg || '接口数据返回异常')
    applyYapiData(json.data)
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    error.value =
      `获取接口数据失败:${msg}。请检查地址与项目 token;` +
      '若为跨域(CORS)限制,需 YApi 服务端允许跨域访问。'
  } finally {
    loading.value = false
  }
}

/** 内置示例接口数据(不请求网络,演示生成效果) */
const mockYapiData: YapiInterface = {
  title: '获取用户列表',
  method: 'GET',
  path: '/api/user/list',
  query_path: { path: '/api/user/list' },
  req_query: [
    { name: 'page', desc: '页码', required: '1', example: '1' },
    { name: 'pageSize', desc: '每页数量', required: '0', example: '20' },
    { name: 'keyword', desc: '搜索关键词', required: '0' },
  ],
  res_body: JSON.stringify({
    type: 'object',
    properties: {
      code: { type: 'integer', description: '状态码' },
      message: { type: 'string', description: '提示信息' },
      data: {
        type: 'object',
        properties: {
          total: { type: 'integer', description: '总数' },
          list: {
            type: 'array',
            description: '用户列表',
            items: {
              type: 'object',
              properties: {
                id: { type: 'integer', description: '用户 ID' },
                name: { type: 'string', description: '用户名' },
                tags: { type: 'array', items: { type: 'string' } },
                vip: { type: 'boolean', description: '是否会员' },
              },
              required: ['id', 'name'],
            },
          },
        },
        required: ['total', 'list'],
      },
    },
    required: ['code', 'message', 'data'],
  }),
}

function loadYapiSample() {
  resetResult()
  yapiUrl.value = 'http://yapi.example.com/project/1234/interface/api/5678'
  applyYapiData(mockYapiData)
}

const jsonSample = `{
  "code": 0,
  "message": "ok",
  "data": {
    "total": 2,
    "list": [
      { "id": 1, "name": "Alice", "tags": ["admin"], "profile": { "city": "北京", "age": 20 } },
      { "id": 2, "name": "Bob", "vip": true }
    ]
  }
}`

function loadJsonSample() {
  jsonInput.value = jsonSample
  convertJson()
}

/** JSON 输入 → TS interface(自动识别普通 JSON 与 YApi schema 形态) */
function convertJson() {
  resetResult()
  if (!jsonInput.value.trim()) return
  try {
    const value: unknown = JSON.parse(jsonInput.value)
    const name = /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(rootName.value.trim())
      ? rootName.value.trim()
      : 'IRoot'
    const em = new InterfaceEmitter()
    const schemaRoot = asSchemaRoot(value)
    if (schemaRoot) {
      // schema 形态:按 type / description / properties / required 规则转换
      const rootType = em.schemaType(schemaRoot, name)
      const defs = em.finish()
      output.value = defs.length ? defs.join('\n\n') : `export type ${name} = ${rootType}`
    } else if (isPlainObject(value)) {
      em.valueType(value, name, '$')
      output.value = em.finish().join('\n\n')
    } else {
      output.value = `export type ${name} = ${em.valueType(value, name, '$')}`
    }
  } catch (e) {
    output.value = ''
    error.value = e instanceof Error ? e.message : '无效的 JSON'
  }
}

function clearAll() {
  resetResult()
  jsonInput.value = ''
}

async function copyOutput() {
  if (!output.value) return
  await navigator.clipboard.writeText(output.value)
  copied.value = true
  setTimeout(() => (copied.value = false), 1500)
}
</script>

<template>
  <ToolShell
    emoji="🧬"
    title="TS Interface 生成"
    desc="YApi 接口文档 / JSON 数据 → TypeScript interface,转换在浏览器本地完成。"
  >
    <div class="mode-tabs">
      <button class="tab" :class="{ active: mode === 'yapi' }" @click="switchMode('yapi')">
        YApi 接口
      </button>
      <button class="tab" :class="{ active: mode === 'json' }" @click="switchMode('json')">
        JSON 转 TS
      </button>
    </div>

    <!-- 模式一:YApi 接口 → TS -->
    <div v-if="mode === 'yapi'">
      <div class="yapi-form">
        <input
          v-model="yapiUrl"
          class="field"
          spellcheck="false"
          placeholder="YApi 接口文档地址:http://yapi.example.com/project/1234/interface/api/5678"
          @keyup.enter="fetchYapi"
        />
        <input
          v-model="yapiToken"
          class="field token"
          spellcheck="false"
          placeholder="项目 token(可选)"
        />
        <button class="btn btn-primary shrink" :disabled="loading" @click="fetchYapi">
          {{ loading ? '获取中…' : '生成' }}
        </button>
        <button class="btn shrink" @click="loadYapiSample">示例</button>
      </div>
      <p class="hint">
        自动请求 YApi 接口详情({query_path、req_query、res_body}),整理出请求 URL、请求参数 interface
        与返回数据 interface(res_body 的 data 层)。填写项目 token 时走 openapi 接口;需 YApi
        服务允许跨域访问。
      </p>

      <div v-if="apiMeta" class="api-meta">
        <span class="api-title">{{ apiMeta.title }}</span>
        <span class="api-method">{{ apiMeta.method }}</span>
        <code class="api-url">{{ apiMeta.url }}</code>
      </div>

      <div v-if="output" class="pane">
        <div class="pane-head">
          <label class="pane-label">生成结果</label>
          <button class="mini" @click="copyOutput">{{ copied ? '已复制 ✓' : '复制' }}</button>
        </div>
        <textarea
          :value="output"
          class="field editor"
          readonly
          placeholder="TypeScript interface 显示在此…"
        />
      </div>

      <p v-if="error" class="err">⚠ {{ error }}</p>
    </div>

    <!-- 模式二:JSON → TS -->
    <div v-else>
      <div class="toolbar">
        <input
          v-model="rootName"
          class="field root-name"
          spellcheck="false"
          placeholder="根接口名"
          @keyup.enter="convertJson"
        />
        <button class="btn btn-primary shrink" @click="convertJson">生成</button>
        <button class="btn shrink" @click="loadJsonSample">示例</button>
        <button class="btn shrink" @click="clearAll">清空</button>
      </div>

      <div class="panes">
        <div class="pane">
          <label class="pane-label">输入 JSON / Schema</label>
          <textarea
            v-model="jsonInput"
            class="field editor"
            spellcheck="false"
            placeholder="在此粘贴普通 JSON 或 YApi schema 结构(字段值为 type/description 等描述对象)…"
            @input="error = ''"
          />
        </div>
        <div class="pane">
          <div class="pane-head">
            <label class="pane-label">生成结果</label>
            <button v-if="output" class="mini" @click="copyOutput">
              {{ copied ? '已复制 ✓' : '复制' }}
            </button>
          </div>
          <textarea
            :value="output"
            class="field editor"
            readonly
            placeholder="TypeScript interface 显示在此…"
          />
        </div>
      </div>

      <p v-if="error" class="err">⚠ {{ error }}</p>
    </div>
  </ToolShell>
</template>

<style scoped>
.mode-tabs {
  display: inline-flex;
  gap: 4px;
  padding: 4px;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--bg-soft);
  margin-bottom: 16px;
}
.tab {
  border: none;
  background: transparent;
  padding: 6px 16px;
  border-radius: var(--radius-sm);
  color: var(--text-soft);
  font-size: 13px;
  cursor: pointer;
}
.tab.active {
  background: var(--bg-elev);
  color: var(--text);
  font-weight: 600;
  box-shadow: var(--shadow);
}
.yapi-form {
  display: flex;
  gap: 10px;
  margin-bottom: 10px;
}
.token {
  flex: 0 0 200px;
}
.shrink {
  flex-shrink: 0;
}
.hint {
  margin: 0 0 14px;
  color: var(--text-mute);
  font-size: 12px;
  line-height: 1.6;
}
.api-meta {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  padding: 10px 14px;
  margin-bottom: 14px;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--bg-soft);
  font-size: 13px;
}
.api-title {
  font-weight: 600;
}
.api-method {
  padding: 1px 8px;
  border-radius: 6px;
  background: var(--primary);
  color: #fff;
  font-size: 12px;
  font-weight: 600;
}
.api-url {
  font-family: 'SFMono-Regular', ui-monospace, Menlo, Consolas, 'Courier New', monospace;
  color: var(--text-soft);
  word-break: break-all;
}
.toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 14px;
}
.root-name {
  flex: 0 0 160px;
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

@media (max-width: 720px) {
  .yapi-form {
    flex-wrap: wrap;
  }
  .yapi-form .field:not(.token) {
    flex: 1 1 100%;
  }
  .panes {
    grid-template-columns: 1fr;
  }
  .editor {
    min-height: 220px;
  }
}
</style>
