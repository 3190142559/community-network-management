<template>
  <div class="login-container">
    <div class="login-card">
      <h2 class="login-title">社区网络设备维修管理系统</h2>
      <el-form ref="loginForm" :model="form" :rules="rules" label-width="0">
        <el-form-item prop="username">
          <el-input v-model="form.username" placeholder="请输入用户名" prefix-icon="el-icon-user" size="medium" />
        </el-form-item>
        <el-form-item prop="password">
          <el-input v-model="form.password" type="password" placeholder="请输入密码" prefix-icon="el-icon-lock" size="medium" @keyup.enter.native="handleLogin" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" size="medium" style="width:100%" :loading="loading" @click="handleLogin">登 录</el-button>
        </el-form-item>
      </el-form>
      <div class="login-tips">
        <p><b>默认账号：</b></p>
        <p>管理员：admin / 123456</p>
        <p>普通用户：user1 / 123456</p>
        <p>维修人员：maintainer1 / 123456</p>
      </div>
    </div>
  </div>
</template>

<script>
import { login as loginApi } from '../api/auth';

export default {
  name: 'Login',
  data() {
    return {
      form: { username: '', password: '' },
      rules: {
        username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
        password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
      },
      loading: false
    };
  },
  methods: {
    handleLogin() {
      this.$refs.loginForm.validate(async valid => {
        if (!valid) return;
        this.loading = true;
        try {
          const res = await loginApi(this.form);
          if (res.code === 0) {
            await this.$store.dispatch('login', res.data);
            this.$message.success('登录成功');
            this.$router.push('/');
          } else {
            this.$message.error(res.message);
          }
        } catch {
          this.$message.error('登录失败');
        } finally {
          this.loading = false;
        }
      });
    }
  }
};
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background: linear-gradient(135deg, #1e3c72 0%, #2a5298 50%, #1e3c72 100%);
}
.login-card {
  width: 400px;
  padding: 40px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.2);
}
.login-title {
  text-align: center;
  color: #303133;
  margin-bottom: 30px;
  font-size: 20px;
}
.login-tips {
  margin-top: 20px;
  padding: 12px;
  background: #f5f7fa;
  border-radius: 4px;
  font-size: 12px;
  color: #909399;
  line-height: 1.8;
}
.login-tips b { color: #606266; }
</style>
