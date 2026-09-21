<template>
  <div class="space-y-5">
    <div class="grid gap-4 lg:grid-cols-3">
      <div class="panel-card p-4 lg:col-span-1">
        <h3 class="text-sm font-bold text-medical-navy">区-中心-站科机构拓扑</h3>
        <ul class="mt-4 space-y-3">
          <li class="rounded-lg border border-sky-100 bg-sky-50/60 px-3 py-2">
            <p class="text-xs text-sky-700">DISTRICT_HQ</p>
            <p class="font-semibold text-slate-800">东城区社区卫生服务管理中心</p>
          </li>
          <li
            v-for="node in nodes"
            :key="node.id"
            class="ml-3 rounded-lg border border-slate-200 bg-white px-3 py-2"
          >
            <div class="flex items-start justify-between gap-2">
              <div>
                <p class="text-[11px] text-slate-500">{{ levelLabel(node.hierarchy_level) }} · {{ node.node_code }}</p>
                <p class="text-sm font-medium text-slate-800">{{ node.facility_name }}</p>
              </div>
              <span
                class="shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold"
                :class="statusClass(node.node_status)"
              >
                {{ node.node_status }}
              </span>
            </div>
            <div class="mt-2">
              <div class="mb-1 flex justify-between text-[11px] text-slate-500">
                <span>HIS 非临床剥离迁移</span>
                <span>{{ migrateProgress(node) }}%</span>
              </div>
              <div class="h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                  class="h-full rounded-full bg-gradient-to-r from-medical-sky to-medical-teal transition-all"
                  :style="{ width: `${migrateProgress(node)}%` }"
                />
              </div>
            </div>
          </li>
        </ul>
      </div>

      <div class="panel-card p-4 lg:col-span-2">
        <div class="flex flex-wrap items-center justify-between gap-2">
          <h3 class="text-sm font-bold text-medical-navy">HIS 解耦与双向同步监视器</h3>
          <span class="stat-chip">已迁移档案合计 {{ totalMigrated.toLocaleString() }}</span>
        </div>
        <div class="mt-4 overflow-x-auto">
          <table class="min-w-full text-left text-sm">
            <thead class="border-b border-slate-200 text-xs uppercase text-slate-500">
              <tr>
                <th class="px-2 py-2">机构</th>
                <th class="px-2 py-2">网关</th>
                <th class="px-2 py-2">剥离状态</th>
                <th class="px-2 py-2">迁移档案数</th>
                <th class="px-2 py-2">同步心跳</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="node in nodes" :key="node.id" class="border-b border-slate-100">
                <td class="px-2 py-3 font-medium text-slate-800">{{ node.facility_name }}</td>
                <td class="px-2 py-3 font-mono text-xs text-slate-600">{{ node.gateway_ip_address }}</td>
                <td class="px-2 py-3">
                  <span v-if="node.his_disconnected_status === 1" class="text-teal-700">已剥离</span>
                  <span v-else class="text-amber-700">进行中</span>
                </td>
                <td class="px-2 py-3">{{ Number(node.migrated_records_count).toLocaleString() }}</td>
                <td class="px-2 py-3">
                  <span class="inline-flex items-center gap-1 text-xs text-emerald-700">
                    <span class="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
                    双向增量 OK
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="mt-4 grid gap-3 md:grid-cols-3">
          <div class="rounded-lg bg-slate-50 p-3">
            <p class="text-xs text-slate-500">在线节点</p>
            <p class="text-2xl font-bold text-medical-navy">{{ onlineCount }}/{{ nodes.length }}</p>
          </div>
          <div class="rounded-lg bg-slate-50 p-3">
            <p class="text-xs text-slate-500">API 汇聚中心延迟</p>
            <p class="text-2xl font-bold text-medical-sky">18ms</p>
          </div>
          <div class="rounded-lg bg-slate-50 p-3">
            <p class="text-xs text-slate-500">今日同步批次</p>
            <p class="text-2xl font-bold text-medical-teal">126</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { getFacilityNodes, type FacilityNode } from '@/utils/sqljs-engine'

const nodes = ref<FacilityNode[]>([])

onMounted(() => {
  nodes.value = getFacilityNodes()
})

const totalMigrated = computed(() =>
  nodes.value.reduce((s, n) => s + Number(n.migrated_records_count || 0), 0),
)
const onlineCount = computed(
  () => nodes.value.filter((n) => n.node_status === 'ONLINE_ACTIVE').length,
)

function levelLabel(level: string) {
  const map: Record<string, string> = {
    DISTRICT_HQ: '区社管中心',
    COMMUNITY_CENTER: '社区中心',
    STATION_CLINIC: '基层服务站',
  }
  return map[level] || level
}

function statusClass(status: string) {
  if (status === 'ONLINE_ACTIVE') return 'bg-emerald-100 text-emerald-800'
  if (status === 'MIGRATING_SYNC') return 'bg-amber-100 text-amber-800'
  return 'bg-rose-100 text-rose-800'
}

function migrateProgress(node: FacilityNode) {
  if (node.his_disconnected_status === 1) return 100
  return Math.min(95, Math.round(Number(node.migrated_records_count) / 500))
}
</script>
