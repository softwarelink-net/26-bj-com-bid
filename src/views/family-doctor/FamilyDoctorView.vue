<template>
  <div class="space-y-5">
    <div class="grid gap-4 lg:grid-cols-3">
      <div class="panel-card p-4 lg:col-span-1">
        <h3 class="text-sm font-bold text-medical-navy">服务包定制选择器</h3>
        <div class="mt-3 space-y-2">
          <button
            v-for="pack in packages"
            :key="pack.code"
            type="button"
            class="w-full rounded-lg border px-3 py-2 text-left text-sm transition"
            :class="selectedPack === pack.code ? 'border-teal-500 bg-teal-50' : 'border-slate-200 hover:bg-slate-50'"
            @click="selectedPack = pack.code"
          >
            <p class="font-semibold text-slate-800">{{ pack.name }}</p>
            <p class="text-xs text-slate-500">{{ pack.desc }}</p>
          </button>
        </div>

        <div class="mt-5 rounded-lg border border-amber-200 bg-amber-50 p-3">
          <p class="text-xs font-bold text-amber-900">履约倒计时提醒</p>
          <ul class="mt-2 space-y-2 text-xs text-amber-900/90">
            <li v-for="c in contracts" :key="c.id" class="flex justify-between gap-2">
              <span>{{ c.resident_name_masked }} · 剩 {{ remainVisits(c) }} 次</span>
              <span>{{ daysLeft(c.contract_end_date) }}天到期</span>
            </li>
          </ul>
        </div>
      </div>

      <div class="panel-card p-4 lg:col-span-2">
        <div class="flex flex-wrap items-center justify-between gap-2">
          <h3 class="text-sm font-bold text-medical-navy">签约协议电子确认向导</h3>
          <input
            v-model="doctorFilter"
            class="rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
            placeholder="按签约医生筛选"
            @keyup.enter="load"
          />
        </div>

        <div class="mt-4 overflow-x-auto">
          <table class="min-w-full text-left text-sm">
            <thead class="border-b text-xs uppercase text-slate-500">
              <tr>
                <th class="px-2 py-2">签约编号</th>
                <th class="px-2 py-2">居民</th>
                <th class="px-2 py-2">家医</th>
                <th class="px-2 py-2">服务包</th>
                <th class="px-2 py-2">履约进度</th>
                <th class="px-2 py-2">状态</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="c in contracts" :key="c.id" class="border-b border-slate-100">
                <td class="px-2 py-3 font-mono text-xs">{{ c.contract_no }}</td>
                <td class="px-2 py-3">{{ c.resident_name_masked }}</td>
                <td class="px-2 py-3">{{ c.family_doctor_name }}</td>
                <td class="px-2 py-3">{{ packLabel(c.service_package_type) }}</td>
                <td class="px-2 py-3">
                  <div class="flex items-center gap-2">
                    <div class="h-2 w-24 overflow-hidden rounded-full bg-slate-100">
                      <div
                        class="h-full bg-medical-teal"
                        :style="{ width: `${fulfillPct(c)}%` }"
                      />
                    </div>
                    <span class="text-xs">{{ c.completed_visits_count }}/{{ c.annual_service_visits_count }}</span>
                  </div>
                </td>
                <td class="px-2 py-3">
                  <span class="rounded bg-emerald-100 px-2 py-0.5 text-[11px] text-emerald-800">{{ c.signed_status }}</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="mt-5 rounded-xl border border-dashed border-sky-300 bg-sky-50/50 p-4">
          <p class="text-sm font-semibold text-medical-navy">新建签约向导（演示）</p>
          <div class="mt-3 grid gap-3 md:grid-cols-3">
            <input v-model="wizard.name" class="rounded border px-3 py-2 text-sm" placeholder="居民姓名（脱敏）" />
            <input v-model="wizard.doctor" class="rounded border px-3 py-2 text-sm" placeholder="签约全科医生" />
            <button class="btn-primary" type="button" @click="confirmSign">电子确认签约 · {{ packLabel(selectedPack) }}</button>
          </div>
          <p v-if="wizardMsg" class="mt-2 text-xs text-teal-700">{{ wizardMsg }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { getFamilyContracts, type FamilyContract } from '@/utils/sqljs-engine'

const packages = [
  { code: 'STANDARD_PACK', name: '标准服务包', desc: '基础随访与健康咨询' },
  { code: 'ELDERLY_CARE_PACK', name: '老年人服务包', desc: '体检随访 + 用药指导' },
  { code: 'CHRONIC_DISEASE_PACK', name: '慢病管理包', desc: '高血压/糖尿病干预追踪' },
  { code: 'VIP_FAMILY_PACK', name: 'VIP家庭包', desc: '家庭积分激励与绿色通道' },
]

const selectedPack = ref('ELDERLY_CARE_PACK')
const doctorFilter = ref('')
const contracts = ref<FamilyContract[]>([])
const wizard = reactive({ name: '', doctor: '李全科医师' })
const wizardMsg = ref('')

function load() {
  contracts.value = getFamilyContracts(doctorFilter.value.trim() || undefined)
}

function packLabel(code: string) {
  return packages.find((p) => p.code === code)?.name || code
}

function fulfillPct(c: FamilyContract) {
  const a = Number(c.annual_service_visits_count) || 1
  return Math.min(100, Math.round((Number(c.completed_visits_count) / a) * 100))
}

function remainVisits(c: FamilyContract) {
  return Math.max(0, Number(c.annual_service_visits_count) - Number(c.completed_visits_count))
}

function daysLeft(end: string) {
  const diff = new Date(end).getTime() - Date.now()
  return Math.max(0, Math.ceil(diff / 86400000))
}

function confirmSign() {
  if (!wizard.name) {
    wizardMsg.value = '请填写居民姓名'
    return
  }
  wizardMsg.value = `已生成演示签约协议：${wizard.name} × ${wizard.doctor} × ${packLabel(selectedPack.value)}（本地会话确认，未写库）`
}

onMounted(load)
</script>
