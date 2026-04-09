<template>
  <div class="dashboard">
    <!-- 核心指标卡片 -->
    <el-row :gutter="20">
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card stat-blue">
          <div class="stat-label">今日订单</div>
          <div class="stat-value">{{ stats?.today?.orders || 0 }}</div>
          <div class="stat-hint">本月累计 {{ stats?.month?.orders || 0 }} 单</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card stat-green">
          <div class="stat-label">今日收入</div>
          <div class="stat-value">¥{{ formatNum(stats?.today?.revenue || 0) }}</div>
          <div class="stat-hint">本月 ¥{{ formatNum(stats?.month?.revenue || 0) }}</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card stat-orange">
          <div class="stat-label">待确认订单</div>
          <div class="stat-value">{{ stats?.pendingOrders || 0 }}</div>
          <div class="stat-hint">需要及时处理</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card stat-purple">
          <div class="stat-label">在线房源</div>
          <div class="stat-value">{{ stats?.villas?.active || 0 }}</div>
          <div class="stat-hint">总计 {{ stats?.villas?.total || 0 }} 栋 / 用户 {{ stats?.users || 0 }} 人</div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 趋势图 + 订单状态 -->
    <el-row :gutter="20" style="margin-top: 20px;">
      <el-col :span="16">
        <el-card shadow="hover">
          <template #header>近30天订单和收入趋势</template>
          <v-chart :option="trendOption" style="height: 320px;" autoresize />
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="hover">
          <template #header>订单状态分布</template>
          <v-chart :option="statusOption" style="height: 320px;" autoresize />
        </el-card>
      </el-col>
    </el-row>

    <!-- 热门别墅 + 最近订单 -->
    <el-row :gutter="20" style="margin-top: 20px;">
      <el-col :span="10">
        <el-card shadow="hover">
          <template #header>热门别墅 Top 5</template>
          <div class="hot-villa" v-for="(v, i) in hotVillas" :key="v.id">
            <div class="rank" :class="'rank-' + (i + 1)">{{ i + 1 }}</div>
            <el-image v-if="v.coverImage" :src="v.coverImage" fit="cover" class="hot-img" />
            <div class="hot-info">
              <div class="hot-name">{{ v.name }}</div>
              <div class="hot-meta">¥{{ v.basePrice }}/晚 · {{ v.orderCount }} 单</div>
            </div>
          </div>
          <el-empty v-if="!hotVillas.length" description="暂无数据" :image-size="80" />
        </el-card>
      </el-col>
      <el-col :span="14">
        <el-card shadow="hover">
          <template #header>最近订单</template>
          <el-table :data="recentOrders" stripe size="small">
            <el-table-column prop="orderNo" label="订单号" width="180" />
            <el-table-column prop="villaName" label="别墅" />
            <el-table-column prop="userName" label="用户" width="100" />
            <el-table-column label="金额" width="100" align="center">
              <template #default="{ row }">¥{{ row.totalAmount }}</template>
            </el-table-column>
            <el-table-column label="状态" width="100" align="center">
              <template #default="{ row }">
                <el-tag :type="statusType(row.status)" size="small">{{ statusText(row.status) }}</el-tag>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { use } from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import { LineChart, PieChart } from 'echarts/charts';
import { TitleComponent, TooltipComponent, LegendComponent, GridComponent } from 'echarts/components';
import VChart from 'vue-echarts';
import { getStats, getTrend, getOrderStatus, getHotVillas, getRecentOrders } from '../../api/dashboard';

use([CanvasRenderer, LineChart, PieChart, TitleComponent, TooltipComponent, LegendComponent, GridComponent]);

const stats = ref<any>(null);
const trend = ref<any[]>([]);
const orderStatus = ref<any[]>([]);
const hotVillas = ref<any[]>([]);
const recentOrders = ref<any[]>([]);

onMounted(async () => {
  const [s, t, os, hv, ro] = await Promise.all([
    getStats(), getTrend(), getOrderStatus(), getHotVillas(), getRecentOrders(),
  ]);
  stats.value = s;
  trend.value = t as any;
  orderStatus.value = os as any;
  hotVillas.value = hv as any;
  recentOrders.value = ro as any;
});

const trendOption = computed(() => ({
  tooltip: { trigger: 'axis' },
  legend: { data: ['订单数', '收入'] },
  xAxis: { type: 'category', data: trend.value.map((t: any) => t.date.slice(5)) },
  yAxis: [
    { type: 'value', name: '订单', position: 'left' },
    { type: 'value', name: '收入(¥)', position: 'right' },
  ],
  series: [
    { name: '订单数', type: 'line', smooth: true, data: trend.value.map((t: any) => t.orders), itemStyle: { color: '#409eff' } },
    { name: '收入', type: 'line', smooth: true, yAxisIndex: 1, data: trend.value.map((t: any) => t.revenue), itemStyle: { color: '#67c23a' } },
  ],
  grid: { left: 50, right: 60, top: 40, bottom: 30 },
}));

const statusOption = computed(() => ({
  tooltip: { trigger: 'item' },
  legend: { bottom: 0, left: 'center' },
  series: [{
    type: 'pie',
    radius: ['40%', '65%'],
    avoidLabelOverlap: false,
    label: { show: true, formatter: '{b}\n{c}' },
    data: orderStatus.value.map((s: any) => ({ value: s.count, name: s.label })),
  }],
}));

function formatNum(n: number) {
  if (n >= 10000) return (n / 10000).toFixed(1) + '万';
  return n.toLocaleString();
}

function statusText(s: number) {
  return { 0: '待支付', 1: '待确认', 2: '待入住', 3: '已入住', 4: '待退押金', 5: '已完成', 6: '已取消', 7: '已拒绝', 8: '已关闭' }[s] || '';
}

function statusType(s: number): any {
  return { 0: 'info', 1: 'warning', 2: '', 3: '', 4: 'warning', 5: 'success', 6: 'info', 7: 'danger', 8: 'info' }[s] || '';
}
</script>

<style scoped>
.dashboard { padding: 0; }
.stat-card { position: relative; overflow: hidden; }
.stat-label { font-size: 14px; color: #909399; }
.stat-value { font-size: 32px; font-weight: bold; margin: 8px 0; }
.stat-hint { font-size: 12px; color: #c0c4cc; }
.stat-blue .stat-value { color: #409eff; }
.stat-green .stat-value { color: #67c23a; }
.stat-orange .stat-value { color: #e6a23c; }
.stat-purple .stat-value { color: #a855f7; }
.hot-villa { display: flex; align-items: center; gap: 12px; padding: 10px 0; border-bottom: 1px solid #f5f5f5; }
.hot-villa:last-child { border-bottom: none; }
.rank { width: 28px; height: 28px; border-radius: 50%; background: #ddd; color: #fff; text-align: center; line-height: 28px; font-weight: bold; font-size: 14px; flex-shrink: 0; }
.rank-1 { background: #f56c6c; }
.rank-2 { background: #e6a23c; }
.rank-3 { background: #409eff; }
.hot-img { width: 60px; height: 45px; border-radius: 4px; }
.hot-info { flex: 1; }
.hot-name { font-size: 14px; color: #303133; font-weight: 500; }
.hot-meta { font-size: 12px; color: #909399; margin-top: 2px; }
</style>
