<template>
  <div class="container booking-page" v-if="villa">
    <h2 class="page-title">确认预订</h2>

    <div class="booking-body">
      <div class="left-col">
        <!-- 别墅卡片 -->
        <div class="card">
          <div class="villa-brief">
            <img :src="resolveImg(villa.coverImage)" />
            <div class="villa-info">
              <h3>{{ villa.name }}</h3>
              <p>{{ villa.address }}</p>
              <p>{{ villa.maxGuests }}人 · {{ villa.bedrooms }}卧 · {{ villa.area }}㎡</p>
            </div>
          </div>
        </div>

        <!-- 日期选择 -->
        <div class="card">
          <h3>选择日期</h3>
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="入住日期"
            end-placeholder="退房日期"
            value-format="YYYY-MM-DD"
            size="large"
            style="width: 100%;"
            :disabled-date="disablePastDate"
          />
          <!-- 已预订日期提示 -->
          <div class="booked-hint" v-if="bookedDates.length">
            <span class="hint-icon">📅</span>
            <span>以下日期已被预订，无法选择</span>
          </div>

          <!-- 每日价格明细 -->
          <div class="daily-prices" v-if="days > 0">
            <div class="daily-price-title">每日价格明细</div>
            <div class="daily-price-list">
              <div class="daily-price-item" v-for="dp in dailyPrices" :key="dp.date">
                <span class="dp-date">{{ dp.dateLabel }}</span>
                <span class="dp-type" :class="dp.isWeekend ? 'weekend' : ''">{{ dp.isWeekend ? '周末' : '平日' }}</span>
                <span class="dp-price">¥{{ dp.price }}</span>
              </div>
            </div>
            <div class="daily-price-summary">
              <span>{{ days }}晚合计</span>
              <span>¥{{ villaAmount }}</span>
            </div>
            <div class="daily-price-summary discount-line" v-if="discountAmount > 0">
              <span>连住折扣（{{ discountLabel }}）</span>
              <span class="discount">-¥{{ discountAmount }}</span>
            </div>
            <div class="daily-price-summary" v-if="deposit > 0">
              <span>押金（退房后退还）</span>
              <span>¥{{ deposit }}</span>
            </div>
          </div>
        </div>

        <!-- 联系信息 -->
        <div class="card">
          <h3>联系信息</h3>
          <el-form :model="form" label-width="100px">
            <el-form-item label="入住人数">
              <el-input-number v-model="form.guests" :min="1" />
            </el-form-item>
            <el-form-item label="联系人">
              <el-input v-model="form.contactName" placeholder="姓名" />
            </el-form-item>
            <el-form-item label="手机号">
              <el-input v-model="form.contactPhone" placeholder="联系电话" />
            </el-form-item>
            <el-form-item label="备注">
              <el-input v-model="form.remark" type="textarea" :rows="3" placeholder="特殊需求（选填）" />
            </el-form-item>
          </el-form>
        </div>

        <!-- 取消政策 -->
        <div class="card cancel-policy">
          <h3>取消政策</h3>
          <div class="policy-items">
            <div class="policy-item free">
              <span class="policy-dot"></span>
              <div>
                <div class="policy-title">入住前 3 天及以上</div>
                <div class="policy-desc">免费取消，全额退款</div>
              </div>
            </div>
            <div class="policy-item partial">
              <span class="policy-dot"></span>
              <div>
                <div class="policy-title">入住前 3 天内</div>
                <div class="policy-desc">收取订单金额的 50% 作为取消费用</div>
              </div>
            </div>
            <div class="policy-item none">
              <span class="policy-dot"></span>
              <div>
                <div class="policy-title">入住当天</div>
                <div class="policy-desc">不可取消，不予退款</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="right-col">
        <div class="summary-card" :class="{ expanded: summaryExpanded }">
          <h3 @click="summaryExpanded = !summaryExpanded">费用明细
            <span class="expand-arrow">{{ summaryExpanded ? '▲' : '▼' }}</span>
          </h3>
          <div class="mobile-summary-bar" v-if="!summaryExpanded">
            <span class="final-price">¥{{ (totalAmount + deposit).toFixed(2) }}</span>
            <el-button type="primary" size="default" @click="submitOrder">提交订单</el-button>
          </div>
          <div class="fee-item">
            <span>别墅费用（{{ days }}晚）</span>
            <span>¥{{ villaAmount }}</span>
          </div>
          <div class="fee-item" v-if="discountAmount > 0">
            <span>连住折扣</span>
            <span class="discount">-¥{{ discountAmount }}</span>
          </div>
          <div class="fee-item total">
            <span>小计</span>
            <span>¥{{ totalAmount }}</span>
          </div>
          <div class="fee-item" v-if="deposit > 0">
            <span>押金</span>
            <span>¥{{ deposit }}</span>
          </div>
          <div class="fee-row-final">
            <span>实付</span>
            <span class="final-price">¥{{ (totalAmount + deposit).toFixed(2) }}</span>
          </div>
          <el-button type="primary" size="large" class="submit-btn" @click="submitOrder">
            提交订单
          </el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { getVilla, getVillaCalendar } from '../../api/villa';
import { createOrder } from '../../api/order';
import { thumbUrl } from '../../utils/request';

const route = useRoute();
const router = useRouter();
const resolveImg = thumbUrl;

const villa = ref<any>(null);
const summaryExpanded = ref(false);
const dateRange = ref<string[]>([]);
const form = reactive({
  guests: 1,
  contactName: '',
  contactPhone: '',
  remark: '',
});
const bookedDates = ref<string[]>([]);
const calendarData = ref<any[]>([]);

const BOOKING_STORAGE_KEY = 'booking_draft';

// 禁用过去的日期
function disablePastDate(date: Date) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (date.getTime() < today.getTime()) return true;
  // 禁用已预订日期
  const dateStr = date.toISOString().split('T')[0];
  return bookedDates.value.includes(dateStr);
}

const days = computed(() => {
  if (!dateRange.value || dateRange.value.length !== 2) return 0;
  const [start, end] = dateRange.value;
  return Math.ceil((new Date(end).getTime() - new Date(start).getTime()) / (1000 * 60 * 60 * 24));
});

// 每日价格明细
const dailyPrices = computed(() => {
  if (!villa.value || !days.value || !dateRange.value?.length) return [];
  const [start] = dateRange.value;
  const prices: any[] = [];
  for (let i = 0; i < days.value; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    const dow = d.getDay();
    const isWeekend = dow === 0 || dow === 5 || dow === 6;
    const dateStr = d.toISOString().split('T')[0];
    // 优先使用日历数据中的自定义价格
    const calDay = calendarData.value.find(c => c.date === dateStr);
    const price = calDay ? calDay.price : (isWeekend ? Number(villa.value.weekendPrice) : Number(villa.value.basePrice));
    prices.push({
      date: dateStr,
      dateLabel: `${d.getMonth() + 1}/${d.getDate()}`,
      isWeekend,
      price,
    });
  }
  return prices;
});

const villaAmount = computed(() => {
  if (!dailyPrices.value.length) return 0;
  return dailyPrices.value.reduce((sum, dp) => sum + dp.price, 0);
});

const discountRate = computed(() => {
  if (!villa.value || days.value < 3) return 1;
  if (days.value >= 7 && villa.value.discount7d) return Number(villa.value.discount7d);
  if (days.value >= 5 && villa.value.discount5d) return Number(villa.value.discount5d);
  if (days.value >= 3 && villa.value.discount3d) return Number(villa.value.discount3d);
  return 1;
});
const discountAmount = computed(() => Math.round(villaAmount.value * (1 - discountRate.value)));
const totalAmount = computed(() => villaAmount.value - discountAmount.value);
const deposit = computed(() => villa.value ? Number(villa.value.deposit) : 0);

const discountLabel = computed(() => {
  if (days.value >= 7 && villa.value?.discount7d) return `${(Number(villa.value.discount7d) * 10).toFixed(1)}折`;
  if (days.value >= 5 && villa.value?.discount5d) return `${(Number(villa.value.discount5d) * 10).toFixed(1)}折`;
  if (days.value >= 3 && villa.value?.discount3d) return `${(Number(villa.value.discount3d) * 10).toFixed(1)}折`;
  return '';
});

// 保存预订状态到 localStorage
function saveBookingDraft() {
  const draft = {
    villaId: route.params.id,
    dateRange: dateRange.value,
    form: { ...form },
    timestamp: Date.now(),
  };
  localStorage.setItem(BOOKING_STORAGE_KEY, JSON.stringify(draft));
}

// 恢复预订状态
function restoreBookingDraft() {
  try {
    const raw = localStorage.getItem(BOOKING_STORAGE_KEY);
    if (!raw) return;
    const draft = JSON.parse(raw);
    // 只恢复同一个别墅的草稿，且不超过24小时
    if (String(draft.villaId) !== String(route.params.id)) return;
    if (Date.now() - draft.timestamp > 24 * 60 * 60 * 1000) {
      localStorage.removeItem(BOOKING_STORAGE_KEY);
      return;
    }
    if (draft.dateRange?.length === 2) {
      // 确保日期没有过期
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (new Date(draft.dateRange[0]).getTime() >= today.getTime()) {
        dateRange.value = draft.dateRange;
      }
    }
    if (draft.form) {
      if (draft.form.guests) form.guests = draft.form.guests;
      if (draft.form.contactName) form.contactName = draft.form.contactName;
      if (draft.form.contactPhone) form.contactPhone = draft.form.contactPhone;
      if (draft.form.remark) form.remark = draft.form.remark;
    }
  } catch (e) { /* ignore */ }
}

// 监听表单变化自动保存草稿
watch([dateRange, () => form.guests, () => form.contactName, () => form.contactPhone, () => form.remark], () => {
  saveBookingDraft();
}, { deep: true });

// 加载日历数据（获取已预订日期）
async function loadCalendar() {
  const id = parseInt(route.params.id as string);
  try {
    const now = new Date();
    // 加载当前月和下两个月的日历
    const months = [
      { year: now.getFullYear(), month: now.getMonth() + 1 },
      { year: now.getMonth() === 11 ? now.getFullYear() + 1 : now.getFullYear(), month: (now.getMonth() + 1) % 12 + 1 },
      { year: now.getMonth() >= 10 ? now.getFullYear() + 1 : now.getFullYear(), month: (now.getMonth() + 2) % 12 + 1 },
    ];
    const results = await Promise.all(months.map(m => getVillaCalendar(id, m.year, m.month)));
    const allDays = (results as any[]).flat();
    calendarData.value = allDays;
    // status !== 1 表示不可用（已预订等）
    bookedDates.value = allDays.filter(d => d.status !== 1).map(d => d.date);
  } catch (e) { /* calendar API might not exist, ignore */ }
}

onMounted(async () => {
  const id = parseInt(route.params.id as string);
  villa.value = await getVilla(id);
  restoreBookingDraft();
  await loadCalendar();
});

async function submitOrder() {
  if (!dateRange.value?.length) {
    ElMessage.warning('请选择入住日期');
    return;
  }
  if (!form.contactName || !form.contactPhone) {
    ElMessage.warning('请填写联系信息');
    return;
  }
  try {
    const order: any = await createOrder({
      villaId: parseInt(route.params.id as string),
      checkIn: dateRange.value[0],
      checkOut: dateRange.value[1],
      guests: form.guests,
      contactName: form.contactName,
      contactPhone: form.contactPhone,
      remark: form.remark,
    });
    // 下单成功后清除草稿
    localStorage.removeItem(BOOKING_STORAGE_KEY);
    ElMessage.success('下单成功');
    router.push(`/order/${order.id}`);
  } catch (e) { /* intercept */ }
}
</script>

<style scoped>
.booking-page { padding: 30px 0 60px; }
.page-title { font-size: 24px; margin-bottom: 24px; color: #333; }

.booking-body { display: grid; grid-template-columns: 1fr 380px; gap: 24px; }

.card {
  background: #fff; padding: 30px; border-radius: 12px;
  margin-bottom: 20px;
}
.card h3 { font-size: 18px; color: #333; margin-bottom: 20px; }

.villa-brief { display: flex; gap: 20px; }
.villa-brief img { width: 180px; height: 130px; object-fit: cover; border-radius: 8px; }
.villa-info h3 { font-size: 18px; margin-bottom: 8px; }
.villa-info p { font-size: 13px; color: #999; margin-top: 4px; }

/* 已预订提示 */
.booked-hint {
  display: flex; align-items: center; gap: 6px;
  margin-top: 12px; padding: 8px 12px;
  background: #fef3c7; border-radius: 6px;
  font-size: 13px; color: #92400e;
}
.hint-icon { font-size: 16px; }

/* 每日价格明细 */
.daily-prices {
  margin-top: 16px; padding-top: 16px; border-top: 1px solid #f5f5f5;
}
.daily-price-title {
  font-size: 14px; font-weight: 600; color: #333; margin-bottom: 10px;
}
.daily-price-list {
  display: grid; gap: 6px; max-height: 200px; overflow-y: auto;
  margin-bottom: 12px;
}
.daily-price-item {
  display: flex; align-items: center; gap: 12px;
  padding: 6px 10px; border-radius: 6px; background: #f8fafc;
  font-size: 13px;
}
.dp-date { color: #333; font-weight: 500; width: 50px; }
.dp-type {
  font-size: 11px; padding: 2px 8px; border-radius: 10px;
  background: #e8f5e9; color: #2e7d32;
}
.dp-type.weekend { background: #fff3ed; color: #ff6b35; }
.dp-price { margin-left: auto; font-weight: 600; color: #333; }
.daily-price-summary {
  display: flex; justify-content: space-between;
  padding: 8px 0; font-size: 14px; color: #333; font-weight: 500;
  border-top: 1px solid #f5f5f5;
}
.daily-price-summary.discount-line { border-top: none; padding-top: 4px; }
.daily-price-summary .discount { color: #27ae60; }

/* 取消政策 */
.cancel-policy .policy-items { display: grid; gap: 14px; }
.policy-item {
  display: flex; align-items: flex-start; gap: 12px;
}
.policy-dot {
  width: 10px; height: 10px; border-radius: 50%;
  margin-top: 5px; flex-shrink: 0;
}
.policy-item.free .policy-dot { background: #27ae60; }
.policy-item.partial .policy-dot { background: #f59e0b; }
.policy-item.none .policy-dot { background: #ef4444; }
.policy-title { font-size: 14px; color: #333; font-weight: 600; }
.policy-desc { font-size: 13px; color: #999; margin-top: 2px; }

.summary-card {
  background: #fff; padding: 30px; border-radius: 12px;
  position: sticky; top: 100px;
}
.summary-card h3 { font-size: 18px; margin-bottom: 20px; }
.fee-item {
  display: flex; justify-content: space-between;
  padding: 10px 0; font-size: 14px; color: #666;
}
.fee-item.total {
  border-top: 1px solid #f5f5f5; padding-top: 16px;
  margin-top: 8px; font-weight: bold; color: #333;
}
.discount { color: #27ae60; }
.fee-row-final {
  margin-top: 16px; padding-top: 16px;
  border-top: 2px solid #f5f5f5;
  display: flex; justify-content: space-between; align-items: baseline;
}
.final-price { font-size: 28px; color: #ff6b35; font-weight: bold; }
.submit-btn {
  width: 100%; height: 50px;
  margin-top: 20px; font-size: 16px;
  background: linear-gradient(135deg, #ff6b35, #ff8f65); border: none;
}

.right-col { align-self: start; }
.expand-arrow { font-size: 12px; color: #94a3b8; margin-left: 6px; }

/* W-16: 小屏幕费用卡片适配 */
@media (max-width: 768px) {
  .booking-body {
    grid-template-columns: 1fr; gap: 16px;
  }
  .right-col {
    position: fixed; bottom: 0; left: 0; right: 0; z-index: 100;
    padding: 0; margin: 0;
  }
  .summary-card {
    position: static; border-radius: 12px 12px 0 0;
    padding: 16px 20px;
    box-shadow: 0 -4px 20px rgba(0,0,0,0.1);
    max-height: 60vh; overflow-y: auto;
  }
  .summary-card .fee-item,
  .summary-card .fee-item.total,
  .summary-card .fee-row-final { display: none; }
  .summary-card.expanded .fee-item,
  .summary-card.expanded .fee-item.total,
  .summary-card.expanded .fee-row-final { display: flex; }
  .summary-card h3 { cursor: pointer; margin-bottom: 0; }
  .summary-card.expanded h3 { margin-bottom: 16px; }
  .mobile-summary-bar {
    display: flex; align-items: center; justify-content: space-between;
  }
  .left-col { padding-bottom: 120px; }
}

@media (min-width: 769px) {
  .mobile-summary-bar { display: none; }
  .expand-arrow { display: none; }
  .summary-card h3 { cursor: default; }
}
</style>
