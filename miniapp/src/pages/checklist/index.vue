<template>
  <view class="page" v-if="data">
    <!-- 倒计时头部 -->
    <view class="countdown-header">
      <view v-if="data.daysUntilCheckin > 0">
        <text class="countdown-number">{{ data.daysUntilCheckin }}</text>
        <text class="countdown-label">天后入住</text>
      </view>
      <view v-else-if="data.daysUntilCheckin === 0">
        <text class="countdown-today">今天入住！</text>
      </view>
      <view v-else>
        <text class="countdown-past">已入住</text>
      </view>
      <text class="countdown-date">{{ data.checkIn }} ~ {{ data.checkOut }}</text>
    </view>

    <!-- 进度条 -->
    <view class="progress-card">
      <view class="progress-header">
        <text class="progress-title">准备进度</text>
        <text class="progress-percent">{{ data.progress.percent }}%</text>
      </view>
      <view class="progress-bar">
        <view class="progress-fill" :style="{ width: data.progress.percent + '%' }"></view>
      </view>
      <text class="progress-text">{{ data.progress.done }}/{{ data.progress.total }} 项已完成</text>
    </view>

    <!-- 任务分类 -->
    <view class="section" v-for="cat in categories" :key="cat.key">
      <text class="section-title">{{ cat.label }}</text>
      <view class="task-list">
        <view
          class="task-item"
          :class="{ done: task.done, overdue: task.overdue }"
          v-for="task in getTasksByCategory(cat.key)"
          :key="task.id"
          @tap="toggle(task)"
        >
          <view class="checkbox" :class="{ checked: task.done }">
            <text v-if="task.done">✓</text>
          </view>
          <view class="task-content">
            <text class="task-title">{{ task.title }}</text>
            <text class="task-detail" v-if="task.detail">{{ task.detail }}</text>
            <text class="task-due" v-if="task.overdue">已过期</text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { getOrderTasks, toggleTask, generateTasks } from '../../api/order-task';

const data = ref<any>(null);
let orderId = 0;

const categories = [
  { key: 'before_checkin', label: '入住前准备' },
  { key: 'during', label: '入住当天' },
  { key: 'after', label: '退房事项' },
];

onLoad(async (query: any) => {
  orderId = parseInt(query.id);
  // 先尝试生成任务（如果还没有的话）
  try { await generateTasks(orderId); } catch {}
  await loadTasks();
});

async function loadTasks() {
  try {
    data.value = await getOrderTasks(orderId);
  } catch (e) {
    console.error(e);
  }
}

function getTasksByCategory(cat: string) {
  return data.value?.tasks?.filter((t: any) => t.category === cat) || [];
}

async function toggle(task: any) {
  try {
    const res = await toggleTask(task.id);
    task.done = res.done;
    // 更新进度
    const tasks = data.value.tasks;
    const doneCount = tasks.filter((t: any) => t.done).length;
    data.value.progress.done = doneCount;
    data.value.progress.percent = Math.round((doneCount / tasks.length) * 100);
  } catch (e) {
    console.error(e);
  }
}
</script>

<style lang="scss">
.page { background: #f5f5f5; min-height: 100vh; }
.countdown-header { background: linear-gradient(135deg, #ff6b35, #ff8f65); padding: 50rpx 30rpx; text-align: center; }
.countdown-number { font-size: 80rpx; font-weight: bold; color: #fff; }
.countdown-label { font-size: 30rpx; color: rgba(255,255,255,0.9); display: block; }
.countdown-today { font-size: 48rpx; font-weight: bold; color: #fff; }
.countdown-past { font-size: 36rpx; color: rgba(255,255,255,0.8); }
.countdown-date { font-size: 24rpx; color: rgba(255,255,255,0.7); display: block; margin-top: 12rpx; }
.progress-card { background: #fff; margin: 20rpx; padding: 24rpx; border-radius: 12rpx; }
.progress-header { display: flex; justify-content: space-between; }
.progress-title { font-size: 28rpx; font-weight: bold; color: #333; }
.progress-percent { font-size: 28rpx; color: #ff6b35; font-weight: bold; }
.progress-bar { height: 12rpx; background: #f0f0f0; border-radius: 6rpx; margin: 16rpx 0; }
.progress-fill { height: 100%; background: #ff6b35; border-radius: 6rpx; transition: width 0.3s; }
.progress-text { font-size: 22rpx; color: #999; }
.section { margin: 20rpx; }
.section-title { font-size: 28rpx; font-weight: bold; color: #333; display: block; margin-bottom: 12rpx; }
.task-list { display: flex; flex-direction: column; gap: 12rpx; }
.task-item { display: flex; gap: 16rpx; background: #fff; padding: 24rpx; border-radius: 10rpx; align-items: flex-start; }
.task-item.done { opacity: 0.6; }
.task-item.overdue { border-left: 6rpx solid #e74c3c; }
.checkbox { width: 40rpx; height: 40rpx; border: 2rpx solid #ddd; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; margin-top: 4rpx; }
.checkbox.checked { background: #27ae60; border-color: #27ae60; color: #fff; font-size: 24rpx; }
.task-content { flex: 1; }
.task-title { font-size: 28rpx; color: #333; display: block; }
.task-item.done .task-title { text-decoration: line-through; color: #999; }
.task-detail { font-size: 22rpx; color: #999; margin-top: 6rpx; display: block; }
.task-due { font-size: 20rpx; color: #e74c3c; margin-top: 4rpx; display: block; }
</style>
