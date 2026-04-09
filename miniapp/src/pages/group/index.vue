<template>
  <view class="page" v-if="group">
    <!-- 别墅信息 -->
    <view class="villa-card">
      <image :src="group.villa?.coverImage" class="villa-img" mode="aspectFill" />
      <view class="villa-info">
        <text class="villa-name">{{ group.villa?.name }}</text>
        <text class="villa-date">{{ group.checkIn }} ~ {{ group.checkOut }}</text>
        <text class="villa-price">原价 ¥{{ group.villa?.basePrice }}/晚</text>
      </view>
    </view>

    <!-- 拼团信息 -->
    <view class="card">
      <view class="discount-banner">
        <text class="discount-text">拼团立减 ¥{{ group.discount }}</text>
      </view>
      <view class="group-progress">
        <text class="progress-text">
          还差 <text class="highlight">{{ group.targetCount - group.currentCount }}</text> 人成团
        </text>
        <text class="expire-text">{{ expireText }}</text>
      </view>

      <!-- 成员头像 -->
      <view class="member-list">
        <view class="member" v-for="m in group.members" :key="m.id">
          <image :src="m.user?.avatar || '/static/default-avatar.png'" class="member-avatar" />
          <text class="member-name">{{ m.user?.nickname }}</text>
        </view>
        <view class="member empty-slot" v-for="i in (group.targetCount - group.currentCount)" :key="'e'+i">
          <view class="empty-avatar">?</view>
          <text class="member-name">等你来</text>
        </view>
      </view>
    </view>

    <!-- 操作 -->
    <view class="bottom-bar">
      <view class="share-btn" @tap="handleShare">分享给朋友</view>
      <view class="join-btn" v-if="!isMember" @tap="handleJoin">
        {{ group.status === 1 ? '已成团' : '立即参团' }}
      </view>
      <view class="join-btn joined" v-else>已参团</view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { getGroup, joinGroup } from '../../api/group-buy';
import { useUserStore } from '../../store/user';

const userStore = useUserStore();
const group = ref<any>(null);

const isMember = computed(() => {
  if (!group.value || !userStore.userInfo) return false;
  return group.value.members?.some((m: any) => m.userId === userStore.userInfo.id);
});

const expireText = computed(() => {
  if (!group.value?.expireAt) return '';
  const diff = new Date(group.value.expireAt).getTime() - Date.now();
  if (diff <= 0) return '已过期';
  const hours = Math.floor(diff / 3600000);
  return `剩余 ${hours} 小时`;
});

onLoad(async (query: any) => {
  group.value = await getGroup(parseInt(query.id));
});

async function handleJoin() {
  if (group.value.status !== 0) return;
  try {
    const res = await joinGroup(group.value.id);
    uni.showToast({ title: res.message, icon: 'success' });
    group.value = await getGroup(group.value.id);
  } catch (e) { console.error(e); }
}

function handleShare() {
  uni.showShareMenu({ withShareTicket: true });
}
</script>

<style lang="scss">
.page { background: #f5f5f5; min-height: 100vh; padding-bottom: 120rpx; }
.villa-card { display: flex; gap: 20rpx; background: #fff; padding: 24rpx; margin: 20rpx; border-radius: 12rpx; }
.villa-img { width: 200rpx; height: 150rpx; border-radius: 8rpx; }
.villa-info { flex: 1; display: flex; flex-direction: column; justify-content: center; }
.villa-name { font-size: 30rpx; font-weight: bold; color: #333; }
.villa-date { font-size: 24rpx; color: #999; margin-top: 6rpx; }
.villa-price { font-size: 24rpx; color: #666; margin-top: 6rpx; }
.card { background: #fff; margin: 0 20rpx 20rpx; padding: 30rpx; border-radius: 12rpx; }
.discount-banner { background: linear-gradient(135deg, #ff6b35, #ff8f65); padding: 20rpx; border-radius: 8rpx; text-align: center; margin-bottom: 24rpx; }
.discount-text { color: #fff; font-size: 36rpx; font-weight: bold; }
.group-progress { text-align: center; margin-bottom: 24rpx; }
.progress-text { font-size: 28rpx; color: #333; }
.highlight { color: #ff6b35; font-weight: bold; font-size: 36rpx; }
.expire-text { font-size: 22rpx; color: #999; display: block; margin-top: 8rpx; }
.member-list { display: flex; justify-content: center; gap: 24rpx; flex-wrap: wrap; }
.member { display: flex; flex-direction: column; align-items: center; }
.member-avatar { width: 80rpx; height: 80rpx; border-radius: 50%; }
.empty-avatar { width: 80rpx; height: 80rpx; border-radius: 50%; background: #f0f0f0; display: flex; align-items: center; justify-content: center; color: #ccc; font-size: 32rpx; border: 2rpx dashed #ddd; }
.member-name { font-size: 20rpx; color: #999; margin-top: 6rpx; }
.bottom-bar { position: fixed; bottom: 0; left: 0; right: 0; background: #fff; display: flex; padding: 20rpx 30rpx; gap: 20rpx; }
.share-btn { flex: 1; text-align: center; padding: 24rpx; border: 1rpx solid #ff6b35; color: #ff6b35; border-radius: 40rpx; font-size: 28rpx; }
.join-btn { flex: 2; text-align: center; padding: 24rpx; background: #ff6b35; color: #fff; border-radius: 40rpx; font-size: 28rpx; font-weight: bold; }
.join-btn.joined { background: #ccc; }
</style>
