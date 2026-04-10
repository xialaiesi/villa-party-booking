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
          />
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
      </div>

      <div class="right-col">
        <div class="summary-card">
          <h3>费用明细</h3>
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
import { ref, reactive, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { getVilla } from '../../api/villa';
import { createOrder } from '../../api/order';
import { thumbUrl } from '../../utils/request';

const route = useRoute();
const router = useRouter();
const resolveImg = thumbUrl;

const villa = ref<any>(null);
const dateRange = ref<string[]>([]);
const form = reactive({
  guests: 1,
  contactName: '',
  contactPhone: '',
  remark: '',
});

const days = computed(() => {
  if (!dateRange.value || dateRange.value.length !== 2) return 0;
  const [start, end] = dateRange.value;
  return Math.ceil((new Date(end).getTime() - new Date(start).getTime()) / (1000 * 60 * 60 * 24));
});

const villaAmount = computed(() => {
  if (!villa.value || !days.value) return 0;
  let total = 0;
  const [start] = dateRange.value;
  for (let i = 0; i < days.value; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    const dow = d.getDay();
    const isWeekend = dow === 0 || dow === 5 || dow === 6;
    total += isWeekend ? Number(villa.value.weekendPrice) : Number(villa.value.basePrice);
  }
  return total;
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

onMounted(async () => {
  const id = parseInt(route.params.id as string);
  villa.value = await getVilla(id);
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
</style>
