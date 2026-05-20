<template>
  <view class="page">
    <view class="toolbar">
      <text class="title">套餐管理</text>
      <view class="add-btn" @tap="showForm()">+ 新增</view>
    </view>

    <view class="list">
      <view class="item-card" v-for="item in list" :key="item.id">
        <image v-if="item.image" :src="resolveImg(item.image)" class="item-img" mode="aspectFill" />
        <view class="item-body">
          <view class="item-top">
            <text class="item-name">{{ item.name }}</text>
            <text class="item-cat">{{ item.category }}</text>
          </view>
          <view class="item-prices">
            <text class="price">¥{{ item.price }}</text>
            <text class="price-sub" v-if="item.weekendPrice">周末¥{{ item.weekendPrice }}</text>
            <text class="price-sub" v-if="item.holidayPrice">节假日¥{{ item.holidayPrice }}</text>
          </view>
          <view class="item-actions">
            <text class="action-btn" @tap="showForm(item)">编辑</text>
            <text class="action-btn danger" @tap="handleDelete(item)">删除</text>
          </view>
        </view>
      </view>
    </view>

    <view class="empty" v-if="!loading && list.length === 0">
      <text class="empty-text">暂无套餐</text>
    </view>

    <!-- 编辑弹窗 -->
    <view class="modal-mask" v-if="formVisible" @tap="formVisible = false">
      <view class="modal" @tap.stop>
        <text class="modal-title">{{ editingId ? '编辑套餐' : '新增套餐' }}</text>
        <view class="form-group">
          <text class="label">名称</text>
          <input class="input" v-model="form.name" placeholder="套餐名称" />
        </view>
        <view class="form-group">
          <text class="label">分类</text>
          <picker :value="catIndex" :range="categories" @change="(e: any) => { catIndex = e.detail.value; form.category = categories[e.detail.value]; }">
            <text class="picker-text">{{ form.category || '选择分类' }}</text>
          </picker>
        </view>
        <view class="form-group row">
          <view class="third">
            <text class="label">平日价</text>
            <input class="input" type="digit" v-model="form.price" placeholder="价格" />
          </view>
          <view class="third">
            <text class="label">周末价</text>
            <input class="input" type="digit" v-model="form.weekendPrice" placeholder="周末" />
          </view>
          <view class="third">
            <text class="label">节假日价</text>
            <input class="input" type="digit" v-model="form.holidayPrice" placeholder="节假日" />
          </view>
        </view>
        <view class="form-group">
          <text class="label">描述</text>
          <textarea class="textarea" v-model="form.description" placeholder="套餐描述" />
        </view>
        <button class="save-btn" @tap="handleSave">保存</button>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import { getAdminPackages, createPackage, updatePackage, deletePackage } from '../../../api/admin';
import { resolveImageUrl } from '../../../utils/request';

const resolveImg = resolveImageUrl;
const list = ref<any[]>([]);
const loading = ref(false);
const formVisible = ref(false);
const editingId = ref(0);
const catIndex = ref(0);
const categories = ['烧烤', 'KTV', '布置装饰', '游戏道具', '餐饮食材', '其他'];

const form = reactive({
  name: '', category: '', price: '', weekendPrice: '', holidayPrice: '', description: '',
});

onShow(() => loadData());

async function loadData() {
  loading.value = true;
  try {
    const data = await getAdminPackages({ page: 1, pageSize: 100 });
    list.value = data.list || data;
  } catch (e) { console.error(e); }
  finally { loading.value = false; }
}

function showForm(item?: any) {
  if (item) {
    editingId.value = item.id;
    Object.assign(form, {
      name: item.name, category: item.category,
      price: String(item.price || ''), weekendPrice: String(item.weekendPrice || ''),
      holidayPrice: String(item.holidayPrice || ''), description: item.description || '',
    });
    catIndex.value = categories.indexOf(item.category);
  } else {
    editingId.value = 0;
    Object.assign(form, { name: '', category: '', price: '', weekendPrice: '', holidayPrice: '', description: '' });
    catIndex.value = 0;
  }
  formVisible.value = true;
}

async function handleSave() {
  if (!form.name) { uni.showToast({ title: '请填写名称', icon: 'none' }); return; }
  const data = {
    ...form,
    price: Number(form.price) || 0,
    weekendPrice: Number(form.weekendPrice) || 0,
    holidayPrice: Number(form.holidayPrice) || 0,
  };
  try {
    if (editingId.value) await updatePackage(editingId.value, data);
    else await createPackage(data);
    uni.showToast({ title: '保存成功', icon: 'success' });
    formVisible.value = false;
    loadData();
  } catch (e) { console.error(e); }
}

function handleDelete(item: any) {
  uni.showModal({
    title: '提示', content: `确认删除「${item.name}」？`,
    success: async (res) => {
      if (res.confirm) {
        await deletePackage(item.id);
        uni.showToast({ title: '已删除', icon: 'success' });
        loadData();
      }
    },
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
.item-body { flex: 1; padding: 20rpx; display: flex; flex-direction: column; justify-content: space-between; }
.item-top { display: flex; justify-content: space-between; align-items: center; }
.item-name { font-size: 28rpx; font-weight: bold; color: #333; }
.item-cat { font-size: 20rpx; background: #f0f0f0; color: #666; padding: 4rpx 12rpx; border-radius: 8rpx; }
.item-prices { display: flex; gap: 16rpx; margin-top: 8rpx; align-items: baseline; }
.price { font-size: 30rpx; color: #FF6B35; font-weight: bold; }
.price-sub { font-size: 22rpx; color: #999; }
.item-actions { display: flex; gap: 16rpx; margin-top: 12rpx; }
.action-btn { font-size: 24rpx; color: #409EFF; padding: 6rpx 20rpx; border: 1rpx solid #409EFF; border-radius: 20rpx; }
.action-btn.danger { color: #F56C6C; border-color: #F56C6C; }

.empty { padding: 200rpx 0; text-align: center; }
.empty-text { color: #999; font-size: 28rpx; }

.modal-mask { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); z-index: 999; display: flex; align-items: flex-end; }
.modal { width: 100%; background: #fff; border-radius: 24rpx 24rpx 0 0; padding: 40rpx 30rpx; max-height: 80vh; overflow-y: auto; }
.modal-title { font-size: 32rpx; font-weight: bold; text-align: center; margin-bottom: 30rpx; display: block; }
.form-group { margin-bottom: 24rpx; }
.form-group.row { display: flex; gap: 16rpx; }
.third { flex: 1; }
.label { font-size: 26rpx; color: #666; display: block; margin-bottom: 10rpx; }
.input { width: 100%; height: 80rpx; background: #f5f7fa; border-radius: 12rpx; padding: 0 20rpx; font-size: 28rpx; box-sizing: border-box; }
.textarea { width: 100%; height: 160rpx; background: #f5f7fa; border-radius: 12rpx; padding: 20rpx; font-size: 28rpx; box-sizing: border-box; }
.picker-text { display: block; height: 80rpx; line-height: 80rpx; background: #f5f7fa; border-radius: 12rpx; padding: 0 20rpx; font-size: 28rpx; color: #333; }
.save-btn { width: 100%; height: 80rpx; line-height: 80rpx; background: #409EFF; color: #fff; font-size: 30rpx; border: none; border-radius: 40rpx; margin-top: 20rpx; }
.save-btn::after { border: none; }
</style>
