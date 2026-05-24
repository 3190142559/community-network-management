const { request, loginAs } = require('./helpers');

describe('Reimbursement API', () => {
  let adminToken, maintainerToken;

  beforeAll(async () => {
    adminToken = await loginAs('admin');
    maintainerToken = await loginAs('maintainer');
  });

  // ============ CREATE ============
  describe('POST /api/reimbursements', () => {
    it('maintainer can submit reimbursement', async () => {
      const res = await request.post('/api/reimbursements').set('Authorization', `Bearer ${maintainerToken}`).send({
        repair_id: 1, // completed repair
        amount: 200.50,
        description: '更换光纤模块费用'
      });
      expect(res.body.code).toBe(0);
      expect(res.body.data.id).toBeTruthy();
    });

    it('should fail without repair_id', async () => {
      const res = await request.post('/api/reimbursements').set('Authorization', `Bearer ${maintainerToken}`).send({
        amount: 100
      });
      expect(res.body.code).toBe(1);
    });

    it('should fail without amount', async () => {
      const res = await request.post('/api/reimbursements').set('Authorization', `Bearer ${maintainerToken}`).send({
        repair_id: 1
      });
      expect(res.body.code).toBe(1);
    });
  });

  // ============ LIST ============
  describe('GET /api/reimbursements', () => {
    it('admin can see all reimbursements', async () => {
      const res = await request.get('/api/reimbursements').set('Authorization', `Bearer ${adminToken}`);
      expect(res.body.code).toBe(0);
      expect(res.body.data.total).toBeGreaterThanOrEqual(2);
    });

    it('maintainer can only see own reimbursements', async () => {
      const res = await request.get('/api/reimbursements').set('Authorization', `Bearer ${maintainerToken}`);
      expect(res.body.code).toBe(0);
      res.body.data.list.forEach(r => expect(r.maintainer_id).toBe(4)); // maintainer1 id=4
    });

    it('admin can filter by status', async () => {
      const res = await request.get('/api/reimbursements?status=pending').set('Authorization', `Bearer ${adminToken}`);
      expect(res.body.code).toBe(0);
      res.body.data.list.forEach(r => expect(r.status).toBe('pending'));
    });
  });

  // ============ APPROVAL WORKFLOW ============
  describe('Reimbursement Approval Workflow', () => {
    let reimId;

    beforeAll(async () => {
      // Create a new reimbursement
      const res = await request.post('/api/reimbursements').set('Authorization', `Bearer ${maintainerToken}`).send({
        repair_id: 1, amount: 150.00, description: '测试审核流程'
      });
      reimId = res.body.data.id;
    });

    it('step1: new reimbursement should be pending', async () => {
      const res = await request.get(`/api/reimbursements/${reimId}`).set('Authorization', `Bearer ${adminToken}`);
      expect(res.body.data.status).toBe('pending');
    });

    it('step2: admin approves reimbursement', async () => {
      const res = await request.put(`/api/reimbursements/${reimId}`).set('Authorization', `Bearer ${adminToken}`).send({
        status: 'approved', admin_comment: '费用合理，同意报销'
      });
      expect(res.body.code).toBe(0);
      const check = await request.get(`/api/reimbursements/${reimId}`).set('Authorization', `Bearer ${adminToken}`);
      expect(check.body.data.status).toBe('approved');
      expect(check.body.data.admin_comment).toBe('费用合理，同意报销');
    });

    it('non-admin cannot approve', async () => {
      // Create another one and try to approve as maintainer
      const createRes = await request.post('/api/reimbursements').set('Authorization', `Bearer ${maintainerToken}`).send({
        repair_id: 1, amount: 50, description: '测试越权'
      });
      const newId = createRes.body.data.id;
      const res = await request.put(`/api/reimbursements/${newId}`).set('Authorization', `Bearer ${maintainerToken}`).send({
        status: 'approved', admin_comment: '越权操作'
      });
      expect(res.body.code).toBe(403);
    });
  });

  // ============ DELETE (ADMIN ONLY) ============
  describe('DELETE /api/reimbursements/:id', () => {
    it('admin can delete reimbursement', async () => {
      const createRes = await request.post('/api/reimbursements').set('Authorization', `Bearer ${maintainerToken}`).send({
        repair_id: 1, amount: 10, description: '待删除'
      });
      const res = await request.delete(`/api/reimbursements/${createRes.body.data.id}`).set('Authorization', `Bearer ${adminToken}`);
      expect(res.body.code).toBe(0);
    });
  });
});
