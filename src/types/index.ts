/** 单个导航链接 */
export interface NavLink {
  /** 名称 */
  name: string
  /** 目标地址 */
  url: string
  /** 一句话描述 */
  desc?: string
  /** 图标：可为 emoji、字母，或远程/本地图片地址 */
  icon?: string
}

/** 一个导航分类 */
export interface NavCategory {
  /** 唯一标识，用于锚点定位 */
  id: string
  /** 分类标题 */
  title: string
  /** 分类图标（emoji） */
  emoji: string
  /** 该分类下的链接列表 */
  links: NavLink[]
}

/** 内置在线工具的元信息 */
export interface ToolMeta {
  /** 唯一标识，同时作为路由名 */
  id: string
  /** 工具名称 */
  name: string
  /** 工具描述 */
  desc: string
  /** 图标 emoji */
  emoji: string
  /** 路由路径 */
  path: string
}
