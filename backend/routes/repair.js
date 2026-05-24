const express = require('express');
const { getDB } = require('../config/db');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');

const router = express.Router();

// GET /api/repairs
router.get('/', authMiddleware, (req, res) => {
  const { page = 1, pageSize = 10, status, community_id } = req.query;
  let where = 'WHERE 1=1';
  const params = [];

  if (req.user.role === 'user') {
    where += ' AND r.user_id = ?';
    params.push(req.user.id);
  } else if (req.user.role === 'maintainer') {
    where += ' AND r.community_id = ?';
    params.push(req.user.community_id);
  }
  // admin sees all

  if (status) { where += ' AND r.status = ?'; params.push(status); }
  if (community_id && req.user.role === 'admin') { where += ' AND r.community_id = ?'; params.push(Number(community_id)); }

  const total = getDB().prepare(`SELECT COUNT(*) as count FROM repairs r ${where}`).get(...params).count;
  const list = getDB().prepare(`
    SELECT r.*, d.name as device_name, u.real_name as user_name, m.real_name as maintainer_name, c.name as community_name
    FROM repairs r
    LEFT JOIN devices d ON r.device_id = d.id
    LEFT JOIN users u ON r.user_id = u.id
    LEFT JOIN users m ON r.maintainer_id = m.id
    LEFT JOIN communities c ON r.community_id = c.id
    ${where} ORDER BY r.created_at DESC LIMIT ? OFFSET ?`)
    .all(...params, Number(pageSize), (Number(page) - 1) * Number(pageSize));

  res.json({ code: 0, data: { list, total, page: Number(page), pageSize: Number(pageSize) } });
});

// GET /api/repairs/:id
router.get('/:id', authMiddleware, (req, res) => {
  const repair = getDB().prepare(`
    SELECT r.*, d.name as device_name, u.real_name as user_name, m.real_name as maintainer_name, c.name as community_name
    FROM repairs r
    LEFT JOIN devices d ON r.device_id = d.id
    LEFT JOIN users u ON r.user_id = u.id
    LEFT JOIN users m ON r.maintainer_id = m.id
    LEFT JOIN communities c ON r.community_id = c.id
    WHERE r.id = ?`).get(Number(req.params.id));
  if (!repair) return res.json({ code: 1, message: '工单不存在' });
  res.json({ code: 0, data: repair });
});

// POST /api/repairs
router.post('/', authMiddleware, roleMiddleware('user', 'admin'), (req, res) => {
  const { device_id, title, description } = req.body;
  if (!device_id || !title) {
    return res.json({ code: 1, message: '设备和标题不能为空' });
  }
  const result = getDB().prepare('INSERT INTO repairs (device_id, user_id, community_id, title, description, status) VALUES (?,?,?,?,?,?)')
    .run(device_id, req.user.id, req.user.community_id, title, description || '', 'pending');
  res.json({ code: 0, data: { id: result.lastInsertRowid }, message: '报修提交成功' });
});

// PUT /api/repairs/:id
router.put('/:id', authMiddleware, (req, res) => {
  const repair = getDB().prepare('SELECT * FROM repairs WHERE id = ?').get(Number(req.params.id));
  if (!repair) return res.json({ code: 1, message: '工单不存在' });

  // maintainer can only update repairs in their community
  if (req.user.role === 'maintainer' && repair.community_id !== req.user.community_id) {
    return res.json({ code: 403, message: '无权操作该工单' });
  }

  const { status, maintainer_id, repair_result } = req.body;
  if (status === 'processing') {
    // Assign maintainer
    getDB().prepare('UPDATE repairs SET status=?, maintainer_id=?, updated_at=CURRENT_TIMESTAMP WHERE id=?')
      .run('processing', maintainer_id || req.user.id, Number(req.params.id));
  } else if (status === 'completed') {
    getDB().prepare('UPDATE repairs SET status=?, repair_result=?, updated_at=CURRENT_TIMESTAMP WHERE id=?')
      .run('completed', repair_result || '', Number(req.params.id));
  } else {
    getDB().prepare('UPDATE repairs SET status=?, updated_at=CURRENT_TIMESTAMP WHERE id=?')
      .run(status, Number(req.params.id));
  }
  res.json({ code: 0, message: '更新成功' });
});

// DELETE /api/repairs/:id
router.delete('/:id', authMiddleware, roleMiddleware('admin'), (req, res) => {
  getDB().prepare('DELETE FROM repairs WHERE id = ?').run(Number(req.params.id));
  res.json({ code: 0, message: '删除成功' });
});

module.exports = router;
