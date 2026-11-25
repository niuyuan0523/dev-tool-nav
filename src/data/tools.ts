import type { ToolMeta } from '@/types'

/**
 * 内置在线工具清单（🧰 在线工具分类）。
 * 新增工具时：在此登记元信息，并在 router 中挂载对应组件即可。
 */
export const tools: ToolMeta[] = [
  {
    id: 'json',
    name: 'JSON 格式化 / 校验',
    desc: '美化、压缩与语法校验 JSON',
    emoji: '🧾',
    path: '/tools/json',
  },
  {
    id: 'base64',
    name: 'Base64 编解码',
    desc: '文本与 Base64 相互转换（支持中文）',
    emoji: '🔐',
    path: '/tools/base64',
  },
  {
    id: 'timestamp',
    name: '时间戳转换',
    desc: 'Unix 时间戳与日期时间互转',
    emoji: '⏱️',
    path: '/tools/timestamp',
  },
  {
    id: 'regex',
    name: '正则表达式测试',
    desc: '实时匹配与高亮，支持常用标志',
    emoji: '🧪',
    path: '/tools/regex',
  },
  {
    id: 'countdown',
    name: '倒计时',
    desc: '目标时间倒计时，支持快捷计时器',
    emoji: '⏳',
    path: '/tools/countdown',
  },
  {
    id: 'worldclock',
    name: '世界时间',
    desc: '多时区实时时钟对照',
    emoji: '🌐',
    path: '/tools/worldclock',
  },
  {
    id: 'password',
    name: '密码 & UUID 生成',
    desc: '随机强密码与 UUID v4 生成器',
    emoji: '🔑',
    path: '/tools/password',
  },
  {
    id: 'url',
    name: 'URL 编解码',
    desc: 'encodeURIComponent 编解码与查询参数解析',
    emoji: '🔗',
    path: '/tools/url',
  },
  {
    id: 'interface',
    name: 'TS Interface 生成',
    desc: 'YApi 接口 / JSON 转 TypeScript 类型定义',
    emoji: '🧬',
    path: '/tools/interface',
  },
]
