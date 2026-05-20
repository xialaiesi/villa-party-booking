<template>
  <view class="page">
    <!-- 顶部标题栏 -->
    <view class="header">
      <text class="title">种草笔记</text>
      <view class="header-right">
        <view class="style-tabs">
          <text
            v-for="tab in styleTabs"
            :key="tab.value"
            class="tab"
            :class="{ active: currentStyle === tab.value }"
            @tap="switchStyle(tab.value)"
          >{{ tab.label }}</text>
        </view>
      </view>
    </view>

    <!-- 瀑布流 -->
    <view class="waterfall">
      <view class="column">
        <view
          class="note-card"
          v-for="note in leftColumn"
          :key="note.id"
          @tap="goDetail(note.id)"
        >
          <image :src="resolveImg(note.coverImage)" class="cover" mode="widthFix" />
          <view class="note-info">
            <text class="note-title">{{ note.title }}</text>
            <view class="note-bottom">
              <view class="note-author">
                <image :src="note.user?.avatar || '/static/default-avatar.png'" class="author-avatar" />
                <text class="author-name">{{ note.user?.nickname || '商家推荐' }}</text>
              </view>
              <view class="note-like">
                <text class="like-icon">&#x2764;</text>
                <text class="like-count">{{ note.likeCount }}</text>
              </view>
            </view>
          </view>
          <view class="merchant-badge" v-if="note.merchantId && !note.userId">商家推荐</view>
        </view>
      </view>
      <view class="column">
        <view
          class="note-card"
          v-for="note in rightColumn"
          :key="note.id"
          @tap="goDetail(note.id)"
        >
          <image :src="resolveImg(note.coverImage)" class="cover" mode="widthFix" />
          <view class="note-info">
            <text class="note-title">{{ note.title }}</text>
            <view class="note-bottom">
              <view class="note-author">
                <image :src="note.user?.avatar || '/static/default-avatar.png'" class="author-avatar" />
                <text class="author-name">{{ note.user?.nickname || '商家推荐' }}</text>
              </view>
              <view class="note-like">
                <text class="like-icon">&#x2764;</text>
                <text class="like-count">{{ note.likeCount }}</text>
              </view>
            </view>
          </view>
          <view class="merchant-badge" v-if="note.merchantId && !note.userId">商家推荐</view>
        </view>
      </view>
    </view>

    <!-- 加载状态 -->
    <view class="load-more" v-if="loading"><text>加载中...</text></view>
    <view class="load-more" v-else-if="noMore"><text>没有更多了</text></view>
    <view v-if="!loading && !notes.length" class="empty"><text>还没有种草笔记</text></view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { onShow, onReachBottom } from '@dcloudio/uni-app';
import { getXhsNoteFeed } from '../../api/xhs-note';
import { resolveImageUrl } from '../../utils/request';

const resolveImg = resolveImageUrl;

const notes = ref<any[]>([]);
const page = ref(1);
const loading = ref(false);
const noMore = ref(false);
const currentStyle = ref('');

const styleTabs = [
  { label: '全部', value: '' },
  { label: '种草', value: 'plant' },
  { label: '攻略', value: 'guide' },
  { label: '场景', value: 'scene' },
];

// 瀑布流：交替分配左右列
const leftColumn = computed(() => notes.value.filter((_, i) => i % 2 === 0));
const rightColumn = computed(() => notes.value.filter((_, i) => i % 2 === 1));

async function loadNotes(reset = false) {
  if (loading.value) return;
  if (!reset && noMore.value) return;
  if (reset) {
    page.value = 1;
    noMore.value = false;
  }
  loading.value = true;
  try {
    const res = await getXhsNoteFeed({
      page: page.value,
      pageSize: 10,
      style: currentStyle.value || undefined,
    });
    if (reset) {
      notes.value = res.list;
    } else {
      notes.value.push(...res.list);
    }
    if (res.list.length < 10) noMore.value = true;
    page.value++;
  } finally {
    loading.value = false;
  }
}

function switchStyle(style: string) {
  currentStyle.value = style;
  loadNotes(true);
}

function goDetail(id: number) {
  uni.navigateTo({ url: `/pages/xhs-note/detail?id=${id}` });
}

onShow(() => { loadNotes(true); });
onReachBottom(() => { loadNotes(); });
</script>

<style lang="scss">
.page { background: #f5f5f5; min-height: 100vh; }

.header {
  display: flex; justify-content: space-between; align-items: center;
  background: #fff; padding: 20rpx 24rpx; position: sticky; top: 0; z-index: 10;
}
.title { font-size: 36rpx; font-weight: bold; color: #333; }
.style-tabs { display: flex; gap: 16rpx; }
.tab {
  font-size: 24rpx; color: #999; padding: 6rpx 20rpx; border-radius: 20rpx;
  &.active { background: #ff6b35; color: #fff; }
}

.waterfall { display: flex; gap: 12rpx; padding: 12rpx; }
.column { flex: 1; display: flex; flex-direction: column; gap: 12rpx; }

.note-card {
  background: #fff; border-radius: 12rpx; overflow: hidden; position: relative;
}
.cover { width: 100%; display: block; }
.note-info { padding: 16rpx; }
.note-title {
  font-size: 26rpx; font-weight: bold; color: #333; line-height: 1.4;
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
}
.note-bottom {
  display: flex; justify-content: space-between; align-items: center; margin-top: 12rpx;
}
.note-author { display: flex; align-items: center; gap: 8rpx; flex: 1; overflow: hidden; }
.author-avatar { width: 36rpx; height: 36rpx; border-radius: 50%; flex-shrink: 0; }
.author-name {
  font-size: 20rpx; color: #999; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.note-like { display: flex; align-items: center; gap: 4rpx; flex-shrink: 0; }
.like-icon { font-size: 22rpx; color: #ccc; }
.like-count { font-size: 20rpx; color: #999; }

.merchant-badge {
  position: absolute; top: 12rpx; left: 12rpx;
  background: rgba(255, 107, 53, 0.9); color: #fff;
  font-size: 18rpx; padding: 4rpx 12rpx; border-radius: 4rpx;
}

.load-more { text-align: center; padding: 30rpx; color: #999; font-size: 24rpx; }
.empty { text-align: center; padding: 200rpx 0; color: #999; font-size: 28rpx; }
</style>
