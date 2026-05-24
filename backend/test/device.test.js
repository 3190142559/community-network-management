const { request, loginAs } = require('./helpers');

describe('Device API', () => {
  let adminToken, maintainerToken, userToken;

  beforeAll(async () => {
    adminToken = await loginAs('admin');
    maintainerToken = await loginAs('maintainer');
    userToken = await loginAs('user');
  });

  // ============ LIST ============
  describe('GET /api/devices', () => {
    it('admin can get all devices', async () => {
      const res = await request.get('/api/devices').set('Authorization', `Bearer ${adminToken}`);
      expect(res.body.code).toBe(0);
      expect(res.body.data.list.length).toBeGreaterThan(0);
      expect(res.body.data.total).toBeGreaterThanOrEqual(6);
    });

    it('maintainer can only see own community devices', async () => {
      const res = await request.get('/api/devices').set('Authorization', `Bearer ${maintainerToken}`);
      expect(res.body.code).toBe(0);
      res.body.data.list.forEach(d => {
        expect(d.community_id).toBe(1); // maintainer1 belongs to community 1
      });
    });

    it('user can only see own community devices', async () => {
      const res = await request.get('/api/devices').set('Authorization', `Bearer ${userToken}`);
      expect(res.body.code).toBe(0);
      res.body.data.list.forEach(d => {
        expect(d.community_id).toBe(1);
      });
    });

    it('admin can filter by status', async () => {
      const res = await request.get('/api/devices?status=fault').set('Authorization', `Bearer ${adminToken}`);
      expect(res.body.code).toBe(0);
      res.body.data.list.forEach(d => expect(d.status).toBe('fault'));
    });

    it('admin can filter by type', async () => {
      const res = await request.get('/api/devices').query({ type: '路由器' }).set('Authorization', `Bearer ${adminToken}`);
      expect(res.body.code).toBe(0);
      res.body.data.list.forEach(d => expect(d.type).toBe('路由器'));
    });

    it('supports pagination', async () => {
      const res = await request.get('/api/devices?page=1&pageSize=2').set('Authorization', `Bearer ${adminToken}`);
      expect(res.body.code).toBe(0);
      expect(res.body.data.list.length).toBeLessThanOrEqual(2);
    });
  });

  // ============ GET BY ID ============
  describe('GET /api/devices/:id', () => {
    it('should return device detail', async () => {
      const res = await request.get('/api/devices/1').set('Authorization', `Bearer ${adminToken}`);
      expect(res.body.code).toBe(0);
      expect(res.body.data.name).toBe('核心交换机');
    });

    it('should return error for nonexistent device', async () => {
      const res = await request.get('/api/devices/999').set('Authorization', `Bearer ${adminToken}`);
      expect(res.body.code).toBe(1);
    });
  });

  // ============ CREATE (ADMIN ONLY) ============
  describe('POST /api/devices', () => {
    it('admin can create device', async () => {
      const res = await request.post('/api/devices').set('Authorization', `Bearer ${adminToken}`).send({
        name: '测试交换机', type: '交换机', model: 'Test-M1', ip_address: '192.168.99.1',
        location: '测试机房', community_id: 1, status: 'normal'
      });
      expect(res.body.code).toBe(0);
      expect(res.body.data.id).toBeTruthy();
    });

    it('maintainer cannot create device', async () => {
      const res = await request.post('/api/devices').set('Authorization', `Bearer ${maintainerToken}`).send({
        name: '非法设备', type: '交换机'
      });
      expect(res.body.code).toBe(403);
    });

    it('should fail with missing name', async () => {
      const res = await request.post('/api/devices').set('Authorization', `Bearer ${adminToken}`).send({ type: '交换机' });
      expect(res.body.code).toBe(1);
    });
  });

  // ============ UPDATE (ADMIN ONLY) ============
  describe('PUT /api/devices/:id', () => {
    it('admin can update device', async () => {
      const res = await request.put('/api/devices/1').set('Authorization', `Bearer ${adminToken}`).send({
        name: '核心交换机-已升级', type: '交换机', model: 'H3C S5500-V2', ip_address: '192.168.1.1',
        location: '1栋机房', community_id: 1, status: 'normal'
      });
      expect(res.body.code).toBe(0);
    });
  });

  // ============ DELETE (ADMIN ONLY) ============
  describe('DELETE /api/devices/:id', () => {
    it('non-admin cannot delete', async () => {
      const res = await request.delete('/api/devices/2').set('Authorization', `Bearer ${maintainerToken}`);
      expect(res.body.code).toBe(403);
    });

    it('admin can delete device', async () => {
      // First create a device, then delete it
      const createRes = await request.post('/api/devices').set('Authorization', `Bearer ${adminToken}`).send({
        name: '待删除设备', type: '交换机'
      });
      const newId = createRes.body.data.id;
      const res = await request.delete(`/api/devices/${newId}`).set('Authorization', `Bearer ${adminToken}`);
      expect(res.body.code).toBe(0);
    });
  });
});
