<template>
  <view class="page">
    <view class="toolbar">
      <view class="status-tabs">
        <text class="tab" :class="{active: statusFilter === -1}" @tap="setStatus(-1)">全部</text>
        <text class="tab" :class="{active: statusFilter === 1}" @tap="setStatus(1)">上架</text>
        <text class="tab" :class="{active: statusFilter === 0}" @tap="setStatus(0)">下架</text>
      </view>
      <view class="add-btn" @tap="goAdd">+ 新增</view>
    </view>

    <view class="villa-list">
      <view class="villa-card" v-for="v in list" :key="v.id">
        <image class="villa-cover" :src="resolveImg(v.coverImage)" mode="aspectFill" />
        <view class="villa-body">
          <view class="villa-top">
            <text class="villa-name">{{ v.name }}</text>
            <text class="status-tag" :class="v.status === 1 ? 'on' : 'off'">
              {{ v.status === 1 ? '上架' : '下架' }}
            </text>
          </view>
          <text class="villa-info">{{ v.bedrooms }}室 · {{ v.maxGuests }}人 · {{ v.area }}㎡</text>
          <text class="villa-price">¥{{ v.basePrice }}/晚</text>
          <view class="villa-actions">
            <text class="action-btn" @tap="goEdit(v.id)">编辑</text>
            <text class="action-btn" @tap="goCalendar(v.id)">房态</text>
            <text class="action-btn" :class="v.status === 1 ? 'danger' : 'success'" @tap="toggleStatus(v)">
              {{ v.status === 1 ? '下架' : '上架' }}
            </text>
          </view>
        </view>
      </view>
    </view>

    <view class="empty" v-if="!loading && list.length === 0">
      <text class="empty-text">暂无房源</text>
    </view>

    <view class="load-more" v-if="hasMore" @tap="loadMore">
      <text>加载更多...</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import { getAdminVillas, updateVillaStatus } from '../../../api/admin';
import { resolveImageUrl } from '../../../utils/request';

const resolveImg = resolveImageUrl;
const list = ref<any[]>([]);
const loading = ref(false);
const statusFilter = ref(-1);
const page = ref(1);
const hasMore = ref(false);

async function loadData(reset = true) {
  if (reset) {
    page.value = 1;
    list.value = [];
  }
  loading.value = true;
  try {
    const params: any = { page: page.value, pageSize: 20 };
    if (statusFilter.value !== -1) params.status = statusFilter.value;
    const data = await getAdminVillas(params);
    const items = data.list || data;
    if (reset) list.value = items;
    else list.value = [...list.value, ...items];
    hasMore.value = items.length === 20;
  } catch (e) { console.error(e); }
  finally { loading.value = false; }
}

function setStatus(s: number) {
  statusFilter.value = s;
  loadData();
}

function loadMore() {
  page.value++;
  loadData(false);
}

async function toggleStatus(v: any) {
  const newStatus = v.status === 1 ? 0 : 1;
  const action = newStatus === 1 ? '上架' : '下架';
  uni.showModal({
    title: '提示',
    content: `确认${action}「${v.name}」？`,
    success: async (res) => {
      if (res.confirm) {
        await updateVillaStatus(v.id, newStatus);
        uni.showToast({ title: `已${action}`, icon: 'success' });
        loadData();
      }
    },
  });
}

function goAdd() {
  uni.navigateTo({ url: '/pages/merchant/villa-edit/index' });
}

function goEdit(id: number) {
  uni.navigateTo({ url: `/pages/merchant/villa-edit/index?id=${id}` });
}

function goCalendar(id: number) {
  uni.navigateTo({ url: `/pages/merchant/calendar/index?villaId=${id}` });
}

onShow(() => loadData());
</script>

<style lang="scss">
.page { background: #f5f5f5; min-height: 100vh; }

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20rpx 24rpx;
  background: #fff;
}
.status-tabs { display: flex; gap: 24rpx; }
.tab {
  font-size: 28rpx; color: #666;
  padding: 8rpx 24rpx;
  border-radius: 24rpx;
}
.tab.active { background: #409EFF; color: #fff; }
.add-btn {
  background: #409EFF; color: #fff;
  padding: 10rpx 28rpx; border-radius: 24rpx;
  font-size: 26rpx;
}

.villa-list { padding: 20rpx 24rpx; }
.villa-card {
  background: #fff;
  border-radius: 16rpx;
  overflow: hidden;
  margin-bottom: 20rpx;
  display: flex;
}
.villa-cover { width: 240rpx; height: 240rpx; flex-shrink: 0; }
.villa-body { flex: 1; padding: 20rpx; display: flex; flex-direction: column; justify-content: space-between; }
.villa-top { display: flex; justify-content: space-between; align-items: center; }
.villa-name { font-size: 30rpx; font-weight: bold; color: #333; flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.status-tag {
  font-size: 20rpx; padding: 4rpx 16rpx; border-radius: 8rpx; flex-shrink: 0; margin-left: 12rpx;
}
.status-tag.on { background: rgba(103,194,58,0.1); color: #67C23A; }
.status-tag.off { background: rgba(144,147,153,0.1); color: #909399; }
.villa-info { font-size: 24rpx; color: #999; margin-top: 8rpx; }
.villa-price { font-size: 30rpx; color: #FF6B35; font-weight: bold; }
.villa-actions { display: flex; gap: 16rpx; margin-top: 12rpx; }
.action-btn {
  font-size: 24rpx; color: #409EFF;
  padding: 6rpx 20rpx;
  border: 1rpx solid #409EFF;
  border-radius: 20rpx;
}
.action-btn.danger { color: #F56C6C; border-color: #F56C6C; }
.action-btn.success { color: #67C23A; border-color: #67C23A; }

.empty { padding: 200rpx 0; text-align: center; }
.empty-text { color: #999; font-size: 28rpx; }

.load-more { text-align: center; padding: 30rpx; color: #999; font-size: 26rpx; }
</style>
