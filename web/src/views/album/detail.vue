<template>
  <div class="container album-detail" v-if="album">
    <!-- 相册头部 -->
    <div class="album-header">
      <div class="header-left">
        <h1>{{ album.title || '聚会相册' }}</h1>
        <div class="header-meta">
          <span>📅 {{ formatDate(album.createdAt) }}</span>
          <span v-if="album.villaName">🏡 {{ album.villaName }}</span>
          <span>📸 {{ photos.length }} 张照片</span>
          <el-tag :type="album.status === 1 ? 'success' : 'info'" size="small">
            {{ album.status === 1 ? '开放中' : '已关闭' }}
          </el-tag>
        </div>
      </div>
      <div class="header-actions">
        <el-button v-if="album.userId === currentUserId" plain round @click="permissionDialogVisible = true">
          权限设置
        </el-button>
        <el-button @click="copyShareLink" type="primary" plain round>
          📋 复制分享链接
        </el-button>
        <el-upload
          v-if="album.status === 1"
          :show-file-list="false"
          :before-upload="handleUpload"
          multiple
          accept="image/*"
        >
          <el-button type="primary" round>📷 上传照片</el-button>
        </el-upload>
      </div>
    </div>

    <!-- 邀请码分享卡片 -->
    <div class="share-card">
      <div class="share-card-header">
        <span class="share-icon">&#127881;</span>
        <span class="share-title">邀请朋友加入相册</span>
      </div>
      <div class="share-card-body">
        <div class="share-code-block">
          <span class="share-code-label">邀请码</span>
          <span class="share-code-value">{{ album.inviteCode }}</span>
        </div>
        <div class="share-card-actions">
          <el-button type="primary" round @click="copyInviteCode">
            &#128203; 复制邀请码
          </el-button>
          <el-button type="success" round @click="copyShareLink">
            &#128279; 复制分享链接
          </el-button>
        </div>
        <div class="share-tip">分享邀请码或链接给朋友，一起上传聚会照片</div>
      </div>
    </div>

    <!-- 照片瀑布流 -->
    <div class="photo-grid" v-if="photos.length">
      <div class="photo-item" v-for="p in photos" :key="p.id" @click="openPhotoComment(p)">
        <img :src="p.url" class="photo-img" loading="lazy" />
        <!-- 评论数角标 -->
        <span v-if="commentCounts[p.id]" class="photo-comment-badge">{{ commentCounts[p.id] }}</span>
        <div class="photo-overlay">
          <div class="photo-info">
            <span class="photo-user">{{ p.user?.nickname || '匿名' }}</span>
            <span class="photo-date">{{ formatDate(p.createdAt) }}</span>
          </div>
          <el-button
            v-if="p.userId === currentUserId"
            size="small" text type="danger"
            @click.stop="handleDelete(p.id)"
          >
            删除
          </el-button>
        </div>
      </div>
    </div>

    <!-- 空状态 -->
    <div class="empty-photos" v-if="!photos.length">
      <el-icon :size="64" color="#cbd5e1"><PictureFilled /></el-icon>
      <h3>还没有照片</h3>
      <p>点击上方「上传照片」按钮，开始记录美好瞬间</p>
    </div>

    <!-- 相册级评论 -->
    <CommentSection v-if="album" :album-id="album.id" />

    <!-- 图片详情+评论弹窗 -->
    <el-dialog v-model="photoCommentVisible" width="900px" :show-close="true" top="5vh" class="photo-dialog">
      <div class="photo-detail-layout" v-if="selectedPhoto">
        <!-- 左：大图 + 箭头 -->
        <div class="photo-detail-left">
          <button class="nav-arrow left" @click="prevPhoto" v-if="photos.length > 1">‹</button>
          <button class="nav-arrow right" @click="nextPhoto" v-if="photos.length > 1">›</button>
          <img :src="selectedPhoto.url" />
          <div class="photo-detail-meta">
            <span class="photo-detail-user">{{ selectedPhoto.user?.nickname || '匿名' }}</span>
            <span class="photo-detail-date">{{ formatDate(selectedPhoto.createdAt) }}</span>
            <span class="photo-counter">{{ selectedPhotoIndex + 1 }} / {{ photos.length }}</span>
            <span v-if="selectedPhoto.caption" class="photo-detail-caption">{{ selectedPhoto.caption }}</span>
          </div>
        </div>
        <!-- 右：评论 -->
        <div class="photo-detail-right">
          <CommentSection :album-id="album.id" :photo-id="selectedPhoto.id" :key="selectedPhoto.id" @update="loadCommentCounts" />
        </div>
      </div>
    </el-dialog>

    <!-- 权限设置弹窗 -->
    <el-dialog v-model="permissionDialogVisible" title="权限设置" width="400px" center>
      <div class="permission-panel">
        <div class="permission-desc">设置其他成员在相册中的操作权限</div>
        <el-radio-group v-model="permissionMode" class="permission-options">
          <el-radio value="upload" size="large">
            <div class="perm-option">
              <div class="perm-option-title">所有人可上传</div>
              <div class="perm-option-desc">加入相册的成员可以上传照片</div>
            </div>
          </el-radio>
          <el-radio value="view" size="large">
            <div class="perm-option">
              <div class="perm-option-title">仅查看</div>
              <div class="perm-option-desc">成员只能查看相册，不能上传照片</div>
            </div>
          </el-radio>
        </el-radio-group>
        <div style="text-align: center; margin-top: 20px;">
          <el-button type="primary" round @click="savePermission">保存设置</el-button>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRoute } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { PictureFilled } from '@element-plus/icons-vue';
import { getAlbumDetail, addPhoto, deletePhoto, getComments } from '../../api/album';
import { uploadSingle } from '../../api/upload';
import { useUserStore } from '../../store/user';
import CommentSection from '../../components/CommentSection.vue';

const route = useRoute();
const userStore = useUserStore();
const album = ref<any>(null);
const photos = ref<any[]>([]);
const currentUserId = ref<number>(0);
const photoCommentVisible = ref(false);
const selectedPhoto = ref<any>(null);
const commentCounts = ref<Record<number, number>>({});
const permissionDialogVisible = ref(false);
const permissionMode = ref('upload');

const selectedPhotoIndex = computed(() =>
  photos.value.findIndex((p: any) => p.id === selectedPhoto.value?.id)
);

function openPhotoComment(photo: any) {
  selectedPhoto.value = photo;
  photoCommentVisible.value = true;
}

function prevPhoto() {
  const i = selectedPhotoIndex.value;
  if (i > 0) selectedPhoto.value = photos.value[i - 1];
  else selectedPhoto.value = photos.value[photos.value.length - 1];
}

function nextPhoto() {
  const i = selectedPhotoIndex.value;
  if (i < photos.value.length - 1) selectedPhoto.value = photos.value[i + 1];
  else selectedPhoto.value = photos.value[0];
}

function onKeydown(e: KeyboardEvent) {
  if (!photoCommentVisible.value) return;
  if (e.key === 'ArrowLeft') prevPhoto();
  if (e.key === 'ArrowRight') nextPhoto();
}
onMounted(() => window.addEventListener('keydown', onKeydown));
onUnmounted(() => window.removeEventListener('keydown', onKeydown));

async function loadCommentCounts() {
  if (!album.value || !photos.value.length) return;
  const counts: Record<number, number> = {};
  // 并行请求每张图片的评论数
  await Promise.all(photos.value.map(async (p: any) => {
    try {
      const comments: any = await getComments(album.value.id, p.id);
      let total = comments.length;
      comments.forEach((c: any) => { total += c.replies?.length || 0; });
      if (total > 0) counts[p.id] = total;
    } catch { /* ignore */ }
  }));
  commentCounts.value = counts;
}

onMounted(async () => {
  currentUserId.value = userStore.info?.id || 0;
  await loadAlbum();
});

async function loadAlbum() {
  const id = parseInt(route.params.id as string);
  try {
    const data: any = await getAlbumDetail(id);
    album.value = data;
    photos.value = data.photos || [];
    loadCommentCounts();
  } catch (e: any) {
    ElMessage.error(e.message || '加载失败');
  }
}

async function handleUpload(file: File) {
  try {
    const res = await uploadSingle(file);
    await addPhoto(album.value.id, { url: res.url });
    ElMessage.success('上传成功');
    await loadAlbum();
  } catch (e: any) {
    ElMessage.error(e.message || '上传失败');
  }
  return false;
}

async function handleDelete(photoId: number) {
  try {
    await ElMessageBox.confirm(
      '确定要删除这张照片吗？此操作不可恢复，删除后将无法找回。',
      '删除确认',
      {
        type: 'warning',
        confirmButtonText: '确认删除',
        cancelButtonText: '取消',
        confirmButtonClass: 'el-button--danger',
      },
    );
    await deletePhoto(photoId);
    ElMessage.success('已删除');
    await loadAlbum();
  } catch { /* cancelled */ }
}

function savePermission() {
  permissionDialogVisible.value = false;
  ElMessage.info('功能开发中，敬请期待');
}

function copyInviteCode() {
  copyText(album.value.inviteCode);
  ElMessage.success('邀请码已复制，发给朋友即可加入相册');
}

function copyShareLink() {
  const link = `${window.location.origin}/album/${album.value.id}`;
  copyText(link);
  ElMessage.success('分享链接已复制，发给朋友即可打开相册');
}

function copyText(text: string) {
  if (navigator.clipboard) {
    navigator.clipboard.writeText(text).catch(() => fallbackCopy(text));
  } else {
    fallbackCopy(text);
  }
}
function fallbackCopy(text: string) {
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.style.position = 'fixed';
  ta.style.opacity = '0';
  document.body.appendChild(ta);
  ta.select();
  document.execCommand('copy');
  document.body.removeChild(ta);
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
}
</script>

<style scoped>
.album-detail { padding: 30px 0 80px; }

/* 头部 */
.album-header {
  display: flex; justify-content: space-between; align-items: flex-start;
  margin-bottom: 20px;
}
.album-header h1 { font-size: 28px; font-weight: 800; color: #1e293b; }
.header-meta {
  display: flex; gap: 16px; margin-top: 8px;
  font-size: 14px; color: #64748b; align-items: center;
}
.header-actions { display: flex; gap: 10px; flex-shrink: 0; }

/* 分享卡片 */
.share-card {
  border-radius: 16px; margin-bottom: 32px; overflow: hidden;
  background: linear-gradient(135deg, #eff6ff, #dbeafe);
  border: 1px solid #93c5fd;
  box-shadow: 0 4px 16px rgba(59, 130, 246, 0.1);
}
.share-card-header {
  padding: 16px 24px;
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  color: #fff; display: flex; align-items: center; gap: 10px;
}
.share-icon { font-size: 22px; }
.share-title { font-size: 16px; font-weight: 700; }
.share-card-body { padding: 24px; text-align: center; }
.share-code-block {
  display: flex; align-items: center; justify-content: center; gap: 12px;
  margin-bottom: 20px;
}
.share-code-label {
  font-size: 13px; color: #64748b; background: #fff;
  padding: 4px 10px; border-radius: 6px;
}
.share-code-value {
  font-size: 28px; font-weight: 800; color: #1e40af;
  letter-spacing: 6px; font-family: monospace;
}
.share-card-actions {
  display: flex; gap: 12px; justify-content: center; margin-bottom: 16px;
}
.share-tip { font-size: 13px; color: #64748b; }

/* 照片瀑布流 */
.photo-grid {
  columns: 4; column-gap: 16px;
}
@media (max-width: 1200px) {
  .photo-grid { columns: 3; }
}
@media (max-width: 768px) {
  .photo-grid { columns: 2; }
}
@media (max-width: 480px) {
  .photo-grid { columns: 1; }
}
.photo-item {
  break-inside: avoid; margin-bottom: 16px;
  border-radius: 12px; overflow: hidden;
  background: #fff; position: relative;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  transition: transform 0.3s;
}
.photo-item:hover { transform: translateY(-3px); }
.photo-img { width: 100%; display: block; cursor: zoom-in; }
.photo-overlay {
  position: absolute; bottom: 0; left: 0; right: 0;
  padding: 10px 12px;
  background: linear-gradient(transparent, rgba(0,0,0,0.6));
  color: #fff; display: flex; justify-content: space-between; align-items: flex-end;
  opacity: 0; transition: opacity 0.3s;
}
.photo-item:hover .photo-overlay { opacity: 1; }
.photo-info { display: flex; flex-direction: column; gap: 2px; }
.photo-user { font-size: 13px; font-weight: 500; }
.photo-date { font-size: 11px; opacity: 0.8; }
/* 评论数角标 */
.photo-comment-badge {
  position: absolute; top: 8px; right: 8px;
  background: #ef4444; color: #fff; font-size: 11px; font-weight: 700;
  min-width: 20px; height: 20px; line-height: 20px;
  text-align: center; border-radius: 10px; padding: 0 5px;
  z-index: 2;
}

/* 图片详情弹窗 */
.photo-detail-layout {
  display: flex; gap: 0; min-height: 500px;
}
.photo-detail-left {
  flex: 1; background: #000; display: flex; flex-direction: column;
  border-radius: 8px 0 0 8px; overflow: hidden;
  position: relative;
}
.nav-arrow {
  position: absolute; top: 50%; transform: translateY(-50%);
  width: 44px; height: 44px; border-radius: 50%;
  background: rgba(255,255,255,0.15); color: #fff;
  border: none; font-size: 28px; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  z-index: 3; transition: background 0.2s; line-height: 1;
  backdrop-filter: blur(4px);
}
.nav-arrow:hover { background: rgba(255,255,255,0.35); }
.nav-arrow.left { left: 12px; }
.nav-arrow.right { right: 12px; }
.photo-counter {
  margin-left: auto; color: #64748b; font-size: 12px;
}
.photo-detail-left img {
  flex: 1; object-fit: contain; max-height: 500px; width: 100%;
}
.photo-detail-meta {
  padding: 12px 16px; background: #1e293b; color: #94a3b8;
  display: flex; gap: 12px; align-items: center; font-size: 13px;
}
.photo-detail-user { color: #e2e8f0; font-weight: 500; }
.photo-detail-caption { color: #cbd5e1; }
.photo-detail-right {
  width: 320px; flex-shrink: 0; padding: 16px;
  overflow-y: auto; max-height: 600px;
  border-left: 1px solid #f1f5f9;
}

/* 空状态 */
.empty-photos {
  text-align: center; padding: 80px 0;
}
.empty-photos h3 { font-size: 20px; color: #64748b; margin: 16px 0 8px; }
.empty-photos p { font-size: 14px; color: #94a3b8; }

/* 权限设置面板 */
.permission-panel { padding: 10px 0; }
.permission-desc { font-size: 14px; color: #64748b; margin-bottom: 20px; text-align: center; }
.permission-options {
  display: flex; flex-direction: column; gap: 12px; width: 100%;
}
.permission-options .el-radio { margin-right: 0; height: auto; padding: 12px 16px; border: 1px solid #e2e8f0; border-radius: 10px; transition: all 0.2s; }
.permission-options .el-radio.is-checked { border-color: #409eff; background: #f0f7ff; }
.perm-option { margin-left: 4px; }
.perm-option-title { font-size: 14px; font-weight: 600; color: #1e293b; }
.perm-option-desc { font-size: 12px; color: #94a3b8; margin-top: 4px; }
</style>
