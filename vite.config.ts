import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  // GitHub Pages 项目页部署在 /<仓库名>/ 子路径下，
  // 生产构建时设置 base，本地开发仍使用根路径。
  // 若仓库名不同，请修改此处。
  base: command === 'build' ? '/dev-tool-nav/' : '/',
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
}))
