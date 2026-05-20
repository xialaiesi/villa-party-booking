<template>
  <view class="page">
    <!-- 顶部操作 -->
    <view class="header">
      <text class="title">种草笔记管理</text>
      <view class="add-btn" @tap="goEdit()">发布笔记</view>
    </view>

    <!-- 状态筛选 -->
    <view class="filter-tabs">
      <text
        v-for="tab in statusTabs"
        :key="tab.value"
        class="tab"
        :class="{ active: currentStatus === tab.value }"
        @tap="switchStatus(tab.value)"
      >{{ tab.label }}</text>
    </view>

    <!-- 笔记列表 -->
    <view class="note-list">
      <view class="note-item" v-for="note in notes" :key="note.id">
        <image :src="resolveImg(note.coverImage)" class="note-cover" mode="aspectFill" />
        <view class="note-body">
          <text class="note-title">{{ note.title }}</text>
          <view class="note-meta">
            <text class="note-villa" v-if="note.villa">{{ note.villa.name }}</text>
            <text class="note-status" :class="'status-' + note.status">{{ statusLabel(note.status) }}</text>
          </view>
          <view class="note-stats">
            <text>{{ note.viewCount }} 浏览</text>
            <text>{{ note.likeCount }} 赞</text>
            <text>{{ note.collectCount }} 收藏</text>
            <text>{{ note.commentCount }} 评论</text>
          </view>
          <view class="note-actions">
            <text class="action-link" @tap="goEdit(note.id)">编辑</text>
            <text class="action-link" @tap="toggleStatus(note)">{{ note.status === 1 ? '隐藏' : '发布' }}</text>
            <text class="action-link danger" @tap="handleDelete(note.id)">删除</text>
          </view>
        </view>
      </view>
    </view>

    <view v-if="!notes.length" class="empty"><text>还没有笔记，点击右上角发布</text></view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import { getAdminXhsNotes, updateAdminXhsNote, deleteAdminXhsNote } from '../../../api/xhs-note';
import { resolveImageUrl } from '../../../utils/request';

const resolveImg = resolveImageUrl;

const notes = ref<any[]>([]);
const currentStatus = ref<number | undefined>(undefined);

const statusTabs = [
  { label: '全部', value: undefined as number | undefined },
  { label: '已发布', value: 1 },
  { label: '草稿', value: 0 },
  { label: '已隐藏', value: 2 },
];

function statusLabel(s: number) {
  if (s === 0) return '草稿';
  if (s === 1) return '已发布';
  return '已隐藏';
}

async function loadNotes() {
  const res = await getAdminXhsNotes({
    page: 1,
    pageSize: 50,
    status: currentStatus.value,
  });
  notes.value = res.list;
}

function switchStatus(status: number | undefined) {
  currentStatus.value = status;
  loadNotes();
}

function goEdit(id?: number) {
  const url = id
    ? `/pages/merchant/xhs-note/edit?id=${id}`
    : '/pages/merchant/xhs-note/edit';
  uni.navigateTo({ url });
}

async function toggleStatus(note: any) {
  const newStatus = note.status === 1 ? 2 : 1;
  await updateAdminXhsNote(note.id, { status: newStatus });
  uni.showToast({ title: newStatus === 1 ? '已发布' : '已隐藏', icon: 'success' });
  loadNotes();
}

function handleDelete(id: number) {
  uni.showModal({
    title: '确认删除',
    content: '删除后不可恢复',
    success: async (res) => {
      if (res.confirm) {
        await deleteAdminXhsNote(id);
        uni.showToast({ title: '已删除', icon: 'success' });
        loadNotes();
      }
    },
  });
}

onShow(() => { loadNotes(); });
</script>

<style lang="scss">
.page { background: #f5f5f5; min-height: 100vh; }

.header {
  display: flex; justify-content: space-between; align-items: center;
  background: #fff; padding: 24rpx 30rpx;
}
.title { font-size: 34rpx; font-weight: bold; color: #333; }
.add-btn {
  background: #ff6b35; color: #fff; padding: 12rpx 28rpx;
  border-radius: 8rpx; font-size: 26rpx;
}

.filter-tabs {
  display: flex; gap: 0; background: #fff; padding: 16rpx 24rpx; margin-bottom: 12rpx;
}
.tab {
  flex: 1; text-align: center; font-size: 26rpx; color: #666;
  padding: 10rpx 0; border-bottom: 4rpx solid transparent;
  &.active { color: #ff6b35; border-bottom-color: #ff6b35; font-weight: bold; }
}

.note-list { padding: 0 16rpx; }
.note-item {
  display: flex; gap: 16rpx; background: #fff; border-radius: 12rpx;
  padding: 20rpx; margin-bottom: 12rpx;
}
.note-cover { width: 180rpx; height: 180rpx; border-radius: 8rpx; flex-shrink: 0; }
.note-body { flex: 1; display: flex; flex-direction: column; justify-content: space-between; }
.note-title {
  font-size: 28rpx; font-weight: bold; color: #333; line-height: 1.4;
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
}
.note-meta { display: flex; gap: 12rpx; align-items: center; margin-top: 8rpx; }
.note-villa { font-size: 22rpx; color: #409EFF; background: #ecf5ff; padding: 2rpx 12rpx; border-radius: 4rpx; }
.note-status { font-size: 22rpx; padding: 2rpx 12rpx; border-radius: 4rpx; }
.status-0 { color: #E6A23C; background: #fdf6ec; }
.status-1 { color: #67C23A; background: #f0f9eb; }
.status-2 { color: #909399; background: #f4f4f5; }

.note-stats { display: flex; gap: 16rpx; margin-top: 8rpx; font-size: 22rpx; color: #999; }

.note-actions { display: flex; gap: 24rpx; margin-top: 8rpx; }
.action-link { font-size: 24rpx; color: #409EFF; &.danger { color: #F56C6C; } }

.empty { text-align: center; padding: 200rpx 0; color: #999; font-size: 28rpx; }
</style>
