<template>
  <view class="page">
    <!-- 档期选择（别墅配置了时段时显示） -->
    <view class="card" v-if="slotOptions.length">
      <text class="card-title">选择档期</text>
      <view class="slot-list">
        <view
          v-for="opt in slotOptions"
          :key="opt.id"
          class="slot-chip"
          :class="{ active: selectedSlotId === opt.id }"
          @tap="selectSlot(opt.id)"
        >
          <text class="slot-name">{{ opt.name }}</text>
          <text class="slot-time" v-if="opt.id !== 0">{{ fmtTime(opt.startMinute) }}-{{ fmtTime(opt.endMinute) }}</text>
          <text class="slot-time" v-else>按天整租</text>
        </view>
      </view>
    </view>

    <!-- 日历选日期 -->
    <view class="card">
      <view class="card-header">
        <text class="card-title">选择入住日期</text>
        <view class="month-switch">
          <text class="switch-btn" @tap="changeMonth(-1)">‹</text>
          <text class="month-text">{{ currentYear }}年 {{ currentMonth }}月</text>
          <text class="switch-btn" @tap="changeMonth(1)">›</text>
        </view>
      </view>

      <!-- 选择提示 -->
      <view class="tip-bar">
        <template v-if="isSlotMode">
          <text v-if="!checkIn">请选择日期</text>
          <text v-else class="selected-tip">{{ checkIn }} · {{ selectedSlotName }}</text>
        </template>
        <template v-else>
          <text v-if="!checkIn">请选择入住日期</text>
          <text v-else-if="!checkOut">请选择退房日期</text>
          <text v-else class="selected-tip">
            {{ checkIn }} 至 {{ checkOut }}（{{ days }}晚）
          </text>
        </template>
      </view>

      <!-- 星期表头 -->
      <view class="weekdays">
        <text class="weekday" v-for="w in weekdays" :key="w">{{ w }}</text>
      </view>

      <!-- 日历网格 -->
      <view class="calendar">
        <!-- 前置占位 -->
        <view v-for="n in startOffset" :key="'pad' + n" class="day placeholder"></view>

        <!-- 日期格子 -->
        <view
          v-for="day in days_list"
          :key="day.date"
          class="day"
          :class="{
            disabled: day.status !== 1 || day.isPast,
            weekend: day.isWeekend,
            'in-range': isInRange(day.date),
            'range-start': day.date === checkIn,
            'range-end': day.date === checkOut,
          }"
          @tap="handleDayTap(day)"
        >
          <text class="date-num">{{ day.dayNum }}</text>
          <text class="date-price" v-if="day.status === 1 && !day.isPast">¥{{ day.price }}</text>
          <text class="date-status" v-else-if="day.status === 2">已订</text>
          <text class="date-status" v-else>不可订</text>
        </view>
      </view>

      <!-- 图例 -->
      <view class="legend">
        <view class="legend-item"><view class="legend-dot available"></view><text>可订</text></view>
        <view class="legend-item"><view class="legend-dot weekend-dot"></view><text>周末</text></view>
        <view class="legend-item"><view class="legend-dot selected"></view><text>已选</text></view>
        <view class="legend-item"><view class="legend-dot disabled-dot"></view><text>不可订</text></view>
      </view>
    </view>

    <!-- 入住人数 -->
    <view class="card">
      <view class="form-item">
        <text class="label">入住人数</text>
        <input type="number" v-model="guests" placeholder="输入人数" class="input" />
      </view>
    </view>

    <view class="card">
      <text class="card-title">联系信息</text>
      <view class="form-item">
        <text class="label">联系人</text>
        <input v-model="contactName" placeholder="请输入姓名" class="input" />
      </view>
      <view class="form-item">
        <text class="label">手机号</text>
        <input v-model="contactPhone" type="number" placeholder="请输入手机号" class="input" />
      </view>
      <view class="form-item">
        <text class="label">备注</text>
        <input v-model="remark" placeholder="特殊需求（选填）" class="input" />
      </view>
    </view>

    <!-- 费用明细 -->
    <view class="card summary" v-if="hasSelection">
      <text class="card-title">费用明细</text>
      <view class="fee-item">
        <text v-if="isSlotMode">场地费用（{{ selectedSlotName }}）</text>
        <text v-else>别墅费用（{{ days }}晚）</text>
        <text>¥{{ villaAmount }}</text>
      </view>
      <view class="fee-item" v-if="discountRate < 1">
        <text>连续入住 {{ (discountRate * 10).toFixed(1) }}折</text>
        <text class="discount">-¥{{ discountAmount }}</text>
      </view>
      <view class="fee-item total">
        <text>小计</text>
        <text>¥{{ totalAmount }}</text>
      </view>
      <view class="fee-item">
        <text>押金（退房后退还）</text>
        <text>¥{{ deposit }}</text>
      </view>
    </view>

    <view class="bottom-bar">
      <view class="price-summary" v-if="hasSelection">
        <text class="total-label">实付</text>
        <text class="total-price">¥{{ totalAmount + deposit }}</text>
      </view>
      <view class="submit-btn" @tap="submitOrder">
        <text>提交订单</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { createOrder } from '../../api/order';
import { getVilla, getVillaCalendar, getVillaSlots } from '../../api/villa';
import { useUserStore } from '../../store/user';

const userStore = useUserStore();
let villaId = 0;

const weekdays = ['一', '二', '三', '四', '五', '六', '日'];
const villa = ref<any>(null);
const currentYear = ref(new Date().getFullYear());
const currentMonth = ref(new Date().getMonth() + 1);
const calendar = ref<any[]>([]);

const checkIn = ref('');
const checkOut = ref('');
const guests = ref('');
const contactName = ref('');
const contactPhone = ref('');
const remark = ref('');

// 档期：0 = 整天，其余为时段 ID
const selectedSlotId = ref(0);
// 选中日期的时段可订与价格（从 /slots 拉取）
const slotInfoForDate = ref<any[]>([]);

// 档期选项：整天 + 别墅配置的时段
const slotOptions = computed(() => {
  const slots = villa.value?.timeSlots || [];
  if (!slots.length) return [];
  return [{ id: 0, name: '整天' }, ...slots];
});
const isSlotMode = computed(() => selectedSlotId.value !== 0);
const selectedSlot = computed(() =>
  (villa.value?.timeSlots || []).find((s: any) => s.id === selectedSlotId.value),
);
const selectedSlotName = computed(() => selectedSlot.value?.name || '');
const hasSelection = computed(() =>
  isSlotMode.value ? !!checkIn.value : !!(checkIn.value && checkOut.value),
);

function fmtTime(min: number) {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${String(h).padStart(2, '0')}:${m ? String(m).padStart(2, '0') : '00'}`;
}

// 日期列表（加上 dayNum / isWeekend / isPast）
const days_list = computed(() => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return calendar.value.map((day: any) => {
    const d = new Date(day.date);
    const dayOfWeek = d.getDay();
    return {
      ...day,
      dayNum: parseInt(day.date.split('-')[2]),
      isWeekend: dayOfWeek === 0 || dayOfWeek === 5 || dayOfWeek === 6,
      isPast: d < today,
    };
  });
});

// 周一开头的偏移量
const startOffset = computed(() => {
  if (days_list.value.length === 0) return 0;
  const firstDay = new Date(days_list.value[0].date).getDay();
  // 将周日=0 转换为 6，其他减 1
  return firstDay === 0 ? 6 : firstDay - 1;
});

const days = computed(() => {
  if (!checkIn.value || !checkOut.value) return 0;
  const diff = new Date(checkOut.value).getTime() - new Date(checkIn.value).getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
});

// 选中范围内的每日价格和（整天档）；时段档取所选档期当日价格
const villaAmount = computed(() => {
  if (isSlotMode.value) {
    if (!checkIn.value) return 0;
    const info = slotInfoForDate.value.find((s: any) => s.id === selectedSlotId.value);
    if (info) return Number(info.price);
    // 兜底：用别墅时段配置价（按周末判断）
    const s = selectedSlot.value;
    if (!s) return 0;
    const dow = new Date(checkIn.value).getDay();
    const isWeekend = dow === 0 || dow === 5 || dow === 6;
    return isWeekend && s.weekendPrice != null ? Number(s.weekendPrice) : Number(s.price);
  }
  if (!checkIn.value || !checkOut.value) return 0;
  let total = 0;
  const start = new Date(checkIn.value);
  const end = new Date(checkOut.value);
  for (const day of calendar.value) {
    const d = new Date(day.date);
    if (d >= start && d < end) {
      total += Number(day.price);
    }
  }
  return total;
});

const discountRate = computed(() => {
  if (isSlotMode.value) return 1; // 时段档不参与连住折扣
  if (!villa.value || days.value < 3) return 1;
  if (days.value >= 7 && villa.value.discount7d) return Number(villa.value.discount7d);
  if (days.value >= 5 && villa.value.discount5d) return Number(villa.value.discount5d);
  if (days.value >= 3 && villa.value.discount3d) return Number(villa.value.discount3d);
  return 1;
});

const discountAmount = computed(() => Math.round(villaAmount.value * (1 - discountRate.value)));
const totalAmount = computed(() => villaAmount.value - discountAmount.value);
const deposit = computed(() => villa.value ? Number(villa.value.deposit) : 0);

onLoad(async (query: any) => {
  villaId = parseInt(query.id);
  villa.value = await getVilla(villaId);
  await loadCalendar();
});

async function loadCalendar() {
  try {
    calendar.value = await getVillaCalendar(villaId, currentYear.value, currentMonth.value);
  } catch (e) {
    console.error(e);
  }
}

function changeMonth(delta: number) {
  let m = currentMonth.value + delta;
  let y = currentYear.value;
  if (m > 12) { m = 1; y += 1; }
  if (m < 1) { m = 12; y -= 1; }
  currentMonth.value = m;
  currentYear.value = y;
  loadCalendar();
}

function isInRange(date: string) {
  if (isSlotMode.value) return false;
  if (!checkIn.value || !checkOut.value) return false;
  return date >= checkIn.value && date <= checkOut.value;
}

// 切换档期：清空已选日期，避免跨模式状态残留
function selectSlot(id: number) {
  if (selectedSlotId.value === id) return;
  selectedSlotId.value = id;
  checkIn.value = '';
  checkOut.value = '';
  slotInfoForDate.value = [];
}

// 拉取某日各时段可订情况
async function loadSlotInfo(date: string) {
  try {
    slotInfoForDate.value = await getVillaSlots(villaId, date);
  } catch (e) {
    slotInfoForDate.value = [];
  }
}

function handleDayTap(day: any) {
  if (day.isPast) {
    uni.showToast({ title: '该日期不可订', icon: 'none' });
    return;
  }

  // 时段档：单日选择
  if (isSlotMode.value) {
    checkIn.value = day.date;
    checkOut.value = day.date;
    loadSlotInfo(day.date).then(() => {
      const info = slotInfoForDate.value.find((s: any) => s.id === selectedSlotId.value);
      if (info && !info.available) {
        uni.showToast({ title: '该时段当日已被预订', icon: 'none' });
      }
    });
    return;
  }

  if (day.status !== 1) {
    uni.showToast({ title: '该日期不可订', icon: 'none' });
    return;
  }

  // 未选入住日期 → 设为入住
  if (!checkIn.value) {
    checkIn.value = day.date;
    return;
  }

  // 已有入住但没退房
  if (checkIn.value && !checkOut.value) {
    if (day.date <= checkIn.value) {
      // 选了更早的日期 → 重新选择入住
      checkIn.value = day.date;
      return;
    }
    // 检查中间是否有不可订日期
    const start = new Date(checkIn.value);
    const end = new Date(day.date);
    for (const d of calendar.value) {
      const dDate = new Date(d.date);
      if (dDate > start && dDate < end && d.status !== 1) {
        uni.showToast({ title: '所选区间包含不可订日期', icon: 'none' });
        return;
      }
    }
    checkOut.value = day.date;
    return;
  }

  // 已有完整区间 → 重新开始选择
  checkIn.value = day.date;
  checkOut.value = '';
}

async function submitOrder() {
  if (!userStore.isLoggedIn) {
    uni.showToast({ title: '请先登录', icon: 'none' });
    return;
  }
  if (!hasSelection.value || !guests.value) {
    uni.showToast({ title: '请填写完整预订信息', icon: 'none' });
    return;
  }

  try {
    const order = await createOrder({
      villaId,
      checkIn: checkIn.value,
      checkOut: checkOut.value,
      slotId: isSlotMode.value ? selectedSlotId.value : undefined,
      guests: parseInt(guests.value),
      contactName: contactName.value,
      contactPhone: contactPhone.value,
      remark: remark.value,
    });
    uni.redirectTo({ url: `/pages/order/detail?id=${order.id}` });
  } catch (e) {
    console.error(e);
  }
}
</script>

<style lang="scss">
.page { background: #f5f5f5; min-height: 100vh; padding: 20rpx; padding-bottom: 160rpx; }
.card { background: #fff; border-radius: 12rpx; padding: 30rpx; margin-bottom: 20rpx; }
.card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20rpx; }
.card-title { font-size: 30rpx; font-weight: bold; color: #333; }

.month-switch { display: flex; align-items: center; gap: 16rpx; }
.switch-btn { width: 48rpx; height: 48rpx; line-height: 44rpx; text-align: center; background: #f5f5f5; border-radius: 50%; font-size: 36rpx; color: #333; }
.month-text { font-size: 28rpx; color: #333; font-weight: bold; min-width: 180rpx; text-align: center; }

.slot-list { display: flex; flex-wrap: wrap; gap: 16rpx; margin-top: 20rpx; }
.slot-chip {
  display: flex; flex-direction: column; align-items: center;
  min-width: 180rpx; padding: 16rpx 24rpx;
  border: 1rpx solid #ebeef5; border-radius: 12rpx; background: #fff;
}
.slot-chip.active { border-color: #ff6b35; background: #fff3ed; }
.slot-name { font-size: 28rpx; color: #333; font-weight: bold; }
.slot-chip.active .slot-name { color: #ff6b35; }
.slot-time { font-size: 22rpx; color: #999; margin-top: 4rpx; }

.tip-bar { background: #fff3ed; padding: 16rpx 24rpx; border-radius: 8rpx; font-size: 24rpx; color: #ff6b35; margin-bottom: 20rpx; }
.selected-tip { color: #27ae60; font-weight: bold; }

.weekdays { display: grid; grid-template-columns: repeat(7, 1fr); gap: 6rpx; margin-bottom: 12rpx; }
.weekday { text-align: center; font-size: 24rpx; color: #999; padding: 8rpx 0; }

.calendar { display: grid; grid-template-columns: repeat(7, 1fr); gap: 6rpx; }
.day {
  background: #fff;
  border: 1rpx solid #ebeef5;
  border-radius: 8rpx;
  padding: 12rpx 4rpx;
  text-align: center;
  min-height: 100rpx;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}
.day.placeholder { background: transparent; border: none; }
.day.weekend { background: #fffaf5; }
.day.disabled { background: #f5f5f5; opacity: 0.5; }
.day.in-range { background: #fff3ed; border-color: #ff6b35; }
.day.range-start, .day.range-end {
  background: #ff6b35;
  border-color: #ff6b35;
}
.day.range-start .date-num, .day.range-end .date-num,
.day.range-start .date-price, .day.range-end .date-price { color: #fff; }

.date-num { font-size: 30rpx; font-weight: bold; color: #333; }
.date-price { font-size: 20rpx; color: #ff6b35; margin-top: 4rpx; }
.date-status { font-size: 18rpx; color: #999; margin-top: 4rpx; }

.legend { display: flex; justify-content: space-around; margin-top: 20rpx; padding-top: 20rpx; border-top: 1rpx solid #f0f0f0; }
.legend-item { display: flex; align-items: center; gap: 8rpx; font-size: 22rpx; color: #666; }
.legend-dot { width: 20rpx; height: 20rpx; border-radius: 4rpx; background: #fff; border: 1rpx solid #ebeef5; }
.legend-dot.weekend-dot { background: #fffaf5; border-color: #ffe0c0; }
.legend-dot.selected { background: #ff6b35; border-color: #ff6b35; }
.legend-dot.disabled-dot { background: #f5f5f5; opacity: 0.6; }

.form-item { display: flex; align-items: center; padding: 20rpx 0; border-bottom: 1rpx solid #f0f0f0; }
.form-item:last-child { border-bottom: none; }
.label { font-size: 28rpx; color: #333; width: 160rpx; }
.input { flex: 1; font-size: 28rpx; }

.fee-item { display: flex; justify-content: space-between; padding: 12rpx 0; font-size: 26rpx; color: #666; }
.fee-item.total { border-top: 1rpx solid #f0f0f0; padding-top: 16rpx; margin-top: 8rpx; font-weight: bold; color: #333; font-size: 28rpx; }
.discount { color: #27ae60; }

.bottom-bar {
  position: fixed; bottom: 0; left: 0; right: 0;
  background: #fff; padding: 20rpx 30rpx;
  display: flex; align-items: center; gap: 20rpx;
  box-shadow: 0 -2rpx 10rpx rgba(0,0,0,0.05);
}
.price-summary { flex: 1; display: flex; flex-direction: column; }
.total-label { font-size: 22rpx; color: #999; }
.total-price { font-size: 36rpx; color: #ff6b35; font-weight: bold; }
.submit-btn {
  background: #ff6b35; color: #fff; text-align: center;
  padding: 24rpx 60rpx; border-radius: 40rpx; font-size: 30rpx; font-weight: bold;
}
</style>
