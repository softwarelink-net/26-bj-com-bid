<template>
  <div class="auth-layout min-h-[calc(100vh-40px)] relative overflow-hidden">
    <div class="auth-bg absolute inset-0" />
    <div class="relative z-10 mx-auto flex min-h-[calc(100vh-40px)] max-w-6xl flex-col px-4 py-8">
      <header class="mb-8 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p class="text-xs font-semibold uppercase tracking-[0.2em] text-sky-200/90">北京市东城区</p>
          <h1 class="mt-1 text-2xl font-bold text-white md:text-3xl">社区卫生服务综合管理系统</h1>
          <p class="mt-1 text-sm text-sky-100/80">项目编号 11010126210200022537-XM001</p>
        </div>
        <nav class="flex gap-2">
          <RouterLink class="btn-ghost !bg-white/10 !text-white !border-white/20" to="/tender">招标公告</RouterLink>
          <RouterLink class="btn-primary" to="/login">登录控制台</RouterLink>
        </nav>
      </header>
      <main class="flex-1">
        <router-view />
      </main>
      <footer class="mt-8 text-center text-xs text-sky-100/60">
        纯前端 sql.js 演示环境 · 数据均脱敏 · 仅供技术研究参考
      </footer>
    </div>
  </div>
</template>

<script setup lang="ts">
</script>

<style scoped>
.auth-bg {
  background:
    radial-gradient(ellipse 80% 60% at 20% 20%, rgba(14, 165, 233, 0.35), transparent 55%),
    radial-gradient(ellipse 70% 50% at 80% 10%, rgba(13, 148, 136, 0.3), transparent 50%),
    linear-gradient(160deg, #0c1a3a 0%, #1e3a8a 45%, #0f766e 100%);
}
</style>
