<template>
  <view class="page">
    <view class="card">
      <textarea
        v-model="content"
        class="content-input"
        placeholder="分享你的轰趴体验..."
        :maxlength="500"
      />
      <text class="word-count">{{ content.length }}/500</text>
    </view>

    <view class="card">
      <text class="label">添加图片</text>
      <view class="image-grid">
        <view class="image-item" v-for="(img, i) in images" :key="i">
          <image :src="img" mode="aspectFill" class="uploaded-img" />
          <view class="remove-btn" @tap="removeImage(i)">×</view>
        </view>
        <view class="add-btn" @tap="chooseImage" v-if="images.length < 9">
          <text>+</text>
        </view>
      </view>
    </view>

    <view class="card">
      <text class="label">添加话题</text>
      <view class="tag-list">
        <view
          class="tag"
          :class="{ active: tags.includes(t) }"
          v-for="t in presetTags"
          :key="t"
          @tap="toggleTag(t)"
        >#{{ t }}</view>
      </view>
    </view>

    <view class="bottom-bar">
      <view class="submit-btn" :class="{ disabled: !content }" @tap="submit">
        <text>发布</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { createPost } from '../../api/community';

const content = ref('');
const images = ref<string[]>([]);
const tags = ref<string[]>([]);

const presetTags = ['生日趴', '团建', '周末聚会', '毕业趴', '闺蜜趴', '亲子派对'];

function chooseImage() {
  uni.chooseImage({
    count: 9 - images.value.length,
    success: (res) => {
      images.value.push(...res.tempFilePaths);
    },
  });
}

function removeImage(i: number) {
  images.value.splice(i, 1);
}

function toggleTag(t: string) {
  const idx = tags.value.indexOf(t);
  if (idx >= 0) tags.value.splice(idx, 1);
  else tags.value.push(t);
}

async function submit() {
  if (!content.value) {
    uni.showToast({ title: '请输入内容', icon: 'none' });
    return;
  }
  try {
    await createPost({
      content: content.value,
      images: images.value,
      tags: tags.value.join(','),
    } as any);
    uni.showToast({ title: '发布成功', icon: 'success' });
    setTimeout(() => uni.navigateBack(), 1000);
  } catch (e) { console.error(e); }
}
</script>

<style lang="scss">
.page { background: #f5f5f5; min-height: 100vh; padding: 20rpx; padding-bottom: 140rpx; }
.card { background: #fff; border-radius: 12rpx; padding: 30rpx; margin-bottom: 20rpx; }
.content-input { width: 100%; min-height: 200rpx; font-size: 28rpx; }
.word-count { text-align: right; font-size: 22rpx; color: #999; display: block; margin-top: 10rpx; }
.label { font-size: 26rpx; color: #333; font-weight: bold; display: block; margin-bottom: 20rpx; }

.image-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16rpx; }
.image-item { position: relative; width: 100%; aspect-ratio: 1; }
.uploaded-img { width: 100%; height: 100%; border-radius: 8rpx; }
.remove-btn {
  position: absolute; top: -10rpx; right: -10rpx;
  width: 36rpx; height: 36rpx; border-radius: 50%;
  background: rgba(0,0,0,0.7); color: #fff;
  text-align: center; line-height: 36rpx; font-size: 28rpx;
}
.add-btn {
  border: 2rpx dashed #ddd; border-radius: 8rpx;
  display: flex; align-items: center; justify-content: center;
  font-size: 60rpx; color: #ccc; aspect-ratio: 1;
}

.tag-list { display: flex; flex-wrap: wrap; gap: 16rpx; }
.tag {
  padding: 12rpx 24rpx; background: #f5f5f5;
  border-radius: 30rpx; font-size: 24rpx; color: #666;
}
.tag.active { background: #ff6b35; color: #fff; }

.bottom-bar {
  position: fixed; bottom: 0; left: 0; right: 0;
  background: #fff; padding: 20rpx 30rpx;
}
.submit-btn {
  text-align: center; padding: 24rpx;
  background: #ff6b35; color: #fff;
  border-radius: 40rpx; font-size: 30rpx; font-weight: bold;
}
.submit-btn.disabled { opacity: 0.5; }
</style>
