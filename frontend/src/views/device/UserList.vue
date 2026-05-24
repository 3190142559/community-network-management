<template>
  <div>
    <el-card>
      <div slot="header" class="card-header">
        <span>用户管理</span>
        <el-button type="primary" size="small" icon="el-icon-plus" @click="handleAdd">添加用户</el-button>
      </div>

      <el-form :inline="true" :model="query" size="small" style="margin-bottom:16px">
        <el-form-item label="角色">
          <el-select v-model="query.role" placeholder="全部" clearable>
            <el-option label="管理员" value="admin" />
            <el-option label="普通用户" value="user" />
            <el-option label="维修人员" value="maintainer" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="fetchData">查询</el-button>
          <el-button @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>

      <el-table :data="list" border v-loading="loading" style="width:100%">
        <el-table-column prop="id" label="ID" width="60" />
        <el-table-column prop="username" label="用户名" width="120" />
        <el-table-column prop="real_name" label="姓名" width="100" />
        <el-table-column prop="phone" label="电话" width="130" />
        <el-table-column label="角色" width="100">
          <template slot-scope="{row}">
            <el-tag :type="roleTag(row.role)" size="small">{{ roleLabel(row.role) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="注册时间" width="140" />
        <el-table-column label="操作" width="180">
          <template slot-scope="{row}">
            <el-button type="text" size="small" icon="el-icon-edit" @click="handleEdit(row)">编辑</el-button>
            <el-button type="text" size="small" style="color:#F56C6C" icon="el-icon-delete" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog :title="dialogTitle" :visible.sync="dialogVisible" width="450px" @close="resetForm">
      <el-form ref="form" :model="form" :rules="formRules" label-width="80px" size="small">
        <el-form-item v-if="!isEdit" label="用户名" prop="username">
          <el-input v-model="form.username" />
        </el-form-item>
        <el-form-item v-if="!isEdit" label="密码" prop="password">
          <el-input v-model="form.password" type="password" show-password />
        </el-form-item>
        <el-form-item label="姓名" prop="real_name">
          <el-input v-model="form.real_name" />
        </el-form-item>
        <el-form-item label="电话">
          <el-input v-model="form.phone" />
        </el-form-item>
        <el-form-item label="角色" prop="role">
          <el-select v-model="form.role" style="width:100%">
            <el-option label="管理员" value="admin" />
            <el-option label="普通用户" value="user" />
            <el-option label="维修人员" value="maintainer" />
          </el-select>
        </el-form-item>
        <el-form-item label="小区">
          <el-select v-model="form.community_id" style="width:100%">
            <el-option v-for="c in communities" :key="c.id" :label="c.name" :value="c.id" />
          </el-select>
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
import { getUsers, updateUser, deleteUser, register, getCommunities } from '../../api/auth';

export default {
  name: 'UserList',
  data() {
    return {
      query: { role: '' },
      list: [], loading: false,
      dialogVisible: false, dialogTitle: '', isEdit: false, editId: null, submitLoading: false,
      form: { username: '', password: '', real_name: '', phone: '', role: 'user', community_id: 1 },
      formRules: {
        username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
        password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
        real_name: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
        role: [{ required: true, message: '请选择角色', trigger: 'change' }]
      },
      communities: []
    };
  },
  created() {
    this.fetchData();
    getCommunities().then(r => { if (r.code === 0) this.communities = r.data; });
  },
  methods: {
    async fetchData() {
      this.loading = true;
      try {
        const res = await getUsers(this.query);
        if (res.code === 0) this.list = res.data;
      } finally { this.loading = false; }
    },
    resetQuery() { this.query.role = ''; this.fetchData(); },
    handleAdd() {
      this.dialogTitle = '添加用户'; this.isEdit = false;
      this.dialogVisible = true;
    },
    handleEdit(row) {
      this.dialogTitle = '编辑用户'; this.isEdit = true; this.editId = row.id;
      this.form = { username: row.username, password: '', real_name: row.real_name, phone: row.phone || '', role: row.role, community_id: row.community_id };
      this.dialogVisible = true;
    },
    handleDelete(row) {
      this.$confirm('确认删除该用户？', '提示', { type: 'warning' }).then(async () => {
        const res = await deleteUser(row.id);
        if (res.code === 0) { this.$message.success('删除成功'); this.fetchData(); }
        else { this.$message.error(res.message); }
      }).catch(() => {});
    },
    resetForm() {
      this.$refs.form?.resetFields();
      this.form = { username: '', password: '', real_name: '', phone: '', role: 'user', community_id: 1 };
    },
    submitForm() {
      this.$refs.form.validate(async valid => {
        if (!valid) return;
        this.submitLoading = true;
        try {
          let res;
          if (this.isEdit) {
            res = await updateUser(this.editId, this.form);
          } else {
            res = await register(this.form);
          }
          if (res.code === 0) {
            this.$message.success(this.isEdit ? '更新成功' : '添加成功');
            this.dialogVisible = false;
            this.fetchData();
          } else this.$message.error(res.message);
        } finally { this.submitLoading = false; }
      });
    },
    roleLabel(r) { const m = { admin: '管理员', user: '普通用户', maintainer: '维修人员' }; return m[r] || r; },
    roleTag(r) { const m = { admin: 'danger', user: 'info', maintainer: 'warning' }; return m[r] || 'info'; }
  }
};
</script>

<style scoped>
.card-header { display: flex; justify-content: space-between; align-items: center; }
</style>
