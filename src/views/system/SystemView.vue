<template>
  <div class="space-y-5">
    <div class="grid gap-4 lg:grid-cols-2">
      <div class="panel-card p-4">
        <h3 class="text-sm font-bold text-medical-navy">Feature Flags 业务开关</h3>
        <ul class="mt-3 space-y-3">
          <li
            v-for="cfg in configs"
            :key="cfg.config_key"
            class="flex items-start justify-between gap-3 rounded-lg border border-slate-200 px-3 py-3"
          >
            <div>
              <p class="text-sm font-semibold text-slate-800">{{ cfg.config_key }}</p>
              <p class="mt-1 text-xs text-slate-500">{{ cfg.description }}</p>
              <p class="mt-1 text-[11px] text-slate-400">分类：{{ cfg.category }}</p>
            </div>
            <button
              v-if="cfg.config_value === 'true' || cfg.config_value === 'false'"
              type="button"
              class="shrink-0 rounded-full px-3 py-1 text-xs font-bold"
              :class="cfg.config_value === 'true' ? 'bg-teal-100 text-teal-800' : 'bg-slate-200 text-slate-600'"
              @click="toggleFlag(cfg)"
            >
              {{ cfg.config_value === 'true' ? 'ON' : 'OFF' }}
            </button>
            <span v-else class="shrink-0 rounded bg-slate-100 px-2 py-1 text-xs">{{ cfg.config_value }}</span>
          </li>
        </ul>
      </div>

      <div class="panel-card p-4">
        <h3 class="text-sm font-bold text-medical-navy">国密 SM4 列级脱敏策略</h3>
        <div class="mt-3 space-y-2 text-sm text-slate-700">
          <p class="rounded-lg bg-slate-50 px-3 py-2">身份证号：110101********XXXX → 动态掩码</p>
          <p class="rounded-lg bg-slate-50 px-3 py-2">家庭住址：仅展示街道级脱敏片段</p>
          <p class="rounded-lg bg-slate-50 px-3 py-2">既往病史：慢病标识可读，明细字段加密存证</p>
        </div>
        <div class="mt-4 rounded-lg border border-sky-200 bg-sky-50 p-3 text-xs text-sky-900">
          接口调用与数据迁移日志采用防篡改哈希链式存证；表前缀统一 <code class="font-mono">bjcom_</code>，严禁跨站点污染。
        </div>
      </div>
    </div>

    <div class="panel-card p-4">
      <h3 class="text-sm font-bold text-medical-navy">安全审计轨迹（bjcom_audit_logs）</h3>
      <div class="mt-3 overflow-x-auto">
        <table class="min-w-full text-left text-sm">
          <thead class="border-b text-xs uppercase text-slate-500">
            <tr>
              <th class="px-2 py-2">时间</th>
              <th class="px-2 py-2">用户</th>
              <th class="px-2 py-2">动作</th>
              <th class="px-2 py-2">资源</th>
              <th class="px-2 py-2">URI</th>
              <th class="px-2 py-2">状态</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="log in logs" :key="log.id" class="border-b border-slate-100">
              <td class="px-2 py-3 text-xs text-slate-500">{{ log.created_at }}</td>
              <td class="px-2 py-3">{{ log.username }}</td>
              <td class="px-2 py-3 font-mono text-xs">{{ log.action_name }}</td>
              <td class="px-2 py-3">{{ log.target_resource }}</td>
              <td class="px-2 py-3 font-mono text-xs">{{ log.request_uri }}</td>
              <td class="px-2 py-3">{{ log.status_code }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import {
  getAuditLogs,
  getSystemConfigs,
  updateSystemConfig,
  type AuditLog,
  type SystemConfig,
} from '@/utils/sqljs-engine'

const configs = ref<SystemConfig[]>([])
const logs = ref<AuditLog[]>([])

function refresh() {
  configs.value = getSystemConfigs()
  logs.value = getAuditLogs()
}

function toggleFlag(cfg: SystemConfig) {
  const next = cfg.config_value === 'true' ? 'false' : 'true'
  updateSystemConfig(cfg.config_key, next)
  refresh()
}

onMounted(refresh)
</script>
