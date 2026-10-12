-- MySQL Database Schema for Info Lomba Ko+Lab

CREATE DATABASE IF NOT EXISTS info_lomba_kolab CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE info_lomba_kolab;

-- 1. Startups / Program Studi Table
CREATE TABLE IF NOT EXISTS startups (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  code VARCHAR(50) NOT NULL,
  description TEXT,
  status ENUM('active', 'inactive') DEFAULT 'active',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. Users Table
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role ENUM('admin', 'dosen', 'mahasiswa') DEFAULT 'mahasiswa',
  nip_nim VARCHAR(50),
  phone VARCHAR(30),
  startup_id INT,
  startup_name VARCHAR(150),
  expertise JSON,
  skills JSON,
  status ENUM('active', 'inactive') DEFAULT 'active',
  avatar VARCHAR(255),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (startup_id) REFERENCES startups(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. Competitions Table
CREATE TABLE IF NOT EXISTS competitions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL,
  organizer VARCHAR(255) NOT NULL,
  description TEXT,
  prize_pool VARCHAR(100),
  registration_deadline DATE NOT NULL,
  event_date DATE,
  status ENUM('upcoming', 'ongoing', 'completed', 'cancelled') DEFAULT 'ongoing',
  max_team_members INT DEFAULT 3,
  requirements JSON,
  image_url TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. Teams Table
CREATE TABLE IF NOT EXISTS teams (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  competition_id INT NOT NULL,
  competition_title VARCHAR(255),
  leader_id INT NOT NULL,
  leader_name VARCHAR(150),
  advisor_id INT,
  advisor_name VARCHAR(150),
  advisor_status ENUM('none', 'pending', 'approved', 'rejected') DEFAULT 'none',
  status ENUM('forming', 'complete', 'withdrawn') DEFAULT 'forming',
  members JSON,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (competition_id) REFERENCES competitions(id) ON DELETE CASCADE,
  FOREIGN KEY (leader_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (advisor_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 5. Submissions Table
CREATE TABLE IF NOT EXISTS submissions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  type VARCHAR(50) NOT NULL,
  type_label VARCHAR(100) NOT NULL,
  team_id INT,
  team_name VARCHAR(150),
  competition_title VARCHAR(255),
  applicant_id INT NOT NULL,
  applicant_name VARCHAR(150),
  applicant_role VARCHAR(50),
  notes TEXT,
  admin_notes TEXT,
  status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
  submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  processed_at DATETIME
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 6. Broadcasts Table
CREATE TABLE IF NOT EXISTS broadcasts (
  id VARCHAR(50) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  target VARCHAR(100) NOT NULL,
  targetCode VARCHAR(50) NOT NULL,
  category VARCHAR(100) NOT NULL,
  priority ENUM('normal', 'high', 'urgent') DEFAULT 'normal',
  message TEXT NOT NULL,
  actionUrl TEXT,
  scheduleDate VARCHAR(100),
  sentAt VARCHAR(100),
  recipientsCount INT DEFAULT 0,
  readCount INT DEFAULT 0,
  status VARCHAR(50) DEFAULT 'Terkirim',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
