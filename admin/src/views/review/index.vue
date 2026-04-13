<template>
  <div class="review-page">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>评价管理</span>
          <el-radio-group v-model="videoStatusFilter" size="small" @change="loadData">
            <el-radio-button :value="-1">全部</el-radio-button>
            <el-radio-button :value="0">待审核</el-radio-button>
            <el-radio-button :value="1">已通过</el-radio-button>
            <el-radio-button :value="2">已拒绝</el-radio-button>
          </el-radio-group>
        </div>
      </template>

      <el-table :data="list" v-loading="loading" empty-text="暂无评价">
        <el-table-column label="用户" width="120">
          <template #default="{ row }">
            <div class="user-info">
              <el-avatar :src="row.user?.avatar" :size="32">{{ row.user?.nickname?.charAt(0) || '用户' }}</el-avatar>
              <span>{{ row.user?.nickname || '用户' }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="别墅" width="140">
          <template #default="{ row }">{{ row.villa?.name || '-' }}</template>
        </el-table-column>
        <el-table-column label="评分" width="80" align="center">
          <template #default="{ row }">
            <span class="rating">{{ row.rating }}星</span>
          </template>
        </el-table-column>
        <el-table-column label="评价内容" min-width="180">
          <template #default="{ row }">
            <div class="content">{{ row.content || '(无文字评价)' }}</div>
            <div class="media-tags">
              <el-tag v-if="row.images?.length" size="small" type="info">{{ row.images.length }}张图</el-tag>
              <el-tag v-if="row.videos?.length" size="small" :type="videoStatusTag(row.videoStatus)">
                {{ row.videos.length }}个视频 · {{ videoStatusText(row.videoStatus) }}
              </el-tag>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="商家回复" width="140">
          <template #default="{ row }">
            <span v-if="row.reply" class="reply">{{ row.reply }}</span>
            <span v-else class="no-reply">未回复</span>
          </template>
        </el-table-column>
        <el-table-column label="时间" width="160">
          <template #default="{ row }">{{ fmtDate(row.createdAt) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="160" align="center">
          <template #default="{ row }">
            <el-button v-if="row.videos?.length && row.videoStatus === 0" type="success" link size="small" @click="handleApprove(row)">通过</el-button>
            <el-button v-if="row.videos?.length && row.videoStatus === 0" type="danger" link size="small" @click="handleReject(row)">拒绝</el-button>
            <el-button type="danger" link size="small" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination" v-if="total > pageSize">
        <el-pagination
          v-model:current-page="page"
          :page-size="pageSize"
          :total="total"
          layout="total, prev, pager, next"
          @current-change="loadData"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { getReviews, reviewVideo, deleteReview } from '../../api/review';

const list = ref<any[]>([]);
const loading = ref(false);
const page = ref(1);
const pageSize = 20;
const total = ref(0);
const videoStatusFilter = ref(-1);

async function loadData() {
  loading.value = true;
  try {
    const res: any = await getReviews({
      page: page.value,
      pageSize,
      videoStatus: videoStatusFilter.value,
    });
    list.value = res.list || [];
    total.value = res.total || 0;
  } finally {
    loading.value = false;
  }
}

function videoStatusText(s: number) {
  return { 0: '待审核', 1: '已通过', 2: '已拒绝' }[s] || '未知';
}

function videoStatusTag(s: number): any {
  return { 0: 'warning', 1: 'success', 2: 'danger' }[s] || 'info';
}

function fmtDate(d: string) {
  return new Date(d).toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
}

async function handleApprove(row: any) {
  await reviewVideo(row.id, { approved: true });
  ElMessage.success('已通过');
  loadData();
}

async function handleReject(row: any) {
  try {
    const { value } = await ElMessageBox.prompt('请输入拒绝原因', '拒绝视频', { confirmButtonText: '确定', cancelButtonText: '取消' });
    await reviewVideo(row.id, { approved: false, reason: value });
    ElMessage.success('已拒绝');
    loadData();
  } catch { /* cancelled */ }
}

async function handleDelete(row: any) {
  try {
    await ElMessageBox.confirm('确定删除该评价？', '提示', { type: 'warning' });
    await deleteReview(row.id);
    ElMessage.success('已删除');
    loadData();
  } catch { /* cancelled */ }
}

onMounted(loadData);
</script>

<style scoped>
.card-header { display: flex; justify-content: space-between; align-items: center; }
.user-info { display: flex; align-items: center; gap: 8px; }
.rating { color: #e6a23c; font-weight: 600; }
.content { font-size: 13px; color: #303133; line-height: 1.5; }
.media-tags { display: flex; gap: 4px; margin-top: 4px; }
.reply { font-size: 12px; color: #67c23a; }
.no-reply { font-size: 12px; color: #c0c4cc; }
.pagination { margin-top: 16px; display: flex; justify-content: flex-end; }
</style>
