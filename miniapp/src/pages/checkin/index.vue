<template>
  <view class="page">
    <!-- 已签署提示 -->
    <view class="signed-banner" v-if="order && order.pactSignedAt">
      <text class="signed-icon">✓</text>
      <view class="signed-text">
        <text class="signed-title">已完成入住登记</text>
        <text class="signed-time">{{ fmtTime(order.pactSignedAt) }}</text>
      </view>
    </view>

    <!-- 带队人登记 -->
    <view class="card">
      <text class="card-title">入住人登记</text>
      <text class="card-tip">为保障聚会安全合规，请如实填写带队人信息</text>
      <view class="form-item">
        <text class="label">带队人姓名</text>
        <input class="input" v-model="form.leaderName" placeholder="请输入真实姓名" :disabled="locked" />
      </view>
      <view class="form-item">
        <text class="label">联系手机</text>
        <input class="input" v-model="form.leaderPhone" type="number" maxlength="11" placeholder="请输入手机号" :disabled="locked" />
      </view>
      <view class="form-item">
        <text class="label">身份证后四位</text>
        <input class="input" v-model="form.leaderIdTail" maxlength="4" placeholder="选填，用于核验" :disabled="locked" />
      </view>
      <view class="form-item">
        <text class="label">实际到场人数</text>
        <input class="input" v-model.number="form.partySize" type="number" placeholder="选填" :disabled="locked" />
      </view>
    </view>

    <!-- 派对公约 -->
    <view class="card">
      <text class="card-title">派对公约</text>
      <view class="pact-box">
        <text class="pact-line" v-for="(line, i) in pactLines" :key="i">{{ line }}</text>
      </view>
    </view>

    <view class="bottom-bar" v-if="!locked">
      <label class="agree" @tap="agreed = !agreed">
        <view class="checkbox" :class="{ checked: agreed }">{{ agreed ? '✓' : '' }}</view>
        <text class="agree-text">我已阅读并同意《派对公约》</text>
      </label>
      <view class="submit-btn" :class="{ active: canSubmit }" @tap="handleSubmit">确认登记</view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { getOrder, signPact, getSiteConfig } from '../../api/order';

const orderId = ref(0);
const order = ref<any>(null);
const pactText = ref('');
const agreed = ref(false);
const form = ref<any>({ leaderName: '', leaderPhone: '', leaderIdTail: '', partySize: '' });

const locked = computed(() => !!order.value?.pactSignedAt);
const pactLines = computed(() => pactText.value.split('\n').filter((l) => l.trim()));
const canSubmit = computed(() => agreed.value && form.value.leaderName && /^1\d{10}$/.test(form.value.leaderPhone));

onLoad((q: any) => {
  orderId.value = Number(q.id);
  load();
});

async function load() {
  try {
    order.value = await getOrder(orderId.value);
    if (order.value.leaderName) form.value.leaderName = order.value.leaderName;
    if (order.value.leaderPhone) form.value.leaderPhone = order.value.leaderPhone;
    if (order.value.leaderIdTail) form.value.leaderIdTail = order.value.leaderIdTail;
    if (order.value.partySize) form.value.partySize = order.value.partySize;
    const cfg = await getSiteConfig();
    pactText.value = cfg.party_pact || '';
  } catch (e) { console.error(e); }
}

async function handleSubmit() {
  if (!agreed.value) { uni.showToast({ title: '请先同意派对公约', icon: 'none' }); return; }
  if (!form.value.leaderName) { uni.showToast({ title: '请填写带队人姓名', icon: 'none' }); return; }
  if (!/^1\d{10}$/.test(form.value.leaderPhone)) { uni.showToast({ title: '请填写正确手机号', icon: 'none' }); return; }
  try {
    await signPact(orderId.value, {
      leaderName: form.value.leaderName,
      leaderPhone: form.value.leaderPhone,
      leaderIdTail: form.value.leaderIdTail || undefined,
      partySize: form.value.partySize ? Number(form.value.partySize) : undefined,
    });
    uni.showToast({ title: '登记成功', icon: 'success' });
    setTimeout(() => uni.navigateBack(), 600);
  } catch (e) {
    uni.showToast({ title: '提交失败', icon: 'none' });
  }
}

function fmtTime(d: string) {
  if (!d) return '';
  const dt = new Date(d);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')} ${String(dt.getHours()).padStart(2, '0')}:${String(dt.getMinutes()).padStart(2, '0')}`;
}
</script>

<style lang="scss">
.page { background: #f5f5f5; min-height: 100vh; padding-bottom: 200rpx; }

.signed-banner {
  display: flex; align-items: center; gap: 20rpx;
  background: linear-gradient(135deg, #27ae60, #2ecc71); color: #fff;
  padding: 30rpx; margin: 24rpx; border-radius: 16rpx;
}
.signed-icon { font-size: 48rpx; }
.signed-title { font-size: 30rpx; font-weight: bold; display: block; }
.signed-time { font-size: 22rpx; opacity: 0.9; display: block; margin-top: 6rpx; }

.card { background: #fff; margin: 24rpx; padding: 28rpx; border-radius: 16rpx; }
.card-title { font-size: 30rpx; font-weight: bold; color: #333; display: block; }
.card-tip { font-size: 22rpx; color: #999; display: block; margin-top: 8rpx; margin-bottom: 12rpx; }

.form-item { display: flex; align-items: center; padding: 24rpx 0; border-bottom: 1rpx solid #f5f5f5; }
.form-item:last-child { border-bottom: none; }
.label { width: 200rpx; font-size: 28rpx; color: #333; }
.input { flex: 1; font-size: 28rpx; color: #333; }

.pact-box { margin-top: 12rpx; }
.pact-line { font-size: 26rpx; color: #666; line-height: 1.8; display: block; margin-bottom: 10rpx; }

.bottom-bar {
  position: fixed; bottom: 0; left: 0; right: 0; background: #fff;
  padding: 20rpx 30rpx;
  padding-bottom: calc(20rpx + env(safe-area-inset-bottom));
  box-shadow: 0 -2rpx 10rpx rgba(0,0,0,0.05);
}
.agree { display: flex; align-items: center; margin-bottom: 16rpx; }
.checkbox {
  width: 36rpx; height: 36rpx; border-radius: 50%; border: 2rpx solid #ccc;
  margin-right: 12rpx; text-align: center; line-height: 36rpx; font-size: 24rpx;
  color: #fff;
}
.checkbox.checked { background: #ff6b35; border-color: #ff6b35; }
.agree-text { font-size: 24rpx; color: #666; }
.submit-btn {
  text-align: center; padding: 26rpx; border-radius: 44rpx;
  background: #ddd; color: #fff; font-size: 30rpx; font-weight: bold;
}
.submit-btn.active { background: #ff6b35; }
</style>
