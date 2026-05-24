<template>
  <div class="dashboard">
    <el-row :gutter="20">
      <el-col :span="6" v-for="card in cards" :key="card.label">
        <el-card shadow="hover" class="stat-card">
          <div class="card-inner">
            <div class="card-icon" :style="{ background: card.color }">
              <i :class="card.icon"></i>
            </div>
            <div class="card-text">
              <div class="card-value">{{ card.value }}</div>
              <div class="card-label">{{ card.label }}</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top:20px">
      <el-col :span="12">
        <el-card>
          <div slot="header">设备状态分布</div>
          <div ref="deviceChart" style="height:300px"></div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card>
          <div slot="header">报修工单统计</div>
          <div ref="repairChart" style="height:300px"></div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top:20px">
      <el-col :span="24">
        <el-card>
          <div slot="header">最近6个月报修趋势</div>
          <div ref="monthlyChart" style="height:300px"></div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script>
import * as echarts from 'echarts';
import { getOverview, getDeviceStats, getRepairStats } from '../../api/statistics';

export default {
  name: 'Dashboard',
  data() {
    return {
      cards: [
        { icon: 'el-icon-s-platform', label: '设备总数', value: 0, color: '#409EFF' },
        { icon: 'el-icon-s-claim', label: '报修总数', value: 0, color: '#E6A23C' },
        { icon: 'el-icon-warning', label: '待处理工单', value: 0, color: '#F56C6C' },
        { icon: 'el-icon-loading', label: '处理中工单', value: 0, color: '#67C23A' }
      ]
    };
  },
  mounted() {
    this.fetchData();
  },
  methods: {
    async fetchData() {
      try {
        const [overviewRes, deviceRes, repairRes] = await Promise.all([
          getOverview(), getDeviceStats(), getRepairStats()
        ]);
        if (overviewRes.code === 0) {
          const d = overviewRes.data;
          this.cards[0].value = d.totalDevices;
          this.cards[1].value = d.totalRepairs;
          this.cards[2].value = d.pendingRepairs;
          this.cards[3].value = d.processingRepairs;
        }
        if (deviceRes.code === 0) this.renderDeviceChart(deviceRes.data);
        if (repairRes.code === 0) this.renderRepairChart(repairRes.data);
      } catch (e) { console.error(e); }
    },
    renderDeviceChart(data) {
      const chart = echarts.init(this.$refs.deviceChart);
      chart.setOption({
        tooltip: { trigger: 'item' },
        legend: { bottom: 0 },
        series: [{
          type: 'pie',
          radius: ['45%', '70%'],
          data: data.byStatus.map(i => ({ name: this.statusLabel(i.name), value: i.value })),
          label: { formatter: '{b}: {c}' }
        }]
      });
      window.addEventListener('resize', () => chart.resize());
    },
    renderRepairChart(data) {
      const chart = echarts.init(this.$refs.repairChart);
      chart.setOption({
        tooltip: { trigger: 'item' },
        legend: { bottom: 0 },
        series: [{
          type: 'pie',
          radius: ['45%', '70%'],
          data: data.byStatus.map(i => ({ name: this.repairStatusLabel(i.name), value: i.value })),
          label: { formatter: '{b}: {c}' }
        }]
      });
      this.renderMonthlyChart(data.monthlyStats);
      window.addEventListener('resize', () => chart.resize());
    },
    renderMonthlyChart(monthlyStats) {
      const chart = echarts.init(this.$refs.monthlyChart);
      chart.setOption({
        tooltip: { trigger: 'axis' },
        xAxis: { type: 'category', data: monthlyStats.map(i => i.month) },
        yAxis: { type: 'value', minInterval: 1 },
        series: [{
          type: 'bar',
          data: monthlyStats.map(i => i.count),
          itemStyle: { color: '#409EFF', borderRadius: [4, 4, 0, 0] }
        }],
        grid: { left: 40, right: 20, top: 20, bottom: 30 }
      });
      window.addEventListener('resize', () => chart.resize());
    },
    statusLabel(s) {
      const m = { normal: '正常', fault: '故障', repairing: '维修中', offline: '离线' };
      return m[s] || s;
    },
    repairStatusLabel(s) {
      const m = { pending: '待处理', processing: '处理中', completed: '已完成' };
      return m[s] || s;
    }
  }
};
</script>

<style scoped>
.stat-card { cursor: pointer; }
.card-inner { display: flex; align-items: center; }
.card-icon {
  width: 60px; height: 60px; border-radius: 8px;
  display: flex; align-items: center; justify-content: center;
  font-size: 28px; color: #fff; margin-right: 16px;
}
.card-value { font-size: 28px; font-weight: bold; color: #303133; }
.card-label { font-size: 14px; color: #909399; margin-top: 4px; }
</style>
