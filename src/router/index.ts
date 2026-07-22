import { createRouter, createWebHashHistory, type RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'home',
    component: () => import('@/views/HomeView.vue'),
    meta: { title: '导航首页' },
  },
  {
    path: '/tools',
    name: 'tools',
    component: () => import('@/views/ToolsView.vue'),
    meta: { title: '在线工具' },
  },
  {
    path: '/tools/json',
    name: 'tool-json',
    component: () => import('@/tools/JsonTool.vue'),
    meta: { title: 'JSON 格式化 / 校验' },
  },
  {
    path: '/tools/base64',
    name: 'tool-base64',
    component: () => import('@/tools/Base64Tool.vue'),
    meta: { title: 'Base64 编解码' },
  },
  {
    path: '/tools/timestamp',
    name: 'tool-timestamp',
    component: () => import('@/tools/TimestampTool.vue'),
    meta: { title: '时间戳转换' },
  },
  {
    path: '/tools/regex',
    name: 'tool-regex',
    component: () => import('@/tools/RegexTool.vue'),
    meta: { title: '正则表达式测试' },
  },
  {
    path: '/tools/countdown',
    name: 'tool-countdown',
    component: () => import('@/tools/CountdownTool.vue'),
    meta: { title: '倒计时' },
  },
  {
    path: '/tools/worldclock',
    name: 'tool-worldclock',
    component: () => import('@/tools/WorldClockTool.vue'),
    meta: { title: '世界时间' },
  },
  {
    path: '/tools/password',
    name: 'tool-password',
    component: () => import('@/tools/PasswordTool.vue'),
    meta: { title: '密码 & UUID 生成' },
  },
  {
    path: '/tools/url',
    name: 'tool-url',
    component: () => import('@/tools/UrlTool.vue'),
    meta: { title: 'URL 编解码' },
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/',
  },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
  scrollBehavior(to) {
    if (to.hash) {
      return { el: to.hash, behavior: 'smooth', top: 80 }
    }
    return { top: 0 }
  },
})

// router.afterEach((to) => {
//   const base = 'DevNav · 程序员导航站 / 工具箱'
//   const title = to.meta.title as string | undefined
//   document.title = title ? `${title} · ${base}` : base
// })

export default router
