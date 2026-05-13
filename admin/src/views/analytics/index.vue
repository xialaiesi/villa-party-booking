<template>
  <div class="analytics-page">
    <div class="page-header">
      <h2>流量分析</h2>
      <el-radio-group v-model="days" @change="fetchData">
        <el-radio-button :value="7">近7天</el-radio-button>
        <el-radio-button :value="30">近30天</el-radio-button>
        <el-radio-button :value="90">近90天</el-radio-button>
      </el-radio-group>
    </div>

    <!-- 转化漏斗 -->
    <el-row :gutter="20">
      <el-col :span="4" v-for="(item, i) in funnelItems" :key="item.key">
        <el-card shadow="hover" class="funnel-card">
          <div class="funnel-label">{{ item.label }}</div>
          <div class="funnel-value">{{ data.funnel?.[item.key] || 0 }}</div>
          <div class="funnel-rate" v-if="i > 0 && funnelItems[i - 1].key">
            {{ funnelRate(funnelItems[i - 1].key, item.key) }}
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 20px;">
      <!-- 渠道分布 -->
      <el-col :span="12">
        <el-card shadow="hover">
          <template #header>渠道来源分布</template>
          <v-chart v-if="channelOption" :option="channelOption" style="height: 300px;" autoresize />
          <el-empty v-else description="暂无数据" />
        </el-card>
      </el-col>

      <!-- 每日PV趋势 -->
      <el-col :span="12">
        <el-card shadow="hover">
          <template #header>每日访问量趋势</template>
          <v-chart v-if="pvOption" :option="pvOption" style="height: 300px;" autoresize />
          <el-empty v-else description="暂无数据" />
        </el-card>
      </el-col>
    </el-row>

    <!-- 热门别墅 -->
    <el-card shadow="hover" style="margin-top: 20px;">
      <template #header>热门别墅 Top 10（按浏览量）</template>
      <el-table :data="data.topVillas || []" stripe>
        <el-table-column type="index" label="#" width="50" />
        <el-table-column prop="villaName" label="别墅名称" />
        <el-table-column prop="views" label="浏览量" width="120" sortable />
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import { use } from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import { PieChart, LineChart } from 'echarts/charts';
import { TitleComponent, TooltipComponent, LegendComponent, GridComponent } from 'echarts/components';
import VChart from 'vue-echarts';
import { getAnalyticsOverview } from '../../api/analytics';

use([CanvasRenderer, PieChart, LineChart, TitleComponent, TooltipComponent, LegendComponent, GridComponent]);

const days = ref(30);
const data = reactive<any>({});

const funnelItems = [
  { key: 'pageView', label: '页面浏览' },
  { key: 'villaView', label: '查看别墅' },
  { key: 'bookingOpen', label: '打开预订' },
  { key: 'wechatClick', label: '微信咨询' },
  { key: 'orderCreate', label: '创建订单' },
];

function funnelRate(prevKey: string, curKey: string): string {
  const prev = data.funnel?.[prevKey] || 0;
  const cur = data.funnel?.[curKey] || 0;
  if (!prev) return '-';
  return Math.round((cur / prev) * 100) + '%';
}

const channelOption = computed(() => {
  const channels = data.channelDistribution;
  if (!channels?.length) return null;
  return {
    tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
    series: [{
      type: 'pie',
      radius: ['40%', '70%'],
      data: channels.map((c: any) => ({ name: c.source, value: c.count })),
      emphasis: { itemStyle: { shadowBlur: 10, shadowOffsetX: 0, shadowColor: 'rgba(0, 0, 0, 0.5)' } },
    }],
    color: ['#ff6b35', '#36a3f7', '#34bfa3', '#ffb822', '#9b59b6', '#e74c3c'],
  };
});

const pvOption = computed(() => {
  const pv = data.dailyPv;
  if (!pv?.length) return null;
  return {
    tooltip: { trigger: 'axis' },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: {
      type: 'category',
      data: pv.map((d: any) => {
        const date = new Date(d.date);
        return `${date.getMonth() + 1}/${date.getDate()}`;
      }),
    },
    yAxis: { type: 'value' },
    series: [{
      data: pv.map((d: any) => d.count),
      type: 'line',
      smooth: true,
      areaStyle: { opacity: 0.15 },
      lineStyle: { color: '#ff6b35' },
      itemStyle: { color: '#ff6b35' },
    }],
  };
});

async function fetchData() {
  try {
    const res = await getAnalyticsOverview(days.value) as any;
    Object.assign(data, res);
  } catch {}
}

onMounted(fetchData);
</script>

<style scoped>
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}
.page-header h2 { margin: 0; font-size: 20px; }
.funnel-card { text-align: center; }
.funnel-label { font-size: 13px; color: #909399; margin-bottom: 8px; }
.funnel-value { font-size: 28px; font-weight: 700; color: #303133; }
.funnel-rate { font-size: 12px; color: #67c23a; margin-top: 4px; }
</style>
