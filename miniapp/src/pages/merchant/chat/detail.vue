<template>
  <view class="page">
    <scroll-view class="msg-scroll" scroll-y :scroll-top="scrollTop" :scroll-with-animation="true">
      <view class="msg-list">
        <view
          class="msg-row"
          v-for="msg in messages"
          :key="msg.id"
          :class="msg.senderType === 'merchant' ? 'mine' : 'other'"
        >
          <view class="bubble">
            <text class="bubble-text" v-if="msg.type === 'text'">{{ msg.content }}</text>
            <image v-else class="bubble-img" :src="resolveImg(msg.content)" mode="widthFix" @tap="previewImg(msg.content)" />
          </view>
        </view>
      </view>
    </scroll-view>

    <scroll-view class="faq-bar" scroll-x v-if="faqList.length">
      <view class="faq-chip" v-for="(f, i) in faqList" :key="i" @tap="useFaq(f)">{{ f }}</view>
    </scroll-view>

    <view class="input-bar">
      <input class="input" v-model="draft" placeholder="输入回复…" confirm-type="send" @confirm="handleSend" />
      <view class="send-btn" :class="{ active: draft.trim() }" @tap="handleSend">发送</view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, nextTick } from 'vue';
import { onLoad, onUnload } from '@dcloudio/uni-app';
import { getAdminChatMessages, sendAdminChatMessage, getAdminChatFaq } from '../../../api/admin';
import { resolveImageUrl } from '../../../utils/request';

const resolveImg = resolveImageUrl;
const chatId = ref(0);
const messages = ref<any[]>([]);
const faqList = ref<string[]>([]);
const draft = ref('');
const scrollTop = ref(0);
let timer: any = null;

onLoad((q: any) => {
  chatId.value = Number(q.id);
  if (q.name) uni.setNavigationBarTitle({ title: decodeURIComponent(q.name) });
  init();
  timer = setInterval(loadMessages, 5000);
});

onUnload(() => { if (timer) clearInterval(timer); });

async function init() {
  await loadMessages();
  try {
    const res = await getAdminChatFaq();
    faqList.value = res.list;
  } catch (e) { console.error(e); }
}

async function loadMessages() {
  try {
    const res = await getAdminChatMessages(chatId.value);
    const prevLen = messages.value.length;
    messages.value = res.list;
    if (messages.value.length !== prevLen) scrollToBottom();
  } catch (e) { console.error(e); }
}

function scrollToBottom() {
  nextTick(() => { scrollTop.value = 999999 + Math.random(); });
}

function useFaq(text: string) {
  draft.value = text;
}

async function handleSend() {
  const content = draft.value.trim();
  if (!content) return;
  draft.value = '';
  try {
    const msg = await sendAdminChatMessage(chatId.value, content);
    messages.value.push(msg);
    scrollToBottom();
  } catch (e) {
    uni.showToast({ title: '发送失败', icon: 'none' });
  }
}

function previewImg(url: string) {
  uni.previewImage({ urls: [resolveImg(url)] });
}
</script>

<style lang="scss">
.page { display: flex; flex-direction: column; height: 100vh; background: #f5f5f5; }
.msg-scroll { flex: 1; overflow: hidden; }
.msg-list { padding: 24rpx; }

.msg-row { display: flex; margin-bottom: 24rpx; }
.msg-row.mine { justify-content: flex-end; }
.msg-row.other { justify-content: flex-start; }
.bubble {
  max-width: 70%; padding: 18rpx 24rpx; border-radius: 16rpx;
  font-size: 28rpx; line-height: 1.5; word-break: break-all;
}
.msg-row.mine .bubble { background: #409EFF; color: #fff; }
.msg-row.other .bubble { background: #fff; color: #333; }
.bubble-text { white-space: pre-wrap; }
.bubble-img { width: 300rpx; border-radius: 8rpx; display: block; }

.faq-bar { white-space: nowrap; background: #fff; padding: 16rpx 20rpx; border-top: 1rpx solid #f0f0f0; }
.faq-chip {
  display: inline-block; padding: 12rpx 24rpx; margin-right: 16rpx;
  background: #f0f7ff; color: #409EFF; border-radius: 30rpx; font-size: 24rpx;
}

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
.send-btn {
  height: 72rpx; line-height: 72rpx; padding: 0 32rpx;
  background: #ddd; color: #fff; border-radius: 36rpx; font-size: 28rpx;
}
.send-btn.active { background: #409EFF; }
</style>
