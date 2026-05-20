<template>
  <view class="page">
    <view class="toolbar">
      <text class="title">限定活动</text>
      <view class="add-btn" @tap="showForm()">+ 新增</view>
    </view>

    <view class="list">
      <view class="item-card" v-for="item in list" :key="item.id">
        <image v-if="item.coverImage" :src="resolveImg(item.coverImage)" class="item-img" mode="aspectFill" />
        <view class="item-body">
          <text class="item-name">{{ item.name }}</text>
          <text class="item-season">{{ item.season }}</text>
          <text class="item-date">{{ formatDate(item.startDate) }} ~ {{ formatDate(item.endDate) }}</text>
          <view class="item-stats">
            <text>限额 {{ item.quota }} · 已售 {{ item.soldCount || 0 }}</text>
            <text class="discount" v-if="item.discount">优惠¥{{ item.discount }}</text>
          </view>
          <view class="item-actions">
            <text class="action-btn" @tap="showForm(item)">编辑</text>
            <text class="action-btn danger" @tap="handleDelete(item)">删除</text>
          </view>
        </view>
      </view>
    </view>

    <view class="empty" v-if="!loading && list.length === 0">
      <text class="empty-text">暂无限定活动</text>
    </view>

    <view class="modal-mask" v-if="formVisible" @tap="formVisible = false">
      <view class="modal" @tap.stop>
        <text class="modal-title">{{ editingId ? '编辑活动' : '新增活动' }}</text>
        <view class="form-group">
          <text class="label">名称</text>
          <input class="input" v-model="form.name" />
        </view>
        <view class="form-group">
          <text class="label">季节</text>
          <picker :value="seasonIdx" :range="seasons" @change="(e: any) => { seasonIdx = e.detail.value; form.season = seasons[e.detail.value]; }">
            <text class="picker-text">{{ form.season || '选择季节' }}</text>
          </picker>
        </view>
        <view class="form-group row">
          <view class="half">
            <text class="label">开始日期</text>
            <picker mode="date" :value="form.startDate" @change="(e: any) => form.startDate = e.detail.value">
              <text class="picker-text">{{ form.startDate || '选择' }}</text>
            </picker>
          </view>
          <view class="half">
            <text class="label">结束日期</text>
            <picker mode="date" :value="form.endDate" @change="(e: any) => form.endDate = e.detail.value">
              <text class="picker-text">{{ form.endDate || '选择' }}</text>
            </picker>
          </view>
        </view>
        <view class="form-group row">
          <view class="half">
            <text class="label">限额</text>
            <input class="input" type="number" v-model="form.quota" />
          </view>
          <view class="half">
            <text class="label">优惠金额</text>
            <input class="input" type="digit" v-model="form.discount" />
          </view>
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
import { getAdminSeasonalEvents, createSeasonalEvent, updateSeasonalEvent, deleteSeasonalEvent } from '../../../api/admin';
import { resolveImageUrl } from '../../../utils/request';

const resolveImg = resolveImageUrl;
const list = ref<any[]>([]);
const loading = ref(false);
const formVisible = ref(false);
const editingId = ref(0);
const seasonIdx = ref(0);
const seasons = ['春季', '夏季', '秋季', '冬季'];

const form = reactive({ name: '', season: '', startDate: '', endDate: '', quota: '', discount: '', description: '' });

function formatDate(d: string) { return d ? d.split('T')[0] : ''; }

onShow(() => loadData());

async function loadData() {
  loading.value = true;
  try {
    const data = await getAdminSeasonalEvents({ page: 1, pageSize: 100 });
    list.value = data.list || data;
  } catch (e) { console.error(e); }
  finally { loading.value = false; }
}

function showForm(item?: any) {
  if (item) {
    editingId.value = item.id;
    Object.assign(form, {
      name: item.name, season: item.season || '',
      startDate: formatDate(item.startDate), endDate: formatDate(item.endDate),
      quota: String(item.quota || ''), discount: String(item.discount || ''),
      description: item.description || '',
    });
    seasonIdx.value = Math.max(0, seasons.indexOf(item.season));
  } else {
    editingId.value = 0;
    Object.assign(form, { name: '', season: '', startDate: '', endDate: '', quota: '', discount: '', description: '' });
  }
  formVisible.value = true;
}

async function handleSave() {
  if (!form.name) { uni.showToast({ title: '请填写名称', icon: 'none' }); return; }
  const data = { ...form, quota: Number(form.quota) || 0, discount: Number(form.discount) || 0 };
  try {
    if (editingId.value) await updateSeasonalEvent(editingId.value, data);
    else await createSeasonalEvent(data);
    formVisible.value = false;
    uni.showToast({ title: '保存成功', icon: 'success' });
    loadData();
  } catch (e) { console.error(e); }
}

function handleDelete(item: any) {
  uni.showModal({
    title: '提示', content: `确认删除「${item.name}」？`,
    success: async (res) => { if (res.confirm) { await deleteSeasonalEvent(item.id); loadData(); } },
  });
}
</script>

<style lang="scss">
.page { background: #f5f5f5; min-height: 100vh; }
.toolbar { display: flex; justify-content: space-between; align-items: center; padding: 20rpx 24rpx; background: #fff; }
.title { font-size: 32rpx; font-weight: bold; }
.add-btn { background: #409EFF; color: #fff; padding: 10rpx 28rpx; border-radius: 24rpx; font-size: 26rpx; }
.list { padding: 20rpx 24rpx; }
.item-card { background: #fff; border-radius: 16rpx; overflow: hidden; margin-bottom: 20rpx; display: flex; }
.item-img { width: 200rpx; height: 200rpx; flex-shrink: 0; }
.item-body { flex: 1; padding: 20rpx; }
.item-name { font-size: 28rpx; font-weight: bold; color: #333; display: block; }
.item-season { font-size: 22rpx; color: #67C23A; display: inline-block; background: rgba(103,194,58,0.1); padding: 2rpx 12rpx; border-radius: 8rpx; margin-top: 6rpx; }
.item-date { font-size: 22rpx; color: #999; display: block; margin-top: 6rpx; }
.item-stats { font-size: 22rpx; color: #666; margin-top: 6rpx; display: flex; justify-content: space-between; }
.discount { color: #FF6B35; font-weight: bold; }
.item-actions { display: flex; gap: 16rpx; margin-top: 12rpx; }
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
.textarea { width: 100%; height: 160rpx; background: #f5f7fa; border-radius: 12rpx; padding: 20rpx; font-size: 28rpx; box-sizing: border-box; }
.picker-text { display: block; height: 80rpx; line-height: 80rpx; background: #f5f7fa; border-radius: 12rpx; padding: 0 20rpx; font-size: 28rpx; }
.save-btn { width: 100%; height: 80rpx; line-height: 80rpx; background: #409EFF; color: #fff; font-size: 30rpx; border: none; border-radius: 40rpx; margin-top: 20rpx; }
.save-btn::after { border: none; }
</style>
