<template>
  <div>
    <el-card>
      <template #header>
        <div class="card-header">
          <span>房态日历管理</span>
          <el-button v-if="selectedVilla" type="primary" size="small" @click="batchVisible = true">批量设置</el-button>
        </div>
      </template>

      <!-- 别墅选择 + 月份选择 -->
      <div class="filter-bar">
        <el-select v-model="selectedVilla" placeholder="选择别墅" style="width: 240px;" @change="loadCalendar">
          <el-option v-for="v in villas" :key="v.id" :label="v.name" :value="v.id" />
        </el-select>
        <el-date-picker
          v-model="selectedMonth"
          type="month"
          format="YYYY-MM"
          value-format="YYYY-MM"
          :clearable="false"
          style="width: 180px;"
          @change="loadCalendar"
        />
      </div>

      <!-- 日历 -->
      <div v-if="selectedVilla && days.length" class="calendar">
        <div class="weekdays">
          <div class="weekday" v-for="w in weekdays" :key="w">{{ w }}</div>
        </div>
        <div class="days">
          <!-- 前置占位 -->
          <div v-for="n in startOffset" :key="'pad' + n" class="day placeholder"></div>
          <!-- 日期 -->
          <div
            v-for="day in days"
            :key="day.date"
            class="day"
            :class="{
              disabled: day.status === 0,
              booked: day.status === 2,
              weekend: isWeekend(day.date),
            }"
            @click="openEditor(day)"
          >
            <div class="date">{{ dayNum(day.date) }}</div>
            <div class="price">¥{{ day.price }}</div>
            <div class="status">{{ statusText(day.status) }}</div>
          </div>
        </div>
      </div>

      <el-empty v-else-if="selectedVilla" description="暂无数据" />
      <div v-else class="hint">请先选择别墅</div>
    </el-card>

    <!-- 单日编辑弹窗 -->
    <el-dialog v-model="editorVisible" :title="'设置 ' + editingDay?.date" width="400px">
      <el-form label-width="80px">
        <el-form-item label="价格">
          <el-input-number v-model="editForm.price" :min="0" :precision="2" :step="100" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="editForm.status" style="width: 100%;">
            <el-option :value="1" label="可订" />
            <el-option :value="0" label="不可订" />
            <el-option :value="2" label="已预订" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editorVisible = false">取消</el-button>
        <el-button type="primary" @click="saveSingleDay">保存</el-button>
      </template>
    </el-dialog>

    <!-- 批量设置弹窗 -->
    <el-dialog v-model="batchVisible" title="批量设置" width="480px">
      <el-form label-width="80px">
        <el-form-item label="日期范围">
          <el-date-picker
            v-model="batchForm.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始"
            end-placeholder="结束"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
        <el-form-item label="价格">
          <el-input-number v-model="batchForm.price" :min="0" :precision="2" :step="100" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="batchForm.status" style="width: 100%;">
            <el-option :value="1" label="可订" />
            <el-option :value="0" label="不可订" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="batchVisible = false">取消</el-button>
        <el-button type="primary" @click="saveBatch">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { getVillas, getCalendar, setCalendar } from '../../api/villa';

const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
const villas = ref<any[]>([]);
const selectedVilla = ref<number | null>(null);
const selectedMonth = ref(new Date().toISOString().slice(0, 7));
const days = ref<any[]>([]);

const editorVisible = ref(false);
const editingDay = ref<any>(null);
const editForm = reactive({ price: 0, status: 1 });

const batchVisible = ref(false);
const batchForm = reactive({ dateRange: [] as string[], price: 2888, status: 1 });

const startOffset = computed(() => {
  if (!days.value.length) return 0;
  return new Date(days.value[0].date).getDay();
});

onMounted(async () => {
  const res: any = await getVillas({ page: 1, pageSize: 100 });
  villas.value = res.list;
});

async function loadCalendar() {
  if (!selectedVilla.value) return;
  const [year, month] = selectedMonth.value.split('-').map(Number);
  try {
    days.value = (await getCalendar(selectedVilla.value, year, month)) as any;
  } catch (e) {
    ElMessage.error('加载日历失败');
  }
}

function dayNum(date: string) {
  return parseInt(date.split('-')[2]);
}

function isWeekend(date: string) {
  const d = new Date(date).getDay();
  return d === 0 || d === 5 || d === 6;
}

function statusText(s: number) {
  return { 0: '不可订', 1: '可订', 2: '已订' }[s] || '';
}

function openEditor(day: any) {
  editingDay.value = day;
  editForm.price = day.price;
  editForm.status = day.status;
  editorVisible.value = true;
}

async function saveSingleDay() {
  if (!selectedVilla.value || !editingDay.value) return;
  await setCalendar(selectedVilla.value, [
    { date: editingDay.value.date, price: editForm.price, status: editForm.status },
  ]);
  ElMessage.success('已保存');
  editorVisible.value = false;
  loadCalendar();
}

async function saveBatch() {
  if (!selectedVilla.value || !batchForm.dateRange.length) {
    ElMessage.warning('请选择日期范围');
    return;
  }
  const [start, end] = batchForm.dateRange;
  const dates: any[] = [];
  const s = new Date(start);
  const e = new Date(end);
  for (let d = new Date(s); d <= e; d.setDate(d.getDate() + 1)) {
    dates.push({
      date: d.toISOString().split('T')[0],
      price: batchForm.price,
      status: batchForm.status,
    });
  }
  await setCalendar(selectedVilla.value, dates);
  ElMessage.success(`已设置 ${dates.length} 天`);
  batchVisible.value = false;
  loadCalendar();
}
</script>

<style scoped>
.card-header { display: flex; justify-content: space-between; align-items: center; }
.filter-bar { display: flex; gap: 12px; margin-bottom: 20px; }
.calendar { user-select: none; }
.weekdays { display: grid; grid-template-columns: repeat(7, 1fr); gap: 8px; margin-bottom: 8px; }
.weekday { text-align: center; font-size: 14px; color: #666; padding: 8px 0; font-weight: bold; }
.days { display: grid; grid-template-columns: repeat(7, 1fr); gap: 8px; }
.day {
  background: #fff; border: 1px solid #ebeef5; border-radius: 6px; padding: 12px 8px;
  text-align: center; cursor: pointer; transition: all 0.2s; min-height: 90px;
}
.day:hover { border-color: #ff6b35; box-shadow: 0 2px 8px rgba(255,107,53,0.15); }
.day.placeholder { background: transparent; border: none; cursor: default; }
.day.placeholder:hover { box-shadow: none; }
.day.weekend { background: #fffaf5; }
.day.disabled { background: #f5f5f5; opacity: 0.6; }
.day.booked { background: #fff3ed; border-color: #ff6b35; }
.date { font-size: 18px; font-weight: bold; color: #333; }
.price { font-size: 14px; color: #ff6b35; margin-top: 4px; }
.status { font-size: 12px; color: #999; margin-top: 2px; }
.hint { text-align: center; padding: 60px 0; color: #999; }
</style>
