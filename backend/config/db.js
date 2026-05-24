const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcryptjs');

let _db = null;

function getDB() {
  return _db;
}

function createDB(dbPath) {
  const db = new Database(dbPath || path.join(__dirname, '..', 'database.db'));
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  _db = db;
  return db;
}

function initDB() {
  const db = getDB();
  db.exec(`
    CREATE TABLE IF NOT EXISTS communities (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      address TEXT
    );

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      real_name TEXT NOT NULL,
      phone TEXT,
      role TEXT NOT NULL DEFAULT 'user' CHECK(role IN ('admin','user','maintainer')),
      community_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (community_id) REFERENCES communities(id)
    );

    CREATE TABLE IF NOT EXISTS devices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      model TEXT,
      ip_address TEXT,
      location TEXT,
      community_id INTEGER,
      status TEXT DEFAULT 'normal' CHECK(status IN ('normal','fault','repairing','offline')),
      install_date TEXT,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (community_id) REFERENCES communities(id)
    );

    CREATE TABLE IF NOT EXISTS repairs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      device_id INTEGER,
      user_id INTEGER,
      maintainer_id INTEGER,
      community_id INTEGER,
      title TEXT NOT NULL,
      description TEXT,
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending','processing','completed')),
      repair_result TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (device_id) REFERENCES devices(id),
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (maintainer_id) REFERENCES users(id),
      FOREIGN KEY (community_id) REFERENCES communities(id)
    );

    CREATE TABLE IF NOT EXISTS reimbursements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      repair_id INTEGER,
      maintainer_id INTEGER,
      amount REAL NOT NULL,
      description TEXT,
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected')),
      admin_comment TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (repair_id) REFERENCES repairs(id),
      FOREIGN KEY (maintainer_id) REFERENCES users(id)
    );
  `);
}

function seedIfEmpty() {
  const db = getDB();
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get();
  if (userCount.count === 0) {
    const hash = bcrypt.hashSync('123456', 10);

    db.prepare("INSERT INTO communities (name, address) VALUES (?, ?)").run('阳光花园', 'XX市XX区阳光路100号');
    db.prepare("INSERT INTO communities (name, address) VALUES (?, ?)").run('翠苑小区', 'XX市XX区翠苑路200号');

    const insertUser = db.prepare("INSERT INTO users (username, password, real_name, phone, role, community_id) VALUES (?,?,?,?,?,?)");
    insertUser.run('admin', hash, '系统管理员', '13800000001', 'admin', 1);
    insertUser.run('user1', hash, '张三', '13800000002', 'user', 1);
    insertUser.run('user2', hash, '李四', '13800000003', 'user', 2);
    insertUser.run('maintainer1', hash, '王五', '13800000004', 'maintainer', 1);
    insertUser.run('maintainer2', hash, '赵六', '13800000005', 'maintainer', 2);

    const insertDevice = db.prepare("INSERT INTO devices (name, type, model, ip_address, location, community_id, status, install_date, description) VALUES (?,?,?,?,?,?,?,?,?)");
    insertDevice.run('核心交换机', '交换机', 'H3C S5500', '192.168.1.1', '1栋机房', 1, 'normal', '2023-01-15', '小区核心汇聚交换机');
    insertDevice.run('接入交换机-A1', '交换机', 'H3C S5120', '192.168.1.10', 'A栋弱电井', 1, 'normal', '2023-01-15', 'A栋接入交换机');
    insertDevice.run('无线AP-广场', '无线AP', 'Huawei AP7050', '192.168.1.100', '中心广场', 1, 'fault', '2023-02-20', '广场公共WiFi覆盖');
    insertDevice.run('光收发器-B1', '光端设备', '烽火 FH-1000', '192.168.1.200', 'B栋地下室', 1, 'repairing', '2023-03-10', 'B栋光纤接入设备');
    insertDevice.run('核心路由器', '路由器', 'Huawei AR2200', '10.0.0.1', '2栋机房', 2, 'normal', '2023-01-20', '翠苑小区出口路由器');
    insertDevice.run('接入交换机-C1', '交换机', 'H3C S5120', '10.0.0.10', 'C栋弱电井', 2, 'offline', '2023-02-15', 'C栋接入交换机');

    const insertRepair = db.prepare("INSERT INTO repairs (device_id, user_id, maintainer_id, community_id, title, description, status, repair_result, created_at) VALUES (?,?,?,?,?,?,?,?,?)");
    insertRepair.run(3, 2, 4, 1, '广场WiFi信号中断', '广场区域无法搜索到WiFi信号', 'completed', '更换电源模块后恢复正常', '2024-05-10 09:00:00');
    insertRepair.run(4, 2, 4, 1, 'B栋光纤信号弱', 'B栋用户反映网络时断时续', 'processing', null, '2024-05-12 14:30:00');
    insertRepair.run(6, 3, 5, 2, 'C栋交换机离线', 'C栋整栋楼无法上网', 'pending', null, '2024-05-13 08:00:00');

    const insertReim = db.prepare("INSERT INTO reimbursements (repair_id, maintainer_id, amount, description, status, admin_comment) VALUES (?,?,?,?,?,?)");
    insertReim.run(1, 4, 350.00, '更换电源模块费用', 'approved', '同意报销');
    insertReim.run(1, 4, 50.00, '交通费用', 'pending', null);
  }
}

module.exports = { getDB, createDB, initDB, seedIfEmpty };
