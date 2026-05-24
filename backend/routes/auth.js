const express = require('express');
const bcrypt = require('bcryptjs');
const { getDB } = require('../config/db');
const { generateToken, authMiddleware } = require('../middleware/auth');

const router = express.Router();

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.json({ code: 1, message: '用户名和密码不能为空' });
  }
  const user = getDB().prepare('SELECT * FROM users WHERE username = ?').get(username);
  if (!user) {
    return res.json({ code: 1, message: '用户名或密码错误' });
  }
  const valid = bcrypt.compareSync(password, user.password);
  if (!valid) {
    return res.json({ code: 1, message: '用户名或密码错误' });
  }
  const token = generateToken(user);
  res.json({
    code: 0,
    data: {
      token,
      user: { id: user.id, username: user.username, real_name: user.real_name, role: user.role, phone: user.phone, community_id: user.community_id }
    },
    message: '登录成功'
  });
});

// GET /api/auth/userinfo
router.get('/userinfo', authMiddleware, (req, res) => {
  const user = getDB().prepare('SELECT id, username, real_name, phone, role, community_id FROM users WHERE id = ?').get(req.user.id);
  res.json({ code: 0, data: user });
});

// POST /api/auth/register
router.post('/register', (req, res) => {
  const { username, password, real_name, phone, community_id } = req.body;
  if (!username || !password || !real_name) {
    return res.json({ code: 1, message: '必填字段不能为空' });
  }
  const exist = getDB().prepare('SELECT id FROM users WHERE username = ?').get(username);
  if (exist) {
    return res.json({ code: 1, message: '用户名已存在' });
  }
  const hash = bcrypt.hashSync(password, 10);
  const result = getDB().prepare('INSERT INTO users (username, password, real_name, phone, role, community_id) VALUES (?,?,?,?,?,?)')
    .run(username, hash, real_name, phone || '', 'user', community_id || 1);
  res.json({ code: 0, data: { id: result.lastInsertRowid }, message: '注册成功' });
});

// GET /api/auth/users - admin only
router.get('/users', authMiddleware, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.json({ code: 403, message: '权限不足' });
  }
  const { role, community_id } = req.query;
  let sql = 'SELECT id, username, real_name, phone, role, community_id, created_at FROM users WHERE 1=1';
  const params = [];
  if (role) { sql += ' AND role = ?'; params.push(role); }
  if (community_id) { sql += ' AND community_id = ?'; params.push(Number(community_id)); }
  const users = getDB().prepare(sql).all(...params);
  res.json({ code: 0, data: users });
});

// PUT /api/auth/users/:id - admin only
router.put('/users/:id', authMiddleware, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.json({ code: 403, message: '权限不足' });
  }
  const { real_name, phone, role, community_id } = req.body;
  getDB().prepare('UPDATE users SET real_name=?, phone=?, role=?, community_id=? WHERE id=?')
    .run(real_name, phone, role, community_id, Number(req.params.id));
  res.json({ code: 0, message: '更新成功' });
});

// DELETE /api/auth/users/:id - admin only
router.delete('/users/:id', authMiddleware, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.json({ code: 403, message: '权限不足' });
  }
  if (Number(req.params.id) === req.user.id) {
    return res.json({ code: 1, message: '不能删除自己的账号' });
  }
  getDB().prepare('DELETE FROM users WHERE id = ?').run(Number(req.params.id));
  res.json({ code: 0, message: '删除成功' });
});

// GET /api/auth/communities
router.get('/communities', authMiddleware, (req, res) => {
  const communities = getDB().prepare('SELECT * FROM communities').all();
  res.json({ code: 0, data: communities });
});

module.exports = router;
