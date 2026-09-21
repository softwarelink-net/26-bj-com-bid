<template>
  <div class="space-y-5">
    <div class="panel-card flex flex-wrap items-end gap-3 p-4">
      <div class="min-w-[200px] flex-1">
        <label class="mb-1 block text-xs font-medium text-slate-600">EHR 快速检索</label>
        <input
          v-model="keyword"
          class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-200"
          placeholder="姓名脱敏 / 档案号 / 地址"
          @keyup.enter="search"
        />
      </div>
      <label class="flex items-center gap-2 text-sm text-slate-700">
        <input v-model="onlyHypertension" type="checkbox" class="rounded border-slate-300" @change="search" />
        高血压慢病
      </label>
      <label class="flex items-center gap-2 text-sm text-slate-700">
        <input v-model="onlyDiabetes" type="checkbox" class="rounded border-slate-300" @change="search" />
        糖尿病慢病
      </label>
      <button class="btn-primary" type="button" @click="search">检索</button>
      <div class="ml-auto flex gap-2">
        <span class="stat-chip">档案 {{ records.length }}</span>
        <span class="stat-chip !bg-rose-50 !text-rose-800">达标率 {{ complianceRate }}%</span>
      </div>
    </div>

    <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      <article v-for="r in records" :key="r.id" class="panel-card p-4">
        <div class="flex items-start justify-between">
          <div>
            <h3 class="text-base font-bold text-slate-900">{{ r.resident_name_masked }}</h3>
            <p class="font-mono text-xs text-slate-500">{{ r.ehr_no }}</p>
          </div>
          <span class="rounded bg-slate-100 px-2 py-0.5 text-[11px] text-slate-600">
            {{ r.gender === 'MALE' ? '男' : '女' }} · {{ r.age_years }}岁
          </span>
        </div>
        <p class="mt-2 text-xs text-slate-600">{{ r.residential_address }}</p>
        <p class="mt-1 text-xs text-slate-500">建档站：{{ r.established_station }}</p>
        <div class="mt-3 flex flex-wrap gap-1">
          <span v-if="r.hypertension_flag" class="rounded bg-rose-100 px-2 py-0.5 text-[11px] text-rose-800">高血压</span>
          <span v-if="r.diabetes_flag" class="rounded bg-amber-100 px-2 py-0.5 text-[11px] text-amber-800">糖尿病</span>
          <span class="rounded bg-sky-100 px-2 py-0.5 text-[11px] text-sky-800">{{ sourceLabel(r.ehr_data_source) }}</span>
        </div>
        <div class="mt-3 border-t border-slate-100 pt-3">
          <p class="text-xs text-slate-500">最近随访：{{ r.last_followup_date }}</p>
          <div class="mt-2 flex gap-2">
            <input v-model="followupDates[r.ehr_no]" type="date" class="flex-1 rounded border border-slate-300 px-2 py-1 text-xs" />
            <button class="btn-ghost !text-xs" type="button" @click="saveFollowup(r.ehr_no)">录入随访</button>
          </div>
        </div>
      </article>
    </div>

    <p v-if="toast" class="fixed bottom-6 right-6 z-50 rounded-lg bg-medical-navy px-4 py-2 text-sm text-white shadow-lg">
      {{ toast }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { getHealthRecords, updateHealthFollowup, type HealthRecord } from '@/utils/sqljs-engine'

const keyword = ref('')
const onlyHypertension = ref(false)
const onlyDiabetes = ref(false)
const records = ref<HealthRecord[]>([])
const followupDates = reactive<Record<string, string>>({})
const toast = ref('')

function search() {
  records.value = getHealthRecords({
    keyword: keyword.value.trim() || undefined,
    hypertension: onlyHypertension.value || undefined,
    diabetes: onlyDiabetes.value || undefined,
  })
  records.value.forEach((r) => {
    if (!followupDates[r.ehr_no]) followupDates[r.ehr_no] = r.last_followup_date
  })
}

const complianceRate = computed(() => {
  if (!records.value.length) return 0
  const ok = records.value.filter((r) => r.hypertension_flag || r.diabetes_flag).length
  return Math.round((ok / records.value.length) * 1000) / 10
})

function sourceLabel(src: string) {
  const map: Record<string, string> = {
    MIGRATED_FROM_HIS: 'HIS迁移',
    NEW_COMMUNITY_REG: '新建档',
    MOBILE_APP_SYNC: '移动端同步',
  }
  return map[src] || src
}

function saveFollowup(ehrNo: string) {
  const date = followupDates[ehrNo]
  if (!date) return
  updateHealthFollowup(ehrNo, date)
  search()
  toast.value = `已更新 ${ehrNo} 公卫随访日期`
  setTimeout(() => {
    toast.value = ''
  }, 2200)
}

onMounted(search)
</script>
