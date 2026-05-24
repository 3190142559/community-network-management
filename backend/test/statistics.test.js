const { request, loginAs } = require('./helpers');

describe('Statistics API', () => {
  let adminToken, maintainerToken, userToken;

  beforeAll(async () => {
    adminToken = await loginAs('admin');
    maintainerToken = await loginAs('maintainer');
    userToken = await loginAs('user');
  });

  // ============ OVERVIEW ============
  describe('GET /api/statistics/overview', () => {
    it('admin gets full overview', async () => {
      const res = await request.get('/api/statistics/overview').set('Authorization', `Bearer ${adminToken}`);
      expect(res.body.code).toBe(0);
      expect(res.body.data.totalDevices).toBeGreaterThan(0);
      expect(res.body.data.totalRepairs).toBeGreaterThan(0);
      expect(res.body.data).toHaveProperty('pendingRepairs');
      expect(res.body.data).toHaveProperty('processingRepairs');
      expect(res.body.data).toHaveProperty('completedRepairs');
    });

    it('maintainer gets community overview', async () => {
      const res = await request.get('/api/statistics/overview').set('Authorization', `Bearer ${maintainerToken}`);
      expect(res.body.code).toBe(0);
      expect(res.body.data.totalDevices).toBeGreaterThan(0);
    });

    it('user gets community overview', async () => {
      const res = await request.get('/api/statistics/overview').set('Authorization', `Bearer ${userToken}`);
      expect(res.body.code).toBe(0);
    });

    it('unauthenticated request fails', async () => {
      const res = await request.get('/api/statistics/overview');
      expect(res.body.code).toBe(401);
    });
  });

  // ============ DEVICE STATS ============
  describe('GET /api/statistics/devices', () => {
    it('should return device stats by status and type', async () => {
      const res = await request.get('/api/statistics/devices').set('Authorization', `Bearer ${adminToken}`);
      expect(res.body.code).toBe(0);
      expect(res.body.data).toHaveProperty('byStatus');
      expect(res.body.data).toHaveProperty('byType');
      expect(res.body.data.byStatus.length).toBeGreaterThan(0);
      res.body.data.byStatus.forEach(item => {
        expect(item).toHaveProperty('name');
        expect(item).toHaveProperty('value');
      });
    });
  });

  // ============ REPAIR STATS ============
  describe('GET /api/statistics/repairs', () => {
    it('should return repair stats by status and monthly trend', async () => {
      const res = await request.get('/api/statistics/repairs').set('Authorization', `Bearer ${adminToken}`);
      expect(res.body.code).toBe(0);
      expect(res.body.data).toHaveProperty('byStatus');
      expect(res.body.data).toHaveProperty('monthlyStats');
      res.body.data.byStatus.forEach(item => {
        expect(item).toHaveProperty('name');
        expect(item).toHaveProperty('value');
      });
    });
  });

  // ============ REIMBURSEMENT STATS ============
  describe('GET /api/statistics/reimbursements', () => {
    it('admin sees all reimbursement stats', async () => {
      const res = await request.get('/api/statistics/reimbursements').set('Authorization', `Bearer ${adminToken}`);
      expect(res.body.code).toBe(0);
      expect(res.body.data).toHaveProperty('byStatus');
      expect(res.body.data).toHaveProperty('amountStats');
    });

    it('maintainer only sees own reimbursement stats', async () => {
      const res = await request.get('/api/statistics/reimbursements').set('Authorization', `Bearer ${maintainerToken}`);
      expect(res.body.code).toBe(0);
    });
  });
});
