const { request, loginAs } = require('./helpers');

describe('Auth API', () => {
  // ============ LOGIN ============
  describe('POST /api/auth/login', () => {
    it('admin should login successfully', async () => {
      const res = await request.post('/api/auth/login').send({ username: 'admin', password: '123456' });
      expect(res.body.code).toBe(0);
      expect(res.body.data.token).toBeTruthy();
      expect(res.body.data.user.role).toBe('admin');
    });

    it('maintainer should login successfully', async () => {
      const res = await request.post('/api/auth/login').send({ username: 'maintainer1', password: '123456' });
      expect(res.body.code).toBe(0);
      expect(res.body.data.user.role).toBe('maintainer');
    });

    it('normal user should login successfully', async () => {
      const res = await request.post('/api/auth/login').send({ username: 'user1', password: '123456' });
      expect(res.body.code).toBe(0);
      expect(res.body.data.user.role).toBe('user');
    });

    it('should fail with wrong password', async () => {
      const res = await request.post('/api/auth/login').send({ username: 'admin', password: 'wrong' });
      expect(res.body.code).toBe(1);
      expect(res.body.message).toContain('错误');
    });

    it('should fail with nonexistent user', async () => {
      const res = await request.post('/api/auth/login').send({ username: 'nobody', password: '123456' });
      expect(res.body.code).toBe(1);
    });

    it('should fail with empty fields', async () => {
      const res = await request.post('/api/auth/login').send({ username: '', password: '' });
      expect(res.body.code).toBe(1);
    });
  });

  // ============ REGISTER ============
  describe('POST /api/auth/register', () => {
    it('should register a new user', async () => {
      const res = await request.post('/api/auth/register').send({
        username: 'newuser', password: '123456', real_name: '新用户', phone: '13900000001', community_id: 1
      });
      expect(res.body.code).toBe(0);
      expect(res.body.data.id).toBeTruthy();
    });

    it('should fail with duplicate username', async () => {
      const res = await request.post('/api/auth/register').send({
        username: 'admin', password: '123456', real_name: '重复'
      });
      expect(res.body.code).toBe(1);
    });

    it('should fail with missing required fields', async () => {
      const res = await request.post('/api/auth/register').send({ username: 'test' });
      expect(res.body.code).toBe(1);
    });
  });

  // ============ USER INFO ============
  describe('GET /api/auth/userinfo', () => {
    it('should return user info with valid token', async () => {
      const token = await loginAs('admin');
      const res = await request.get('/api/auth/userinfo').set('Authorization', `Bearer ${token}`);
      expect(res.body.code).toBe(0);
      expect(res.body.data.username).toBe('admin');
    });

    it('should fail without token', async () => {
      const res = await request.get('/api/auth/userinfo');
      expect(res.body.code).toBe(401);
    });

    it('should fail with invalid token', async () => {
      const res = await request.get('/api/auth/userinfo').set('Authorization', 'Bearer invalidtoken');
      expect(res.body.code).toBe(401);
    });
  });

  // ============ USER MANAGEMENT (ADMIN) ============
  describe('User Management', () => {
    let adminToken, userToken;

    beforeAll(async () => {
      adminToken = await loginAs('admin');
      userToken = await loginAs('user');
    });

    it('admin can get all users', async () => {
      const res = await request.get('/api/auth/users').set('Authorization', `Bearer ${adminToken}`);
      expect(res.body.code).toBe(0);
      expect(res.body.data.length).toBeGreaterThanOrEqual(5);
    });

    it('admin can filter users by role', async () => {
      const res = await request.get('/api/auth/users?role=maintainer').set('Authorization', `Bearer ${adminToken}`);
      expect(res.body.code).toBe(0);
      res.body.data.forEach(u => expect(u.role).toBe('maintainer'));
    });

    it('non-admin cannot get user list', async () => {
      const res = await request.get('/api/auth/users').set('Authorization', `Bearer ${userToken}`);
      expect(res.body.code).toBe(403);
    });

    it('admin can update a user', async () => {
      const res = await request.put('/api/auth/users/2').set('Authorization', `Bearer ${adminToken}`).send({
        real_name: '张三改', phone: '13900000000', role: 'user', community_id: 1
      });
      expect(res.body.code).toBe(0);
    });

    it('admin cannot delete self', async () => {
      const res = await request.delete('/api/auth/users/1').set('Authorization', `Bearer ${adminToken}`);
      expect(res.body.code).toBe(1);
    });
  });

  // ============ COMMUNITIES ============
  describe('GET /api/auth/communities', () => {
    it('should return community list', async () => {
      const token = await loginAs('admin');
      const res = await request.get('/api/auth/communities').set('Authorization', `Bearer ${token}`);
      expect(res.body.code).toBe(0);
      expect(res.body.data.length).toBe(2);
    });
  });
});
