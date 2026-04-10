<template>
  <div class="container album-page">
    <div class="page-header">
      <h1>📸 共享相册</h1>
      <p>聚会的美好瞬间，一起记录、一起回忆</p>
    </div>

    <!-- 邀请码加入 -->
    <div class="invite-bar">
      <el-input
        v-model="inviteCode"
        placeholder="输入邀请码查看相册"
        size="large"
        class="invite-input"
        @keyup.enter="joinByCode"
      >
        <template #prefix><el-icon><Key /></el-icon></template>
        <template #append>
          <el-button @click="joinByCode">加入相册</el-button>
        </template>
      </el-input>
    </div>

    <!-- 我的相册 -->
    <div class="section" v-if="albums.length">
      <h2>我的相册</h2>
      <div class="album-grid">
        <div class="album-card" v-for="a in albums" :key="a.id" @click="goDetail(a.id)">
          <div class="album-cover">
            <img v-if="a.coverUrl" :src="a.coverUrl" />
            <div v-else class="album-empty-cover">
              <el-icon :size="40"><Camera /></el-icon>
            </div>
            <div class="album-photo-count">{{ a.photoCount }} 张</div>
          </div>
          <div class="album-info">
            <div class="album-title">{{ a.title || '聚会相册' }}</div>
            <div class="album-meta">
              <span>{{ formatDate(a.createdAt) }}</span>
              <span class="album-status" :class="a.status === 1 ? 'open' : 'closed'">
                {{ a.status === 1 ? '开放中' : '已关闭' }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 空状态 -->
    <div class="empty-state" v-if="loaded && !albums.length">
      <el-icon :size="64" color="#cbd5e1"><PictureFilled /></el-icon>
      <h3>还没有相册</h3>
      <p>完成一次入住后，可以在订单详情里创建共享相册</p>
      <p>或者输入邀请码加入朋友的相册</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { Camera, Key, PictureFilled } from '@element-plus/icons-vue';
import { getMyAlbums, getAlbumByCode } from '../../api/album';

const router = useRouter();
const albums = ref<any[]>([]);
const inviteCode = ref('');
const loaded = ref(false);

onMounted(async () => {
  try {
    const data: any = await getMyAlbums();
    albums.value = data || [];
  } catch (e) {
    // 未登录时静默
  }
  loaded.value = true;
});

async function joinByCode() {
  const code = inviteCode.value.trim();
  if (!code) { ElMessage.warning('请输入邀请码'); return; }
  try {
    const album: any = await getAlbumByCode(code);
    router.push(`/album/${album.id}`);
  } catch (e) {
    ElMessage.error('邀请码无效或相册已过期');
  }
}

function goDetail(id: number) { router.push(`/album/${id}`); }

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('zh-CN', { year: 'numeric', month: 'short', day: 'numeric' });
}
</script>

<style scoped>
.album-page { padding: 40px 0 80px; }

.page-header { text-align: center; margin-bottom: 40px; }
.page-header h1 { font-size: 32px; font-weight: 800; color: #1e293b; }
.page-header p { font-size: 16px; color: #94a3b8; margin-top: 8px; }

.invite-bar {
  max-width: 500px; margin: 0 auto 48px;
}
.invite-input :deep(.el-input__wrapper) { border-radius: 12px; }

.section h2 { font-size: 22px; font-weight: 700; color: #1e293b; margin-bottom: 24px; }

.album-grid {
  display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px;
}
.album-card {
  background: #fff; border-radius: 14px; overflow: hidden;
  cursor: pointer; transition: all 0.3s;
  box-shadow: 0 2px 12px rgba(0,0,0,0.05);
}
.album-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0,0,0,0.1);
}
.album-cover {
  position: relative; height: 220px; background: #f1f5f9;
}
.album-cover img { width: 100%; height: 100%; object-fit: cover; }
.album-empty-cover {
  width: 100%; height: 100%;
  display: flex; align-items: center; justify-content: center;
  color: #cbd5e1;
}
.album-photo-count {
  position: absolute; bottom: 10px; right: 10px;
  background: rgba(0,0,0,0.5); color: #fff;
  padding: 3px 10px; border-radius: 12px; font-size: 12px;
}
.album-info { padding: 16px; }
.album-title { font-size: 16px; font-weight: 600; color: #1e293b; }
.album-meta {
  display: flex; justify-content: space-between; align-items: center;
  margin-top: 8px; font-size: 13px; color: #94a3b8;
}
.album-status {
  padding: 2px 8px; border-radius: 8px; font-size: 11px;
}
.album-status.open { background: #dcfce7; color: #16a34a; }
.album-status.closed { background: #f1f5f9; color: #94a3b8; }

.empty-state {
  text-align: center; padding: 80px 0;
}
.empty-state h3 { font-size: 20px; color: #64748b; margin: 16px 0 8px; }
.empty-state p { font-size: 14px; color: #94a3b8; }
</style>
