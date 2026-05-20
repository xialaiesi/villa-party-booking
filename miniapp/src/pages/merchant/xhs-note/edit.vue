<template>
  <view class="page">
    <view class="form">
      <!-- 标题 -->
      <view class="form-item">
        <text class="label">标题 ({{ title.length }}/50)</text>
        <input class="input" v-model="title" placeholder="写一个吸引人的标题" maxlength="50" />
      </view>

      <!-- 正文 -->
      <view class="form-item">
        <text class="label">正文</text>
        <textarea class="textarea" v-model="content" placeholder="分享你的别墅体验..." maxlength="2000" :auto-height="true" />
      </view>

      <!-- 封面图 -->
      <view class="form-item">
        <text class="label">封面图（必传）</text>
        <view class="cover-upload" @tap="chooseCover">
          <image v-if="coverImage" :src="resolveImg(coverImage)" class="cover-preview" mode="aspectFill" />
          <view v-else class="upload-placeholder">
            <text class="upload-icon">+</text>
            <text class="upload-text">选择封面</text>
          </view>
        </view>
      </view>

      <!-- 内容图 -->
      <view class="form-item">
        <text class="label">内容图（最多9张）</text>
        <view class="image-grid">
          <view class="img-item" v-for="(img, i) in images" :key="i">
            <image :src="resolveImg(img)" class="img-preview" mode="aspectFill" />
            <view class="img-remove" @tap="removeImage(i)">x</view>
          </view>
          <view class="img-add" v-if="images.length < 9" @tap="chooseImages">
            <text class="upload-icon">+</text>
          </view>
        </view>
      </view>

      <!-- 关联别墅 -->
      <view class="form-item">
        <text class="label">关联别墅（可选）</text>
        <picker :range="villaOptions" range-key="name" @change="onVillaChange">
          <view class="picker-display">
            {{ selectedVilla ? selectedVilla.name : '选择关联别墅' }}
          </view>
        </picker>
      </view>

      <!-- 风格 -->
      <view class="form-item">
        <text class="label">笔记风格</text>
        <view class="style-tabs">
          <text
            v-for="s in styleOptions"
            :key="s.value"
            class="style-tab"
            :class="{ active: style === s.value }"
            @tap="style = s.value"
          >{{ s.label }}</text>
        </view>
      </view>

      <!-- 标签 -->
      <view class="form-item">
        <text class="label">标签</text>
        <view class="tags-input">
          <view class="tag" v-for="(tag, i) in tags" :key="i">
            <text>#{{ tag }}</text>
            <text class="tag-remove" @tap="removeTag(i)">x</text>
          </view>
          <input class="tag-input" v-model="tagInput" placeholder="输入标签按确认添加" @confirm="addTag" />
        </view>
        <view class="preset-tags">
          <text
            v-for="pt in presetTags"
            :key="pt"
            class="preset-tag"
            @tap="addPresetTag(pt)"
          >#{{ pt }}</text>
        </view>
      </view>
    </view>

    <!-- 底部按钮 -->
    <view class="bottom-btns">
      <view class="btn-draft" @tap="save(0)">存草稿</view>
      <view class="btn-publish" @tap="save(1)">发布</view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { createAdminXhsNote, updateAdminXhsNote, getAdminXhsNotes } from '../../../api/xhs-note';
import { getAdminVillas } from '../../../api/admin';
import { uploadImage } from '../../../api/admin';
import { resolveImageUrl } from '../../../utils/request';

const resolveImg = resolveImageUrl;

const title = ref('');
const content = ref('');
const coverImage = ref('');
const images = ref<string[]>([]);
const tags = ref<string[]>([]);
const tagInput = ref('');
const style = ref('plant');
const villaId = ref<number | undefined>(undefined);
const selectedVilla = ref<any>(null);
const villaOptions = ref<any[]>([]);
let editId: number | undefined;

const styleOptions = [
  { label: '种草安利', value: 'plant' },
  { label: '攻略实用', value: 'guide' },
  { label: '场景沉浸', value: 'scene' },
];

const presetTags = [
  '泳池别墅', '清远别墅', '周末游', '团建', '生日趴',
  '闺蜜旅行', '亲子游', 'KTV别墅', '烧烤别墅', '温泉别墅',
];

onLoad(async (options: any) => {
  // 加载别墅列表
  const villaRes = await getAdminVillas({ pageSize: 100 });
  villaOptions.value = villaRes.list || [];

  // 编辑模式：加载现有笔记
  if (options?.id) {
    editId = parseInt(options.id);
    const res = await getAdminXhsNotes({ page: 1, pageSize: 50 });
    const note = res.list.find((n: any) => n.id === editId);
    if (note) {
      title.value = note.title;
      content.value = note.content;
      coverImage.value = note.coverImage;
      images.value = note.images || [];
      tags.value = note.tags || [];
      style.value = note.style || 'plant';
      if (note.villaId) {
        villaId.value = note.villaId;
        selectedVilla.value = villaOptions.value.find((v: any) => v.id === note.villaId);
      }
    }
  }
});

function onVillaChange(e: any) {
  const idx = parseInt(e.detail.value);
  selectedVilla.value = villaOptions.value[idx];
  villaId.value = selectedVilla.value?.id;
}

async function chooseCover() {
  uni.chooseImage({
    count: 1,
    success: async (res) => {
      const uploaded = await uploadImage(res.tempFilePaths[0]);
      coverImage.value = uploaded.url;
    },
  });
}

async function chooseImages() {
  const remain = 9 - images.value.length;
  uni.chooseImage({
    count: remain,
    success: async (res) => {
      for (const path of res.tempFilePaths) {
        const uploaded = await uploadImage(path);
        images.value.push(uploaded.url);
      }
    },
  });
}

function removeImage(index: number) {
  images.value.splice(index, 1);
}

function addTag() {
  const t = tagInput.value.trim().replace(/^#/, '');
  if (t && !tags.value.includes(t)) {
    tags.value.push(t);
  }
  tagInput.value = '';
}

function addPresetTag(tag: string) {
  if (!tags.value.includes(tag)) {
    tags.value.push(tag);
  }
}

function removeTag(index: number) {
  tags.value.splice(index, 1);
}

async function save(status: number) {
  if (!title.value.trim()) {
    return uni.showToast({ title: '请填写标题', icon: 'none' });
  }
  if (!content.value.trim()) {
    return uni.showToast({ title: '请填写正文', icon: 'none' });
  }
  if (!coverImage.value) {
    return uni.showToast({ title: '请上传封面图', icon: 'none' });
  }

  const data = {
    title: title.value.trim(),
    content: content.value.trim(),
    coverImage: coverImage.value,
    images: images.value,
    tags: tags.value,
    villaId: villaId.value,
    style: style.value,
    status,
  };

  if (editId) {
    await updateAdminXhsNote(editId, data);
  } else {
    await createAdminXhsNote(data);
  }

  uni.showToast({ title: status === 1 ? '发布成功' : '已存草稿', icon: 'success' });
  setTimeout(() => uni.navigateBack(), 500);
}
</script>

<style lang="scss">
.page { background: #f5f5f5; min-height: 100vh; padding-bottom: 140rpx; }

.form { padding: 16rpx; }
.form-item { background: #fff; border-radius: 12rpx; padding: 24rpx; margin-bottom: 12rpx; }
.label { font-size: 26rpx; color: #666; display: block; margin-bottom: 12rpx; }
.input {
  width: 100%; border-bottom: 1rpx solid #eee; padding: 12rpx 0;
  font-size: 30rpx; font-weight: bold;
}
.textarea {
  width: 100%; min-height: 200rpx; font-size: 28rpx; line-height: 1.6;
  padding: 12rpx 0;
}

/* 封面上传 */
.cover-upload { width: 100%; height: 400rpx; border-radius: 8rpx; overflow: hidden; }
.cover-preview { width: 100%; height: 100%; }
.upload-placeholder {
  width: 100%; height: 100%; background: #f0f0f0;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
}
.upload-icon { font-size: 80rpx; color: #ccc; }
.upload-text { font-size: 26rpx; color: #999; margin-top: 8rpx; }

/* 图片网格 */
.image-grid { display: flex; flex-wrap: wrap; gap: 12rpx; }
.img-item { width: 200rpx; height: 200rpx; position: relative; border-radius: 8rpx; overflow: hidden; }
.img-preview { width: 100%; height: 100%; }
.img-remove {
  position: absolute; top: 4rpx; right: 4rpx;
  width: 36rpx; height: 36rpx; background: rgba(0,0,0,0.5);
  color: #fff; font-size: 24rpx; text-align: center; line-height: 36rpx;
  border-radius: 50%;
}
.img-add {
  width: 200rpx; height: 200rpx; background: #f0f0f0; border-radius: 8rpx;
  display: flex; align-items: center; justify-content: center;
}

/* 别墅选择 */
.picker-display {
  padding: 16rpx; background: #f5f5f5; border-radius: 8rpx;
  font-size: 28rpx; color: #333;
}

/* 风格选择 */
.style-tabs { display: flex; gap: 16rpx; }
.style-tab {
  font-size: 26rpx; padding: 10rpx 24rpx; border-radius: 20rpx;
  background: #f5f5f5; color: #666;
  &.active { background: #ff6b35; color: #fff; }
}

/* 标签 */
.tags-input { display: flex; flex-wrap: wrap; gap: 8rpx; align-items: center; }
.tag {
  display: flex; align-items: center; gap: 6rpx;
  background: #fff3ed; color: #ff6b35; font-size: 24rpx;
  padding: 6rpx 16rpx; border-radius: 20rpx;
}
.tag-remove { color: #ff6b35; font-size: 24rpx; }
.tag-input { flex: 1; min-width: 200rpx; font-size: 26rpx; padding: 10rpx 0; }
.preset-tags { display: flex; flex-wrap: wrap; gap: 8rpx; margin-top: 12rpx; }
.preset-tag {
  font-size: 22rpx; color: #999; background: #f5f5f5;
  padding: 6rpx 14rpx; border-radius: 20rpx;
}

/* 底部按钮 */
.bottom-btns {
  position: fixed; bottom: 0; left: 0; right: 0;
  display: flex; gap: 16rpx; padding: 20rpx 24rpx;
  padding-bottom: calc(20rpx + env(safe-area-inset-bottom));
  background: #fff; border-top: 1rpx solid #f0f0f0;
}
.btn-draft {
  flex: 1; text-align: center; padding: 20rpx 0; border-radius: 8rpx;
  background: #f5f5f5; color: #666; font-size: 28rpx;
}
.btn-publish {
  flex: 2; text-align: center; padding: 20rpx 0; border-radius: 8rpx;
  background: #ff6b35; color: #fff; font-size: 28rpx; font-weight: bold;
}
</style>
