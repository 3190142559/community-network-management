<template>
  <div>
    <el-card>
      <div slot="header" class="card-header">
        <span>费用报销管理</span>
        <el-button v-if="userRole === 'maintainer'" type="primary" size="small" icon="el-icon-plus" @click="handleAdd">提交报销</el-button>
      </div>

      <el-form :inline="true" :model="query" size="small" style="margin-bottom:16px">
        <el-form-item label="状态">
          <el-select v-model="query.status" placeholder="全部" clearable>
            <el-option label="待审核" value="pending" />
            <el-option label="已通过" value="approved" />
            <el-option label="已拒绝" value="rejected" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="fetchData">查询</el-button>
          <el-button @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>

      <el-table :data="list" border v-loading="loading" style="width:100%">
        <el-table-column prop="id" label="ID" width="60" />
        <el-table-column prop="repair_title" label="关联工单" min-width="150" />
        <el-table-column prop="maintainer_name" label="申请人" width="90" />
        <el-table-column prop="amount" label="金额(元)" width="100">
          <template slot-scope="{row}">¥{{ row.amount }}</template>
        </el-table-column>
        <el-table-column label="状态" width="90">
          <template slot-scope="{row}">
            <el-tag :type="statusType(row.status)" size="small">{{ statusLabel(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="admin_comment" label="审核意见" min-width="120">
          <template slot-scope="{row}">{{ row.admin_comment || '-' }}</template>
        </el-table-column>
        <el-table-column prop="created_at" label="申请时间" width="140" />
        <el-table-column label="操作" width="200" fixed="right">
          <template slot-scope="{row}">
            <template v-if="userRole === 'admin' && row.status === 'pending'">
              <el-button type="text" size="small" style="color:#67C23A" @click="handleApprove(row)">通过</el-button>
              <el-button type="text" size="small" style="color:#F56C6C" @click="handleReject(row)">拒绝</el-button>
            </template>
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
    <el-dialog title="报销详情" :visible.sync="detailVisible" width="500px">
      <el-descriptions :column="2" border size="small">
        <el-descriptions-item label="关联工单">{{ detail.repair_title }}</el-descriptions-item>
        <el-descriptions-item label="申请人">{{ detail.maintainer_name }}</el-descriptions-item>
        <el-descriptions-item label="金额">¥{{ detail.amount }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="statusType(detail.status)" size="small">{{ statusLabel(detail.status) }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="描述" :span="2">{{ detail.description || '-' }}</el-descriptions-item>
        <el-descriptions-item label="审核意见" :span="2">{{ detail.admin_comment || '-' }}</el-descriptions-item>
        <el-descriptions-item label="申请时间">{{ detail.created_at }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>

    <!-- Add dialog (maintainer) -->
    <el-dialog title="提交费用报销" :visible.sync="addVisible" width="500px" @close="resetAddForm">
      <el-form ref="addForm" :model="addForm" :rules="addRules" label-width="80px" size="small">
        <el-form-item label="关联工单" prop="repair_id">
          <el-select v-model="addForm.repair_id" style="width:100%" placeholder="请选择工单">
            <el-option v-for="r in completedRepairs" :key="r.id" :label="`#${r.id} ${r.title}`" :value="r.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="金额(元)" prop="amount">
          <el-input-number v-model="addForm.amount" :min="0" :precision="2" style="width:100%" />
        </el-form-item>
        <el-form-item label="费用说明">
          <el-input v-model="addForm.description" type="textarea" :rows="3" placeholder="请说明费用明细" />
        </el-form-item>
      </el-form>
      <div slot="footer">
        <el-button @click="addVisible = false">取消</el-button>
        <el-button type="primary" @click="submitAdd">提交</el-button>
      </div>
    </el-dialog>

    <!-- Approve/Reject dialog (admin) -->
    <el-dialog :title="auditTitle" :visible.sync="auditVisible" width="450px">
      <el-form :model="auditForm" label-width="80px" size="small">
        <el-form-item label="审核意见">
          <el-input v-model="auditForm.admin_comment" type="textarea" :rows="3" placeholder="请输入审核意见" />
        </el-form-item>
      </el-form>
      <div slot="footer">
        <el-button @click="auditVisible = false">取消</el-button>
        <el-button type="primary" @click="submitAudit">确认</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { getReimbursements, createReimbursement, updateReimbursement, deleteReimbursement } from '../../api/reimbursement';
import { getRepairs } from '../../api/repair';

export default {
  name: 'ReimbursementList',
  data() {
    return {
      query: { page: 1, pageSize: 10, status: '' },
      list: [], total: 0, loading: false,
      detailVisible: false, detail: {},
      addVisible: false, addForm: { repair_id: '', amount: 0, description: '' },
      addRules: { repair_id: [{ required: true, message: '请选择工单', trigger: 'change' }] },
      auditVisible: false, auditTitle: '', auditForm: { admin_comment: '' }, auditId: null, auditStatus: '',
      completedRepairs: []
    };
  },
  computed: {
    userRole() { return this.$store.state.user?.role || ''; }
  },
  created() { this.fetchData(); },
  methods: {
    async fetchData() {
      this.loading = true;
      try {
        const res = await getReimbursements(this.query);
        if (res.code === 0) { this.list = res.data.list; this.total = res.data.total; }
      } finally { this.loading = false; }
    },
    resetQuery() { this.query = { page: 1, pageSize: 10, status: '' }; this.fetchData(); },
    handleView(row) { this.detail = row; this.detailVisible = true; },
    handleDelete(row) {
      this.$confirm('确认删除？', '提示', { type: 'warning' }).then(async () => {
        await deleteReimbursement(row.id);
        this.$message.success('删除成功');
        this.fetchData();
      }).catch(() => {});
    },
    async handleAdd() {
      const res = await getRepairs({ pageSize: 100, status: 'completed' });
      this.completedRepairs = res.code === 0 ? res.data.list : [];
      this.addVisible = true;
    },
    resetAddForm() { this.$refs.addForm?.resetFields(); this.addForm = { repair_id: '', amount: 0, description: '' }; },
    submitAdd() {
      this.$refs.addForm.validate(async valid => {
        if (!valid) return;
        const res = await createReimbursement(this.addForm);
        if (res.code === 0) { this.$message.success('报销申请已提交'); this.addVisible = false; this.fetchData(); }
      });
    },
    handleApprove(row) { this.auditId = row.id; this.auditStatus = 'approved'; this.auditTitle = '通过报销申请'; this.auditForm.admin_comment = ''; this.auditVisible = true; },
    handleReject(row) { this.auditId = row.id; this.auditStatus = 'rejected'; this.auditTitle = '拒绝报销申请'; this.auditForm.admin_comment = ''; this.auditVisible = true; },
    async submitAudit() {
      const res = await updateReimbursement(this.auditId, { status: this.auditStatus, admin_comment: this.auditForm.admin_comment });
      if (res.code === 0) { this.$message.success('审核完成'); this.auditVisible = false; this.fetchData(); }
    },
    statusLabel(s) { const m = { pending: '待审核', approved: '已通过', rejected: '已拒绝' }; return m[s] || s; },
    statusType(s) { const m = { pending: 'warning', approved: 'success', rejected: 'danger' }; return m[s] || 'info'; }
  }
};
</script>

<style scoped>
.card-header { display: flex; justify-content: space-between; align-items: center; }
</style>
