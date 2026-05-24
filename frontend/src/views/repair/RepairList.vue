<template>
  <div>
    <el-card>
      <div slot="header" class="card-header">
        <span>报修工单管理</span>
        <el-button v-if="userRole === 'admin'" type="primary" size="small" icon="el-icon-plus" @click="handleAdd">添加工单</el-button>
      </div>

      <el-form :inline="true" :model="query" size="small" style="margin-bottom:16px">
        <el-form-item label="状态">
          <el-select v-model="query.status" placeholder="全部" clearable>
            <el-option label="待处理" value="pending" />
            <el-option label="处理中" value="processing" />
            <el-option label="已完成" value="completed" />
          </el-select>
        </el-form-item>
        <el-form-item v-if="userRole === 'admin' && communities.length" label="小区">
          <el-select v-model="query.community_id" placeholder="全部" clearable>
            <el-option v-for="c in communities" :key="c.id" :label="c.name" :value="c.id" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="fetchData">查询</el-button>
          <el-button @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>

      <el-table :data="list" border v-loading="loading" style="width:100%">
        <el-table-column prop="id" label="ID" width="60" />
        <el-table-column prop="title" label="标题" min-width="160" />
        <el-table-column prop="device_name" label="设备" width="130" />
        <el-table-column prop="user_name" label="报修人" width="90" />
        <el-table-column prop="maintainer_name" label="维修人" width="90">
          <template slot-scope="{row}">{{ row.maintainer_name || '-' }}</template>
        </el-table-column>
        <el-table-column prop="community_name" label="小区" width="100" />
        <el-table-column label="状态" width="90">
          <template slot-scope="{row}">
            <el-tag :type="statusType(row.status)" size="small">{{ statusLabel(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" width="140" />
        <el-table-column label="操作" width="220" fixed="right">
          <template slot-scope="{row}">
            <el-button v-if="row.status === 'pending' && (userRole === 'maintainer' || userRole === 'admin')" type="text" size="small" @click="handleAccept(row)">接单</el-button>
            <el-button v-if="row.status === 'processing' && (row.maintainer_id === userId || userRole === 'admin')" type="text" size="small" @click="handleComplete(row)">完工</el-button>
            <el-button type="text" size="small" icon="el-icon-view" @click="handleView(row)">查看</el-button>
            <el-button v-if="userRole === 'admin'" type="text" size="small" style="color:#F56C6C" @click="handleDelete(row)">删除</el-button>
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
    <el-dialog title="工单详情" :visible.sync="detailVisible" width="550px">
      <el-descriptions :column="2" border size="small">
        <el-descriptions-item label="标题">{{ detail.title }}</el-descriptions-item>
        <el-descriptions-item label="设备">{{ detail.device_name }}</el-descriptions-item>
        <el-descriptions-item label="报修人">{{ detail.user_name }}</el-descriptions-item>
        <el-descriptions-item label="维修人">{{ detail.maintainer_name || '-' }}</el-descriptions-item>
        <el-descriptions-item label="小区">{{ detail.community_name }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="statusType(detail.status)" size="small">{{ statusLabel(detail.status) }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="描述" :span="2">{{ detail.description || '-' }}</el-descriptions-item>
        <el-descriptions-item label="维修结果" :span="2">{{ detail.repair_result || '-' }}</el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ detail.created_at }}</el-descriptions-item>
        <el-descriptions-item label="更新时间">{{ detail.updated_at }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>

    <!-- Complete dialog -->
    <el-dialog title="完工处理" :visible.sync="completeVisible" width="450px">
      <el-form :model="completeForm" label-width="80px" size="small">
        <el-form-item label="维修结果" prop="repair_result">
          <el-input v-model="completeForm.repair_result" type="textarea" :rows="3" placeholder="请填写维修结果" />
        </el-form-item>
      </el-form>
      <div slot="footer">
        <el-button @click="completeVisible = false">取消</el-button>
        <el-button type="primary" @click="submitComplete">确认完工</el-button>
      </div>
    </el-dialog>

    <!-- Add dialog (admin) -->
    <el-dialog title="添加报修工单" :visible.sync="addVisible" width="500px" @close="resetAddForm">
      <el-form ref="addForm" :model="addForm" :rules="addRules" label-width="80px" size="small">
        <el-form-item label="设备" prop="device_id">
          <el-select v-model="addForm.device_id" style="width:100%" placeholder="请选择设备">
            <el-option v-for="d in deviceOptions" :key="d.id" :label="d.name" :value="d.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="标题" prop="title">
          <el-input v-model="addForm.title" placeholder="请输入工单标题" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="addForm.description" type="textarea" :rows="3" />
        </el-form-item>
      </el-form>
      <div slot="footer">
        <el-button @click="addVisible = false">取消</el-button>
        <el-button type="primary" @click="submitAdd">确认</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { getRepairs, createRepair, updateRepair, deleteRepair } from '../../api/repair';
import { getCommunities } from '../../api/auth';
import { getDeviceOptions } from '../../api/device';

export default {
  name: 'RepairList',
  data() {
    return {
      query: { page: 1, pageSize: 10, status: '', community_id: '' },
      list: [], total: 0, loading: false,
      detailVisible: false, detail: {},
      completeVisible: false, completeForm: { repair_result: '' }, completeId: null,
      addVisible: false, addForm: { device_id: '', title: '', description: '' },
      addRules: {
        device_id: [{ required: true, message: '请选择设备', trigger: 'change' }],
        title: [{ required: true, message: '请输入标题', trigger: 'blur' }]
      },
      communities: [], deviceOptions: []
    };
  },
  computed: {
    userRole() { return this.$store.state.user?.role || ''; },
    userId() { return this.$store.state.user?.id; }
  },
  created() {
    this.fetchData();
    if (this.userRole === 'admin') {
      getCommunities().then(r => { if (r.code === 0) this.communities = r.data; });
      getDeviceOptions().then(r => { if (r.code === 0) this.deviceOptions = r.data; });
    }
  },
  methods: {
    async fetchData() {
      this.loading = true;
      try {
        const res = await getRepairs(this.query);
        if (res.code === 0) { this.list = res.data.list; this.total = res.data.total; }
      } finally { this.loading = false; }
    },
    resetQuery() {
      this.query = { page: 1, pageSize: 10, status: '', community_id: '' };
      this.fetchData();
    },
    handleView(row) {
      this.detail = row;
      this.detailVisible = true;
    },
    handleAccept(row) {
      this.$confirm('确认接单？', '提示').then(async () => {
        const res = await updateRepair(row.id, { status: 'processing' });
        if (res.code === 0) { this.$message.success('接单成功'); this.fetchData(); }
      }).catch(() => {});
    },
    handleComplete(row) {
      this.completeId = row.id;
      this.completeForm.repair_result = '';
      this.completeVisible = true;
    },
    async submitComplete() {
      const res = await updateRepair(this.completeId, { status: 'completed', repair_result: this.completeForm.repair_result });
      if (res.code === 0) { this.$message.success('完工'); this.completeVisible = false; this.fetchData(); }
    },
    handleDelete(row) {
      this.$confirm('确认删除该工单？', '提示', { type: 'warning' }).then(async () => {
        await deleteRepair(row.id);
        this.$message.success('删除成功');
        this.fetchData();
      }).catch(() => {});
    },
    handleAdd() { this.addVisible = true; },
    resetAddForm() { this.$refs.addForm?.resetFields(); this.addForm = { device_id: '', title: '', description: '' }; },
    submitAdd() {
      this.$refs.addForm.validate(async valid => {
        if (!valid) return;
        const res = await createRepair(this.addForm);
        if (res.code === 0) { this.$message.success('添加成功'); this.addVisible = false; this.fetchData(); }
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
