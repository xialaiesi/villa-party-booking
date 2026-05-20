<template>
  <view class="page">
    <!-- 图片轮播 -->
    <swiper class="swiper" :indicator-dots="true" indicator-color="rgba(255,255,255,0.5)" indicator-active-color="#fff">
      <swiper-item v-for="(img, i) in allImages" :key="i">
        <image :src="resolveImg(img)" class="swiper-img" mode="aspectFill" @tap="previewImage(i)" />
      </swiper-item>
    </swiper>
    <view class="img-counter">{{ allImages.length }} 张图</view>

    <!-- 笔记内容 -->
    <view class="content-section">
      <view class="author-row">
        <image :src="note.user?.avatar || '/static/default-avatar.png'" class="author-avatar" />
        <view class="author-info">
          <text class="author-name">{{ note.user?.nickname || '商家推荐' }}</text>
          <text class="publish-time">{{ formatTime(note.createdAt) }}</text>
        </view>
        <view class="merchant-badge" v-if="note.merchantId && !note.userId">商家推荐</view>
      </view>

      <text class="note-title">{{ note.title }}</text>
      <text class="note-content">{{ note.content }}</text>

      <!-- 标签 -->
      <view class="tags" v-if="note.tags?.length">
        <text class="tag" v-for="(tag, i) in note.tags" :key="i">#{{ tag }}</text>
      </view>

      <!-- 关联别墅卡片 -->
      <view class="villa-card" v-if="note.villa" @tap="goVilla(note.villa.id)">
        <image :src="resolveImg(note.villa.coverImage)" class="villa-cover" mode="aspectFill" />
        <view class="villa-info">
          <text class="villa-name">{{ note.villa.name }}</text>
          <text class="villa-addr">{{ note.villa.address }}</text>
          <view class="villa-bottom">
            <text class="villa-price" v-if="note.villa.basePrice">
              <text class="price-symbol">&#xA5;</text>{{ note.villa.basePrice }}<text class="price-unit">/晚</text>
            </text>
            <text class="villa-link" v-if="note.villa.status === 1">查看详情 &gt;</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 数据统计 -->
    <view class="stats-row">
      <text class="stat">{{ note.viewCount }} 浏览</text>
      <text class="stat">{{ note.likeCount }} 赞</text>
      <text class="stat">{{ note.collectCount }} 收藏</text>
    </view>

    <!-- 评论区 -->
    <view class="comment-section">
      <text class="section-title">评论 ({{ note.commentCount || 0 }})</text>
      <view class="comment-item" v-for="c in note.comments" :key="c.id">
        <image :src="c.user?.avatar || '/static/default-avatar.png'" class="comment-avatar" />
        <view class="comment-body">
          <text class="comment-name">{{ c.user?.nickname }}</text>
          <text class="comment-text">{{ c.content }}</text>
          <!-- 回复 -->
          <view class="reply-item" v-for="r in c.replies" :key="r.id">
            <text class="reply-text"><text class="reply-name">{{ r.user?.nickname }}</text>: {{ r.content }}</text>
          </view>
        </view>
      </view>
      <view v-if="!note.comments?.length" class="no-comment"><text>暂无评论</text></view>
    </view>

    <!-- 底部操作栏 -->
    <view class="bottom-bar">
      <view class="action-left">
        <input class="comment-input" v-model="commentText" placeholder="说点什么..." />
        <view class="send-btn" @tap="sendComment" v-if="commentText">发送</view>
      </view>
      <view class="action-right">
        <view class="action-btn" @tap="handleLike">
          <text :class="['action-icon', { active: note.liked }]">&#x2764;</text>
          <text class="action-num">{{ note.likeCount }}</text>
        </view>
        <view class="action-btn" @tap="handleCollect">
          <text :class="['action-icon', { active: note.collected }]">&#x2606;</text>
          <text class="action-num">{{ note.collectCount }}</text>
        </view>
        <view class="action-btn copy-btn" @tap="copyToXhs">
          <text class="action-icon">&#x2398;</text>
          <text class="action-num">复制</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { getXhsNote, toggleNoteLike, toggleNoteCollect, addNoteComment } from '../../api/xhs-note';
import { resolveImageUrl } from '../../utils/request';

const resolveImg = resolveImageUrl;

const note = ref<any>({});
const allImages = ref<string[]>([]);
const commentText = ref('');
let noteId = 0;

onLoad((options: any) => {
  noteId = parseInt(options.id);
  loadNote();
});

async function loadNote() {
  const res = await getXhsNote(noteId);
  note.value = res;
  // 合并封面图和内容图
  const imgs: string[] = [];
  if (res.coverImage) imgs.push(res.coverImage);
  if (res.images?.length) {
    res.images.forEach((img: string) => {
      if (img !== res.coverImage) imgs.push(img);
    });
  }
  allImages.value = imgs;
}

function previewImage(index: number) {
  uni.previewImage({
    urls: allImages.value.map((img) => resolveImg(img)),
    current: index,
  });
}

function formatTime(t: string) {
  if (!t) return '';
  const d = new Date(t);
  const m = d.getMonth() + 1;
  const day = d.getDate();
  return `${m}月${day}日`;
}

function goVilla(id: number) {
  uni.navigateTo({ url: `/pages/villa/index?id=${id}` });
}

async function handleLike() {
  const res = await toggleNoteLike(noteId);
  note.value.liked = res.liked;
  note.value.likeCount += res.liked ? 1 : -1;
}

async function handleCollect() {
  const res = await toggleNoteCollect(noteId);
  note.value.collected = res.collected;
  note.value.collectCount += res.collected ? 1 : -1;
}

async function sendComment() {
  if (!commentText.value.trim()) return;
  await addNoteComment(noteId, commentText.value.trim());
  commentText.value = '';
  uni.showToast({ title: '评论成功', icon: 'success' });
  loadNote();
}

/** 一键复制到小红书 */
function copyToXhs() {
  const n = note.value;
  const tags = (n.tags || []).map((t: string) => `#${t}`).join(' ');
  const villaInfo = n.villa ? `\n\n${n.villa.name} | ${n.villa.address}` : '';
  const promo = '\n\n---\n搜索「别墅轰趴」小程序可直接预订';

  const text = `${n.title}\n\n${n.content}${villaInfo}\n\n${tags}${promo}`;

  uni.setClipboardData({
    data: text,
    success: () => {
      uni.showModal({
        title: '已复制到剪贴板',
        content: '文案已复制，是否保存图片到相册？',
        confirmText: '保存图片',
        cancelText: '仅复制文案',
        success: (modalRes) => {
          if (modalRes.confirm) {
            saveImages();
          }
        },
      });
    },
  });
}

/** 批量保存图片到相册 */
function saveImages() {
  let saved = 0;
  const imgs = allImages.value.map((img) => resolveImg(img));
  imgs.forEach((url) => {
    uni.downloadFile({
      url,
      success: (dlRes) => {
        if (dlRes.statusCode === 200) {
          uni.saveImageToPhotosAlbum({
            filePath: dlRes.tempFilePath,
            success: () => {
              saved++;
              if (saved === imgs.length) {
                uni.showToast({ title: `已保存${saved}张图片`, icon: 'success' });
              }
            },
          });
        }
      },
    });
  });
}
</script>

<style lang="scss">
.page { background: #fff; min-height: 100vh; padding-bottom: 120rpx; }

.swiper { width: 100%; height: 750rpx; }
.swiper-img { width: 100%; height: 100%; }
.img-counter {
  position: absolute; top: 700rpx; right: 24rpx;
  background: rgba(0,0,0,0.5); color: #fff; font-size: 22rpx;
  padding: 4rpx 16rpx; border-radius: 20rpx;
}

.content-section { padding: 24rpx; }
.author-row { display: flex; align-items: center; gap: 12rpx; margin-bottom: 20rpx; }
.author-avatar { width: 72rpx; height: 72rpx; border-radius: 50%; }
.author-info { flex: 1; }
.author-name { font-size: 28rpx; font-weight: bold; color: #333; display: block; }
.publish-time { font-size: 22rpx; color: #999; display: block; margin-top: 4rpx; }
.merchant-badge {
  background: #ff6b35; color: #fff; font-size: 20rpx;
  padding: 6rpx 16rpx; border-radius: 4rpx;
}

.note-title {
  font-size: 34rpx; font-weight: bold; color: #333; line-height: 1.5;
  display: block; margin-bottom: 16rpx;
}
.note-content {
  font-size: 28rpx; color: #555; line-height: 1.8; display: block; white-space: pre-wrap;
}

.tags { display: flex; flex-wrap: wrap; gap: 12rpx; margin-top: 20rpx; }
.tag {
  font-size: 24rpx; color: #ff6b35; background: #fff3ed;
  padding: 6rpx 16rpx; border-radius: 20rpx;
}

/* 别墅卡片 */
.villa-card {
  display: flex; gap: 16rpx; margin-top: 24rpx;
  background: #f9f9f9; border-radius: 12rpx; padding: 16rpx; overflow: hidden;
}
.villa-cover { width: 180rpx; height: 140rpx; border-radius: 8rpx; flex-shrink: 0; }
.villa-info { flex: 1; display: flex; flex-direction: column; justify-content: space-between; }
.villa-name { font-size: 28rpx; font-weight: bold; color: #333; }
.villa-addr { font-size: 22rpx; color: #999; margin-top: 4rpx; }
.villa-bottom { display: flex; justify-content: space-between; align-items: center; margin-top: 8rpx; }
.villa-price { font-size: 30rpx; color: #ff6b35; font-weight: bold; }
.price-symbol { font-size: 22rpx; }
.price-unit { font-size: 20rpx; color: #999; font-weight: normal; }
.villa-link { font-size: 22rpx; color: #409EFF; }

/* 统计 */
.stats-row {
  display: flex; gap: 30rpx; padding: 16rpx 24rpx;
  border-top: 1rpx solid #f0f0f0; border-bottom: 1rpx solid #f0f0f0;
}
.stat { font-size: 24rpx; color: #999; }

/* 评论 */
.comment-section { padding: 24rpx; }
.section-title { font-size: 30rpx; font-weight: bold; color: #333; display: block; margin-bottom: 20rpx; }
.comment-item { display: flex; gap: 12rpx; margin-bottom: 24rpx; }
.comment-avatar { width: 56rpx; height: 56rpx; border-radius: 50%; flex-shrink: 0; }
.comment-body { flex: 1; }
.comment-name { font-size: 24rpx; color: #999; display: block; margin-bottom: 6rpx; }
.comment-text { font-size: 28rpx; color: #333; line-height: 1.5; display: block; }
.reply-item { margin-top: 12rpx; padding: 10rpx; background: #f5f5f5; border-radius: 8rpx; }
.reply-text { font-size: 26rpx; color: #555; }
.reply-name { color: #409EFF; font-weight: bold; }
.no-comment { text-align: center; padding: 40rpx; color: #ccc; font-size: 26rpx; }

/* 底部操作栏 */
.bottom-bar {
  position: fixed; bottom: 0; left: 0; right: 0;
  display: flex; align-items: center; gap: 16rpx;
  background: #fff; padding: 16rpx 24rpx; padding-bottom: calc(16rpx + env(safe-area-inset-bottom));
  border-top: 1rpx solid #f0f0f0; z-index: 100;
}
.action-left { flex: 1; display: flex; gap: 12rpx; align-items: center; }
.comment-input {
  flex: 1; background: #f5f5f5; border-radius: 30rpx;
  padding: 14rpx 24rpx; font-size: 26rpx;
}
.send-btn {
  background: #ff6b35; color: #fff; padding: 10rpx 24rpx;
  border-radius: 20rpx; font-size: 24rpx; flex-shrink: 0;
}
.action-right { display: flex; gap: 20rpx; flex-shrink: 0; }
.action-btn { display: flex; flex-direction: column; align-items: center; }
.action-icon { font-size: 36rpx; color: #999; &.active { color: #ff6b35; } }
.action-num { font-size: 18rpx; color: #999; }
.copy-btn .action-icon { font-size: 30rpx; }
</style>
