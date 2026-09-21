import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  assetsInclude: ['**/*.wasm'],
  optimizeDeps: {
    include: ['sql.js'],
    exclude: ['sql.js/dist/sql-wasm-browser.wasm'],
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
