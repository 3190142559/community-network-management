<template>
  <div class="statistics">
    <el-row :gutter="20">
      <el-col :span="8">
        <el-card><div slot="header">设备类型分布</div><div ref="deviceTypeChart" style="height:300px"></div></el-card>
      </el-col>
      <el-col :span="8">
        <el-card><div slot="header">设备状态分布</div><div ref="deviceStatusChart" style="height:300px"></div></el-card>
      </el-col>
      <el-col :span="8">
        <el-card><div slot="header">工单状态分布</div><div ref="repairStatusChart" style="height:300px"></div></el-card>
      </el-col>
    </el-row>
    <el-row :gutter="20" style="margin-top:20px">
      <el-col :span="12">
        <el-card><div slot="header">月度报修趋势</div><div ref="monthlyChart" style="height:300px"></div></el-card>
      </el-col>
      <el-col :span="12">
        <el-card v-if="userRole === 'admin' || userRole === 'maintainer'">
          <div slot="header">报销费用统计</div>
          <div ref="reimburseChart" style="height:300px"></div>
        </el-card>
        <el-card v-else>
          <div slot="header">我的报修统计</div>
          <div ref="myRepairChart" style="height:300px"></div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script>
import * as echarts from 'echarts';
import { getDeviceStats, getRepairStats, getReimbursementStats } from '../../api/statistics';

export default {
  name: 'Statistics',
  computed: {
    userRole() { return this.$store.state.user?.role || ''; }
  },
  mounted() { this.fetchData(); },
  methods: {
    async fetchData() {
      try {
        const [deviceRes, repairRes] = await Promise.all([getDeviceStats(), getRepairStats()]);
        if (deviceRes.code === 0) this.renderDeviceCharts(deviceRes.data);
        if (repairRes.code === 0) this.renderRepairCharts(repairRes.data);
        if (this.userRole === 'admin' || this.userRole === 'maintainer') {
          const reimRes = await getReimbursementStats();
          if (reimRes.code === 0) this.renderReimburseChart(reimRes.data);
        }
      } catch (e) { console.error(e); }
    },
    renderDeviceCharts(data) {
      const pieOption = (items, name) => ({
        tooltip: { trigger: 'item' },
        series: [{
          type: 'pie', radius: '65%', center: ['50%', '55%'],
          data: items.map(i => ({ name: name === 'type' ? i.name : this.devStatusLabel(i.name), value: i.value })),
          label: { formatter: '{b}: {c}' }
        }]
      });
      const tChart = echarts.init(this.$refs.deviceTypeChart);
      tChart.setOption(pieOption(data.byType, 'type'));
      window.addEventListener('resize', () => tChart.resize());

      const sChart = echarts.init(this.$refs.deviceStatusChart);
      sChart.setOption(pieOption(data.byStatus, 'status'));
      window.addEventListener('resize', () => sChart.resize());
    },
    renderRepairCharts(data) {
      const statusChart = echarts.init(this.$refs.repairStatusChart);
      statusChart.setOption({
        tooltip: { trigger: 'item' },
        series: [{
          type: 'pie', radius: '65%', center: ['50%', '55%'],
          data: data.byStatus.map(i => ({ name: this.repairStatusLabel(i.name), value: i.value })),
          label: { formatter: '{b}: {c}' }
        }]
      });
      window.addEventListener('resize', () => statusChart.resize());

      const monthlyChart = echarts.init(this.$refs.monthlyChart);
      monthlyChart.setOption({
        tooltip: { trigger: 'axis' },
        xAxis: { type: 'category', data: data.monthlyStats.map(i => i.month) },
        yAxis: { type: 'value', minInterval: 1 },
        series: [{
          type: 'line', smooth: true,
          data: data.monthlyStats.map(i => i.count),
          itemStyle: { color: '#409EFF' },
          areaStyle: { color: 'rgba(64,158,255,0.2)' }
        }],
        grid: { left: 40, right: 20, top: 20, bottom: 30 }
      });
      window.addEventListener('resize', () => monthlyChart.resize());
    },
    renderReimburseChart(data) {
      const chart = echarts.init(this.$refs.reimburseChart);
      chart.setOption({
        tooltip: { trigger: 'axis' },
        xAxis: { type: 'category', data: data.amountStats.map(i => this.reimStatusLabel(i.status)) },
        yAxis: { type: 'value' },
        series: [{
          type: 'bar',
          data: data.amountStats.map(i => i.total),
          itemStyle: { borderRadius: [4, 4, 0, 0] },
          label: { show: true, position: 'top', formatter: '¥{c}' }
        }],
        grid: { left: 60, right: 20, top: 20, bottom: 30 }
      });
      window.addEventListener('resize', () => chart.resize());
    },
    devStatusLabel(s) { const m = { normal: '正常', fault: '故障', repairing: '维修中', offline: '离线' }; return m[s] || s; },
    repairStatusLabel(s) { const m = { pending: '待处理', processing: '处理中', completed: '已完成' }; return m[s] || s; },
    reimStatusLabel(s) { const m = { pending: '待审核', approved: '已通过', rejected: '已拒绝' }; return m[s] || s; }
  }
};
</script>
