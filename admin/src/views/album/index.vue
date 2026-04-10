<template>
  <div>
    <el-table :data="list" border stripe>
      <el-table-column prop="id" label="ID" width="70" />
      <el-table-column label="封面" width="100">
        <template #default="{ row }">
          <el-image v-if="row.coverImage" :src="row.coverImage" fit="cover" style="width: 70px; height: 50px; border-radius: 4px;" />
        </template>
      </el-table-column>
      <el-table-column prop="title" label="相册名称" min-width="160" />
      <el-table-column prop="villaName" label="别墅" width="140" />
      <el-table-column prop="orderNo" label="订单号" width="160" />
      <el-table-column label="创建者" width="100">
        <template #default="{ row }">{{ row.creator?.nickname || '-' }}</template>
      </el-table-column>
      <el-table-column prop="photoCount" label="照片数" width="80" align="center" />
      <el-table-column label="邀请码" width="130">
        <template #default="{ row }">
          <span class="invite-code" @click="copyCode(row.inviteCode)">{{ row.inviteCode }}</span>
        </template>
      </el-table-column>
      <el-table-column label="状态" width="80" align="center">
        <template #default="{ row }">
          <el-tag :type="row.status === 1 ? 'success' : 'info'" size="small">
            {{ row.status === 1 ? '开放' : '关闭' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="创建时间" width="120">
        <template #default="{ row }">{{ formatDate(row.createdAt) }}</template>
      </el-table-column>
      <el-table-column label="操作" width="160" align="center">
        <template #default="{ row }">
          <div class="action-btns">
            <span class="action-link primary" @click="viewDetail(row)">查看</span>
            <span class="action-divider">|</span>
            <span
              :class="['action-link', row.status === 1 ? 'danger' : 'success']"
              @click="toggleStatus(row)"
            >
              {{ row.status === 1 ? '关闭' : '开放' }}
            </span>
          </div>
        </template>
      </el-table-column>
    </el-table>

    <el-pagination
      v-model:current-page="page"
      :page-size="pageSize"
      :total="total"
      layout="total, prev, pager, next"
      @current-change="loadData"
      style="margin-top: 20px; justify-content: flex-end;"
    />

    <!-- 相册详情弹窗 -->
    <el-dialog v-model="detailVisible" :title="currentAlbum?.title || '相册详情'" width="800px">
      <div v-if="currentAlbum" class="detail-header">
        <el-descriptions :column="3" border size="small">
          <el-descriptions-item label="别墅">{{ currentAlbum.villaName || '-' }}</el-descriptions-item>
          <el-descriptions-item label="订单号">{{ currentAlbum.orderNo || '-' }}</el-descriptions-item>
          <el-descriptions-item label="邀请码">
            <span class="invite-code" @click="copyCode(currentAlbum.inviteCode)">{{ currentAlbum.inviteCode }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="创建者">{{ currentAlbum.creator?.nickname || '-' }}</el-descriptions-item>
          <el-descriptions-item label="照片数">{{ detailPhotos.length }} 张</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="currentAlbum.status === 1 ? 'success' : 'info'" size="small">
              {{ currentAlbum.status === 1 ? '开放中' : '已关闭' }}
            </el-tag>
          </el-descriptions-item>
        </el-descriptions>
      </div>

      <div class="photo-grid" v-if="detailPhotos.length">
        <div class="photo-item" v-for="(p, i) in detailPhotos" :key="p.id">
          <el-image
            :src="p.url"
            fit="cover"
            style="width: 100%; height: 140px; border-radius: 6px;"
            :preview-src-list="detailPhotos.map((x: any) => x.url)"
            :initial-index="i"
            preview-teleported
          />
          <div class="photo-meta">
            <span>{{ p.user?.nickname || '匿名' }}</span>
          </div>
        </div>
      </div>
      <div v-else style="text-align: center; padding: 40px; color: #94a3b8;">暂无照片</div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import request from '../../utils/request';

const list = ref<any[]>([]);
const page = ref(1);
const pageSize = 20;
const total = ref(0);
const detailVisible = ref(false);
const currentAlbum = ref<any>(null);
const detailPhotos = ref<any[]>([]);

onMounted(() => loadData());

async function loadData() {
  const res: any = await request.get('/api/admin/albums', { params: { page: page.value, pageSize } });
  list.value = res.list;
  total.value = res.total;
}

async function viewDetail(row: any) {
  currentAlbum.value = row;
  const detail: any = await request.get(`/api/admin/albums/${row.id}`);
  detailPhotos.value = detail.photos || [];
  detailVisible.value = true;
}

async function toggleStatus(row: any) {
  const newStatus = row.status === 1 ? 0 : 1;
  await request.put(`/api/admin/albums/${row.id}/status`, { status: newStatus });
  ElMessage.success(newStatus === 1 ? '已开放' : '已关闭');
  loadData();
}

function copyCode(code: string) {
  navigator.clipboard.writeText(code);
  ElMessage.success(`邀请码已复制：${code}`);
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('zh-CN');
}
</script>

<style scoped>
.invite-code {
  font-family: monospace; font-weight: 700; color: #3b82f6;
  cursor: pointer; letter-spacing: 1px;
}
.invite-code:hover { text-decoration: underline; }

.detail-header { margin-bottom: 20px; }

.photo-grid {
  display: grid; grid-template-columns: repeat(5, 1fr); gap: 10px;
  max-height: 500px; overflow-y: auto; margin-top: 16px;
}
.photo-item { position: relative; }
.photo-meta {
  font-size: 11px; color: #94a3b8; margin-top: 4px; text-align: center;
}
</style>
