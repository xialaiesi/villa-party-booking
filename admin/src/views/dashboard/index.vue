<template>
  <div class="dashboard">
    <!-- 核心指标卡片 -->
    <el-row :gutter="20">
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card stat-blue">
          <div class="stat-label">本月订单</div>
          <div class="stat-value">{{ stats?.month?.orders || 0 }}</div>
          <div class="stat-hint">
            <span>今日 {{ stats?.today?.orders || 0 }} 单</span>
            <span v-if="orderGrowth !== null" class="growth" :class="orderGrowth >= 0 ? 'up' : 'down'">
              {{ orderGrowth >= 0 ? '+' : '' }}{{ orderGrowth }}%
            </span>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card stat-green">
          <div class="stat-label">本月收入</div>
          <div class="stat-value">¥{{ formatNum(stats?.month?.revenue || 0) }}</div>
          <div class="stat-hint">
            <span>今日 ¥{{ formatNum(stats?.today?.revenue || 0) }}</span>
            <span v-if="revenueGrowth !== null" class="growth" :class="revenueGrowth >= 0 ? 'up' : 'down'">
              {{ revenueGrowth >= 0 ? '+' : '' }}{{ revenueGrowth }}%
            </span>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card stat-orange">
          <div class="stat-label">待处理事项</div>
          <div class="stat-value">{{ totalPending }}</div>
          <div class="stat-hint pending-list">
            <span v-if="stats?.pendingItems?.pendingOrders" class="pending-tag">待确认订单 {{ stats.pendingItems.pendingOrders }}</span>
            <span v-if="stats?.pendingItems?.pendingDepositOrders" class="pending-tag">待退押金 {{ stats.pendingItems.pendingDepositOrders }}</span>
            <span v-if="stats?.pendingItems?.pendingVideoReviews" class="pending-tag">待审核视频 {{ stats.pendingItems.pendingVideoReviews }}</span>
            <span v-if="totalPending === 0" class="pending-tag">暂无待处理事项</span>
          </div>
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
          <div v-if="isTrendEmpty" class="chart-empty" style="height: 320px;">
            <el-icon :size="48" color="#c0c4cc"><TrendCharts /></el-icon>
            <p>订单数据将在这里展示</p>
            <p class="chart-empty-sub">有新订单后，趋势图会自动更新</p>
          </div>
          <v-chart v-else :option="trendOption" style="height: 320px;" autoresize />
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
        <el-card shadow="hover" class="hot-villa-card">
          <template #header>热门别墅 Top 5</template>
          <div class="hot-villa" v-for="(v, i) in hotVillas" :key="v.id">
            <div class="rank" :class="'rank-' + (i + 1)">{{ i + 1 }}</div>
            <el-image v-if="v.coverImage" :src="v.coverImage" fit="cover" class="hot-img" />
            <div class="hot-info">
              <div class="hot-name">{{ v.name }}</div>
              <div class="hot-meta">¥{{ v.basePrice }}/晚 · {{ v.orderCount }} 单</div>
            </div>
          </div>
          <div v-if="!hotVillas.length" class="hot-villa-empty">
            <el-icon :size="40" color="#c0c4cc"><House /></el-icon>
            <p>快去添加房源吧</p>
          </div>
        </el-card>
      </el-col>
      <el-col :span="14">
        <el-card shadow="hover">
          <template #header>最近订单</template>
          <el-table :data="recentOrders" stripe size="small" :row-class-name="orderRowClass">
            <el-table-column label="订单号" width="150">
              <template #default="{ row }">
                <div class="order-no-cell">
                  <span class="order-no-text" :title="row.orderNo">...{{ row.orderNo.slice(-8) }}</span>
                  <el-icon class="order-no-copy" @click.stop="copyOrderNo(row.orderNo)"><CopyDocument /></el-icon>
                </div>
              </template>
            </el-table-column>
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
            <el-table-column label="操作" width="90" align="center">
              <template #default="{ row }">
                <el-button type="primary" link size="small" @click="goOrderDetail(row)">查看详情</el-button>
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
import { useRouter } from 'vue-router';
import { use } from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import { LineChart, PieChart } from 'echarts/charts';
import { TitleComponent, TooltipComponent, LegendComponent, GridComponent } from 'echarts/components';
import VChart from 'vue-echarts';
import { ElMessage } from 'element-plus';
import { CopyDocument, TrendCharts, House } from '@element-plus/icons-vue';
import { getStats, getTrend, getOrderStatus, getHotVillas, getRecentOrders } from '../../api/dashboard';

use([CanvasRenderer, LineChart, PieChart, TitleComponent, TooltipComponent, LegendComponent, GridComponent]);

const router = useRouter();
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

// 环比计算
const orderGrowth = computed(() => {
  if (!stats.value?.lastMonth) return null;
  const last = stats.value.lastMonth.orders;
  if (!last) return null;
  return Math.round(((stats.value.month.orders - last) / last) * 100);
});

const revenueGrowth = computed(() => {
  if (!stats.value?.lastMonth) return null;
  const last = stats.value.lastMonth.revenue;
  if (!last) return null;
  return Math.round(((stats.value.month.revenue - last) / last) * 100);
});

// 待处理事项总数
const totalPending = computed(() => {
  if (!stats.value?.pendingItems) return 0;
  const p = stats.value.pendingItems;
  return (p.pendingOrders || 0) + (p.pendingDepositOrders || 0) + (p.pendingVideoReviews || 0);
});

// A-03: 趋势图数据是否为空
const isTrendEmpty = computed(() => {
  if (!trend.value.length) return true;
  const totalOrders = trend.value.reduce((sum: number, t: any) => sum + (t.orders || 0), 0);
  const totalRevenue = trend.value.reduce((sum: number, t: any) => sum + (t.revenue || 0), 0);
  return totalOrders === 0 && totalRevenue === 0;
});

// A-03: 趋势图配置优化，数据稀疏时调整Y轴
const trendOption = computed(() => {
  const orders = trend.value.map((t: any) => t.orders);
  const revenue = trend.value.map((t: any) => t.revenue);
  const maxOrders = Math.max(...orders, 0);
  const maxRevenue = Math.max(...revenue, 0);

  return {
    tooltip: { trigger: 'axis' },
    legend: { data: ['订单数', '收入'] },
    xAxis: { type: 'category', data: trend.value.map((t: any) => t.date.slice(5)) },
    yAxis: [
      {
        type: 'value', name: '订单', position: 'left',
        minInterval: 1,
        max: maxOrders <= 5 ? 5 : undefined,
      },
      {
        type: 'value', name: '收入(¥)', position: 'right',
        max: maxRevenue <= 100 ? 100 : undefined,
      },
    ],
    series: [
      {
        name: '订单数', type: 'line', smooth: true, data: orders,
        itemStyle: { color: '#409eff' },
        areaStyle: maxOrders <= 5 ? { color: 'rgba(64,158,255,0.08)' } : undefined,
        symbolSize: maxOrders <= 5 ? 8 : 4,
      },
      {
        name: '收入', type: 'line', smooth: true, yAxisIndex: 1, data: revenue,
        itemStyle: { color: '#67c23a' },
        areaStyle: maxRevenue <= 100 ? { color: 'rgba(103,194,58,0.08)' } : undefined,
        symbolSize: maxRevenue <= 100 ? 8 : 4,
      },
    ],
    grid: { left: 50, right: 60, top: 40, bottom: 30 },
  };
});

// A-04: 饼图展示所有状态，0的灰色显示
const allStatusList = [
  { key: 'PENDING_PAY', label: '待支付', color: '#909399' },
  { key: 'PAID', label: '已支付', color: '#e6a23c' },
  { key: 'CONFIRMED', label: '已确认', color: '#409eff' },
  { key: 'CHECKED_IN', label: '已入住', color: '#67c23a' },
  { key: 'PENDING_DEPOSIT', label: '待退押金', color: '#f56c6c' },
  { key: 'COMPLETED', label: '已完成', color: '#95d475' },
  { key: 'CANCELLED', label: '已取消', color: '#c0c4cc' },
  { key: 'REJECTED', label: '已拒绝', color: '#f89898' },
];

const statusOption = computed(() => {
  // 把接口返回的数据映射到 map 中
  const countMap: Record<string, number> = {};
  orderStatus.value.forEach((s: any) => { countMap[s.label] = s.count; });

  const data = allStatusList.map(s => {
    const count = countMap[s.label] || 0;
    return {
      value: count,
      name: s.label,
      itemStyle: { color: count > 0 ? s.color : '#e8e8e8' },
      label: { show: count > 0 },
    };
  });

  // 至少有一个非0状态的计数
  const hasData = data.some(d => d.value > 0);

  return {
    tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
    legend: {
      bottom: 0, left: 'center', type: 'scroll',
      data: allStatusList.map(s => s.label),
      textStyle: { fontSize: 11 },
    },
    series: [{
      type: 'pie',
      radius: ['40%', '65%'],
      avoidLabelOverlap: false,
      label: { show: true, formatter: '{b}\n{c}' },
      emphasis: {
        label: { show: true, fontSize: 14, fontWeight: 'bold' },
      },
      // 无数据时给每个状态均等值1以展示分布骨架
      data: hasData ? data : data.map(d => ({ ...d, value: 1, label: { show: false } })),
    }],
    // 无数据时显示中心提示文字
    ...(hasData ? {} : {
      graphic: {
        type: 'text',
        left: 'center',
        top: 'center',
        style: { text: '暂无订单数据', fontSize: 13, fill: '#c0c4cc' },
      },
    }),
  };
});

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

// 待处理订单高亮
function orderRowClass({ row }: { row: any }) {
  if (row.status === 1 || row.status === 4) return 'pending-row';
  return '';
}

function goOrderDetail(row: any) {
  router.push(`/order?orderNo=${row.orderNo}`);
}

// A-10: 复制订单号
function copyOrderNo(orderNo: string) {
  navigator.clipboard.writeText(orderNo).then(() => {
    ElMessage.success('订单号已复制');
  }).catch(() => {
    // fallback
    const textarea = document.createElement('textarea');
    textarea.value = orderNo;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    ElMessage.success('订单号已复制');
  });
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

/* 环比增长指标 */
.growth { margin-left: 8px; font-size: 12px; font-weight: 600; }
.growth.up { color: #67c23a; }
.growth.down { color: #f56c6c; }

/* 待处理事项 */
.pending-list { display: flex; flex-wrap: wrap; gap: 4px; }
.pending-tag { font-size: 11px; color: #e6a23c; background: #fdf6ec; padding: 1px 6px; border-radius: 4px; }

/* A-03: 趋势图空状态 */
.chart-empty {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  color: #c0c4cc;
}
.chart-empty p { margin: 8px 0 0; font-size: 14px; color: #909399; }
.chart-empty .chart-empty-sub { font-size: 12px; color: #c0c4cc; margin-top: 4px; }

/* A-08: 热门别墅卡片自适应高度 */
.hot-villa-card :deep(.el-card__body) { padding-bottom: 12px; }
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

/* A-08: 热门别墅空状态 */
.hot-villa-empty {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  padding: 24px 0; color: #c0c4cc;
}
.hot-villa-empty p { margin: 8px 0 0; font-size: 14px; color: #909399; }

/* A-10: 订单号截断+复制按钮 */
.order-no-cell { display: flex; align-items: center; gap: 4px; }
.order-no-text { font-family: monospace; font-size: 13px; color: #606266; }
.order-no-copy {
  cursor: pointer; color: #c0c4cc; font-size: 14px; flex-shrink: 0;
  transition: color 0.2s;
}
.order-no-copy:hover { color: #409eff; }

/* 待处理订单高亮 */
:deep(.pending-row) { background-color: #fdf6ec !important; }
</style>
