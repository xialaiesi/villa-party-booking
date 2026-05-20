<template>
  <view class="page">
    <view class="toolbar">
      <text class="title">设施管理</text>
      <view class="add-btn" @tap="showForm()">+ 新增</view>
    </view>

    <view class="cat-section" v-for="cat in groupedList" :key="cat.name">
      <text class="cat-title">{{ cat.name }}</text>
      <view class="facility-grid">
        <view class="facility-item" v-for="f in cat.items" :key="f.id" @tap="showForm(f)">
          <text class="facility-icon">{{ f.icon || '🔧' }}</text>
          <text class="facility-name">{{ f.name }}</text>
          <text class="del-btn" @tap.stop="handleDelete(f)">×</text>
        </view>
      </view>
    </view>

    <view class="empty" v-if="!loading && list.length === 0">
      <text class="empty-text">暂无设施</text>
    </view>

    <!-- 编辑弹窗 -->
    <view class="modal-mask" v-if="formVisible" @tap="formVisible = false">
      <view class="modal" @tap.stop>
        <text class="modal-title">{{ editingId ? '编辑设施' : '新增设施' }}</text>
        <view class="form-group">
          <text class="label">名称</text>
          <input class="input" v-model="form.name" placeholder="设施名称" />
        </view>
        <view class="form-group">
          <text class="label">分类</text>
          <picker :value="catIndex" :range="categories" @change="(e: any) => { catIndex = e.detail.value; form.category = categories[e.detail.value]; }">
            <text class="picker-text">{{ form.category || '选择分类' }}</text>
          </picker>
        </view>
        <view class="form-group">
          <text class="label">图标</text>
          <input class="input" v-model="form.icon" placeholder="如: wifi, pool" />
        </view>
        <button class="save-btn" @tap="handleSave">保存</button>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import { getAdminFacilities, createFacility, updateFacility, deleteFacility } from '../../../api/admin';

const list = ref<any[]>([]);
const loading = ref(false);
const formVisible = ref(false);
const editingId = ref(0);
const catIndex = ref(0);
const categories = ['娱乐', '餐饮', '运动', '基础'];

const form = reactive({ name: '', category: '', icon: '' });

const groupedList = computed(() => {
  const groups: Record<string, any[]> = {};
  list.value.forEach((f) => {
    const cat = f.category || '其他';
    if (!groups[cat]) groups[cat] = [];
    groups[cat].push(f);
  });
  return Object.entries(groups).map(([name, items]) => ({ name, items }));
});

onShow(() => loadData());

async function loadData() {
  loading.value = true;
  try { list.value = await getAdminFacilities() || []; }
  catch (e) { console.error(e); }
  finally { loading.value = false; }
}

function showForm(item?: any) {
  if (item) {
    editingId.value = item.id;
    Object.assign(form, { name: item.name, category: item.category || '', icon: item.icon || '' });
    catIndex.value = Math.max(0, categories.indexOf(item.category));
  } else {
    editingId.value = 0;
    Object.assign(form, { name: '', category: '', icon: '' });
  }
  formVisible.value = true;
}

async function handleSave() {
  if (!form.name) { uni.showToast({ title: '请填写名称', icon: 'none' }); return; }
  try {
    if (editingId.value) await updateFacility(editingId.value, form);
    else await createFacility(form);
    uni.showToast({ title: '保存成功', icon: 'success' });
    formVisible.value = false;
    loadData();
  } catch (e) { console.error(e); }
}

function handleDelete(item: any) {
  uni.showModal({
    title: '提示', content: `确认删除「${item.name}」？`,
    success: async (res) => { if (res.confirm) { await deleteFacility(item.id); loadData(); } },
  });
}
</script>

<style lang="scss">
.page { background: #f5f5f5; min-height: 100vh; }
.toolbar { display: flex; justify-content: space-between; align-items: center; padding: 20rpx 24rpx; background: #fff; }
.title { font-size: 32rpx; font-weight: bold; }
.add-btn { background: #409EFF; color: #fff; padding: 10rpx 28rpx; border-radius: 24rpx; font-size: 26rpx; }
.cat-section { margin: 24rpx; }
.cat-title { font-size: 28rpx; font-weight: bold; color: #333; display: block; margin-bottom: 16rpx; }
.facility-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16rpx; }
.facility-item {
  background: #fff; border-radius: 12rpx; padding: 24rpx 16rpx;
  display: flex; flex-direction: column; align-items: center; position: relative;
}
.facility-icon { font-size: 40rpx; }
.facility-name { font-size: 24rpx; color: #333; margin-top: 8rpx; }
.del-btn { position: absolute; top: 4rpx; right: 8rpx; font-size: 32rpx; color: #ccc; }
.empty { padding: 200rpx 0; text-align: center; }
.empty-text { color: #999; }
.modal-mask { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); z-index: 999; display: flex; align-items: flex-end; }
.modal { width: 100%; background: #fff; border-radius: 24rpx 24rpx 0 0; padding: 40rpx 30rpx; }
.modal-title { font-size: 32rpx; font-weight: bold; text-align: center; margin-bottom: 30rpx; display: block; }
.form-group { margin-bottom: 24rpx; }
.label { font-size: 26rpx; color: #666; display: block; margin-bottom: 10rpx; }
.input { width: 100%; height: 80rpx; background: #f5f7fa; border-radius: 12rpx; padding: 0 20rpx; font-size: 28rpx; box-sizing: border-box; }
.picker-text { display: block; height: 80rpx; line-height: 80rpx; background: #f5f7fa; border-radius: 12rpx; padding: 0 20rpx; font-size: 28rpx; }
.save-btn { width: 100%; height: 80rpx; line-height: 80rpx; background: #409EFF; color: #fff; font-size: 30rpx; border: none; border-radius: 40rpx; margin-top: 20rpx; }
.save-btn::after { border: none; }
</style>
