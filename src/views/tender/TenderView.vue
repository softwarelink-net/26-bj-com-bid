<template>
  <article class="panel-card mx-auto max-w-4xl overflow-hidden shadow-xl">
    <div class="bg-gradient-to-r from-medical-navy to-medical-teal px-6 py-5 text-white">
      <p class="text-xs tracking-wider text-sky-100">公开招标公示 · 免密访问</p>
      <h2 class="mt-1 text-2xl font-bold">区社管中心社区卫生服务综合管理系统建设项目招标公告</h2>
      <p class="mt-2 text-sm text-sky-100">项目编号：11010126210200022537-XM001</p>
    </div>

    <div class="space-y-6 p-6 text-sm leading-relaxed text-slate-700">
      <section v-for="item in sections" :key="item.title">
        <h3 class="mb-2 border-l-4 border-medical-teal pl-3 text-base font-bold text-medical-navy">
          {{ item.title }}
        </h3>
        <div class="rounded-lg bg-slate-50 px-4 py-3 whitespace-pre-wrap">{{ item.content }}</div>
      </section>

      <section>
        <h3 class="mb-2 border-l-4 border-medical-teal pl-3 text-base font-bold text-medical-navy">
          7. 技术要点
        </h3>
        <ul class="list-disc space-y-2 pl-5">
          <li v-for="(t, i) in techPoints" :key="i">{{ t }}</li>
        </ul>
      </section>

      <section>
        <h3 class="mb-2 border-l-4 border-medical-teal pl-3 text-base font-bold text-medical-navy">
          8. 技术创新性
        </h3>
        <ul class="list-disc space-y-2 pl-5">
          <li v-for="(t, i) in innovations" :key="i">{{ t }}</li>
        </ul>
      </section>

      <section class="rounded-xl border border-sky-200 bg-sky-50 p-4">
        <h3 class="font-bold text-medical-sky">北京市政府采购电子交易平台 · 线上投标指引</h3>
        <ol class="mt-2 list-decimal space-y-1 pl-5 text-slate-700">
          <li>登录北京市政府采购电子交易平台，检索项目编号 11010126210200022537-XM001。</li>
          <li>按招标文件要求准备资格证明、技术方案与报价文件。</li>
          <li>投标文件递交截止时间：2026年10月09日 09:00，逾期系统自动拒收。</li>
          <li>本项目不接受联合体投标；合同签订后 6 个月内完成建设，终验后提供 2 年免费运维。</li>
        </ol>
      </section>
    </div>
  </article>
</template>

<script setup lang="ts">
const sections = [
  { title: '1. 标题', content: '区社管中心社区卫生服务综合管理系统建设项目招标公告' },
  { title: '2. 项目发包方', content: '北京市东城区社区卫生服务管理中心' },
  { title: '3. 项目编号', content: '11010126210200022537-XM001' },
  { title: '4. 项目发布时间', content: '2026-09-15 00:00:00' },
  {
    title: '5. 关键词',
    content:
      '北京市东城区社区卫生服务管理中心, 社区卫生服务系统, HIS解耦, 基本公卫服务, 家医签约, 11010126210200022537-XM001, 北京政府采购',
  },
  {
    title: '6. 摘要',
    content:
      '北京市东城区社区卫生服务管理中心委托北京国恒招标有限公司，对区社管中心社区卫生服务综合管理系统建设项目组织公开招标，预算金额与最高限价为2,011,200.00元。采购需求为建设综合管理信息系统，将非临床业务从HIS系统中剥离，涵盖区域一体化管理、公卫服务、家医签约、药械管理及数据迁移，合同签订后6个月内完成项目建设，终验后提供2年免费运维服务，不接受联合体投标，投标文件递交截止时间为2026年10月09日09:00。',
  },
]

const techPoints = [
  '非临床业务自既有 HIS 系统中的无损剥离与松耦合架构重构：提升底层医疗 HIS 运行效能。',
  '区-中心-站科-医务四级分级业务管理与区域一体化指标统计：实现多维数据精准汇聚。',
  '居民电子健康档案、基本公卫、家医签约与药械全链条闭环：保障基层医疗卫生高质量发展。',
  '纯前端 WebAssembly sql.js 边缘极速响应体系：零服务器常驻运维开销，数据本地极简持久化。',
]

const innovations = [
  '全要素首都核心区社区卫生服务与公卫运营数字孪生指挥大屏：宏观洞察各中心门诊流向、慢病控制率与家医签约履约率。',
  '统一业务命名空间严格隔离架构：统一采用专用数据表前缀与独立本地存储载体，杜绝同平台跨站点污染。',
]
</script>
