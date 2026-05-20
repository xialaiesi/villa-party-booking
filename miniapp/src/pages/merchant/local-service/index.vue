<template>
  <view class="page">
    <view class="toolbar">
      <text class="title">周边服务</text>
      <view class="add-btn" @tap="showForm()">+ 新增</view>
    </view>

    <view class="list">
      <view class="item-card" v-for="item in list" :key="item.id">
        <image v-if="item.coverImage" :src="resolveImg(item.coverImage)" class="item-img" mode="aspectFill" />
        <view class="item-body">
          <text class="item-name">{{ item.name }}</text>
          <text class="item-cat">{{ item.category }}</text>
          <text class="item-provider">{{ item.provider }}</text>
          <text class="item-price">¥{{ item.price }}/{{ item.unit || '次' }}</text>
          <view class="item-actions">
            <text class="action-btn" @tap="showForm(item)">编辑</text>
            <text class="action-btn danger" @tap="handleDelete(item)">删除</text>
          </view>
        </view>
      </view>
    </view>

    <view class="empty" v-if="!loading && list.length === 0">
      <text class="empty-text">暂无周边服务</text>
    </view>

    <view class="modal-mask" v-if="formVisible" @tap="formVisible = false">
      <view class="modal" @tap.stop>
        <text class="modal-title">{{ editingId ? '编辑服务' : '新增服务' }}</text>
        <view class="form-group">
          <text class="label">名称</text>
          <input class="input" v-model="form.name" placeholder="服务名称" />
        </view>
        <view class="form-group">
          <text class="label">分类</text>
          <picker :value="catIdx" :range="categories" @change="(e: any) => { catIdx = e.detail.value; form.category = categories[e.detail.value]; }">
            <text class="picker-text">{{ form.category || '选择分类' }}</text>
          </picker>
        </view>
        <view class="form-group row">
          <view class="half">
            <text class="label">价格</text>
            <input class="input" type="digit" v-model="form.price" />
          </view>
          <view class="half">
            <text class="label">单位</text>
            <input class="input" v-model="form.unit" placeholder="次/天/小时" />
          </view>
        </view>
        <view class="form-group">
          <text class="label">服务商</text>
          <input class="input" v-model="form.provider" placeholder="服务提供方" />
        </view>
        <view class="form-group">
          <text class="label">描述</text>
          <textarea class="textarea" v-model="form.description" placeholder="描述" />
        </view>
        <button class="save-btn" @tap="handleSave">保存</button>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import { getAdminLocalServices, createLocalService, updateLocalService, deleteLocalService } from '../../../api/admin';
import { resolveImageUrl } from '../../../utils/request';

const resolveImg = resolveImageUrl;
const list = ref<any[]>([]);
const loading = ref(false);
const formVisible = ref(false);
const editingId = ref(0);
const catIdx = ref(0);
const categories = ['厨师', '摄影师', 'DJ', '调酒师', '蛋糕', '教练'];

const form = reactive({ name: '', category: '', price: '', unit: '', provider: '', description: '' });

onShow(() => loadData());

async function loadData() {
  loading.value = true;
  try {
    const data = await getAdminLocalServices({ page: 1, pageSize: 100 });
    list.value = data.list || data;
  } catch (e) { console.error(e); }
  finally { loading.value = false; }
}

function showForm(item?: any) {
  if (item) {
    editingId.value = item.id;
    Object.assign(form, {
      name: item.name, category: item.category || '', price: String(item.price || ''),
      unit: item.unit || '', provider: item.provider || '', description: item.description || '',
    });
    catIdx.value = Math.max(0, categories.indexOf(item.category));
  } else {
    editingId.value = 0;
    Object.assign(form, { name: '', category: '', price: '', unit: '', provider: '', description: '' });
  }
  formVisible.value = true;
}

async function handleSave() {
  if (!form.name) { uni.showToast({ title: '请填写名称', icon: 'none' }); return; }
  const data = { ...form, price: Number(form.price) || 0 };
  try {
    if (editingId.value) await updateLocalService(editingId.value, data);
    else await createLocalService(data);
    formVisible.value = false;
    uni.showToast({ title: '保存成功', icon: 'success' });
    loadData();
  } catch (e) { console.error(e); }
}

function handleDelete(item: any) {
  uni.showModal({
    title: '提示', content: `确认删除「${item.name}」？`,
    success: async (res) => { if (res.confirm) { await deleteLocalService(item.id); loadData(); } },
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
.item-img { width: 180rpx; height: 180rpx; flex-shrink: 0; }
.item-body { flex: 1; padding: 20rpx; }
.item-name { font-size: 28rpx; font-weight: bold; color: #333; display: block; }
.item-cat { font-size: 22rpx; color: #409EFF; display: inline-block; background: rgba(64,158,255,0.1); padding: 2rpx 12rpx; border-radius: 8rpx; margin-top: 6rpx; }
.item-provider { font-size: 22rpx; color: #999; display: block; margin-top: 6rpx; }
.item-price { font-size: 28rpx; color: #FF6B35; font-weight: bold; display: block; margin-top: 6rpx; }
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
