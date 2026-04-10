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
      <div class="photo-item" v-for="(p, i) in photos" :key="p.id">
        <el-image
          :src="p.url"
          fit="cover"
          class="photo-img"
          :preview-src-list="photos.map((x: any) => x.url)"
          :initial-index="i"
          preview-teleported
          lazy
        />
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
        <div class="photo-bottom">
          <span class="photo-caption-text" v-if="p.caption">{{ p.caption }}</span>
          <span class="photo-comment-btn" @click.stop="openPhotoComment(p)">💬 评论</span>
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

    <!-- 图片评论弹窗 -->
    <el-dialog v-model="photoCommentVisible" :title="'图片评论'" width="600px">
      <div v-if="selectedPhoto" style="text-align: center; margin-bottom: 16px;">
        <el-image :src="selectedPhoto.url" fit="contain" style="max-height: 300px; border-radius: 8px;" />
      </div>
      <CommentSection v-if="selectedPhoto && album" :album-id="album.id" :photo-id="selectedPhoto.id" />
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { PictureFilled } from '@element-plus/icons-vue';
import { getAlbumDetail, addPhoto, deletePhoto } from '../../api/album';
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

function openPhotoComment(photo: any) {
  selectedPhoto.value = photo;
  photoCommentVisible.value = true;
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
.photo-bottom {
  padding: 8px 12px; font-size: 13px; color: #64748b;
  border-top: 1px solid #f1f5f9;
  display: flex; justify-content: space-between; align-items: center;
}
.photo-caption-text { flex: 1; }
.photo-comment-btn {
  cursor: pointer; font-size: 12px; color: #94a3b8;
  transition: color 0.2s; white-space: nowrap;
}
.photo-comment-btn:hover { color: #3b82f6; }

/* 空状态 */
.empty-photos {
  text-align: center; padding: 80px 0;
}
.empty-photos h3 { font-size: 20px; color: #64748b; margin: 16px 0 8px; }
.empty-photos p { font-size: 14px; color: #94a3b8; }
</style>
