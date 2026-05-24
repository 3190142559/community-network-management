-- 社区网络设备维修管理系统 - MySQL初始化脚本
-- 此文件仅供 MySQL 环境参考，默认使用 SQLite (better-sqlite3)

CREATE DATABASE IF NOT EXISTS community_network DEFAULT CHARSET utf8mb4;
USE community_network;

CREATE TABLE communities (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  address VARCHAR(255)
);

CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(50) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  real_name VARCHAR(50) NOT NULL,
  phone VARCHAR(20),
  role ENUM('admin','user','maintainer') NOT NULL DEFAULT 'user',
  community_id INT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (community_id) REFERENCES communities(id)
);

CREATE TABLE devices (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  type VARCHAR(50) NOT NULL,
  model VARCHAR(100),
  ip_address VARCHAR(50),
  location VARCHAR(100),
  community_id INT,
  status ENUM('normal','fault','repairing','offline') DEFAULT 'normal',
  install_date DATE,
  description TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (community_id) REFERENCES communities(id)
);

CREATE TABLE repairs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  device_id INT,
  user_id INT,
  maintainer_id INT,
  community_id INT,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  status ENUM('pending','processing','completed') DEFAULT 'pending',
  repair_result TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (device_id) REFERENCES devices(id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (maintainer_id) REFERENCES users(id),
  FOREIGN KEY (community_id) REFERENCES communities(id)
);

CREATE TABLE reimbursements (
  id INT PRIMARY KEY AUTO_INCREMENT,
  repair_id INT,
  maintainer_id INT,
  amount DECIMAL(10,2) NOT NULL,
  description TEXT,
  status ENUM('pending','approved','rejected') DEFAULT 'pending',
  admin_comment TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (repair_id) REFERENCES repairs(id),
  FOREIGN KEY (maintainer_id) REFERENCES users(id)
);
