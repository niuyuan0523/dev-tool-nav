# DevNav · 程序员导航站 / 工具箱

> 聚合常用开发导航站点与内置在线小工具，一站直达。基于 **Vue 3 + Vite + TypeScript**，纯前端、数据驱动、开箱即用。

---

## ✨ 特性

- **常用开发导航**：官方文档、包与镜像、UI 组件库、UI 与设计、AI & 效率、社区 & 资源等分类聚合。
- **内置在线工具**：JSON 格式化、Base64、时间戳、正则测试、倒计时、世界时间、密码 & UUID 生成、URL 编解码，全部在浏览器本地运行，数据不出网。
- **数据驱动架构**：导航与工具均由数据文件集中配置，新增内容无需改动组件。
- **实时天气**：顶栏基于开放 API（Open‑Meteo + BigDataCloud）展示当前定位天气，无需 API Key。
- **明暗主题**：跟随系统偏好并可手动切换，选择持久化到 `localStorage`。
- **可收起侧边栏**：桌面端边缘手柄一键收起/展开，状态持久化；移动端自适应为抽屉。
- **响应式布局**：桌面、平板、移动端均适配。

## 🧰 内置工具

| 工具 | 说明 | 路由 |
| --- | --- | --- |
| JSON 格式化 / 校验 | 美化、压缩与语法校验 JSON | `/tools/json` |
| Base64 编解码 | 文本与 Base64 相互转换（支持中文） | `/tools/base64` |
| 时间戳转换 | Unix 时间戳与日期时间互转 | `/tools/timestamp` |
| 正则表达式测试 | 实时匹配与高亮，支持常用标志 | `/tools/regex` |
| 倒计时 | 目标时间倒计时，支持快捷计时器 | `/tools/countdown` |
| 世界时间 | 多时区实时时钟对照 | `/tools/worldclock` |
| 密码 & UUID 生成 | 随机强密码与 UUID v4 生成器 | `/tools/password` |
| URL 编解码 | encodeURIComponent 编解码与查询参数解析 | `/tools/url` |

## 🛠️ 技术栈

- [Vue 3](https://cn.vuejs.org/)（`<script setup>` 组合式 API）
- [Vite 6](https://cn.vitejs.dev/)
- [TypeScript 5](https://www.typescriptlang.org/)
- [Vue Router 4](https://router.vuejs.org/zh/)（`createWebHashHistory` 哈希路由）
- 原生 CSS 变量设计系统（明暗双主题）

## 🚀 快速开始

> 需要 Node.js **18+**（推荐 20 LTS）。

```bash
# 安装依赖
npm install

# 启动开发服务器（默认 http://localhost:5173）
npm run dev

# 类型检查 + 生产构建（输出到 dist/）
npm run build

# 本地预览构建产物
npm run preview

# 代码检查（自动修复）/ 格式化
npm run lint
npm run format
```

## 📁 项目结构

```
dev-tool-nav/
├─ .github/workflows/      # GitHub Actions（推送 master 自动部署 Pages）
├─ public/                 # 静态资源（logo、favicon 等）
├─ src/
│  ├─ components/          # 通用组件
│  │  ├─ AppSidebar.vue    # 侧边栏（导航 + 收起手柄）
│  │  ├─ LinkCard.vue      # 导航链接卡片
│  │  └─ ToolShell.vue     # 工具页通用外壳
│  ├─ data/
│  │  ├─ navigation.ts     # 导航分类与链接数据
│  │  └─ tools.ts          # 内置工具元信息
│  ├─ router/index.ts      # 路由配置（工具懒加载）
│  ├─ tools/               # 各在线工具组件
│  ├─ views/
│  │  ├─ HomeView.vue      # 首页（导航 + 搜索）
│  │  └─ ToolsView.vue     # 工具箱列表页
│  ├─ types/index.ts       # 类型定义
│  ├─ App.vue              # 布局外壳（顶栏 / 主题 / 天气）
│  ├─ main.ts              # 应用入口
│  └─ style.css            # 全局样式与设计变量
├─ .editorconfig           # 编辑器统一风格
├─ .prettierrc.json        # Prettier 格式化配置
├─ eslint.config.js        # ESLint 扁平配置
├─ index.html
├─ vite.config.ts
└─ tsconfig.json
```

## 🧩 扩展指南

得益于数据驱动设计，扩展内容非常简单。

### 新增导航链接

编辑 [`src/data/navigation.ts`](src/data/navigation.ts)，在对应分类的 `links` 中追加一项即可（或新增一个分类对象）：

```ts
{
  name: '站点名称',
  url: 'https://example.com/',
  desc: '一句话描述',
  icon: '🔗',
}
```

新增/修改会自动同步到首页与侧边栏的「网址导航」。

### 新增在线工具

1. 在 [`src/data/tools.ts`](src/data/tools.ts) 登记工具元信息：

   ```ts
   {
     id: 'my-tool',
     name: '我的工具',
     desc: '功能描述',
     emoji: '✨',
     path: '/tools/my-tool',
   }
   ```

2. 在 `src/tools/` 新建组件（推荐用 `ToolShell` 包裹）：

   ```vue
   <script setup lang="ts">
   import ToolShell from '@/components/ToolShell.vue'
   </script>

   <template>
     <ToolShell emoji="✨" title="我的工具" desc="功能描述">
       <!-- 工具内容 -->
     </ToolShell>
   </template>
   ```

3. 在 [`src/router/index.ts`](src/router/index.ts) 挂载懒加载路由：

   ```ts
   {
     path: '/tools/my-tool',
     name: 'tool-my-tool',
     component: () => import('@/tools/MyTool.vue'),
     meta: { title: '我的工具' },
   }
   ```

## 🌦️ 天气说明

顶栏天气使用以下免费、无需 Key 的开放接口：

- **Open‑Meteo** —— 当前气温与天气代码（WMO code）。
- **BigDataCloud** —— 逆地理编码获取城市名。

首次访问会请求浏览器定位授权：允许则展示当地天气，拒绝或不支持时回退到默认城市（北京）。

## 📦 部署

构建产物为纯静态文件，可直接部署到任意静态托管（Vercel / Netlify / Cloudflare Pages / Nginx / GitHub Pages 等）。

项目使用哈希路由（`createWebHashHistory`），无需服务器额外重写规则即可正常刷新与直达子路由。

```bash
npm run build   # 生成 dist/
```

## 📄 License

本项目基于 [MIT](LICENSE) 许可证开源。
