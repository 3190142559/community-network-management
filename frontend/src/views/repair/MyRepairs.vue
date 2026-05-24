<template>
  <div>
    <el-card>
      <div slot="header" class="card-header">
        <span>我的报修</span>
        <el-button type="primary" size="small" icon="el-icon-plus" @click="handleAdd">提交报修</el-button>
      </div>

      <el-table :data="list" border v-loading="loading" style="width:100%">
        <el-table-column prop="id" label="ID" width="60" />
        <el-table-column prop="title" label="标题" min-width="160" />
        <el-table-column prop="device_name" label="报修设备" width="130" />
        <el-table-column prop="maintainer_name" label="维修人员" width="90">
          <template slot-scope="{row}">{{ row.maintainer_name || '-' }}</template>
        </el-table-column>
        <el-table-column label="状态" width="90">
          <template slot-scope="{row}">
            <el-tag :type="statusType(row.status)" size="small">{{ statusLabel(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="提交时间" width="140" />
        <el-table-column label="操作" width="120">
          <template slot-scope="{row}">
            <el-button type="text" size="small" @click="handleView(row)">查看</el-button>
            <el-button v-if="row.status === 'pending'" type="text" size="small" style="color:#F56C6C" @click="handleDelete(row)">取消</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        style="margin-top:16px;text-align:right"
        :current-page="query.page" :page-sizes="[10,20,50]" :page-size="query.pageSize"
        :total="total" layout="total,sizes,prev,pager,next"
        @size-change="v => { query.pageSize = v; fetchData(); }"
        @current-change="v => { query.page = v; fetchData(); }"
      />
    </el-card>

    <!-- Detail dialog -->
    <el-dialog title="工单详情" :visible.sync="detailVisible" width="500px">
      <el-descriptions :column="2" border size="small">
        <el-descriptions-item label="标题">{{ detail.title }}</el-descriptions-item>
        <el-descriptions-item label="设备">{{ detail.device_name }}</el-descriptions-item>
        <el-descriptions-item label="维修人">{{ detail.maintainer_name || '-' }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="statusType(detail.status)" size="small">{{ statusLabel(detail.status) }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="描述" :span="2">{{ detail.description || '-' }}</el-descriptions-item>
        <el-descriptions-item label="维修结果" :span="2">{{ detail.repair_result || '-' }}</el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ detail.created_at }}</el-descriptions-item>
        <el-descriptions-item label="更新时间">{{ detail.updated_at }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>

    <!-- Add dialog -->
    <el-dialog title="提交报修申请" :visible.sync="addVisible" width="500px" @close="resetAddForm">
      <el-form ref="addForm" :model="addForm" :rules="addRules" label-width="80px" size="small">
        <el-form-item label="报修设备" prop="device_id">
          <el-select v-model="addForm.device_id" style="width:100%" placeholder="请选择设备">
            <el-option v-for="d in deviceOptions" :key="d.id" :label="d.name" :value="d.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="标题" prop="title">
          <el-input v-model="addForm.title" placeholder="请输入问题描述标题" />
        </el-form-item>
        <el-form-item label="详细描述">
          <el-input v-model="addForm.description" type="textarea" :rows="3" placeholder="请详细描述故障现象" />
        </el-form-item>
      </el-form>
      <div slot="footer">
        <el-button @click="addVisible = false">取消</el-button>
        <el-button type="primary" @click="submitAdd">提交</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { getRepairs, createRepair, deleteRepair } from '../../api/repair';
import { getDeviceOptions } from '../../api/device';

export default {
  name: 'MyRepairs',
  data() {
    return {
      query: { page: 1, pageSize: 10 },
      list: [], total: 0, loading: false,
      detailVisible: false, detail: {},
      addVisible: false, addForm: { device_id: '', title: '', description: '' },
      addRules: {
        device_id: [{ required: true, message: '请选择设备', trigger: 'change' }],
        title: [{ required: true, message: '请输入标题', trigger: 'blur' }]
      },
      deviceOptions: []
    };
  },
  created() {
    this.fetchData();
    getDeviceOptions().then(r => { if (r.code === 0) this.deviceOptions = r.data; });
  },
  methods: {
    async fetchData() {
      this.loading = true;
      try {
        const res = await getRepairs(this.query);
        if (res.code === 0) { this.list = res.data.list; this.total = res.data.total; }
      } finally { this.loading = false; }
    },
    handleView(row) { this.detail = row; this.detailVisible = true; },
    handleDelete(row) {
      this.$confirm('确认取消该报修？', '提示', { type: 'warning' }).then(async () => {
        await deleteRepair(row.id);
        this.$message.success('已取消');
        this.fetchData();
      }).catch(() => {});
    },
    handleAdd() { this.addVisible = true; },
    resetAddForm() { this.$refs.addForm?.resetFields(); this.addForm = { device_id: '', title: '', description: '' }; },
    submitAdd() {
      this.$refs.addForm.validate(async valid => {
        if (!valid) return;
        const res = await createRepair(this.addForm);
        if (res.code === 0) { this.$message.success('报修提交成功'); this.addVisible = false; this.fetchData(); }
      });
    },
    statusLabel(s) {
      const m = { pending: '待处理', processing: '处理中', completed: '已完成' };
      return m[s] || s;
    },
    statusType(s) {
      const m = { pending: 'danger', processing: 'warning', completed: 'success' };
      return m[s] || 'info';
    }
  }
};
</script>

<style scoped>
.card-header { display: flex; justify-content: space-between; align-items: center; }
</style>
