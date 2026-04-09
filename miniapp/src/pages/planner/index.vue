<template>
  <view class="page">
    <view class="chat-area">
      <view class="message" v-for="msg in messages" :key="msg.id || msg.content" :class="msg.role">
        <image v-if="msg.role === 'assistant'" src="/static/logo.png" class="bot-avatar" />
        <view class="bubble">
          <text>{{ msg.content }}</text>
        </view>
      </view>
      <view class="message assistant" v-if="loading">
        <image src="/static/logo.png" class="bot-avatar" />
        <view class="bubble typing">
          <text>策划师思考中...</text>
        </view>
      </view>
    </view>

    <view class="input-bar">
      <input
        v-model="input"
        class="chat-input"
        placeholder="描述你的聚会需求..."
        confirm-type="send"
        @confirm="sendMessage"
      />
      <view class="send-btn" :class="{ disabled: !input || loading }" @tap="sendMessage">
        <text>发送</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue';
import { createSession, chat } from '../../api/ai-planner';

const messages = ref<any[]>([]);
const input = ref('');
const loading = ref(false);
let sessionId = 0;

onMounted(async () => {
  try {
    const res = await createSession();
    sessionId = res.sessionId;
    messages.value = res.messages;
  } catch (e) {
    console.error(e);
  }
});

async function sendMessage() {
  if (!input.value.trim() || loading.value || !sessionId) return;
  const msg = input.value.trim();
  input.value = '';

  messages.value.push({ role: 'user', content: msg });
  loading.value = true;

  await nextTick();
  // scroll to bottom
  uni.pageScrollTo({ scrollTop: 99999, duration: 200 });

  try {
    const res = await chat(sessionId, msg);
    messages.value.push({ role: 'assistant', content: res.reply });

    if (res.recommendation) {
      // AI 给出了推荐，可以跳转
      uni.showModal({
        title: '策划师推荐',
        content: '已为你生成推荐方案，是否查看？',
        success: (r) => {
          if (r.confirm) {
            uni.navigateTo({ url: `/pages/smart/index` });
          }
        },
      });
    }
  } catch (e) {
    messages.value.push({ role: 'assistant', content: '抱歉出了点问题，请重试~' });
  } finally {
    loading.value = false;
    await nextTick();
    uni.pageScrollTo({ scrollTop: 99999, duration: 200 });
  }
}
</script>

<style lang="scss">
.page { background: #f5f5f5; min-height: 100vh; padding-bottom: 120rpx; }
.chat-area { padding: 20rpx; }
.message { display: flex; margin-bottom: 24rpx; gap: 12rpx; }
.message.user { flex-direction: row-reverse; }
.bot-avatar { width: 60rpx; height: 60rpx; border-radius: 50%; flex-shrink: 0; }
.bubble { max-width: 70%; padding: 20rpx 24rpx; border-radius: 16rpx; font-size: 28rpx; line-height: 1.6; }
.message.assistant .bubble { background: #fff; color: #333; border-top-left-radius: 4rpx; }
.message.user .bubble { background: #ff6b35; color: #fff; border-top-right-radius: 4rpx; }
.bubble.typing { color: #999; }
.input-bar { position: fixed; bottom: 0; left: 0; right: 0; background: #fff; display: flex; padding: 16rpx 20rpx; gap: 12rpx; align-items: center; border-top: 1rpx solid #eee; }
.chat-input { flex: 1; background: #f5f5f5; border-radius: 30rpx; padding: 16rpx 24rpx; font-size: 28rpx; }
.send-btn { background: #ff6b35; color: #fff; padding: 16rpx 32rpx; border-radius: 30rpx; font-size: 28rpx; }
.send-btn.disabled { opacity: 0.5; }
</style>
