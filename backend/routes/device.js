const express = require('express');
const { getDB } = require('../config/db');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');

const router = express.Router();

// GET /api/devices
router.get('/', authMiddleware, (req, res) => {
  const { page = 1, pageSize = 10, name, type, status, community_id } = req.query;
  let where = 'WHERE 1=1';
  const params = [];

  if (req.user.role === 'maintainer' || req.user.role === 'user') {
    where += ' AND d.community_id = ?';
    params.push(req.user.community_id);
  }
  if (name) { where += ' AND d.name LIKE ?'; params.push(`%${name}%`); }
  if (type) { where += ' AND d.type = ?'; params.push(type); }
  if (status) { where += ' AND d.status = ?'; params.push(status); }
  if (community_id && req.user.role === 'admin') { where += ' AND d.community_id = ?'; params.push(Number(community_id)); }

  const total = getDB().prepare(`SELECT COUNT(*) as count FROM devices d ${where}`).get(...params).count;
  const list = getDB().prepare(`SELECT d.*, c.name as community_name FROM devices d LEFT JOIN communities c ON d.community_id = c.id ${where} ORDER BY d.id DESC LIMIT ? OFFSET ?`)
    .all(...params, Number(pageSize), (Number(page) - 1) * Number(pageSize));

  res.json({ code: 0, data: { list, total, page: Number(page), pageSize: Number(pageSize) } });
});

// GET /api/devices/:id
router.get('/:id', authMiddleware, (req, res) => {
  const device = getDB().prepare('SELECT d.*, c.name as community_name FROM devices d LEFT JOIN communities c ON d.community_id = c.id WHERE d.id = ?').get(Number(req.params.id));
  if (!device) return res.json({ code: 1, message: '设备不存在' });
  res.json({ code: 0, data: device });
});

// POST /api/devices
router.post('/', authMiddleware, roleMiddleware('admin'), (req, res) => {
  const { name, type, model, ip_address, location, community_id, status, install_date, description } = req.body;
  if (!name || !type) {
    return res.json({ code: 1, message: '设备名称和类型不能为空' });
  }
  const result = getDB().prepare('INSERT INTO devices (name, type, model, ip_address, location, community_id, status, install_date, description) VALUES (?,?,?,?,?,?,?,?,?)')
    .run(name, type, model || '', ip_address || '', location || '', community_id || 1, status || 'normal', install_date || '', description || '');
  res.json({ code: 0, data: { id: result.lastInsertRowid }, message: '添加成功' });
});

// PUT /api/devices/:id
router.put('/:id', authMiddleware, roleMiddleware('admin'), (req, res) => {
  const { name, type, model, ip_address, location, community_id, status, install_date, description } = req.body;
  getDB().prepare('UPDATE devices SET name=?, type=?, model=?, ip_address=?, location=?, community_id=?, status=?, install_date=?, description=? WHERE id=?')
    .run(name, type, model || '', ip_address || '', location || '', community_id || 1, status || 'normal', install_date || '', description || '', Number(req.params.id));
  res.json({ code: 0, message: '更新成功' });
});

// DELETE /api/devices/:id
router.delete('/:id', authMiddleware, roleMiddleware('admin'), (req, res) => {
  getDB().prepare('DELETE FROM devices WHERE id = ?').run(Number(req.params.id));
  res.json({ code: 0, message: '删除成功' });
});

// GET /api/devices/options/all - for select dropdown
router.get('/options/all', authMiddleware, (req, res) => {
  const devices = getDB().prepare('SELECT id, name FROM devices ORDER BY id').all();
  res.json({ code: 0, data: devices });
});

module.exports = router;
