<template>
  <div class="container order-detail" v-if="order">
    <h2 class="page-title">订单详情</h2>

    <div class="status-card" :class="'status-' + order.status">
      <div class="status-icon">{{ statusIcon(order.status) }}</div>
      <div class="status-text">{{ statusText(order.status) }}</div>
      <div class="status-desc">{{ statusDesc(order.status) }}</div>
    </div>

    <!-- 订单进度条 -->
    <div class="card progress-card" v-if="order.status <= 5">
      <h3>订单进度</h3>
      <div class="progress-bar">
        <div
          v-for="(step, idx) in progressSteps"
          :key="idx"
          class="progress-step"
          :class="{ active: idx <= currentStepIndex, current: idx === currentStepIndex }"
        >
          <div class="step-dot">
            <span v-if="idx < currentStepIndex" class="step-check">&#10003;</span>
            <span v-else>{{ idx + 1 }}</span>
          </div>
          <div class="step-label">{{ step.label }}</div>
          <div class="step-line" v-if="idx < progressSteps.length - 1" :class="{ filled: idx < currentStepIndex }" />
        </div>
      </div>
      <div class="next-action-tip" v-if="nextActionText(order.status)">
        <span class="tip-icon">&#128161;</span>
        <span>{{ nextActionText(order.status) }}</span>
      </div>
    </div>

    <div class="card">
      <h3>别墅信息</h3>
      <div class="villa-row">
        <div>
          <div class="villa-name">{{ order.villa?.name }}</div>
          <div class="date-info">{{ fmtDate(order.checkIn) }} ~ {{ fmtDate(order.checkOut) }}（{{ order.days }}晚）</div>
          <div class="guest-info">入住 {{ order.guests }} 人</div>
        </div>
      </div>
    </div>

    <div class="card">
      <h3>费用明细</h3>
      <div class="fee-item"><span>别墅费用</span><span>¥{{ order.villaAmount }}</span></div>
      <div class="fee-item" v-if="order.discountAmount > 0">
        <span>连住折扣</span><span class="discount">-¥{{ order.discountAmount }}</span>
      </div>
      <div class="fee-item"><span>订单总额</span><span style="font-weight: 600;">¥{{ order.totalAmount }}</span></div>
      <div class="fee-divider" />
      <div class="fee-item"><span>定金</span><span>¥{{ order.depositAmount }}</span></div>
      <div class="fee-item"><span>尾款（入住后支付）</span><span>¥{{ finalAmount }}</span></div>
    </div>

    <div class="card" v-if="order.contactName">
      <h3>联系信息</h3>
      <p>{{ order.contactName }} · {{ order.contactPhone }}</p>
    </div>

    <div class="card">
      <h3>订单信息</h3>
      <div class="info-row"><span class="label">订单号：</span>{{ order.orderNo }}
        <span class="copy-btn" @click.stop="copyOrderNo(order.orderNo)" title="复制订单号">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
        </span>
      </div>
      <div class="info-row"><span class="label">下单时间：</span>{{ formatDate(order.createdAt) }}</div>
    </div>

    <!-- 操作按钮 -->
    <div class="action-bar">
      <!-- 待付定金 -->
      <template v-if="order.status === 0">
        <el-button size="large" @click="handleCancel">取消订单</el-button>
        <el-button type="primary" size="large" @click="handlePayDeposit">
          支付定金 ¥{{ order.depositAmount }}
        </el-button>
      </template>

      <!-- 已付定金，等待商家确认 -->
      <template v-if="order.status === 1">
        <el-button size="large" @click="handleCancel">取消订单</el-button>
        <el-button disabled size="large">等待商家确认...</el-button>
      </template>

      <!-- 待付尾款 -->
      <template v-if="order.status === 2">
        <el-button size="large" @click="handleCancel">取消订单</el-button>
        <el-button type="primary" size="large" @click="handlePayFinal">
          支付尾款 ¥{{ finalAmount }}
        </el-button>
      </template>

      <!-- 待入住 -->
      <template v-if="order.status === 3">
        <span style="color: #67c23a; font-size: 16px; font-weight: 600;">费用已结清，请按时入住</span>
      </template>

      <!-- 已入住/已完成：创建相册 -->
      <template v-if="order.status >= 4 && order.status <= 5">
        <el-button v-if="!album" type="warning" size="large" round @click="handleCreateAlbum">
          📸 创建共享相册
        </el-button>
        <el-button v-else type="success" size="large" round @click="$router.push(`/album/${album.id}`)">
          📸 查看相册（{{ album.photoCount || 0 }}张）
        </el-button>
      </template>
    </div>

    <!-- 相册创建成功提示 -->
    <div class="card album-card" v-if="album">
      <h3>📸 聚会相册</h3>
      <div class="album-info-row">
        <div>
          <div class="album-title">{{ album.title }}</div>
          <div class="album-code">
            邀请码：<span class="code-text" @click="copyCode">{{ album.inviteCode }}</span>
            <span class="code-tip">（分享给朋友一起上传照片）</span>
          </div>
        </div>
        <el-button type="primary" round @click="$router.push(`/album/${album.id}`)">进入相册</el-button>
      </div>
    </div>

    <!-- 评价区域（已完成订单） -->
    <div class="card" v-if="order.status === 5">
      <h3>⭐ 评价</h3>
      <!-- 已评价 -->
      <div v-if="reviewData" class="review-done">
        <div class="review-stars">
          <span v-for="i in 5" :key="i" :class="i <= reviewData.rating ? 'star-on' : 'star-off'">★</span>
        </div>
        <div class="review-content" v-if="reviewData.content">{{ reviewData.content }}</div>
        <div class="review-time">{{ formatDate(reviewData.createdAt) }}</div>
        <div class="review-reply" v-if="reviewData.reply">
          <b>商家回复：</b>{{ reviewData.reply }}
        </div>
      </div>
      <!-- 未评价：评价表单 -->
      <div v-else class="review-form">
        <div class="rating-row">
          <span>评分：</span>
          <span
            v-for="i in 5" :key="i"
            :class="['star-btn', i <= reviewRating ? 'star-on' : 'star-off']"
            @click="reviewRating = i"
          >★</span>
        </div>
        <el-input v-model="reviewContent" type="textarea" :rows="3" placeholder="说说你的入住体验..." maxlength="500" show-word-limit />
        <div style="margin-top: 10px; text-align: right;">
          <el-button type="primary" round :disabled="!reviewRating" @click="submitReview">提交评价</el-button>
        </div>
      </div>
    </div>

    <!-- Mock 支付弹窗 -->
    <el-dialog v-model="payDialogVisible" :title="payType === 'deposit' ? '支付定金' : '支付尾款'" width="400px" center>
      <div class="pay-dialog">
        <div class="pay-amount">
          ¥{{ payType === 'deposit' ? order.depositAmount : finalAmount }}
        </div>
        <div class="pay-hint">请通过以下方式向商家转账</div>
        <div class="pay-methods">
          <div class="pay-method" @click="confirmPay('wechat')">
            <span class="method-icon" style="color: #07c160;">微信</span>
            <span>微信转账</span>
          </div>
          <div class="pay-method" @click="confirmPay('alipay')">
            <span class="method-icon" style="color: #1677ff;">支付宝</span>
            <span>支付宝转账</span>
          </div>
          <div class="pay-method" @click="confirmPay('bank')">
            <span class="method-icon" style="color: #e6a23c;">银行</span>
            <span>银行卡转账</span>
          </div>
        </div>
        <div class="pay-note">转账完成后，商家会在后台确认到账，届时订单状态将自动更新</div>
      </div>
    </el-dialog>

    <!-- 客服联系方式 -->
    <div class="card service-card">
      <div class="service-row">
        <div class="service-info">
          <span class="service-icon">&#128222;</span>
          <div>
            <div class="service-title">需要帮助？联系客服</div>
            <div class="service-desc">工作时间：每天 9:00 - 22:00</div>
          </div>
        </div>
        <div class="service-actions">
          <el-button round size="small" @click="callService">电话咨询</el-button>
          <el-button round size="small" type="primary" @click="copyWechat">微信客服</el-button>
        </div>
      </div>
    </div>

    <!-- 支付成功提示 -->
    <el-dialog v-model="paySuccessVisible" title="" width="420px" center :close-on-click-modal="false">
      <div class="pay-success">
        <div class="success-icon">✅</div>
        <h3>{{ payType === 'deposit' ? '定金' : '尾款' }}支付请求已提交</h3>
        <div class="pay-success-progress">
          <div class="progress-item active">
            <div class="progress-dot">✓</div>
            <span>提交支付</span>
          </div>
          <div class="progress-line active" />
          <div class="progress-item pending">
            <div class="progress-dot">2</div>
            <span>商家确认</span>
          </div>
          <div class="progress-line" />
          <div class="progress-item pending">
            <div class="progress-dot">3</div>
            <span>完成</span>
          </div>
        </div>
        <p class="pay-success-tip">已提交支付，商家将在 2-4 小时内确认到账</p>
        <div class="pay-success-contact">
          <span>如有疑问请联系客服：</span>
          <span class="contact-phone" @click="callService">400-888-8888</span>
          <span> / 微信：</span>
          <span class="contact-wechat" @click="copyWechat">villa_service</span>
        </div>
        <div class="pay-success-actions">
          <el-button round @click="paySuccessVisible = false">返回订单</el-button>
          <el-button type="primary" round @click="paySuccessVisible = false; $router.push('/search')">继续浏览</el-button>
        </div>
      </div>
    </el-dialog>
    <!-- 支付失败提示 -->
    <el-dialog v-model="payFailVisible" title="" width="400px" center>
      <div class="pay-fail">
        <div class="fail-icon">❌</div>
        <h3>支付提交失败</h3>
        <div class="fail-reason">{{ payFailReason }}</div>
        <div class="fail-suggestions">
          <div class="fail-title">可能的原因：</div>
          <ul>
            <li>网络连接不稳定，请检查网络后重试</li>
            <li>订单状态已发生变化，请刷新页面查看</li>
            <li>系统繁忙，请稍后再试</li>
          </ul>
        </div>
        <div class="fail-actions">
          <el-button round @click="payFailVisible = false; load()">刷新订单</el-button>
          <el-button type="primary" round @click="retryPay">重新支付</el-button>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { getOrder, cancelOrder, payDeposit, payFinal } from '../../api/order';
import { createAlbum, getMyAlbums } from '../../api/album';
import { createReview, checkReview } from '../../api/review';

const route = useRoute();
const order = ref<any>(null);
const album = ref<any>(null);
const payDialogVisible = ref(false);
const paySuccessVisible = ref(false);
const payType = ref<'deposit' | 'final'>('deposit');
const reviewData = ref<any>(null);
const reviewRating = ref(0);
const reviewContent = ref('');

const finalAmount = computed(() => {
  if (!order.value) return 0;
  return (Number(order.value.totalAmount) - Number(order.value.depositAmount)).toFixed(2);
});

const progressSteps = [
  { label: '提交订单', status: 0 },
  { label: '支付定金', status: 1 },
  { label: '商家确认', status: 2 },
  { label: '支付尾款', status: 3 },
  { label: '入住', status: 4 },
  { label: '完成', status: 5 },
];

const currentStepIndex = computed(() => {
  const s = order.value?.status ?? 0;
  const idx = progressSteps.findIndex(step => step.status === s);
  return idx >= 0 ? idx : 0;
});

function nextActionText(s: number): string {
  return {
    0: '请尽快支付定金以锁定日期，超时订单将自动关闭',
    1: '商家正在确认到账，预计 2-4 小时内完成确认',
    2: '商家已确认订单，请在入住前完成尾款支付',
    3: '费用已结清，请按照预定日期准时入住',
    4: '您正在入住中，祝您玩得愉快！',
    5: '入住已完成，欢迎您留下评价',
  }[s] || '';
}

function callService() {
  window.location.href = 'tel:400-888-8888';
}

function copyWechat() {
  const wechat = 'villa_service';
  if (navigator.clipboard) {
    navigator.clipboard.writeText(wechat).catch(() => {});
  } else {
    const ta = document.createElement('textarea');
    ta.value = wechat; ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta); ta.select(); document.execCommand('copy');
    document.body.removeChild(ta);
  }
  ElMessage.success('微信号 villa_service 已复制，请在微信中添加');
}

onMounted(() => load());

async function load() {
  const id = parseInt(route.params.id as string);
  order.value = await getOrder(id);
  // 检查是否已有相册
  if (order.value.status >= 4) {
    try {
      const albums: any = await getMyAlbums();
      album.value = albums?.find((a: any) => a.orderId === order.value.id) || null;
    } catch { /* not logged in or no albums */ }
  }
  // 检查是否已评价
  if (order.value.status === 5) {
    try {
      const res: any = await checkReview(order.value.id);
      reviewData.value = res.review;
    } catch { /* ignore */ }
  }
}

async function handleCreateAlbum() {
  try {
    const res: any = await createAlbum({ orderId: order.value.id });
    album.value = res;
    ElMessage.success('相册创建成功！分享邀请码给朋友一起上传照片吧');
  } catch (e: any) {
    ElMessage.error(e.message || '创建失败');
  }
}

function copyCode() {
  const link = `${window.location.origin}/album/${album.value.id}`;
  const ta = document.createElement('textarea');
  ta.value = link; ta.style.position = 'fixed'; ta.style.opacity = '0';
  document.body.appendChild(ta); ta.select(); document.execCommand('copy');
  document.body.removeChild(ta);
  ElMessage.success('分享链接已复制');
}

function handlePayDeposit() {
  payType.value = 'deposit';
  payDialogVisible.value = true;
}

function handlePayFinal() {
  payType.value = 'final';
  payDialogVisible.value = true;
}

const payFailVisible = ref(false);
const payFailReason = ref('');

async function confirmPay(_method: string) {
  payDialogVisible.value = false;
  try {
    if (payType.value === 'deposit') {
      await payDeposit(order.value.id);
    } else {
      await payFinal(order.value.id);
    }
    paySuccessVisible.value = true;
    load();
  } catch (e: any) {
    payFailReason.value = e.message || '支付提交失败，请稍后重试';
    payFailVisible.value = true;
  }
}

function retryPay() {
  payFailVisible.value = false;
  payDialogVisible.value = true;
}

async function handleCancel() {
  await ElMessageBox.confirm('确定取消该订单？', '提示');
  await cancelOrder(order.value.id);
  ElMessage.success('已取消');
  load();
}

async function submitReview() {
  try {
    reviewData.value = await createReview({
      orderId: order.value.id,
      rating: reviewRating.value,
      content: reviewContent.value,
    });
    ElMessage.success('评价成功，感谢您的反馈！');
  } catch (e: any) {
    ElMessage.error(e.message || '评价失败');
  }
}

function copyOrderNo(orderNo: string) {
  if (navigator.clipboard) {
    navigator.clipboard.writeText(orderNo).then(() => {
      ElMessage.success('订单号已复制');
    }).catch(() => {
      fallbackCopy(orderNo);
    });
  } else {
    fallbackCopy(orderNo);
  }
}

function fallbackCopy(text: string) {
  const ta = document.createElement('textarea');
  ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
  document.body.appendChild(ta); ta.select(); document.execCommand('copy');
  document.body.removeChild(ta);
  ElMessage.success('订单号已复制');
}

function formatDate(d: string) { return new Date(d).toLocaleString(); }
function fmtDate(d: string) { return d?.split('T')[0] || d; }

function statusIcon(s: number) {
  return { 0: '💰', 1: '⏳', 2: '💳', 3: '✅', 4: '🏠', 5: '🎉' }[s] || '📦';
}
function statusText(s: number) {
  return { 0: '待付定金', 1: '已付定金', 2: '待付尾款', 3: '待入住', 4: '已入住', 5: '已完成', 6: '已取消', 7: '已拒绝', 8: '已关闭' }[s] || '';
}
function statusDesc(s: number) {
  return {
    0: '请支付定金以锁定日期',
    1: '等待商家确认到账',
    2: '订单已确认，请支付尾款',
    3: '费用已结清，请按时入住',
    4: '祝您玩得开心！',
    5: '感谢您的入住，欢迎下次光临',
  }[s] || '';
}
</script>

<style scoped>
.order-detail { padding: 30px 0 60px; max-width: 900px; }
.page-title { font-size: 24px; color: #1e293b; margin-bottom: 20px; font-weight: 700; }

.status-card {
  background: linear-gradient(135deg, #e6a23c, #f5c542);
  padding: 40px; border-radius: 14px; color: #fff;
  text-align: center; margin-bottom: 20px;
}
.status-card.status-1 { background: linear-gradient(135deg, #409eff, #53a8ff); }
.status-card.status-2 { background: linear-gradient(135deg, #e6a23c, #f5c542); }
.status-card.status-3 { background: linear-gradient(135deg, #67c23a, #85ce61); }
.status-card.status-4 { background: linear-gradient(135deg, #409eff, #53a8ff); }
.status-card.status-5 { background: linear-gradient(135deg, #27ae60, #2ecc71); }
.status-card.status-6, .status-card.status-7, .status-card.status-8 { background: linear-gradient(135deg, #909399, #b1b3b8); }
.status-icon { font-size: 48px; }
.status-text { font-size: 24px; font-weight: 700; margin-top: 8px; }
.status-desc { font-size: 14px; opacity: 0.9; margin-top: 6px; }

.card { background: #fff; padding: 24px; border-radius: 12px; margin-bottom: 16px; }
.card h3 { font-size: 16px; margin-bottom: 16px; color: #1e293b; font-weight: 600; }
.villa-name { font-size: 16px; color: #1e293b; font-weight: 600; }
.date-info, .guest-info { font-size: 14px; color: #64748b; margin-top: 6px; }

.fee-item { display: flex; justify-content: space-between; padding: 10px 0; font-size: 14px; color: #64748b; }
.fee-divider { border-top: 1px dashed #e2e8f0; margin: 8px 0; }
.discount { color: #27ae60; }
.info-row { padding: 6px 0; font-size: 14px; color: #64748b; display: flex; align-items: center; }
.label { color: #94a3b8; }
.copy-btn {
  display: inline-flex; align-items: center; justify-content: center;
  margin-left: 8px; padding: 4px; border-radius: 4px;
  color: #94a3b8; cursor: pointer; transition: all 0.2s;
}
.copy-btn:hover { color: #409eff; background: #f0f7ff; }

.action-bar {
  display: flex; gap: 12px; padding: 20px;
  background: #fff; border-radius: 12px;
  justify-content: flex-end;
}

/* Mock 支付弹窗 */
.pay-dialog { text-align: center; }
.pay-amount { font-size: 36px; font-weight: 800; color: #ff6b35; margin: 16px 0; }
.pay-hint { font-size: 14px; color: #94a3b8; margin-bottom: 20px; }
.pay-methods { display: flex; gap: 16px; justify-content: center; margin-bottom: 20px; }
.pay-method {
  padding: 16px 24px; border-radius: 12px; border: 1px solid #e2e8f0;
  cursor: pointer; transition: all 0.2s; display: flex; flex-direction: column; align-items: center; gap: 6px;
}
.pay-method:hover { border-color: #409eff; background: #f0f7ff; }
.method-icon { font-size: 18px; font-weight: 700; }
.pay-note { font-size: 12px; color: #94a3b8; line-height: 1.6; }

.pay-success { text-align: center; padding: 20px 0; }
.success-icon { font-size: 48px; }
.pay-success h3 { font-size: 18px; color: #1e293b; margin: 12px 0 16px; }
.pay-success-progress {
  display: flex; align-items: center; justify-content: center;
  gap: 0; margin-bottom: 16px;
}
.pay-success-progress .progress-item {
  display: flex; flex-direction: column; align-items: center; gap: 6px;
}
.pay-success-progress .progress-dot {
  width: 28px; height: 28px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 12px; font-weight: 700;
  background: #e2e8f0; color: #94a3b8;
}
.pay-success-progress .progress-item.active .progress-dot {
  background: #67c23a; color: #fff;
}
.pay-success-progress .progress-item.pending .progress-dot {
  background: #e2e8f0; color: #94a3b8;
}
.pay-success-progress .progress-item span {
  font-size: 12px; color: #64748b; white-space: nowrap;
}
.pay-success-progress .progress-line {
  width: 40px; height: 3px; background: #e2e8f0; margin: 0 4px 18px;
}
.pay-success-progress .progress-line.active { background: #67c23a; }
.pay-success-tip {
  font-size: 14px; color: #e6a23c; font-weight: 500;
  background: #fffbeb; padding: 10px 16px; border-radius: 8px;
  margin-bottom: 12px;
}
.pay-success-contact {
  font-size: 13px; color: #64748b; margin-bottom: 16px;
}
.pay-success-contact .contact-phone,
.pay-success-contact .contact-wechat {
  color: #409eff; cursor: pointer; font-weight: 600;
}
.pay-success-contact .contact-phone:hover,
.pay-success-contact .contact-wechat:hover { text-decoration: underline; }
.pay-success-actions { display: flex; gap: 12px; justify-content: center; }

/* 支付失败 */
.pay-fail { text-align: center; padding: 20px 0; }
.fail-icon { font-size: 48px; }
.pay-fail h3 { font-size: 18px; color: #f56c6c; margin: 12px 0 12px; }
.fail-reason {
  font-size: 14px; color: #e6a23c; background: #fef0e0;
  padding: 10px 16px; border-radius: 8px; margin-bottom: 16px;
}
.fail-suggestions { text-align: left; margin-bottom: 20px; }
.fail-title { font-size: 14px; color: #64748b; font-weight: 600; margin-bottom: 8px; }
.fail-suggestions ul {
  margin: 0; padding-left: 20px; font-size: 13px; color: #94a3b8; line-height: 2;
}
.fail-actions { display: flex; gap: 12px; justify-content: center; }

/* 评价 */
.review-form { }
.rating-row { display: flex; align-items: center; gap: 4px; margin-bottom: 12px; font-size: 14px; color: #64748b; }
.star-btn { font-size: 28px; cursor: pointer; transition: color 0.15s; }
.star-on { color: #fbbf24; }
.star-off { color: #e2e8f0; }
.review-done { }
.review-stars { font-size: 22px; margin-bottom: 8px; }
.review-stars .star-on { color: #fbbf24; }
.review-stars .star-off { color: #e2e8f0; }
.review-content { font-size: 14px; color: #475569; line-height: 1.7; margin-bottom: 6px; }
.review-time { font-size: 12px; color: #94a3b8; }
.review-reply {
  margin-top: 12px; padding: 12px; background: #f8fafc; border-radius: 8px;
  font-size: 13px; color: #64748b; line-height: 1.6;
  border-left: 3px solid #3b82f6;
}
.review-reply b { color: #3b82f6; }

/* 相册卡片 */
.album-card {
  background: linear-gradient(135deg, #f0f7ff, #e8f4fd) !important;
  border: 1px solid #bae0ff;
}
.album-info-row {
  display: flex; justify-content: space-between; align-items: center;
}
.album-title { font-size: 16px; font-weight: 600; color: #1e293b; }
.album-code { font-size: 14px; color: #64748b; margin-top: 8px; }
.code-text {
  font-family: monospace; font-weight: 700; color: #3b82f6;
  cursor: pointer; letter-spacing: 2px; font-size: 18px;
}
.code-text:hover { text-decoration: underline; }
.code-tip { font-size: 12px; color: #94a3b8; }

/* 进度条 */
.progress-card { }
.progress-bar {
  display: flex; align-items: flex-start; position: relative;
}
.progress-step {
  flex: 1; display: flex; flex-direction: column; align-items: center;
  position: relative;
}
.step-dot {
  width: 32px; height: 32px; border-radius: 50%;
  background: #e2e8f0; color: #94a3b8;
  display: flex; align-items: center; justify-content: center;
  font-size: 13px; font-weight: 700; position: relative; z-index: 1;
  transition: all 0.3s;
}
.progress-step.active .step-dot {
  background: #409eff; color: #fff;
}
.progress-step.current .step-dot {
  background: #ff6b35; color: #fff;
  box-shadow: 0 0 0 4px rgba(255, 107, 53, 0.2);
}
.step-check { font-size: 14px; }
.step-label {
  font-size: 12px; color: #94a3b8; margin-top: 8px; text-align: center;
  white-space: nowrap;
}
.progress-step.active .step-label { color: #1e293b; font-weight: 500; }
.progress-step.current .step-label { color: #ff6b35; font-weight: 600; }
.step-line {
  position: absolute; top: 15px; left: calc(50% + 16px);
  width: calc(100% - 32px); height: 3px;
  background: #e2e8f0; z-index: 0;
}
.step-line.filled { background: #409eff; }

.next-action-tip {
  display: flex; align-items: center; gap: 8px;
  margin-top: 20px; padding: 14px 18px; border-radius: 10px;
  background: #fffbeb; border: 1px solid #fde68a;
  font-size: 14px; color: #92400e; line-height: 1.5;
}
.tip-icon { font-size: 18px; flex-shrink: 0; }

/* 客服 */
.service-card { background: #f8fafc !important; border: 1px solid #e2e8f0; }
.service-row {
  display: flex; justify-content: space-between; align-items: center;
  flex-wrap: wrap; gap: 12px;
}
.service-info { display: flex; align-items: center; gap: 12px; }
.service-icon { font-size: 28px; }
.service-title { font-size: 15px; font-weight: 600; color: #1e293b; }
.service-desc { font-size: 12px; color: #94a3b8; margin-top: 2px; }
.service-actions { display: flex; gap: 8px; }

@media (max-width: 768px) {
  .action-bar { flex-direction: column; }
  .pay-methods { flex-direction: column; gap: 10px; }
  .progress-bar { gap: 0; }
  .step-label { font-size: 11px; }
  .service-row { flex-direction: column; align-items: flex-start; }
}
</style>
