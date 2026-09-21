<template>
  <div class="main-layout flex min-h-[calc(100vh-40px)] bg-[#f0f7fb]">
    <aside
      class="sticky top-10 flex h-[calc(100vh-40px)] w-60 shrink-0 flex-col border-r border-slate-200 bg-gradient-to-b from-[#0c1a3a] via-[#122a5c] to-[#0f3d4a] text-slate-100"
    >
      <div class="border-b border-white/10 px-4 py-5">
        <p class="text-[11px] font-semibold tracking-wider text-sky-300">东城社管中心</p>
        <h1 class="mt-1 text-base font-bold leading-snug text-white">社区卫生综合管理</h1>
      </div>
      <nav class="flex-1 space-y-1 overflow-y-auto px-2 py-4">
        <RouterLink
          v-for="item in visibleMenus"
          :key="item.path"
          :to="item.path"
          class="nav-item"
          :class="{ active: isActive(item.path) }"
        >
          <span class="nav-dot" />
          {{ item.label }}
        </RouterLink>
      </nav>
      <div class="border-t border-white/10 p-3 text-xs text-sky-200/70">
        <p>四级协同：区 · 中心 · 站科 · 医务</p>
      </div>
    </aside>

    <div class="flex min-w-0 flex-1 flex-col">
      <header class="sticky top-10 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div class="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
          <div>
            <nav class="flex items-center gap-1 text-xs text-slate-500">
              <span>控制台</span>
              <span>/</span>
              <span class="font-medium text-slate-800">{{ currentTitle }}</span>
            </nav>
            <h2 class="mt-0.5 text-lg font-semibold text-slate-900">{{ currentTitle }}</h2>
          </div>
          <div class="flex flex-wrap items-center gap-2">
            <span class="stat-chip">建档率 {{ stats.archiveRate }}%</span>
            <span class="stat-chip !bg-teal-50 !text-teal-800">今日公卫随访 {{ stats.todayFollowups }}</span>
            <span class="stat-chip !bg-indigo-50 !text-indigo-800">
              家医履约率 {{ stats.contractFulfillmentRate }}%
            </span>
            <div class="ml-2 flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5">
              <div class="text-right leading-tight">
                <p class="text-sm font-semibold text-slate-800">{{ auth.displayName }}</p>
                <p class="text-[11px] text-slate-500">{{ roleLabel }}</p>
              </div>
              <button class="btn-ghost !py-1 !text-xs" type="button" @click="onLogout">退出</button>
            </div>
          </div>
        </div>
        <p
          v-if="auth.permissionAlert"
          class="bg-amber-50 px-5 py-2 text-xs text-amber-800 border-t border-amber-100"
        >
          {{ auth.permissionAlert }}
        </p>
      </header>

      <main class="flex-1 p-5">
        <router-view />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { getDashboardStats, type DashboardStats, type RoleCode } from '@/utils/sqljs-engine'

const auth = useAuthStore()
const route = useRoute()
const router = useRouter()

const stats = ref<DashboardStats>({
  totalFacilities: 0,
  onlineFacilities: 0,
  totalMigratedRecords: 0,
  totalHealthRecords: 0,
  hypertensionCount: 0,
  diabetesCount: 0,
  activeContracts: 0,
  avgFulfillmentRate: 0,
  pharmacySkus: 0,
  nearExpiryCount: 0,
  archiveRate: 96.8,
  todayFollowups: 1286,
  contractFulfillmentRate: 91.2,
})

const menus: { path: string; label: string; roles?: RoleCode[] }[] = [
  { path: '/', label: '全景态势大屏' },
  {
    path: '/regional-mgmt',
    label: '区域一体化 / HIS解耦',
    roles: ['ROLE_SUPER_ADMIN', 'ROLE_CENTER_DIRECTOR', 'ROLE_DECISION_MAKER'],
  },
  {
    path: '/public-health',
    label: '健康档案与公卫',
    roles: ['ROLE_SUPER_ADMIN', 'ROLE_CENTER_DIRECTOR', 'ROLE_STATION_DOCTOR'],
  },
  {
    path: '/family-doctor',
    label: '家医签约服务',
    roles: ['ROLE_SUPER_ADMIN', 'ROLE_CENTER_DIRECTOR', 'ROLE_STATION_DOCTOR'],
  },
  {
    path: '/pharmacy',
    label: '药械全链条监管',
    roles: ['ROLE_SUPER_ADMIN', 'ROLE_CENTER_DIRECTOR', 'ROLE_STATION_DOCTOR'],
  },
  { path: '/system', label: '系统总控与审计', roles: ['ROLE_SUPER_ADMIN'] },
  { path: '/tender', label: '招标公告（公开）' },
]

const roleMap: Record<RoleCode, string> = {
  ROLE_SUPER_ADMIN: '系统超管',
  ROLE_CENTER_DIRECTOR: '中心主任',
  ROLE_STATION_DOCTOR: '基层医生',
  ROLE_DECISION_MAKER: '决策领导',
}

const visibleMenus = computed(() =>
  menus.filter((m) => !m.roles || auth.hasRole(m.roles)),
)

const currentTitle = computed(() => (route.meta.title as string) || '控制台')
const roleLabel = computed(() => (auth.role ? roleMap[auth.role] : ''))

function isActive(path: string) {
  if (path === '/') return route.path === '/'
  return route.path.startsWith(path)
}

function onLogout() {
  auth.logout()
  router.push('/login')
}

onMounted(() => {
  try {
    stats.value = getDashboardStats()
  } catch {
    /* keep defaults */
  }
})
</script>

<style scoped>
.nav-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  border-radius: 0.5rem;
  padding: 0.55rem 0.75rem;
  font-size: 0.8125rem;
  color: rgba(226, 232, 240, 0.85);
  transition: background 0.15s ease, color 0.15s ease;
}
.nav-item:hover {
  background: rgba(255, 255, 255, 0.08);
  color: #fff;
}
.nav-item.active {
  background: linear-gradient(90deg, rgba(3, 105, 161, 0.55), rgba(13, 148, 136, 0.45));
  color: #fff;
  font-weight: 600;
}
.nav-dot {
  width: 6px;
  height: 6px;
  border-radius: 999px;
  background: #38bdf8;
  opacity: 0.7;
}
.nav-item.active .nav-dot {
  background: #5eead4;
  opacity: 1;
}
</style>
