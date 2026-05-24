const express = require('express');
const { getDB } = require('../config/db');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');

const router = express.Router();

// GET /api/reimbursements
router.get('/', authMiddleware, (req, res) => {
  const { page = 1, pageSize = 10, status } = req.query;
  let where = 'WHERE 1=1';
  const params = [];

  if (req.user.role === 'maintainer') {
    where += ' AND r.maintainer_id = ?';
    params.push(req.user.id);
  }
  if (status) { where += ' AND r.status = ?'; params.push(status); }

  const total = getDB().prepare(`SELECT COUNT(*) as count FROM reimbursements r ${where}`).get(...params).count;
  const list = getDB().prepare(`
    SELECT r.*, rp.title as repair_title, u.real_name as maintainer_name, c.name as community_name
    FROM reimbursements r
    LEFT JOIN repairs rp ON r.repair_id = rp.id
    LEFT JOIN users u ON r.maintainer_id = u.id
    LEFT JOIN communities c ON u.community_id = c.id
    ${where} ORDER BY r.created_at DESC LIMIT ? OFFSET ?`)
    .all(...params, Number(pageSize), (Number(page) - 1) * Number(pageSize));

  res.json({ code: 0, data: { list, total, page: Number(page), pageSize: Number(pageSize) } });
});

// GET /api/reimbursements/:id
router.get('/:id', authMiddleware, (req, res) => {
  const item = getDB().prepare(`
    SELECT r.*, rp.title as repair_title, u.real_name as maintainer_name
    FROM reimbursements r
    LEFT JOIN repairs rp ON r.repair_id = rp.id
    LEFT JOIN users u ON r.maintainer_id = u.id
    WHERE r.id = ?`).get(Number(req.params.id));
  if (!item) return res.json({ code: 1, message: '报销申请不存在' });
  res.json({ code: 0, data: item });
});

// POST /api/reimbursements
router.post('/', authMiddleware, roleMiddleware('maintainer', 'admin'), (req, res) => {
  const { repair_id, amount, description } = req.body;
  if (!repair_id || !amount) {
    return res.json({ code: 1, message: '关联工单和金额不能为空' });
  }
  const result = getDB().prepare('INSERT INTO reimbursements (repair_id, maintainer_id, amount, description, status) VALUES (?,?,?,?,?)')
    .run(repair_id, req.user.id, Number(amount), description || '', 'pending');
  res.json({ code: 0, data: { id: result.lastInsertRowid }, message: '报销申请提交成功' });
});

// PUT /api/reimbursements/:id (approve/reject)
router.put('/:id', authMiddleware, roleMiddleware('admin'), (req, res) => {
  const { status, admin_comment } = req.body;
  if (!['approved', 'rejected'].includes(status)) {
    return res.json({ code: 1, message: '审核状态不正确' });
  }
  getDB().prepare('UPDATE reimbursements SET status=?, admin_comment=?, updated_at=CURRENT_TIMESTAMP WHERE id=?')
    .run(status, admin_comment || '', Number(req.params.id));
  res.json({ code: 0, message: status === 'approved' ? '已通过' : '已拒绝' });
});

// DELETE /api/reimbursements/:id
router.delete('/:id', authMiddleware, roleMiddleware('admin'), (req, res) => {
  getDB().prepare('DELETE FROM reimbursements WHERE id = ?').run(Number(req.params.id));
  res.json({ code: 0, message: '删除成功' });
});

module.exports = router;
