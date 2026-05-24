<template>
  <el-container class="layout-container">
    <el-aside :width="isCollapse ? '64px' : '200px'" class="layout-aside">
      <div class="logo-box">
        <span v-if="!isCollapse">设备维修管理</span>
        <i v-else class="el-icon-s-platform" style="font-size:24px;color:#409EFF"></i>
      </div>
      <el-menu
        :default-active="activeMenu"
        router
        :collapse="isCollapse"
        background-color="#304156"
        text-color="#bfcbd9"
        active-text-color="#409EFF"
      >
        <el-menu-item index="/dashboard">
          <i class="el-icon-s-home"></i>
          <span>首页</span>
        </el-menu-item>

        <el-menu-item v-if="user.role === 'admin'" index="/devices">
          <i class="el-icon-s-platform"></i>
          <span>设备信息管理</span>
        </el-menu-item>

        <el-menu-item v-if="user.role === 'user'" index="/my-repairs">
          <i class="el-icon-s-order"></i>
          <span>我的报修</span>
        </el-menu-item>

        <el-menu-item v-if="user.role !== 'user'" index="/repairs">
          <i class="el-icon-s-claim"></i>
          <span>报修工单管理</span>
        </el-menu-item>

        <el-menu-item v-if="user.role === 'admin' || user.role === 'maintainer'" index="/reimbursements">
          <i class="el-icon-money"></i>
          <span>费用报销管理</span>
        </el-menu-item>

        <el-menu-item index="/statistics">
          <i class="el-icon-s-data"></i>
          <span>数据统计</span>
        </el-menu-item>

        <el-menu-item v-if="user.role === 'admin'" index="/users">
          <i class="el-icon-user"></i>
          <span>用户管理</span>
        </el-menu-item>
      </el-menu>
    </el-aside>

    <el-container>
      <el-header class="layout-header">
        <div class="header-left">
          <i :class="isCollapse ? 'el-icon-s-unfold' : 'el-icon-s-fold'" class="collapse-btn" @click="isCollapse = !isCollapse"></i>
          <el-breadcrumb separator="/">
            <el-breadcrumb-item :to="{ path: '/dashboard' }">首页</el-breadcrumb-item>
            <el-breadcrumb-item v-if="currentTitle">{{ currentTitle }}</el-breadcrumb-item>
          </el-breadcrumb>
        </div>
        <div class="header-right">
          <el-tag :type="roleTagType" size="small">{{ roleText }}</el-tag>
          <el-dropdown @command="handleCommand" style="margin-left:12px">
            <span class="user-info">
              {{ user.real_name }} <i class="el-icon-arrow-down"></i>
            </span>
            <el-dropdown-menu slot="dropdown">
              <el-dropdown-item icon="el-icon-switch-button" command="logout">退出登录</el-dropdown-item>
            </el-dropdown-menu>
          </el-dropdown>
        </div>
      </el-header>

      <el-main class="layout-main">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script>
export default {
  name: 'MainLayout',
  data() {
    return {
      isCollapse: false
    };
  },
  computed: {
    user() {
      return this.$store.state.user || {};
    },
    activeMenu() {
      return this.$route.path;
    },
    currentTitle() {
      return this.$route.meta.title || '';
    },
    roleText() {
      const map = { admin: '管理员', user: '普通用户', maintainer: '维修人员' };
      return map[this.user.role] || '';
    },
    roleTagType() {
      const map = { admin: 'danger', user: 'info', maintainer: 'warning' };
      return map[this.user.role] || 'info';
    }
  },
  methods: {
    handleCommand(cmd) {
      if (cmd === 'logout') {
        this.$store.dispatch('logout');
        this.$router.push('/login');
        this.$message.success('已退出登录');
      }
    }
  }
};
</script>

<style scoped>
.layout-container { height: 100vh; }
.layout-aside {
  background-color: #304156;
  overflow-x: hidden;
  transition: width 0.3s;
}
.logo-box {
  height: 60px;
  line-height: 60px;
  text-align: center;
  color: #fff;
  font-size: 16px;
  font-weight: bold;
  background: #263445;
  white-space: nowrap;
}
.layout-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #fff;
  border-bottom: 1px solid #e6e6e6;
  padding: 0 20px;
  height: 60px;
}
.header-left { display: flex; align-items: center; }
.collapse-btn { font-size: 20px; cursor: pointer; margin-right: 16px; color: #606266; }
.header-right { display: flex; align-items: center; }
.user-info { cursor: pointer; color: #606266; }
.layout-main { background: #f0f2f5; padding: 20px; overflow-y: auto; }
.el-menu { border-right: none; }
.el-menu-item.is-active { background-color: #263445 !important; }
</style>
