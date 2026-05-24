const express = require('express');
const { getDB } = require('../config/db');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// GET /api/statistics/overview
router.get('/overview', authMiddleware, (req, res) => {
  let communityFilter = '';
  const params = [];
  if (req.user.role === 'maintainer' || req.user.role === 'user') {
    communityFilter = 'WHERE community_id = ?';
    params.push(req.user.community_id);
  }

  const totalDevices = getDB().prepare(`SELECT COUNT(*) as count FROM devices ${communityFilter}`).get(...params).count;
  const totalRepairs = getDB().prepare(`SELECT COUNT(*) as count FROM repairs ${communityFilter}`).get(...params).count;
  const pendingRepairs = getDB().prepare(`SELECT COUNT(*) as count FROM repairs ${communityFilter ? communityFilter + ' AND status = ?' : 'WHERE status = ?'}`)
    .get(...params, 'pending').count;
  const processingRepairs = getDB().prepare(`SELECT COUNT(*) as count FROM repairs ${communityFilter ? communityFilter + ' AND status = ?' : 'WHERE status = ?'}`)
    .get(...params, 'processing').count;

  res.json({
    code: 0,
    data: {
      totalDevices,
      totalRepairs,
      pendingRepairs,
      processingRepairs,
      completedRepairs: totalRepairs - pendingRepairs - processingRepairs
    }
  });
});

// GET /api/statistics/devices
router.get('/devices', authMiddleware, (req, res) => {
  let communityFilter = '';
  const params = [];
  if (req.user.role === 'maintainer' || req.user.role === 'user') {
    communityFilter = 'WHERE community_id = ?';
    params.push(req.user.community_id);
  }

  // By type
  const byStatus = getDB().prepare(`SELECT status as name, COUNT(*) as value FROM devices ${communityFilter} ${communityFilter ? 'AND' : 'WHERE'} status IS NOT NULL GROUP BY status`).all(...params);

  // By type
  const byType = getDB().prepare(`SELECT type as name, COUNT(*) as value FROM devices ${communityFilter} ${communityFilter ? 'AND' : 'WHERE'} type IS NOT NULL GROUP BY type`).all(...params);

  res.json({ code: 0, data: { byStatus, byType } });
});

// GET /api/statistics/repairs
router.get('/repairs', authMiddleware, (req, res) => {
  let communityFilter = '';
  const params = [];
  if (req.user.role === 'maintainer' || req.user.role === 'user') {
    communityFilter = 'WHERE community_id = ?';
    params.push(req.user.community_id);
  }

  // By status
  const byStatus = getDB().prepare(`SELECT status as name, COUNT(*) as value FROM repairs ${communityFilter} ${communityFilter ? 'AND' : 'WHERE'} status IS NOT NULL GROUP BY status`).all(...params);

  // Monthly repair count (last 6 months)
  const monthlyStats = getDB().prepare(`SELECT substr(created_at, 1, 7) as month, COUNT(*) as count FROM repairs ${communityFilter} ${communityFilter ? 'AND' : 'WHERE'} created_at >= date('now', '-6 months') GROUP BY month ORDER BY month`).all(...params);

  res.json({ code: 0, data: { byStatus, monthlyStats } });
});

// GET /api/statistics/reimbursements
router.get('/reimbursements', authMiddleware, (req, res) => {
  let communityFilter = '';
  const params = [];
  if (req.user.role === 'maintainer') {
    communityFilter = 'WHERE r.maintainer_id = ?';
    params.push(req.user.id);
  }

  const byStatus = getDB().prepare(`SELECT status as name, COUNT(*) as value FROM reimbursements r ${communityFilter} ${communityFilter ? 'AND' : 'WHERE'} status IS NOT NULL GROUP BY status`).all(...params);

  const amountStats = getDB().prepare(`SELECT status, COALESCE(SUM(amount),0) as total FROM reimbursements r ${communityFilter} ${communityFilter ? 'AND' : 'WHERE'} status IS NOT NULL GROUP BY status`).all(...params);

  res.json({ code: 0, data: { byStatus, amountStats } });
});

module.exports = router;
