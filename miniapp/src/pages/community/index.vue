<template>
  <view class="page">
    <view class="header">
      <text class="title">趴友圈</text>
      <view class="post-btn" @tap="goPost">发布</view>
    </view>

    <view class="feed">
      <view class="post-card" v-for="post in posts" :key="post.id" @tap="goDetail(post.id)">
        <view class="post-user">
          <image :src="post.user?.avatar || '/static/default-avatar.png'" class="avatar" />
          <text class="nickname">{{ post.user?.nickname }}</text>
        </view>
        <text class="post-content">{{ post.content }}</text>
        <view class="post-images" v-if="post.images?.length">
          <image v-for="(img, i) in post.images.slice(0, 3)" :key="i" :src="img" class="post-img" mode="aspectFill" />
        </view>
        <view class="post-meta">
          <text class="villa-tag" v-if="post.villa">{{ post.villa.name }}</text>
          <view class="post-stats">
            <text>{{ post.likeCount }} 赞</text>
            <text>{{ post.commentCount }} 评论</text>
          </view>
        </view>
      </view>
    </view>
    <view v-if="!posts.length" class="empty"><text>还没有人分享，快来做第一个吧</text></view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import { getFeed } from '../../api/community';

const posts = ref<any[]>([]);

onShow(async () => {
  const res = await getFeed();
  posts.value = res.list;
});

function goDetail(id: number) { uni.navigateTo({ url: `/pages/community/detail?id=${id}` }); }
function goPost() { uni.navigateTo({ url: '/pages/community/post' }); }
</script>

<style lang="scss">
.page { background: #f5f5f5; min-height: 100vh; }
.header { display: flex; justify-content: space-between; align-items: center; background: #fff; padding: 24rpx 30rpx; }
.title { font-size: 36rpx; font-weight: bold; color: #333; }
.post-btn { background: #ff6b35; color: #fff; padding: 10rpx 28rpx; border-radius: 20rpx; font-size: 26rpx; }
.feed { padding: 20rpx; }
.post-card { background: #fff; border-radius: 12rpx; padding: 24rpx; margin-bottom: 16rpx; }
.post-user { display: flex; align-items: center; gap: 12rpx; margin-bottom: 16rpx; }
.avatar { width: 64rpx; height: 64rpx; border-radius: 50%; }
.nickname { font-size: 26rpx; font-weight: bold; color: #333; }
.post-content { font-size: 28rpx; color: #333; line-height: 1.6; display: block; }
.post-images { display: flex; gap: 8rpx; margin-top: 16rpx; }
.post-img { width: 220rpx; height: 220rpx; border-radius: 8rpx; }
.post-meta { display: flex; justify-content: space-between; align-items: center; margin-top: 16rpx; }
.villa-tag { font-size: 22rpx; color: #ff6b35; background: #fff3ed; padding: 4rpx 16rpx; border-radius: 20rpx; }
.post-stats { display: flex; gap: 20rpx; font-size: 22rpx; color: #999; }
.empty { text-align: center; padding: 200rpx 0; color: #999; }
</style>
