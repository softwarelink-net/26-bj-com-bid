import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      // sql.js 的 browser export 无 ESM default，强制走可被预打包互操作的 sql-wasm.js
      'sql.js': fileURLToPath(new URL('./node_modules/sql.js/dist/sql-wasm.js', import.meta.url)),
    },
  },
  optimizeDeps: {
    include: ['sql.js'],
  },
  server: {
    port: 5173,
    host: true,
  },
  build: {
    outDir: 'dist',
    assetsInlineLimit: 0,
    commonjsOptions: {
      include: [/sql\.js/, /node_modules/],
    },
    rollupOptions: {
      output: {
        manualChunks: {
          echarts: ['echarts'],
        },
      },
    },
  },
})
