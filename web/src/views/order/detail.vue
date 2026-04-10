<template>
  <div class="container order-detail" v-if="order">
    <h2 class="page-title">订单详情</h2>

    <div class="status-card" :class="'status-' + order.status">
      <div class="status-icon">{{ statusIcon(order.status) }}</div>
      <div class="status-text">{{ statusText(order.status) }}</div>
      <div class="status-desc">{{ statusDesc(order.status) }}</div>
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
      <div class="info-row"><span class="label">订单号：</span>{{ order.orderNo }}</div>
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

    <!-- 支付成功提示 -->
    <el-dialog v-model="paySuccessVisible" title="" width="360px" center>
      <div class="pay-success">
        <div class="success-icon">✅</div>
        <h3>{{ payType === 'deposit' ? '定金' : '尾款' }}支付请求已提交</h3>
        <p>请等待商家确认到账，确认后订单状态会自动更新</p>
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

const route = useRoute();
const order = ref<any>(null);
const album = ref<any>(null);
const payDialogVisible = ref(false);
const paySuccessVisible = ref(false);
const payType = ref<'deposit' | 'final'>('deposit');

const finalAmount = computed(() => {
  if (!order.value) return 0;
  return (Number(order.value.totalAmount) - Number(order.value.depositAmount)).toFixed(2);
});

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
    ElMessage.error(e.message || '操作失败');
  }
}

async function handleCancel() {
  await ElMessageBox.confirm('确定取消该订单？', '提示');
  await cancelOrder(order.value.id);
  ElMessage.success('已取消');
  load();
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
.info-row { padding: 6px 0; font-size: 14px; color: #64748b; }
.label { color: #94a3b8; }

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
.pay-success h3 { font-size: 18px; color: #1e293b; margin: 12px 0 8px; }
.pay-success p { font-size: 14px; color: #94a3b8; }

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

@media (max-width: 768px) {
  .action-bar { flex-direction: column; }
  .pay-methods { flex-direction: column; gap: 10px; }
}
</style>
