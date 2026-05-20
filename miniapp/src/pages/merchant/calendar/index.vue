<template>
  <view class="page">
    <!-- 别墅选择 -->
    <view class="villa-picker" v-if="!villaId">
      <text class="picker-title">选择别墅</text>
      <view class="villa-item" v-for="v in villas" :key="v.id" @tap="selectVilla(v.id)">
        <text class="villa-name">{{ v.name }}</text>
        <text class="villa-arrow">›</text>
      </view>
    </view>

    <!-- 日历视图 -->
    <view v-else>
      <!-- 月份导航 -->
      <view class="month-nav">
        <text class="nav-btn" @tap="prevMonth">‹</text>
        <text class="month-text">{{ year }}年{{ month }}月</text>
        <text class="nav-btn" @tap="nextMonth">›</text>
      </view>

      <!-- 星期标头 -->
      <view class="week-header">
        <text class="week-day" v-for="d in ['日','一','二','三','四','五','六']" :key="d">{{ d }}</text>
      </view>

      <!-- 日历网格 -->
      <view class="calendar-grid">
        <view class="day-cell empty" v-for="n in startDay" :key="'e'+n"></view>
        <view
          class="day-cell"
          :class="{
            disabled: day.status === 'disabled',
            booked: day.status === 'booked',
            selected: selectedDate === day.date,
          }"
          v-for="day in calendarDays"
          :key="day.date"
          @tap="selectDate(day)"
        >
          <text class="day-num">{{ day.day }}</text>
          <text class="day-price" v-if="day.price">¥{{ day.price }}</text>
          <text class="day-status" v-if="day.status === 'booked'">已订</text>
          <text class="day-status off" v-if="day.status === 'disabled'">不可订</text>
        </view>
      </view>

      <!-- 编辑面板 -->
      <view class="edit-panel" v-if="selectedDate">
        <text class="panel-title">{{ selectedDate }} 设置</text>
        <view class="form-row">
          <text class="form-label">价格</text>
          <input class="form-input" type="digit" v-model="editPrice" placeholder="输入价格" />
        </view>
        <view class="form-row">
          <text class="form-label">状态</text>
          <view class="status-options">
            <text class="option" :class="{active: editStatus === 'available'}" @tap="editStatus = 'available'">可预订</text>
            <text class="option" :class="{active: editStatus === 'disabled'}" @tap="editStatus = 'disabled'">不可订</text>
          </view>
        </view>
        <button class="save-btn" @tap="saveCalendar">保存</button>
      </view>

      <!-- 批量操作 -->
      <view class="batch-section">
        <text class="section-title">批量设置</text>
        <view class="form-row">
          <text class="form-label">日期范围</text>
          <view class="date-range">
            <picker mode="date" :value="batchStart" @change="(e: any) => batchStart = e.detail.value">
              <text class="date-pick">{{ batchStart || '开始日期' }}</text>
            </picker>
            <text>至</text>
            <picker mode="date" :value="batchEnd" @change="(e: any) => batchEnd = e.detail.value">
              <text class="date-pick">{{ batchEnd || '结束日期' }}</text>
            </picker>
          </view>
        </view>
        <view class="form-row">
          <text class="form-label">价格</text>
          <input class="form-input" type="digit" v-model="batchPrice" placeholder="批量价格" />
        </view>
        <view class="form-row">
          <text class="form-label">状态</text>
          <view class="status-options">
            <text class="option" :class="{active: batchStatus === 'available'}" @tap="batchStatus = 'available'">可预订</text>
            <text class="option" :class="{active: batchStatus === 'disabled'}" @tap="batchStatus = 'disabled'">不可订</text>
          </view>
        </view>
        <button class="save-btn" @tap="saveBatch">批量保存</button>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { getAdminVillas, getAdminCalendar, setAdminCalendar } from '../../../api/admin';

const villaId = ref(0);
const villas = ref<any[]>([]);
const year = ref(new Date().getFullYear());
const month = ref(new Date().getMonth() + 1);
const calendarData = ref<any[]>([]);

const selectedDate = ref('');
const editPrice = ref('');
const editStatus = ref('available');

const batchStart = ref('');
const batchEnd = ref('');
const batchPrice = ref('');
const batchStatus = ref('available');

const daysInMonth = computed(() => new Date(year.value, month.value, 0).getDate());
const startDay = computed(() => new Date(year.value, month.value - 1, 1).getDay());

const calendarDays = computed(() => {
  const days = [];
  for (let d = 1; d <= daysInMonth.value; d++) {
    const dateStr = `${year.value}-${String(month.value).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const found = calendarData.value.find((c: any) => c.date === dateStr);
    days.push({
      day: d,
      date: dateStr,
      price: found?.price || null,
      status: found?.status || 'available',
    });
  }
  return days;
});

onLoad((opts: any) => {
  if (opts?.villaId) {
    villaId.value = Number(opts.villaId);
    loadCalendar();
  } else {
    loadVillas();
  }
});

async function loadVillas() {
  const data = await getAdminVillas({ page: 1, pageSize: 100 });
  villas.value = data.list || data;
}

function selectVilla(id: number) {
  villaId.value = id;
  loadCalendar();
}

async function loadCalendar() {
  try {
    calendarData.value = await getAdminCalendar(villaId.value, year.value, month.value) || [];
  } catch (e) { console.error(e); }
}

watch([year, month], () => { if (villaId.value) loadCalendar(); });

function prevMonth() {
  if (month.value === 1) { month.value = 12; year.value--; }
  else month.value--;
}

function nextMonth() {
  if (month.value === 12) { month.value = 1; year.value++; }
  else month.value++;
}

function selectDate(day: any) {
  if (day.status === 'booked') return;
  selectedDate.value = day.date;
  editPrice.value = day.price ? String(day.price) : '';
  editStatus.value = day.status || 'available';
}

async function saveCalendar() {
  try {
    await setAdminCalendar(villaId.value, [{
      date: selectedDate.value,
      price: Number(editPrice.value) || undefined,
      status: editStatus.value,
    }]);
    uni.showToast({ title: '保存成功', icon: 'success' });
    selectedDate.value = '';
    loadCalendar();
  } catch (e) { console.error(e); }
}

async function saveBatch() {
  if (!batchStart.value || !batchEnd.value) {
    uni.showToast({ title: '请选择日期范围', icon: 'none' });
    return;
  }
  const dates: any[] = [];
  const start = new Date(batchStart.value);
  const end = new Date(batchEnd.value);
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    dates.push({
      date: d.toISOString().split('T')[0],
      price: Number(batchPrice.value) || undefined,
      status: batchStatus.value,
    });
  }
  try {
    await setAdminCalendar(villaId.value, dates);
    uni.showToast({ title: '批量保存成功', icon: 'success' });
    loadCalendar();
  } catch (e) { console.error(e); }
}
</script>

<style lang="scss">
.page { background: #f5f5f5; min-height: 100vh; padding-bottom: 40rpx; }

.villa-picker { padding: 24rpx; }
.picker-title { font-size: 30rpx; font-weight: bold; display: block; margin-bottom: 20rpx; }
.villa-item {
  display: flex; justify-content: space-between; align-items: center;
  background: #fff; padding: 30rpx 24rpx; border-radius: 12rpx;
  margin-bottom: 12rpx;
}
.villa-name { font-size: 30rpx; color: #333; }
.villa-arrow { font-size: 36rpx; color: #ccc; }

.month-nav {
  display: flex; justify-content: center; align-items: center;
  padding: 24rpx; background: #fff; gap: 40rpx;
}
.nav-btn { font-size: 44rpx; color: #409EFF; padding: 0 20rpx; }
.month-text { font-size: 32rpx; font-weight: bold; color: #333; }

.week-header {
  display: grid; grid-template-columns: repeat(7, 1fr);
  background: #fff; padding: 16rpx 0; border-bottom: 1rpx solid #eee;
}
.week-day { text-align: center; font-size: 24rpx; color: #999; }

.calendar-grid {
  display: grid; grid-template-columns: repeat(7, 1fr);
  background: #fff; padding: 8rpx;
}
.day-cell {
  min-height: 110rpx; padding: 8rpx;
  display: flex; flex-direction: column; align-items: center;
  border: 2rpx solid transparent; border-radius: 8rpx;
}
.day-cell.empty { min-height: 0; }
.day-cell.selected { border-color: #409EFF; background: rgba(64,158,255,0.05); }
.day-cell.booked { background: rgba(245,108,108,0.08); }
.day-cell.disabled { opacity: 0.5; }
.day-num { font-size: 28rpx; color: #333; }
.day-price { font-size: 18rpx; color: #FF6B35; margin-top: 4rpx; }
.day-status { font-size: 16rpx; color: #F56C6C; margin-top: 2rpx; }
.day-status.off { color: #999; }

.edit-panel, .batch-section {
  margin: 24rpx; background: #fff; border-radius: 16rpx; padding: 24rpx;
}
.panel-title, .section-title { font-size: 30rpx; font-weight: bold; color: #333; display: block; margin-bottom: 20rpx; }
.form-row { display: flex; align-items: center; margin-bottom: 20rpx; }
.form-label { font-size: 28rpx; color: #666; width: 140rpx; flex-shrink: 0; }
.form-input {
  flex: 1; height: 72rpx; background: #f5f7fa; border-radius: 8rpx; padding: 0 20rpx; font-size: 28rpx;
}
.status-options { display: flex; gap: 16rpx; }
.option {
  font-size: 26rpx; padding: 10rpx 28rpx; border-radius: 24rpx;
  color: #666; background: #f5f5f5;
}
.option.active { background: #409EFF; color: #fff; }

.date-range { display: flex; align-items: center; gap: 16rpx; flex: 1; }
.date-pick {
  font-size: 26rpx; color: #333; background: #f5f7fa;
  padding: 10rpx 20rpx; border-radius: 8rpx;
}

.save-btn {
  width: 100%; height: 80rpx; line-height: 80rpx;
  background: #409EFF; color: #fff;
  font-size: 30rpx; border: none; border-radius: 40rpx; margin-top: 10rpx;
}
.save-btn::after { border: none; }
</style>
