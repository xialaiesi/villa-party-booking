<template>
  <div class="video-review-page">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>视频审核</span>
          <el-tag :type="pendingCount > 0 ? 'danger' : 'success'">
            待审核: {{ pendingCount }}
          </el-tag>
        </div>
      </template>

      <el-table :data="list" v-loading="loading" empty-text="暂无待审核视频">
        <el-table-column label="用户" width="120">
          <template #default="{ row }">
            <div class="user-info">
              <el-avatar :src="row.user?.avatar" :size="36">{{ row.user?.nickname?.charAt(0) || '用户' }}</el-avatar>
              <span>{{ row.user?.nickname || '用户' }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="别墅" prop="villa.name" width="150" />
        <el-table-column label="评分" width="100">
          <template #default="{ row }">
            <span class="rating">{{ row.rating }}星</span>
          </template>
        </el-table-column>
        <el-table-column label="评价内容" min-width="150">
          <template #default="{ row }">
            <span class="content">{{ row.content || '(无文字评价)' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="视频" width="200">
          <template #default="{ row }">
            <div class="video-preview" v-if="row.videos?.length">
              <video
                v-for="(v, i) in row.videos"
                :key="i"
                :src="resolveVideo(v.url)"
                :poster="v.cover"
                controls
                preload="metadata"
                class="video-item"
              />
            </div>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button type="success" size="small" @click="handleApprove(row)">
              通过
            </el-button>
            <el-button type="danger" size="small" @click="handleReject(row)">
              拒绝
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-if="total > pageSize"
        class="pagination"
        layout="prev, pager, next"
        :total="total"
        :page-size="pageSize"
        :current-page="page"
        @current-change="loadData"
      />
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { getPendingVideoReviews, reviewVideo } from '../../api/review';

const loading = ref(false);
const list = ref<any[]>([]);
const page = ref(1);
const pageSize = ref(10);
const total = ref(0);
const pendingCount = ref(0);

function resolveVideo(url: string) {
  return url?.startsWith('http') ? url : `https://your-cos-domain.com/${url}`;
}

async function loadData() {
  loading.value = true;
  try {
    const res: any = await getPendingVideoReviews({ page: page.value, pageSize: pageSize.value });
    list.value = res.list || [];
    total.value = res.total || 0;
    pendingCount.value = res.total || 0;
  } catch (e: any) {
    ElMessage.error(e.message || '加载失败');
  } finally {
    loading.value = false;
  }
}

async function handleApprove(row: any) {
  try {
    await reviewVideo(row.id, { approved: true });
    ElMessage.success('已通过');
    loadData();
  } catch (e: any) {
    ElMessage.error(e.message || '操作失败');
  }
}

async function handleReject(row: any) {
  try {
    const { value } = await ElMessageBox.prompt('请输入拒绝原因（可选）', '拒绝视频', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
    });
    await reviewVideo(row.id, { approved: false, reason: value });
    ElMessage.success('已拒绝');
    loadData();
  } catch (e: any) {
    if (e !== 'cancel') {
      ElMessage.error(e.message || '操作失败');
    }
  }
}

onMounted(() => loadData());
</script>

<style scoped>
.video-review-page { padding: 20px; }
.card-header { display: flex; justify-content: space-between; align-items: center; }
.user-info { display: flex; align-items: center; gap: 8px; }
.rating { color: #f59e0b; font-weight: 600; }
.content { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.video-preview { display: flex; gap: 8px; flex-wrap: wrap; }
.video-item { width: 120px; height: 80px; border-radius: 6px; object-fit: cover; }
.pagination { margin-top: 20px; justify-content: center; display: flex; }
</style>