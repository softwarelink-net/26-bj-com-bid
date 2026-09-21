<template>
  <div class="space-y-5">
    <section class="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <div v-for="card in kpiCards" :key="card.label" class="panel-card overflow-hidden">
        <div class="bg-gradient-to-br from-medical-navy/95 to-medical-teal/90 px-4 py-3 text-white">
          <p class="text-xs text-sky-100">{{ card.label }}</p>
          <p class="mt-1 text-2xl font-bold">{{ card.value }}</p>
        </div>
        <p class="px-4 py-2 text-xs text-slate-500">{{ card.hint }}</p>
      </div>
    </section>

    <section class="grid gap-4 xl:grid-cols-2">
      <div class="panel-card p-4">
        <h3 class="text-sm font-bold text-medical-navy">各中心门诊人次 vs 公卫随访覆盖率</h3>
        <div ref="barRef" class="mt-2 h-72 w-full" />
      </div>
      <div class="panel-card p-4">
        <h3 class="text-sm font-bold text-medical-navy">重点慢病患者控制率雷达</h3>
        <div ref="radarRef" class="mt-2 h-72 w-full" />
      </div>
      <div class="panel-card p-4">
        <h3 class="text-sm font-bold text-medical-navy">药械周转率 / 冷链健康度仪表盘</h3>
        <div ref="gaugeRef" class="mt-2 h-72 w-full" />
      </div>
      <div class="panel-card p-4">
        <h3 class="text-sm font-bold text-medical-navy">家医签约人群分类构成</h3>
        <div ref="pieRef" class="mt-2 h-72 w-full" />
      </div>
    </section>

    <section class="grid gap-4 lg:grid-cols-2">
      <div class="panel-card p-4">
        <h3 class="text-sm font-bold text-medical-navy">实时滚动通知</h3>
        <div class="mt-3 h-40 overflow-hidden rounded-lg border border-slate-100 bg-slate-50">
          <ul class="animate-marquee space-y-2 p-3 text-xs text-slate-700">
            <li v-for="(n, i) in notices" :key="i" class="rounded bg-white px-3 py-2 shadow-sm">{{ n }}</li>
            <li v-for="(n, i) in notices" :key="`d-${i}`" class="rounded bg-white px-3 py-2 shadow-sm">{{ n }}</li>
          </ul>
        </div>
      </div>
      <div class="panel-card p-4">
        <h3 class="text-sm font-bold text-medical-navy">Feature Flags 一键切换</h3>
        <div class="mt-3 space-y-3">
          <div
            v-for="flag in flags"
            :key="flag.config_key"
            class="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-3"
          >
            <div>
              <p class="text-sm font-semibold text-slate-800">{{ flagTitle(flag.config_key) }}</p>
              <p class="text-xs text-slate-500">{{ flag.description }}</p>
            </div>
            <button
              type="button"
              class="rounded-full px-3 py-1 text-xs font-bold"
              :class="flag.config_value === 'true' ? 'bg-teal-500 text-white' : 'bg-slate-300 text-slate-700'"
              @click="toggle(flag)"
            >
              {{ flag.config_value === 'true' ? '已开启' : '已关闭' }}
            </button>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import * as echarts from 'echarts'
import { computed, onMounted, onUnmounted, ref } from 'vue'
import {
  getDashboardStats,
  getFacilityNodes,
  getFamilyContracts,
  getSystemConfigs,
  updateSystemConfig,
  type SystemConfig,
} from '@/utils/sqljs-engine'

const barRef = ref<HTMLDivElement | null>(null)
const radarRef = ref<HTMLDivElement | null>(null)
const gaugeRef = ref<HTMLDivElement | null>(null)
const pieRef = ref<HTMLDivElement | null>(null)
const flags = ref<SystemConfig[]>([])
const stats = getDashboardStats()
const facilities = getFacilityNodes()
const contracts = getFamilyContracts()

const charts: echarts.ECharts[] = []

const kpiCards = computed(() => [
  { label: '在线机构节点', value: `${stats.onlineFacilities}/${stats.totalFacilities}`, hint: '区-中心-站科网格' },
  { label: 'HIS 迁移档案', value: stats.totalMigratedRecords.toLocaleString(), hint: '非临床业务剥离累计' },
  { label: '慢病管理人数', value: `${stats.hypertensionCount + stats.diabetesCount}`, hint: '高血压+糖尿病标识' },
  { label: '家医履约率', value: `${stats.contractFulfillmentRate}%`, hint: '年度约定随访完成度' },
])

const notices = [
  '【同步】朝阳门中心 HIS 双向增量批次 #A291 完成，耗时 1.2s',
  '【公卫】高血压随访履约核销：孙*芳 已完成第 4 次上门随访',
  '【药械】安定门站采血管库存周转率升至 1.8 次/月',
  '【签约】赵*强 慢病包履约进度 50%，系统已推送下一次随访提醒',
  '【安全】SM4 列级脱敏策略巡检通过，无明文穿透告警',
]

function flagTitle(key: string) {
  if (key.includes('HIS')) return 'HIS 自动解耦同步'
  if (key.includes('SM4')) return '国密 SM4 脱敏'
  return key
}

function loadFlags() {
  flags.value = getSystemConfigs().filter(
    (c) => c.config_key === 'FEATURE_AUTO_HIS_DECOUPLING_SYNC' || c.config_key === 'FEATURE_SM4_PATIENT_MASKING',
  )
}

function toggle(flag: SystemConfig) {
  updateSystemConfig(flag.config_key, flag.config_value === 'true' ? 'false' : 'true')
  loadFlags()
}

function initCharts() {
  if (barRef.value) {
    const c = echarts.init(barRef.value)
    charts.push(c)
    c.setOption({
      tooltip: { trigger: 'axis' },
      legend: { data: ['门诊人次', '公卫覆盖率%'] },
      grid: { left: 40, right: 40, top: 40, bottom: 40 },
      xAxis: {
        type: 'category',
        data: facilities.map((f) => f.facility_name.replace('北京市东城区', '').replace('东城区', '')),
      },
      yAxis: [
        { type: 'value', name: '人次' },
        { type: 'value', name: '%', max: 100 },
      ],
      series: [
        {
          name: '门诊人次',
          type: 'bar',
          data: [1860, 920, 1540],
          itemStyle: { color: '#0369a1' },
        },
        {
          name: '公卫覆盖率%',
          type: 'line',
          yAxisIndex: 1,
          data: [92.4, 88.1, 90.6],
          itemStyle: { color: '#0d9488' },
          smooth: true,
        },
      ],
    })
  }

  if (radarRef.value) {
    const c = echarts.init(radarRef.value)
    charts.push(c)
    c.setOption({
      tooltip: {},
      radar: {
        indicator: [
          { name: '血压达标', max: 100 },
          { name: '血糖达标', max: 100 },
          { name: '随访及时', max: 100 },
          { name: '用药依从', max: 100 },
          { name: '健康教育', max: 100 },
        ],
      },
      series: [
        {
          type: 'radar',
          data: [
            {
              value: [86, 81, 93, 78, 88],
              name: '东城区均值',
              areaStyle: { color: 'rgba(13,148,136,0.25)' },
              lineStyle: { color: '#0d9488' },
            },
          ],
        },
      ],
    })
  }

  if (gaugeRef.value) {
    const c = echarts.init(gaugeRef.value)
    charts.push(c)
    c.setOption({
      series: [
        {
          type: 'gauge',
          center: ['30%', '55%'],
          radius: '70%',
          min: 0,
          max: 100,
          detail: { formatter: '{value}%', fontSize: 14 },
          title: { offsetCenter: [0, '75%'], fontSize: 12 },
          data: [{ value: 87, name: '库存周转健康度' }],
          axisLine: {
            lineStyle: {
              width: 12,
              color: [
                [0.3, '#f87171'],
                [0.7, '#38bdf8'],
                [1, '#14b8a6'],
              ],
            },
          },
        },
        {
          type: 'gauge',
          center: ['72%', '55%'],
          radius: '70%',
          min: 0,
          max: 100,
          detail: { formatter: '{value}%', fontSize: 14 },
          title: { offsetCenter: [0, '75%'], fontSize: 12 },
          data: [{ value: 96, name: '冷链温控健康度' }],
          axisLine: {
            lineStyle: {
              width: 12,
              color: [
                [0.3, '#f87171'],
                [0.7, '#38bdf8'],
                [1, '#14b8a6'],
              ],
            },
          },
        },
      ],
    })
  }

  if (pieRef.value) {
    const c = echarts.init(pieRef.value)
    charts.push(c)
    const packCount: Record<string, number> = {}
    contracts.forEach((ct) => {
      packCount[ct.service_package_type] = (packCount[ct.service_package_type] || 0) + 1
    })
    const nameMap: Record<string, string> = {
      STANDARD_PACK: '标准包',
      ELDERLY_CARE_PACK: '老年人包',
      CHRONIC_DISEASE_PACK: '慢病包',
      VIP_FAMILY_PACK: 'VIP家庭包',
    }
    c.setOption({
      tooltip: { trigger: 'item' },
      series: [
        {
          type: 'pie',
          radius: ['42%', '68%'],
          data: Object.entries(packCount).map(([k, v]) => ({
            name: nameMap[k] || k,
            value: v,
          })),
          label: { fontSize: 11 },
          color: ['#1e3a8a', '#0369a1', '#0d9488', '#38bdf8'],
        },
      ],
    })
  }
}

function onResize() {
  charts.forEach((c) => c.resize())
}

onMounted(() => {
  loadFlags()
  initCharts()
  window.addEventListener('resize', onResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', onResize)
  charts.forEach((c) => c.dispose())
})
</script>

<style scoped>
@keyframes marquee {
  0% {
    transform: translateY(0);
  }
  100% {
    transform: translateY(-50%);
  }
}
.animate-marquee {
  animation: marquee 18s linear infinite;
}
</style>
