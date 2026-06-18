<template>
  <view class="page">
    <view class="form">
      <view class="form-group">
        <text class="label">别墅名称 *</text>
        <input class="input" v-model="form.name" placeholder="请输入别墅名称" />
      </view>
      <view class="form-group">
        <text class="label">地址 *</text>
        <input class="input" v-model="form.address" placeholder="请输入地址" />
      </view>
      <view class="form-group row">
        <view class="half">
          <text class="label">最大人数</text>
          <input class="input" type="number" v-model="form.maxGuests" placeholder="人数" />
        </view>
        <view class="half">
          <text class="label">卧室数</text>
          <input class="input" type="number" v-model="form.bedrooms" placeholder="卧室" />
        </view>
      </view>
      <view class="form-group row">
        <view class="half">
          <text class="label">面积(㎡)</text>
          <input class="input" type="digit" v-model="form.area" placeholder="面积" />
        </view>
        <view class="half">
          <text class="label">基础价格</text>
          <input class="input" type="digit" v-model="form.basePrice" placeholder="价格" />
        </view>
      </view>
      <view class="form-group row">
        <view class="half">
          <text class="label">周末价格</text>
          <input class="input" type="digit" v-model="form.weekendPrice" placeholder="周末价" />
        </view>
        <view class="half">
          <text class="label">押金</text>
          <input class="input" type="digit" v-model="form.deposit" placeholder="押金" />
        </view>
      </view>
      <view class="form-group">
        <text class="label">标签(逗号分隔)</text>
        <input class="input" v-model="form.tags" placeholder="如: 泳池,KTV,轰趴" />
      </view>
      <view class="form-group">
        <text class="label">描述</text>
        <textarea class="textarea" v-model="form.description" placeholder="别墅描述" />
      </view>

      <!-- 封面图 -->
      <view class="form-group">
        <text class="label">封面图</text>
        <view class="image-upload" @tap="chooseCover">
          <image v-if="form.coverImage" :src="resolveImg(form.coverImage)" class="preview-img" mode="aspectFill" />
          <view v-else class="upload-placeholder">
            <text class="upload-icon">+</text>
            <text class="upload-text">上传封面</text>
          </view>
        </view>
      </view>

      <!-- 相册 -->
      <view class="form-group">
        <text class="label">相册图片</text>
        <view class="image-grid">
          <view class="img-item" v-for="(img, i) in form.images" :key="i">
            <image :src="resolveImg(img)" class="preview-img" mode="aspectFill" />
            <text class="remove-btn" @tap="removeImage(i)">×</text>
          </view>
          <view class="img-item upload-placeholder" @tap="chooseImages">
            <text class="upload-icon">+</text>
          </view>
        </view>
      </view>

      <button class="submit-btn" :loading="saving" @tap="handleSubmit">
        {{ isEdit ? '保存修改' : '创建别墅' }}
      </button>

      <!-- 售卖时段（钟点/半日租）-->
      <view class="slot-section" v-if="isEdit">
        <view class="slot-header">
          <text class="section-title">售卖时段（钟点 / 半日租）</text>
          <text class="add-slot" @tap="addSlot">+ 添加时段</text>
        </view>
        <text class="slot-hint">不配置则仅支持整天预订。整天与任意时段同日互斥，时段之间时间不重叠才可同日各接一场。</text>
        <view class="slot-card" v-for="(s, i) in slots" :key="i">
          <view class="form-group">
            <text class="label">时段名称</text>
            <input class="input" v-model="s.name" placeholder="如：下午场" />
          </view>
          <view class="form-group row">
            <view class="half">
              <text class="label">开始时间</text>
              <input class="input" v-model="s.startTime" placeholder="12:00" />
            </view>
            <view class="half">
              <text class="label">结束时间</text>
              <input class="input" v-model="s.endTime" placeholder="18:00" />
            </view>
          </view>
          <view class="form-group row">
            <view class="half">
              <text class="label">价格</text>
              <input class="input" type="digit" v-model="s.price" placeholder="价格" />
            </view>
            <view class="half">
              <text class="label">周末价(选填)</text>
              <input class="input" type="digit" v-model="s.weekendPrice" placeholder="周末价" />
            </view>
          </view>
          <text class="remove-slot" @tap="removeSlot(i)">删除该时段</text>
        </view>
        <button class="slot-save-btn" :loading="savingSlots" @tap="saveSlots">保存时段配置</button>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import {
  createVilla,
  updateVilla,
  getAdminVillas,
  getAdminVillaSlots,
  setAdminVillaSlots,
} from '../../../api/admin';
import { resolveImageUrl, BASE_URL } from '../../../utils/request';

const resolveImg = resolveImageUrl;
const isEdit = ref(false);
const editId = ref(0);
const saving = ref(false);
const savingSlots = ref(false);
const slots = ref<any[]>([]);

function minToTime(min: number) {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}
function timeToMin(t: string): number {
  const [h, m] = (t || '').split(':').map((x) => parseInt(x));
  if (isNaN(h)) return NaN;
  return h * 60 + (m || 0);
}

const form = reactive({
  name: '',
  address: '',
  maxGuests: '',
  bedrooms: '',
  area: '',
  basePrice: '',
  weekendPrice: '',
  deposit: '',
  tags: '',
  description: '',
  coverImage: '',
  images: [] as string[],
});

onLoad(async (opts: any) => {
  if (opts?.id) {
    isEdit.value = true;
    editId.value = Number(opts.id);
    try {
      const data = await getAdminVillas({ page: 1, pageSize: 100 });
      const villa = (data.list || data).find((v: any) => v.id === editId.value);
      if (villa) {
        Object.assign(form, {
          name: villa.name || '',
          address: villa.address || '',
          maxGuests: String(villa.maxGuests || ''),
          bedrooms: String(villa.bedrooms || ''),
          area: String(villa.area || ''),
          basePrice: String(villa.basePrice || ''),
          weekendPrice: String(villa.weekendPrice || ''),
          deposit: String(villa.deposit || ''),
          tags: villa.tags || '',
          description: villa.description || '',
          coverImage: villa.coverImage || '',
          images: villa.images || [],
        });
      }
    } catch (e) { console.error(e); }
    await loadSlots();
  }
});

async function loadSlots() {
  try {
    const list = await getAdminVillaSlots(editId.value);
    slots.value = (list || []).map((s: any) => ({
      type: s.type,
      name: s.name,
      startTime: minToTime(s.startMinute),
      endTime: minToTime(s.endMinute),
      price: String(s.price ?? ''),
      weekendPrice: s.weekendPrice != null ? String(s.weekendPrice) : '',
    }));
  } catch (e) { console.error(e); }
}

function addSlot() {
  slots.value.push({ type: 'half_day', name: '', startTime: '', endTime: '', price: '', weekendPrice: '' });
}
function removeSlot(i: number) {
  slots.value.splice(i, 1);
}

async function saveSlots() {
  const payload: any[] = [];
  for (const s of slots.value) {
    const start = timeToMin(s.startTime);
    const end = timeToMin(s.endTime);
    if (!s.name) {
      uni.showToast({ title: '请填写时段名称', icon: 'none' });
      return;
    }
    if (isNaN(start) || isNaN(end) || start >= end) {
      uni.showToast({ title: `「${s.name}」时间范围不合法`, icon: 'none' });
      return;
    }
    if (!s.price) {
      uni.showToast({ title: `「${s.name}」请填写价格`, icon: 'none' });
      return;
    }
    payload.push({
      type: end - start >= 600 ? 'half_day' : 'hourly',
      name: s.name,
      startMinute: start,
      endMinute: end,
      price: Number(s.price),
      weekendPrice: s.weekendPrice ? Number(s.weekendPrice) : null,
    });
  }
  savingSlots.value = true;
  try {
    await setAdminVillaSlots(editId.value, payload);
    uni.showToast({ title: '时段已保存', icon: 'success' });
  } catch (e) { console.error(e); }
  finally { savingSlots.value = false; }
}

function uploadFile(filePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    uni.uploadFile({
      url: `${BASE_URL}/api/upload`,
      filePath,
      name: 'file',
      header: { Authorization: `Bearer ${uni.getStorageSync('admin_token')}` },
      success: (res: any) => {
        const data = JSON.parse(res.data);
        if (data.code === 0) resolve(data.data.url);
        else reject(new Error(data.message));
      },
      fail: reject,
    });
  });
}

function chooseCover() {
  uni.chooseImage({
    count: 1,
    success: async (res) => {
      try {
        uni.showLoading({ title: '上传中...' });
        const url = await uploadFile(res.tempFilePaths[0]);
        form.coverImage = url;
        uni.hideLoading();
      } catch (e) {
        uni.hideLoading();
        uni.showToast({ title: '上传失败', icon: 'none' });
      }
    },
  });
}

function chooseImages() {
  uni.chooseImage({
    count: 9 - form.images.length,
    success: async (res) => {
      uni.showLoading({ title: '上传中...' });
      for (const path of res.tempFilePaths) {
        try {
          const url = await uploadFile(path);
          form.images.push(url);
        } catch (e) { console.error(e); }
      }
      uni.hideLoading();
    },
  });
}

function removeImage(i: number) {
  form.images.splice(i, 1);
}

async function handleSubmit() {
  if (!form.name || !form.address) {
    uni.showToast({ title: '请填写名称和地址', icon: 'none' });
    return;
  }
  saving.value = true;
  try {
    const data = {
      ...form,
      maxGuests: Number(form.maxGuests) || 0,
      bedrooms: Number(form.bedrooms) || 0,
      area: Number(form.area) || 0,
      basePrice: Number(form.basePrice) || 0,
      weekendPrice: Number(form.weekendPrice) || 0,
      deposit: Number(form.deposit) || 0,
    };
    if (isEdit.value) {
      await updateVilla(editId.value, data);
    } else {
      await createVilla(data);
    }
    uni.showToast({ title: '保存成功', icon: 'success' });
    setTimeout(() => uni.navigateBack(), 500);
  } catch (e) { console.error(e); }
  finally { saving.value = false; }
}
</script>

<style lang="scss">
.page { background: #f5f5f5; min-height: 100vh; }
.form { padding: 24rpx; }
.form-group { margin-bottom: 24rpx; }
.form-group.row { display: flex; gap: 20rpx; }
.half { flex: 1; }
.label { font-size: 26rpx; color: #666; display: block; margin-bottom: 10rpx; }
.input {
  width: 100%; height: 80rpx; background: #fff; border-radius: 12rpx;
  padding: 0 20rpx; font-size: 28rpx; box-sizing: border-box;
}
.textarea {
  width: 100%; height: 200rpx; background: #fff; border-radius: 12rpx;
  padding: 20rpx; font-size: 28rpx; box-sizing: border-box;
}

.image-upload { width: 200rpx; height: 200rpx; }
.preview-img { width: 100%; height: 100%; border-radius: 12rpx; }
.upload-placeholder {
  width: 200rpx; height: 200rpx; background: #fff;
  border-radius: 12rpx; border: 2rpx dashed #ddd;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
}
.upload-icon { font-size: 60rpx; color: #ccc; }
.upload-text { font-size: 22rpx; color: #999; }

.image-grid { display: flex; flex-wrap: wrap; gap: 16rpx; }
.img-item { width: 200rpx; height: 200rpx; position: relative; }
.remove-btn {
  position: absolute; top: -10rpx; right: -10rpx;
  width: 40rpx; height: 40rpx; line-height: 40rpx; text-align: center;
  background: #F56C6C; color: #fff; border-radius: 50%; font-size: 28rpx;
}

.submit-btn {
  width: 100%; height: 88rpx; line-height: 88rpx;
  background: linear-gradient(135deg, #409EFF, #66b1ff);
  color: #fff; font-size: 32rpx; border: none; border-radius: 44rpx;
  margin-top: 40rpx;
}
.submit-btn::after { border: none; }

.slot-section { margin-top: 48rpx; }
.slot-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12rpx; }
.section-title { font-size: 30rpx; font-weight: bold; color: #333; }
.add-slot { font-size: 26rpx; color: #409EFF; }
.slot-hint { font-size: 22rpx; color: #999; display: block; margin-bottom: 20rpx; line-height: 1.5; }
.slot-card { background: #fff; border-radius: 12rpx; padding: 24rpx; margin-bottom: 20rpx; }
.remove-slot { font-size: 24rpx; color: #F56C6C; }
.slot-save-btn {
  width: 100%; height: 80rpx; line-height: 80rpx;
  background: #fff; color: #409EFF; font-size: 28rpx;
  border: 2rpx solid #409EFF; border-radius: 40rpx; margin-top: 8rpx;
}
.slot-save-btn::after { border: none; }
</style>
