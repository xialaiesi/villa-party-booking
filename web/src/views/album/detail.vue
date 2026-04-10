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

    <!-- 邀请码展示 -->
    <div class="invite-card">
      <span class="invite-label">邀请码</span>
      <span class="invite-code">{{ album.inviteCode }}</span>
      <span class="invite-tip">分享给朋友，一起上传聚会照片</span>
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
        <!-- 左：大图 -->
        <div class="photo-detail-left">
          <img :src="selectedPhoto.url" />
          <div class="photo-detail-meta">
            <span class="photo-detail-user">{{ selectedPhoto.user?.nickname || '匿名' }}</span>
            <span class="photo-detail-date">{{ formatDate(selectedPhoto.createdAt) }}</span>
            <span v-if="selectedPhoto.caption" class="photo-detail-caption">{{ selectedPhoto.caption }}</span>
          </div>
        </div>
        <!-- 右：评论 -->
        <div class="photo-detail-right">
          <CommentSection :album-id="album.id" :photo-id="selectedPhoto.id" :key="selectedPhoto.id" @update="loadCommentCounts" />
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
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

function openPhotoComment(photo: any) {
  selectedPhoto.value = photo;
  photoCommentVisible.value = true;
}

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
    await ElMessageBox.confirm('确定删除这张照片？', '提示', { type: 'warning' });
    await deletePhoto(photoId);
    ElMessage.success('已删除');
    await loadAlbum();
  } catch { /* cancelled */ }
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

/* 邀请码卡片 */
.invite-card {
  display: flex; align-items: center; gap: 16px;
  padding: 16px 24px; border-radius: 12px; margin-bottom: 32px;
  background: linear-gradient(135deg, #f0f4ff, #e8f0fe);
  border: 1px solid #c7d7fe;
}
.invite-label { font-size: 13px; color: #64748b; }
.invite-code {
  font-size: 22px; font-weight: 800; color: #3b82f6;
  letter-spacing: 4px; font-family: monospace;
}
.invite-tip { font-size: 12px; color: #94a3b8; margin-left: auto; }

/* 照片瀑布流 */
.photo-grid {
  columns: 4; column-gap: 16px;
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
</style>
