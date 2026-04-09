<template>
  <view class="page">
    <!-- 相册头部 -->
    <view class="album-header" v-if="album">
      <image :src="album.order?.villa?.coverImage" class="header-bg" mode="aspectFill" />
      <view class="header-overlay">
        <text class="album-title">{{ album.title }}</text>
        <text class="album-date">{{ album.order?.checkIn }}</text>
        <text class="album-count">{{ album.photos?.length || 0 }} 张照片</text>
      </view>
    </view>

    <!-- 照片瀑布流 -->
    <view class="photo-grid" v-if="album?.photos?.length">
      <view class="photo-item" v-for="photo in album.photos" :key="photo.id" @tap="previewPhoto(photo)">
        <image :src="photo.url" mode="aspectFill" class="photo-img" />
        <view class="photo-info" v-if="photo.caption || photo.user">
          <text class="photo-user" v-if="photo.user">{{ photo.user.nickname }}</text>
          <text class="photo-caption" v-if="photo.caption">{{ photo.caption }}</text>
        </view>
      </view>
    </view>

    <view v-if="album && (!album.photos || album.photos.length === 0)" class="empty">
      <text>还没有照片，快来上传吧</text>
    </view>

    <!-- 底部操作 -->
    <view class="bottom-bar" v-if="album">
      <view class="invite-btn" @tap="shareAlbum">
        <text>邀请好友</text>
      </view>
      <view class="upload-btn" @tap="uploadPhoto">
        <text>上传照片</text>
      </view>
    </view>

    <!-- 我的相册列表（无 album 时显示） -->
    <view v-if="!album && albumList.length" class="album-list">
      <text class="section-title">我的聚会回忆</text>
      <view class="album-card" v-for="a in albumList" :key="a.id" @tap="openAlbum(a.id)">
        <image :src="a.order?.villa?.coverImage" class="album-cover" mode="aspectFill" />
        <view class="album-info">
          <text class="album-name">{{ a.title }}</text>
          <text class="album-meta">{{ a.order?.checkIn }} · {{ a.photoCount }}张</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { getAlbum, getAlbumByCode, getMyAlbums, addPhoto } from '../../api/album';

const album = ref<any>(null);
const albumList = ref<any[]>([]);
let albumId = 0;

onLoad(async (query: any) => {
  if (query?.id) {
    albumId = parseInt(query.id);
    album.value = await getAlbum(albumId);
  } else if (query?.code) {
    album.value = await getAlbumByCode(query.code);
    albumId = album.value.id;
  } else {
    // 展示我的相册列表
    albumList.value = await getMyAlbums();
  }
});

function openAlbum(id: number) {
  albumId = id;
  uni.navigateTo({ url: `/pages/album/index?id=${id}` });
}

function previewPhoto(photo: any) {
  const urls = album.value.photos.map((p: any) => p.url);
  uni.previewImage({ urls, current: photo.url });
}

function uploadPhoto() {
  uni.chooseImage({
    count: 9,
    success: async (res) => {
      for (const path of res.tempFilePaths) {
        // TODO: 上传到 COS/OSS 获取 URL，这里暂用本地路径模拟
        try {
          await addPhoto(albumId, { url: path });
        } catch (e) {
          console.error(e);
        }
      }
      // 刷新
      album.value = await getAlbum(albumId);
      uni.showToast({ title: '上传成功', icon: 'success' });
    },
  });
}

function shareAlbum() {
  if (!album.value) return;
  uni.showModal({
    title: '邀请码',
    content: `分享邀请码给朋友：${album.value.inviteCode}`,
    showCancel: false,
  });
}
</script>

<style lang="scss">
.page { background: #f5f5f5; min-height: 100vh; padding-bottom: 120rpx; }
.album-header { position: relative; height: 400rpx; }
.header-bg { width: 100%; height: 100%; }
.header-overlay { position: absolute; bottom: 0; left: 0; right: 0; padding: 30rpx; background: linear-gradient(transparent, rgba(0,0,0,0.7)); }
.album-title { font-size: 36rpx; font-weight: bold; color: #fff; display: block; }
.album-date, .album-count { font-size: 24rpx; color: rgba(255,255,255,0.8); display: block; margin-top: 4rpx; }
.photo-grid { display: flex; flex-wrap: wrap; padding: 10rpx; gap: 10rpx; }
.photo-item { width: calc(33.33% - 8rpx); position: relative; }
.photo-img { width: 100%; height: 240rpx; border-radius: 8rpx; }
.photo-info { position: absolute; bottom: 0; left: 0; right: 0; padding: 8rpx 12rpx; background: linear-gradient(transparent, rgba(0,0,0,0.5)); border-radius: 0 0 8rpx 8rpx; }
.photo-user { font-size: 20rpx; color: #fff; display: block; }
.photo-caption { font-size: 18rpx; color: rgba(255,255,255,0.8); }
.empty { text-align: center; padding: 100rpx 0; color: #999; }
.bottom-bar { position: fixed; bottom: 0; left: 0; right: 0; background: #fff; display: flex; padding: 20rpx 30rpx; gap: 20rpx; }
.invite-btn { flex: 1; text-align: center; padding: 24rpx; border: 1rpx solid #ff6b35; color: #ff6b35; border-radius: 40rpx; font-size: 28rpx; }
.upload-btn { flex: 2; text-align: center; padding: 24rpx; background: #ff6b35; color: #fff; border-radius: 40rpx; font-size: 28rpx; font-weight: bold; }
.section-title { font-size: 32rpx; font-weight: bold; color: #333; display: block; padding: 20rpx; }
.album-list { padding: 0 20rpx; }
.album-card { display: flex; background: #fff; border-radius: 12rpx; overflow: hidden; margin-bottom: 16rpx; }
.album-cover { width: 200rpx; height: 150rpx; }
.album-info { flex: 1; padding: 20rpx; display: flex; flex-direction: column; justify-content: center; }
.album-name { font-size: 28rpx; font-weight: bold; color: #333; }
.album-meta { font-size: 24rpx; color: #999; margin-top: 8rpx; }
</style>
