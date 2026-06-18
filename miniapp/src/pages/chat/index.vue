<template>
  <view class="page">
    <scroll-view class="msg-scroll" scroll-y :scroll-top="scrollTop" :scroll-with-animation="true">
      <view class="msg-list">
        <view class="tip" v-if="chatInfo">{{ chatInfo.villaName }} · 专属管家为您服务</view>
        <view
          class="msg-row"
          v-for="msg in messages"
          :key="msg.id"
          :class="msg.senderType === 'user' ? 'mine' : 'other'"
        >
          <view class="bubble">
            <text class="bubble-text" v-if="msg.type === 'text'">{{ msg.content }}</text>
            <image v-else class="bubble-img" :src="resolveImg(msg.content)" mode="widthFix" @tap="previewImg(msg.content)" />
          </view>
        </view>
      </view>
    </scroll-view>

    <view class="input-bar">
      <input
        class="input"
        v-model="draft"
        placeholder="输入消息…"
        confirm-type="send"
        @confirm="handleSend"
      />
      <view class="img-btn" @tap="handlePickImage">图</view>
      <view class="send-btn" :class="{ active: draft.trim() }" @tap="handleSend">发送</view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, nextTick } from 'vue';
import { onLoad, onUnload } from '@dcloudio/uni-app';
import { getOrderChat, getChatMessages, sendChatMessage } from '../../api/chat';
import { resolveImageUrl } from '../../utils/request';
import { uploadImage } from '../../api/upload';

const resolveImg = resolveImageUrl;

const orderId = ref(0);
const chatInfo = ref<any>(null);
const messages = ref<any[]>([]);
const draft = ref('');
const scrollTop = ref(0);
let timer: any = null;

onLoad((q: any) => {
  orderId.value = Number(q.orderId);
  init();
  timer = setInterval(loadMessages, 5000);
});

onUnload(() => {
  if (timer) clearInterval(timer);
});

async function init() {
  try {
    chatInfo.value = await getOrderChat(orderId.value);
    await loadMessages();
  } catch (e) {
    console.error(e);
  }
}

async function loadMessages() {
  try {
    const res = await getChatMessages(orderId.value);
    const prevLen = messages.value.length;
    messages.value = res.list;
    if (messages.value.length !== prevLen) scrollToBottom();
  } catch (e) {
    console.error(e);
  }
}

function scrollToBottom() {
  nextTick(() => {
    scrollTop.value = 999999 + Math.random();
  });
}

async function handleSend() {
  const content = draft.value.trim();
  if (!content) return;
  draft.value = '';
  try {
    const msg = await sendChatMessage(orderId.value, content);
    messages.value.push(msg);
    scrollToBottom();
  } catch (e) {
    console.error(e);
    uni.showToast({ title: '发送失败', icon: 'none' });
  }
}

function handlePickImage() {
  uni.chooseImage({
    count: 1,
    success: async (res) => {
      const path = res.tempFilePaths[0];
      try {
        uni.showLoading({ title: '上传中' });
        const url = await uploadImage(path);
        const msg = await sendChatMessage(orderId.value, url, 'image');
        messages.value.push(msg);
        scrollToBottom();
      } catch (e) {
        uni.showToast({ title: '发送失败', icon: 'none' });
      } finally {
        uni.hideLoading();
      }
    },
  });
}

function previewImg(url: string) {
  uni.previewImage({ urls: [resolveImg(url)] });
}
</script>

<style lang="scss">
.page { display: flex; flex-direction: column; height: 100vh; background: #f5f5f5; }
.msg-scroll { flex: 1; overflow: hidden; }
.msg-list { padding: 24rpx; }
.tip { text-align: center; font-size: 22rpx; color: #999; margin-bottom: 24rpx; }

.msg-row { display: flex; margin-bottom: 24rpx; }
.msg-row.mine { justify-content: flex-end; }
.msg-row.other { justify-content: flex-start; }
.bubble {
  max-width: 70%; padding: 18rpx 24rpx; border-radius: 16rpx;
  font-size: 28rpx; line-height: 1.5; word-break: break-all;
}
.msg-row.mine .bubble { background: #ff6b35; color: #fff; }
.msg-row.other .bubble { background: #fff; color: #333; }
.bubble-text { white-space: pre-wrap; }
.bubble-img { width: 300rpx; border-radius: 8rpx; display: block; }

.input-bar {
  display: flex; align-items: center; gap: 16rpx;
  padding: 16rpx 24rpx;
  padding-bottom: calc(16rpx + env(safe-area-inset-bottom));
  background: #fff; box-shadow: 0 -2rpx 10rpx rgba(0,0,0,0.05);
}
.input {
  flex: 1; height: 72rpx; background: #f5f5f5; border-radius: 36rpx;
  padding: 0 28rpx; font-size: 28rpx;
}
.img-btn {
  width: 72rpx; height: 72rpx; line-height: 72rpx; text-align: center;
  background: #f5f5f5; border-radius: 50%; font-size: 26rpx; color: #666;
}
.send-btn {
  height: 72rpx; line-height: 72rpx; padding: 0 32rpx;
  background: #ddd; color: #fff; border-radius: 36rpx; font-size: 28rpx;
}
.send-btn.active { background: #ff6b35; }
</style>
