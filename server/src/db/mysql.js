import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
dotenv.config();

const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_PORT = process.env.DB_PORT || 3306;
const DB_USER = process.env.DB_USER || 'root';
const DB_PASSWORD = process.env.DB_PASSWORD || '';
const DB_NAME = process.env.DB_NAME || 'info_lomba_kolab';

let pool = null;
let isConnected = false;

export const initMySQL = async () => {
  try {
    // 1. Create connection without database to ensure DB exists
    const rootConn = await mysql.createConnection({
      host: DB_HOST,
      port: DB_PORT,
      user: DB_USER,
      password: DB_PASSWORD,
    });

    await rootConn.query(`CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
    await rootConn.end();

    // 2. Create connection pool to the database
    pool = mysql.createPool({
      host: DB_HOST,
      port: DB_PORT,
      user: DB_USER,
      password: DB_PASSWORD,
      database: DB_NAME,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    });

    // 3. Create Tables if not exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS startups (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(150) NOT NULL,
        code VARCHAR(50) NOT NULL,
        description TEXT,
        status ENUM('active', 'inactive') DEFAULT 'active',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await pool.query(`
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
    `);

    await pool.query(`
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
    `);

    await pool.query(`
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
    `);

    await pool.query(`
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
    `);

    await pool.query(`
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
    `);

    // 4. Seed initial data if tables are empty
    const [userRows] = await pool.query('SELECT COUNT(*) as count FROM users');
    if (userRows[0].count === 0) {
      await seedDatabase(pool);
    }

    isConnected = true;
    console.log(`✅ [MySQL] Successfully connected to database: ${DB_NAME} at ${DB_HOST}:${DB_PORT}`);
    return pool;
  } catch (error) {
    isConnected = false;
    console.warn(`⚠️ [MySQL] Could not connect to MySQL server (${error.message}). Falling back to JSON database engine.`);
    return null;
  }
};

const seedDatabase = async (dbPool) => {
  console.log('🌱 [MySQL] Seeding default database data...');
  const hashedPassword = bcrypt.hashSync('KoLab2026!', 10);

  // Seed startups
  await dbPool.query(`
    INSERT INTO startups (id, name, code, description) VALUES
    (1, 'Teknologi Informasi', 'TI', 'Program Studi Teknologi Informasi'),
    (2, 'Sistem Informasi', 'SI', 'Program Studi Sistem Informasi Enterprise'),
    (3, 'Teknik Komputer', 'TK', 'Program Studi Sistem Tertanam dan IoT'),
    (4, 'Bisnis Digital', 'BD', 'Program Studi Kewirausahaan Digital & FinTech')
  `);

  // Seed users
  await dbPool.query(`
    INSERT INTO users (id, name, email, password, role, nip_nim, phone, startup_id, startup_name) VALUES
    (1, 'Admin Ko+Lab System', 'admin@kolab.id', '${hashedPassword}', 'admin', 'ADM-2026-001', '081234567890', 1, 'Teknologi Informasi'),
    (2, 'Dr. Budi Santoso, M.T.', 'dosen@kolab.id', '${hashedPassword}', 'dosen', '198503122010121001', '081298765432', 1, 'Teknologi Informasi'),
    (3, 'Prof. Siti Aminah, Ph.D.', 'siti.aminah@kolab.id', '${hashedPassword}', 'dosen', '197804152005012002', '081311223344', 2, 'Sistem Informasi'),
    (4, 'Rina Wijaya', 'mahasiswa@kolab.id', '${hashedPassword}', 'mahasiswa', '2241720088', '085712348899', 1, 'Teknologi Informasi'),
    (5, 'Ahmad Fauzi', 'ahmad.fauzi@student.kolab.id', '${hashedPassword}', 'mahasiswa', '2241720102', '081987654321', 1, 'Teknologi Informasi'),
    (6, 'Dewi Lestari', 'dewi.lestari@student.kolab.id', '${hashedPassword}', 'mahasiswa', '2241720150', '085234567891', 2, 'Sistem Informasi')
  `);

  // Seed competitions
  await dbPool.query(`
    INSERT INTO competitions (id, title, category, organizer, description, prize_pool, registration_deadline, status) VALUES
    (1, 'National Hackathon Ko+Lab 2026', 'Software Development', 'Politeknik Negeri & Industri Tech', 'Kompetisi pembuatan aplikasi inovatif bertema Smart City dan Sustainability solusi berbasis AI & Web.', 'Rp 50.000.000', '2026-11-15', 'ongoing'),
    (2, 'Indonesian UI/UX Design Challenge 2026', 'Design & Experience', 'Association of Digital Designers', 'Kompetisi perancangan antarmuka pengguna berkualifikasi tinggi berfokus pada aksesibilitas.', 'Rp 25.000.000', '2026-10-30', 'ongoing'),
    (3, 'AI Startup & Business Plan Competition', 'Business & Pitch', 'Venture Capital & Innovation Hub', 'Ajang kompetisi rencana bisnis bagi mahasiswa pendiri startup teknologi di bidang AI.', 'Rp 75.000.000', '2026-12-05', 'upcoming')
  `);

  // Seed broadcasts
  await dbPool.query(`
    INSERT INTO broadcasts (id, title, target, targetCode, category, priority, message, sentAt, recipientsCount, readCount, status) VALUES
    ('BC-001', 'Pendaftaran Hackathon National 2026 Diperpanjang!', 'Mahasiswa', 'mahasiswa', 'Pengumuman Lomba', 'high', 'Informasi penting: batas akhir pendaftaran Hackathon National 2026 diperpanjang hingga 15 November 2026.', '2026-10-08 14:30', 890, 765, 'Terkirim'),
    ('BC-002', 'Pemeliharaan Server Sistem Info Lomba', 'Semua Pengguna', 'all', 'System Maintenance', 'urgent', 'Sistem akan mengalami pemeliharaan rutin pada hari Minggu jam 01:00 - 04:00 WIB.', '2026-10-05 09:00', 1420, 1380, 'Terkirim')
  `);

  console.log('✅ [MySQL] Seed data created successfully!');
};

export const getMySQLPool = () => pool;
export const isMySQLConnected = () => isConnected;
