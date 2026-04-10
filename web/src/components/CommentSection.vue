<template>
  <div class="comment-section">
    <h3 class="comment-title">
      💬 {{ photoId ? '图片评论' : '相册评论' }}
      <span class="comment-count" v-if="comments.length">（{{ totalCount }}）</span>
    </h3>

    <!-- 发表评论 -->
    <div class="comment-input" v-if="isLoggedIn">
      <div class="input-row">
        <el-input
          v-model="newComment"
          :placeholder="replyTo ? `回复 ${replyTo.user?.nickname}...` : '写下你的评论...'"
          :rows="2"
          type="textarea"
          maxlength="500"
          show-word-limit
        />
      </div>
      <div class="input-actions">
        <el-button v-if="replyTo" size="small" text @click="replyTo = null">取消回复</el-button>
        <el-button type="primary" size="small" round :disabled="!newComment.trim()" @click="submitComment">
          {{ replyTo ? '回复' : '发表评论' }}
        </el-button>
      </div>
    </div>
    <div v-else class="login-tip">
      <router-link to="/login">登录</router-link> 后即可评论
    </div>

    <!-- 评论列表（盖楼） -->
    <div class="comment-list" v-if="comments.length">
      <div class="comment-item" v-for="c in comments" :key="c.id">
        <!-- 主评论 -->
        <div class="comment-main">
          <div class="comment-avatar">{{ (c.user?.nickname || '匿').charAt(0) }}</div>
          <div class="comment-body">
            <div class="comment-header">
              <span class="comment-user">{{ c.user?.nickname || '匿名' }}</span>
              <span class="comment-time">{{ fmtTime(c.createdAt) }}</span>
            </div>
            <div class="comment-content">{{ c.content }}</div>
            <div class="comment-actions">
              <span class="comment-btn" @click="replyTo = c">回复</span>
              <span v-if="c.userId === currentUserId" class="comment-btn danger" @click="handleDelete(c.id)">删除</span>
            </div>
          </div>
        </div>

        <!-- 回复列表（盖楼） -->
        <div class="reply-list" v-if="c.replies?.length">
          <div class="reply-item" v-for="r in c.replies" :key="r.id">
            <div class="comment-avatar small">{{ (r.user?.nickname || '匿').charAt(0) }}</div>
            <div class="comment-body">
              <div class="comment-header">
                <span class="comment-user">{{ r.user?.nickname || '匿名' }}</span>
                <span v-if="r.replyTo" class="reply-to">回复 <b>{{ r.replyTo }}</b></span>
                <span class="comment-time">{{ fmtTime(r.createdAt) }}</span>
              </div>
              <div class="comment-content">{{ r.content }}</div>
              <div class="comment-actions">
                <span class="comment-btn" @click="replyTo = { ...r, parentId: c.id }">回复</span>
                <span v-if="r.userId === currentUserId" class="comment-btn danger" @click="handleDelete(r.id)">删除</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div v-else class="comment-empty">暂无评论，来说两句吧～</div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { ElMessage } from 'element-plus';
import { getComments, addComment, deleteComment } from '../api/album';
import { useUserStore } from '../store/user';

const props = defineProps<{ albumId: number; photoId?: number }>();
const emit = defineEmits<{ update: [] }>();
const userStore = useUserStore();

const comments = ref<any[]>([]);
const newComment = ref('');
const replyTo = ref<any>(null);

const isLoggedIn = computed(() => userStore.isLoggedIn);
const currentUserId = computed(() => userStore.info?.id || 0);
const totalCount = computed(() => {
  let count = comments.value.length;
  comments.value.forEach((c: any) => { count += c.replies?.length || 0; });
  return count;
});

async function loadComments() {
  try {
    comments.value = await getComments(props.albumId, props.photoId) as any;
  } catch { /* ignore */ }
}

async function submitComment() {
  if (!newComment.value.trim()) return;
  try {
    await addComment(props.albumId, {
      content: newComment.value,
      photoId: props.photoId,
      parentId: replyTo.value?.parentId || replyTo.value?.id,
    });
    newComment.value = '';
    replyTo.value = null;
    ElMessage.success('评论成功');
    loadComments();
    emit('update');
  } catch (e: any) {
    ElMessage.error(e.message || '评论失败');
  }
}

async function handleDelete(id: number) {
  try {
    await deleteComment(id);
    ElMessage.success('已删除');
    loadComments();
    emit('update');
  } catch (e: any) {
    ElMessage.error(e.message || '删除失败');
  }
}

function fmtTime(d: string) {
  const diff = Date.now() - new Date(d).getTime();
  if (diff < 60000) return '刚刚';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`;
  return new Date(d).toLocaleDateString('zh-CN');
}

onMounted(loadComments);
watch(() => props.photoId, loadComments);
</script>

<style scoped>
.comment-section { margin-top: 24px; }
.comment-title {
  font-size: 18px; font-weight: 700; color: #1e293b; margin-bottom: 16px;
}
.comment-count { font-size: 14px; color: #94a3b8; font-weight: 400; }

/* 输入框 */
.comment-input { margin-bottom: 24px; }
.input-actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 8px; }
.login-tip { font-size: 14px; color: #94a3b8; margin-bottom: 24px; }
.login-tip a { color: #3b82f6; }

/* 评论列表 */
.comment-list { display: flex; flex-direction: column; gap: 0; }
.comment-item {
  border-bottom: 1px solid #f1f5f9; padding: 16px 0;
}
.comment-item:last-child { border-bottom: none; }
.comment-main { display: flex; gap: 12px; }
.comment-avatar {
  width: 36px; height: 36px; border-radius: 50%; flex-shrink: 0;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: #fff; font-size: 14px; font-weight: 600;
  display: flex; align-items: center; justify-content: center;
}
.comment-avatar.small { width: 28px; height: 28px; font-size: 12px; }
.comment-body { flex: 1; min-width: 0; }
.comment-header { display: flex; align-items: center; gap: 8px; margin-bottom: 4px; flex-wrap: wrap; }
.comment-user { font-size: 14px; font-weight: 600; color: #1e293b; }
.reply-to { font-size: 12px; color: #94a3b8; }
.reply-to b { color: #3b82f6; font-weight: 500; }
.comment-time { font-size: 12px; color: #cbd5e1; }
.comment-content { font-size: 14px; color: #475569; line-height: 1.7; word-break: break-all; }
.comment-actions { display: flex; gap: 12px; margin-top: 6px; }
.comment-btn {
  font-size: 12px; color: #94a3b8; cursor: pointer;
  transition: color 0.2s;
}
.comment-btn:hover { color: #3b82f6; }
.comment-btn.danger:hover { color: #ef4444; }

/* 盖楼回复 */
.reply-list {
  margin-left: 48px; padding: 12px 16px; margin-top: 8px;
  background: #f8fafc; border-radius: 8px;
  display: flex; flex-direction: column; gap: 12px;
}
.reply-item { display: flex; gap: 10px; }

.comment-empty {
  text-align: center; padding: 40px 0; color: #cbd5e1; font-size: 14px;
}
</style>
