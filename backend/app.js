const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { createDB, initDB, seedIfEmpty } = require('./config/db');
const authRoutes = require('./routes/auth');
const deviceRoutes = require('./routes/device');
const repairRoutes = require('./routes/repair');
const reimbursementRoutes = require('./routes/reimbursement');
const statisticsRoutes = require('./routes/statistics');

function createApp(dbPath) {
  // Initialize database
  createDB(dbPath);
  initDB();
  seedIfEmpty();

  const app = express();

  // Serve frontend static files
  const frontendDist = path.join(__dirname, '..', 'frontend', 'dist');
  if (fs.existsSync(frontendDist)) {
    app.use(express.static(frontendDist));
  }

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

  // Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/devices', deviceRoutes);
  app.use('/api/repairs', repairRoutes);
  app.use('/api/reimbursements', reimbursementRoutes);
  app.use('/api/statistics', statisticsRoutes);

  // Error handling
  app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  });

  return app;
}

module.exports = { createApp };
