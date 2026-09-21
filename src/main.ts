import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import './assets/main.css'
import { initSqlEngine } from './utils/sqljs-engine'

async function bootstrap() {
  await initSqlEngine()
  const app = createApp(App)
  app.use(createPinia())
  app.use(router)
  app.mount('#app')
}

bootstrap().catch((err) => {
  console.error('系统初始化失败', err)
  document.body.innerHTML = `
    <div style="padding:80px 24px;text-align:center;font-family:sans-serif;color:#0f172a">
      <h1 style="color:#1e3a8a">东城区社区卫生服务综合管理系统</h1>
      <p>本地 SQLite 引擎初始化失败，请刷新页面重试。</p>
      <pre style="color:#b91c1c;white-space:pre-wrap">${String(err)}</pre>
    </div>
  `
})
