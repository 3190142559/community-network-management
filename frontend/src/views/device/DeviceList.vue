<template>
  <div>
    <el-card>
      <div slot="header" class="card-header">
        <span>设备信息列表</span>
        <el-button type="primary" size="small" icon="el-icon-plus" @click="handleAdd">添加设备</el-button>
      </div>

      <el-form :inline="true" :model="query" size="small" style="margin-bottom:16px">
        <el-form-item label="设备名称">
          <el-input v-model="query.name" placeholder="搜索名称" clearable />
        </el-form-item>
        <el-form-item label="设备类型">
          <el-select v-model="query.type" placeholder="全部" clearable>
            <el-option label="交换机" value="交换机" />
            <el-option label="路由器" value="路由器" />
            <el-option label="无线AP" value="无线AP" />
            <el-option label="光端设备" value="光端设备" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="query.status" placeholder="全部" clearable>
            <el-option label="正常" value="normal" />
            <el-option label="故障" value="fault" />
            <el-option label="维修中" value="repairing" />
            <el-option label="离线" value="offline" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="fetchData">查询</el-button>
          <el-button @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>

      <el-table :data="list" border v-loading="loading" style="width:100%">
        <el-table-column prop="id" label="ID" width="60" />
        <el-table-column prop="name" label="设备名称" min-width="140" />
        <el-table-column prop="type" label="设备类型" width="100" />
        <el-table-column prop="model" label="型号" width="120" />
        <el-table-column prop="ip_address" label="IP地址" width="140" />
        <el-table-column prop="location" label="位置" width="120" />
        <el-table-column prop="community_name" label="所属小区" width="120" />
        <el-table-column label="状态" width="90">
          <template slot-scope="{row}">
            <el-tag :type="statusType(row.status)" size="small">{{ statusLabel(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="install_date" label="安装日期" width="110" />
        <el-table-column label="操作" width="180" fixed="right">
          <template slot-scope="{row}">
            <el-button type="text" size="small" icon="el-icon-edit" @click="handleEdit(row)">编辑</el-button>
            <el-button type="text" size="small" style="color:#F56C6C" icon="el-icon-delete" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        style="margin-top:16px;text-align:right"
        :current-page="query.page"
        :page-sizes="[10,20,50]"
        :page-size="query.pageSize"
        :total="total"
        layout="total,sizes,prev,pager,next"
        @size-change="v => { query.pageSize = v; fetchData(); }"
        @current-change="v => { query.page = v; fetchData(); }"
      />
    </el-card>

    <el-dialog :title="dialogTitle" :visible.sync="dialogVisible" width="550px" @close="resetForm">
      <el-form ref="form" :model="form" :rules="rules" label-width="90px" size="small">
        <el-form-item label="设备名称" prop="name">
          <el-input v-model="form.name" />
        </el-form-item>
        <el-form-item label="设备类型" prop="type">
          <el-select v-model="form.type" style="width:100%">
            <el-option label="交换机" value="交换机" />
            <el-option label="路由器" value="路由器" />
            <el-option label="无线AP" value="无线AP" />
            <el-option label="光端设备" value="光端设备" />
          </el-select>
        </el-form-item>
        <el-form-item label="型号" prop="model">
          <el-input v-model="form.model" />
        </el-form-item>
        <el-form-item label="IP地址">
          <el-input v-model="form.ip_address" />
        </el-form-item>
        <el-form-item label="位置">
          <el-input v-model="form.location" />
        </el-form-item>
        <el-form-item label="所属小区" prop="community_id">
          <el-select v-model="form.community_id" style="width:100%">
            <el-option v-for="c in communities" :key="c.id" :label="c.name" :value="c.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="form.status" style="width:100%">
            <el-option label="正常" value="normal" />
            <el-option label="故障" value="fault" />
            <el-option label="维修中" value="repairing" />
            <el-option label="离线" value="offline" />
          </el-select>
        </el-form-item>
        <el-form-item label="安装日期">
          <el-date-picker v-model="form.install_date" type="date" placeholder="选择日期" value-format="yyyy-MM-dd" style="width:100%" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="form.description" type="textarea" :rows="2" />
        </el-form-item>
      </el-form>
      <div slot="footer">
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="submitForm">确认</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { getDevices, createDevice, updateDevice, deleteDevice } from '../../api/device';
import { getCommunities } from '../../api/auth';

export default {
  name: 'DeviceList',
  data() {
    return {
      query: { page: 1, pageSize: 10, name: '', type: '', status: '' },
      list: [], total: 0, loading: false,
      dialogVisible: false, dialogTitle: '', submitLoading: false,
      isEdit: false, editId: null,
      form: { name: '', type: '', model: '', ip_address: '', location: '', community_id: 1, status: 'normal', install_date: '', description: '' },
      rules: {
        name: [{ required: true, message: '请输入设备名称', trigger: 'blur' }],
        type: [{ required: true, message: '请选择设备类型', trigger: 'change' }]
      },
      communities: []
    };
  },
  created() {
    this.fetchData();
    this.loadCommunities();
  },
  methods: {
    async fetchData() {
      this.loading = true;
      try {
        const res = await getDevices(this.query);
        if (res.code === 0) {
          this.list = res.data.list;
          this.total = res.data.total;
        }
      } finally { this.loading = false; }
    },
    async loadCommunities() {
      const res = await getCommunities();
      if (res.code === 0) this.communities = res.data;
    },
    resetQuery() {
      this.query = { page: 1, pageSize: 10, name: '', type: '', status: '' };
      this.fetchData();
    },
    handleAdd() {
      this.dialogTitle = '添加设备';
      this.isEdit = false;
      this.dialogVisible = true;
    },
    handleEdit(row) {
      this.dialogTitle = '编辑设备';
      this.isEdit = true;
      this.editId = row.id;
      Object.keys(this.form).forEach(k => { if (row[k] !== undefined) this.form[k] = row[k]; });
      this.dialogVisible = true;
    },
    handleDelete(row) {
      this.$confirm('确认删除该设备？', '提示', { type: 'warning' }).then(async () => {
        const res = await deleteDevice(row.id);
        if (res.code === 0) { this.$message.success('删除成功'); this.fetchData(); }
      }).catch(() => {});
    },
    resetForm() {
      this.$refs.form?.resetFields();
      this.form = { name: '', type: '', model: '', ip_address: '', location: '', community_id: 1, status: 'normal', install_date: '', description: '' };
    },
    submitForm() {
      this.$refs.form.validate(async valid => {
        if (!valid) return;
        this.submitLoading = true;
        try {
          const res = this.isEdit
            ? await updateDevice(this.editId, this.form)
            : await createDevice(this.form);
          if (res.code === 0) {
            this.$message.success(this.isEdit ? '更新成功' : '添加成功');
            this.dialogVisible = false;
            this.fetchData();
          }
        } finally { this.submitLoading = false; }
      });
    },
    statusLabel(s) {
      const m = { normal: '正常', fault: '故障', repairing: '维修中', offline: '离线' };
      return m[s] || s;
    },
    statusType(s) {
      const m = { normal: 'success', fault: 'danger', repairing: 'warning', offline: 'info' };
      return m[s] || 'info';
    }
  }
};
</script>

<style scoped>
.card-header { display: flex; justify-content: space-between; align-items: center; }
</style>
