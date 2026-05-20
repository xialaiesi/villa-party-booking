<template>
  <view class="page">
    <view class="toolbar">
      <text class="title">商家管理</text>
      <view class="add-btn" @tap="showForm()">+ 新增</view>
    </view>

    <view class="list">
      <view class="merchant-card" v-for="m in list" :key="m.id">
        <view class="merchant-header">
          <text class="merchant-name">{{ m.name }}</text>
          <text class="status-tag" :class="m.status === 1 ? 'on' : 'off'">{{ m.status === 1 ? '正常' : '停用' }}</text>
        </view>
        <view class="merchant-info">
          <text class="info-item">联系人: {{ m.contactName }} · {{ m.contactPhone }}</text>
          <text class="info-item" v-if="m.email">邮箱: {{ m.email }}</text>
          <text class="info-item">佣金率: {{ (m.commissionRate * 100).toFixed(1) }}%</text>
        </view>
        <view class="merchant-stats">
          <view class="stat">
            <text class="stat-num">{{ m.villaCount || 0 }}</text>
            <text class="stat-label">房源</text>
          </view>
          <view class="stat">
            <text class="stat-num">{{ m.orderCount || 0 }}</text>
            <text class="stat-label">订单</text>
          </view>
          <view class="stat">
            <text class="stat-num">¥{{ m.totalRevenue || 0 }}</text>
            <text class="stat-label">总收入</text>
          </view>
        </view>
        <view class="merchant-actions">
          <text class="action-btn" @tap="showForm(m)">编辑</text>
          <text class="action-btn danger" @tap="handleDelete(m)">删除</text>
        </view>
      </view>
    </view>

    <view class="empty" v-if="!loading && list.length === 0">
      <text class="empty-text">暂无商家</text>
    </view>

    <view class="modal-mask" v-if="formVisible" @tap="formVisible = false">
      <view class="modal" @tap.stop>
        <text class="modal-title">{{ editingId ? '编辑商家' : '新增商家' }}</text>
        <view class="form-group">
          <text class="label">商家名称</text>
          <input class="input" v-model="form.name" />
        </view>
        <view class="form-group row">
          <view class="half">
            <text class="label">联系人</text>
            <input class="input" v-model="form.contactName" />
          </view>
          <view class="half">
            <text class="label">手机</text>
            <input class="input" v-model="form.contactPhone" />
          </view>
        </view>
        <view class="form-group">
          <text class="label">邮箱</text>
          <input class="input" v-model="form.email" />
        </view>
        <view class="form-group">
          <text class="label">地址</text>
          <input class="input" v-model="form.address" />
        </view>
        <view class="form-group">
          <text class="label">佣金率(0-1)</text>
          <input class="input" type="digit" v-model="form.commissionRate" placeholder="如0.1=10%" />
        </view>
        <view class="form-group">
          <text class="label">描述</text>
          <textarea class="textarea" v-model="form.description" />
        </view>
        <button class="save-btn" @tap="handleSave">保存</button>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import { getAdminMerchants, createMerchant, updateMerchant, deleteMerchant } from '../../../api/admin';

const list = ref<any[]>([]);
const loading = ref(false);
const formVisible = ref(false);
const editingId = ref(0);
const form = reactive({
  name: '', contactName: '', contactPhone: '', email: '', address: '', commissionRate: '', description: '',
});

onShow(() => loadData());

async function loadData() {
  loading.value = true;
  try {
    const data = await getAdminMerchants({ page: 1, pageSize: 50 });
    list.value = data.list || data;
  } catch (e) { console.error(e); }
  finally { loading.value = false; }
}

function showForm(item?: any) {
  if (item) {
    editingId.value = item.id;
    Object.assign(form, {
      name: item.name, contactName: item.contactName, contactPhone: item.contactPhone,
      email: item.email || '', address: item.address || '',
      commissionRate: String(item.commissionRate || ''), description: item.description || '',
    });
  } else {
    editingId.value = 0;
    Object.assign(form, { name: '', contactName: '', contactPhone: '', email: '', address: '', commissionRate: '', description: '' });
  }
  formVisible.value = true;
}

async function handleSave() {
  if (!form.name || !form.contactName) { uni.showToast({ title: '请填写必要信息', icon: 'none' }); return; }
  const data = { ...form, commissionRate: Number(form.commissionRate) || 0 };
  try {
    if (editingId.value) await updateMerchant(editingId.value, data);
    else await createMerchant(data);
    formVisible.value = false;
    uni.showToast({ title: '保存成功', icon: 'success' });
    loadData();
  } catch (e) { console.error(e); }
}

function handleDelete(item: any) {
  uni.showModal({
    title: '提示', content: `确认删除「${item.name}」？`,
    success: async (res) => { if (res.confirm) { await deleteMerchant(item.id); loadData(); } },
  });
}
</script>

<style lang="scss">
.page { background: #f5f5f5; min-height: 100vh; }
.toolbar { display: flex; justify-content: space-between; align-items: center; padding: 20rpx 24rpx; background: #fff; }
.title { font-size: 32rpx; font-weight: bold; }
.add-btn { background: #409EFF; color: #fff; padding: 10rpx 28rpx; border-radius: 24rpx; font-size: 26rpx; }
.list { padding: 20rpx 24rpx; }
.merchant-card { background: #fff; border-radius: 16rpx; padding: 24rpx; margin-bottom: 20rpx; }
.merchant-header { display: flex; justify-content: space-between; align-items: center; }
.merchant-name { font-size: 32rpx; font-weight: bold; color: #333; }
.status-tag { font-size: 20rpx; padding: 4rpx 16rpx; border-radius: 8rpx; }
.status-tag.on { background: rgba(103,194,58,0.1); color: #67C23A; }
.status-tag.off { background: rgba(144,147,153,0.1); color: #909399; }
.merchant-info { margin-top: 16rpx; }
.info-item { font-size: 24rpx; color: #666; display: block; margin-top: 6rpx; }
.merchant-stats { display: flex; margin-top: 20rpx; padding-top: 20rpx; border-top: 1rpx solid #f5f5f5; }
.stat { flex: 1; text-align: center; }
.stat-num { font-size: 32rpx; font-weight: bold; color: #333; display: block; }
.stat-label { font-size: 22rpx; color: #999; }
.merchant-actions { display: flex; gap: 16rpx; margin-top: 20rpx; justify-content: flex-end; }
.action-btn { font-size: 24rpx; color: #409EFF; padding: 6rpx 20rpx; border: 1rpx solid #409EFF; border-radius: 20rpx; }
.action-btn.danger { color: #F56C6C; border-color: #F56C6C; }
.empty { padding: 200rpx 0; text-align: center; }
.empty-text { color: #999; }
.modal-mask { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); z-index: 999; display: flex; align-items: flex-end; }
.modal { width: 100%; background: #fff; border-radius: 24rpx 24rpx 0 0; padding: 40rpx 30rpx; max-height: 80vh; overflow-y: auto; }
.modal-title { font-size: 32rpx; font-weight: bold; text-align: center; margin-bottom: 30rpx; display: block; }
.form-group { margin-bottom: 24rpx; }
.form-group.row { display: flex; gap: 16rpx; }
.half { flex: 1; }
.label { font-size: 26rpx; color: #666; display: block; margin-bottom: 10rpx; }
.input { width: 100%; height: 80rpx; background: #f5f7fa; border-radius: 12rpx; padding: 0 20rpx; font-size: 28rpx; box-sizing: border-box; }
.textarea { width: 100%; height: 140rpx; background: #f5f7fa; border-radius: 12rpx; padding: 20rpx; font-size: 28rpx; box-sizing: border-box; }
.save-btn { width: 100%; height: 80rpx; line-height: 80rpx; background: #409EFF; color: #fff; font-size: 30rpx; border: none; border-radius: 40rpx; margin-top: 20rpx; }
.save-btn::after { border: none; }
</style>
