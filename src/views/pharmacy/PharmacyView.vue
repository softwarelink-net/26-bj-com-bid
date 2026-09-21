<template>
  <div class="space-y-5">
    <div class="grid gap-4 lg:grid-cols-2">
      <div class="panel-card p-4">
        <h3 class="text-sm font-bold text-medical-navy">基层药械库存余量柱状图</h3>
        <div ref="chartRef" class="mt-2 h-72 w-full" />
      </div>
      <div class="panel-card p-4">
        <h3 class="text-sm font-bold text-rose-700">近效期 / 库存预警列表</h3>
        <ul class="mt-3 space-y-2">
          <li
            v-for="item in warnItems"
            :key="item.id"
            class="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm"
          >
            <div class="flex justify-between gap-2">
              <span class="font-medium text-rose-900">{{ item.item_name }}</span>
              <span class="text-xs text-rose-700">{{ item.supply_status }}</span>
            </div>
            <p class="mt-1 text-xs text-rose-800/80">
              批号 {{ item.batch_number }} · 效期 {{ item.expiry_date }} · 库存 {{ item.stock_quantity }}
            </p>
          </li>
          <li v-if="!warnItems.length" class="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-4 text-center text-sm text-emerald-800">
            当前无近效期红色预警，库存状态总体安全
          </li>
        </ul>
        <div class="mt-4 rounded-lg bg-slate-50 p-3 text-xs text-slate-600">
          <p class="font-semibold text-slate-800">冷链温湿度监测（演示）</p>
          <p class="mt-1">冷链仓位 A1：2.4℃ / 湿度 48% · 状态正常</p>
          <p>麻精药品专柜：双人双锁 · 出入库动态追溯已启用</p>
        </div>
      </div>
    </div>

    <div class="panel-card p-4">
      <div class="flex flex-wrap items-center justify-between gap-2">
        <h3 class="text-sm font-bold text-medical-navy">耗材出入库盘点台账</h3>
        <select v-model="facilityId" class="rounded-lg border border-slate-300 px-3 py-1.5 text-sm" @change="load">
          <option value="">全部机构</option>
          <option v-for="f in facilities" :key="f.id" :value="f.id">{{ f.facility_name }}</option>
        </select>
      </div>
      <div class="mt-3 overflow-x-auto">
        <table class="min-w-full text-left text-sm">
          <thead class="border-b text-xs uppercase text-slate-500">
            <tr>
              <th class="px-2 py-2">编码</th>
              <th class="px-2 py-2">品名</th>
              <th class="px-2 py-2">类别</th>
              <th class="px-2 py-2">批号</th>
              <th class="px-2 py-2">库存</th>
              <th class="px-2 py-2">效期</th>
              <th class="px-2 py-2">状态</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="p in items" :key="p.id" class="border-b border-slate-100">
              <td class="px-2 py-3 font-mono text-xs">{{ p.drug_device_code }}</td>
              <td class="px-2 py-3">{{ p.item_name }}</td>
              <td class="px-2 py-3">{{ categoryLabel(p.item_category) }}</td>
              <td class="px-2 py-3">{{ p.batch_number }}</td>
              <td class="px-2 py-3 font-semibold">{{ p.stock_quantity }}</td>
              <td class="px-2 py-3">{{ p.expiry_date }}</td>
              <td class="px-2 py-3">
                <span
                  class="rounded px-2 py-0.5 text-[11px]"
                  :class="p.supply_status === 'IN_STOCK_SAFE' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'"
                >
                  {{ p.supply_status }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import * as echarts from 'echarts'
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import {
  getFacilityNodes,
  getPharmacyInventory,
  type FacilityNode,
  type PharmacyItem,
} from '@/utils/sqljs-engine'

const items = ref<PharmacyItem[]>([])
const facilities = ref<FacilityNode[]>([])
const facilityId = ref('')
const chartRef = ref<HTMLDivElement | null>(null)
let chart: echarts.ECharts | null = null

const warnItems = computed(() =>
  items.value.filter((i) => i.supply_status !== 'IN_STOCK_SAFE' || isNearExpiry(i.expiry_date)),
)

function isNearExpiry(date: string) {
  const diff = new Date(date).getTime() - Date.now()
  return diff < 180 * 86400000
}

function categoryLabel(c: string) {
  const map: Record<string, string> = {
    WESTERN_MEDICINE: '西药',
    CHINESE_PATENT_MEDICINE: '中成药',
    MEDICAL_CONSUMABLE: '医疗耗材',
  }
  return map[c] || c
}

function load() {
  items.value = getPharmacyInventory(facilityId.value || undefined)
  renderChart()
}

function renderChart() {
  if (!chartRef.value) return
  if (!chart) chart = echarts.init(chartRef.value)
  chart.setOption({
    tooltip: { trigger: 'axis' },
    grid: { left: 40, right: 16, top: 30, bottom: 60 },
    xAxis: {
      type: 'category',
      data: items.value.map((i) => i.item_name.slice(0, 10)),
      axisLabel: { rotate: 25, fontSize: 10 },
    },
    yAxis: { type: 'value', name: '库存' },
    series: [
      {
        type: 'bar',
        data: items.value.map((i) => i.stock_quantity),
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#0369a1' },
            { offset: 1, color: '#0d9488' },
          ]),
        },
        barWidth: 28,
      },
    ],
  })
}

onMounted(() => {
  facilities.value = getFacilityNodes()
  load()
  window.addEventListener('resize', resize)
})

onUnmounted(() => {
  window.removeEventListener('resize', resize)
  chart?.dispose()
})

function resize() {
  chart?.resize()
}

watch(items, () => renderChart())
</script>
