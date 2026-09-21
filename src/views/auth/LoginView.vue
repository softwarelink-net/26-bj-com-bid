<template>
  <div class="mx-auto max-w-md">
    <div class="panel-card overflow-hidden shadow-xl">
      <div class="bg-gradient-to-r from-medical-navy via-medical-sky to-medical-teal px-6 py-5 text-white">
        <h2 class="text-xl font-bold">用户登录鉴权</h2>
        <p class="mt-1 text-sm text-sky-100">基于本地 SQLite + Pinia Session 的 RBAC 拦截</p>
      </div>
      <form class="space-y-4 p-6" @submit.prevent="onSubmit">
        <div>
          <label class="mb-1 block text-sm font-medium text-slate-700">登录账号</label>
          <input
            v-model="username"
            class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-200"
            autocomplete="username"
            placeholder="admin / director / doctor / leader"
          />
        </div>
        <div>
          <label class="mb-1 block text-sm font-medium text-slate-700">登录密码</label>
          <input
            v-model="password"
            type="password"
            class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-200"
            autocomplete="current-password"
            placeholder="请输入演示密码"
          />
        </div>
        <p v-if="error" class="rounded-md bg-rose-50 px-3 py-2 text-xs text-rose-700">{{ error }}</p>
        <button class="btn-primary w-full" type="submit" :disabled="loading">
          {{ loading ? '鉴权中…' : '进入综合管理控制台' }}
        </button>
      </form>
      <div class="border-t border-slate-100 bg-slate-50 px-6 py-4 text-xs text-slate-600">
        <p class="font-semibold text-slate-800">演示账号速查</p>
        <ul class="mt-2 space-y-1">
          <li>超管 admin / Admin@2026</li>
          <li>主任 director / Director@2026</li>
          <li>医生 doctor / Doctor@2026</li>
          <li>领导 leader / Leader@2026</li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const router = useRouter()
const route = useRoute()

const username = ref('admin')
const password = ref('Admin@2026')
const loading = ref(false)
const error = ref('')

async function onSubmit() {
  loading.value = true
  error.value = ''
  try {
    const ok = await auth.login(username.value.trim(), password.value)
    if (!ok) {
      error.value = auth.permissionAlert || '登录失败'
      return
    }
    const redirect = (route.query.redirect as string) || '/'
    await router.replace(redirect)
  } catch (e) {
    error.value = String(e)
  } finally {
    loading.value = false
  }
}
</script>
