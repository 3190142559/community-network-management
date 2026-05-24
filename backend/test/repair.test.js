const { request, loginAs } = require('./helpers');

describe('Repair API', () => {
  let adminToken, maintainerToken, userToken, maintainerId, userId;

  beforeAll(async () => {
    adminToken = await loginAs('admin');
    maintainerToken = await loginAs('maintainer');
    userToken = await loginAs('user');
    maintainerId = 4; // maintainer1
    userId = 2; // user1
  });

  // ============ CREATE REPAIR ============
  describe('POST /api/repairs', () => {
    it('user can submit repair request', async () => {
      const res = await request.post('/api/repairs').set('Authorization', `Bearer ${userToken}`).send({
        device_id: 1, title: '测试报修-网络故障', description: '网速很慢'
      });
      expect(res.body.code).toBe(0);
      expect(res.body.data.id).toBeTruthy();
    });

    it('should fail without device_id', async () => {
      const res = await request.post('/api/repairs').set('Authorization', `Bearer ${userToken}`).send({
        title: '无设备报修'
      });
      expect(res.body.code).toBe(1);
    });

    it('should fail without title', async () => {
      const res = await request.post('/api/repairs').set('Authorization', `Bearer ${userToken}`).send({
        device_id: 1
      });
      expect(res.body.code).toBe(1);
    });
  });

  // ============ LIST REPAIRS ============
  describe('GET /api/repairs', () => {
    it('admin can see all repairs', async () => {
      const res = await request.get('/api/repairs').set('Authorization', `Bearer ${adminToken}`);
      expect(res.body.code).toBe(0);
      expect(res.body.data.total).toBeGreaterThanOrEqual(3);
    });

    it('user can only see own repairs', async () => {
      const res = await request.get('/api/repairs').set('Authorization', `Bearer ${userToken}`);
      expect(res.body.code).toBe(0);
      res.body.data.list.forEach(r => expect(r.user_id).toBe(userId));
    });

    it('maintainer sees repairs in own community', async () => {
      const res = await request.get('/api/repairs').set('Authorization', `Bearer ${maintainerToken}`);
      expect(res.body.code).toBe(0);
      res.body.data.list.forEach(r => expect(r.community_id).toBe(1));
    });

    it('admin can filter by status', async () => {
      const res = await request.get('/api/repairs?status=pending').set('Authorization', `Bearer ${adminToken}`);
      expect(res.body.code).toBe(0);
      res.body.data.list.forEach(r => expect(r.status).toBe('pending'));
    });
  });

  // ============ WORKFLOW: PENDING -> PROCESSING -> COMPLETED ============
  describe('Repair Workflow', () => {
    let repairId;

    beforeAll(async () => {
      // Create a new repair as user
      const res = await request.post('/api/repairs').set('Authorization', `Bearer ${userToken}`).send({
        device_id: 1, title: '工作流测试报修', description: '测试完整工单流程'
      });
      repairId = res.body.data.id;
    });

    it('step1: new repair should be pending', async () => {
      const res = await request.get(`/api/repairs/${repairId}`).set('Authorization', `Bearer ${adminToken}`);
      expect(res.body.data.status).toBe('pending');
    });

    it('step2: maintainer accepts repair (pending -> processing)', async () => {
      const res = await request.put(`/api/repairs/${repairId}`).set('Authorization', `Bearer ${maintainerToken}`).send({
        status: 'processing'
      });
      expect(res.body.code).toBe(0);
      const check = await request.get(`/api/repairs/${repairId}`).set('Authorization', `Bearer ${adminToken}`);
      expect(check.body.data.status).toBe('processing');
    });

    it('step3: maintainer completes repair (processing -> completed)', async () => {
      const res = await request.put(`/api/repairs/${repairId}`).set('Authorization', `Bearer ${maintainerToken}`).send({
        status: 'completed', repair_result: '更换网线后恢复正常'
      });
      expect(res.body.code).toBe(0);
      const check = await request.get(`/api/repairs/${repairId}`).set('Authorization', `Bearer ${adminToken}`);
      expect(check.body.data.status).toBe('completed');
      expect(check.body.data.repair_result).toBe('更换网线后恢复正常');
    });
  });

  // ============ DELETE (ADMIN ONLY) ============
  describe('DELETE /api/repairs/:id', () => {
    it('non-admin cannot delete', async () => {
      const res = await request.delete('/api/repairs/3').set('Authorization', `Bearer ${maintainerToken}`);
      expect(res.body.code).toBe(403);
    });

    it('admin can delete repair', async () => {
      const res = await request.delete('/api/repairs/3').set('Authorization', `Bearer ${adminToken}`);
      expect(res.body.code).toBe(0);
    });
  });
});
