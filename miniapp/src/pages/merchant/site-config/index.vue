<template>
  <view class="page">
    <text class="page-title">站点配置</text>

    <view class="card">
      <text class="card-title">首页 Hero 区域</text>
      <view class="form-group">
        <text class="label">主标题</text>
        <input class="input" v-model="config.heroTitle" placeholder="如: 别墅轰趴" />
      </view>
      <view class="form-group">
        <text class="label">副标题</text>
        <input class="input" v-model="config.heroSubtitle" placeholder="副标题文案" />
      </view>
    </view>

    <view class="card">
      <text class="card-title">场景标签</text>
      <view class="form-group">
        <text class="label">标签(逗号分隔)</text>
        <textarea class="textarea" v-model="config.sceneTags" placeholder="如: 团建,生日派对,轰趴,亲子" />
      </view>
    </view>

    <view class="card">
      <text class="card-title">平台设置</text>
      <view class="form-group">
        <text class="label">客服电话</text>
        <input class="input" v-model="config.contactPhone" placeholder="客服电话" />
      </view>
      <view class="form-group">
        <text class="label">公告信息</text>
        <textarea class="textarea" v-model="config.announcement" placeholder="首页公告(选填)" />
      </view>
    </view>

    <view class="card">
      <text class="card-title">派对公约</text>
      <view class="form-group">
        <text class="label">入住前客户需阅读并签署的公约（每行一条）</text>
        <textarea class="textarea tall" v-model="config.party_pact" placeholder="噪音管理、人数上限、安全责任等" />
      </view>
    </view>

    <button class="save-btn" @tap="handleSave">保存配置</button>
  </view>
</template>

<script setup lang="ts">
import { reactive } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { getAdminSiteConfig, saveAdminSiteConfig } from '../../../api/admin';

const config = reactive({
  heroTitle: '',
  heroSubtitle: '',
  sceneTags: '',
  contactPhone: '',
  announcement: '',
  party_pact: '',
});

onLoad(async () => {
  try {
    const data = await getAdminSiteConfig();
    if (data) Object.assign(config, data);
  } catch (e) { console.error(e); }
});

async function handleSave() {
  try {
    await saveAdminSiteConfig(config);
    uni.showToast({ title: '保存成功', icon: 'success' });
  } catch (e) { console.error(e); }
}
</script>

<style lang="scss">
.page { background: #f5f5f5; min-height: 100vh; padding: 24rpx; padding-bottom: 160rpx; }
.page-title { font-size: 32rpx; font-weight: bold; display: block; margin-bottom: 24rpx; }
.card { background: #fff; border-radius: 16rpx; padding: 24rpx; margin-bottom: 24rpx; }
.card-title { font-size: 28rpx; font-weight: bold; color: #333; display: block; margin-bottom: 20rpx; }
.form-group { margin-bottom: 20rpx; }
.label { font-size: 26rpx; color: #666; display: block; margin-bottom: 10rpx; }
.input { width: 100%; height: 80rpx; background: #f5f7fa; border-radius: 12rpx; padding: 0 20rpx; font-size: 28rpx; box-sizing: border-box; }
.textarea { width: 100%; height: 140rpx; background: #f5f7fa; border-radius: 12rpx; padding: 20rpx; font-size: 28rpx; box-sizing: border-box; }
.textarea.tall { height: 280rpx; }
.save-btn {
  position: fixed; bottom: 40rpx; left: 24rpx; right: 24rpx;
  height: 88rpx; line-height: 88rpx;
  background: linear-gradient(135deg, #409EFF, #66b1ff);
  color: #fff; font-size: 32rpx; border: none; border-radius: 44rpx;
}
.save-btn::after { border: none; }
</style>
