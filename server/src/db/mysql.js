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
        id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(150) NOT NULL,
        code VARCHAR(50) NOT NULL,
        description TEXT,
        status ENUM('active', 'inactive') DEFAULT 'active',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(150) NOT NULL,
        email VARCHAR(150) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        role ENUM('admin', 'dosen', 'mahasiswa') DEFAULT 'mahasiswa',
        nip_nim VARCHAR(50),
        phone VARCHAR(30),
        startup_id BIGINT,
        startup_name VARCHAR(150),
        position VARCHAR(100),
        program_studi VARCHAR(100),
        tempat_lahir VARCHAR(100),
        tanggal_lahir DATE NULL,
        instagram VARCHAR(150),
        linkedin VARCHAR(150),
        foto_pribadi TEXT,
        tanda_tangan TEXT,
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
        id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
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
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        needs_advisor TINYINT(1) DEFAULT 0,
        max_advisors INT DEFAULT 1,
        location VARCHAR(255) DEFAULT "",
        registration_fee VARCHAR(100) DEFAULT "",
        registration_url TEXT,
        guidebook_url TEXT,
        created_by BIGINT NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS teams (
        id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(150) NOT NULL,
        competition_id BIGINT NOT NULL,
        competition_title VARCHAR(255),
        leader_id BIGINT NOT NULL,
        leader_name VARCHAR(150),
        advisor_id BIGINT,
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
        id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
        type VARCHAR(50) NOT NULL,
        type_label VARCHAR(100) NOT NULL,
        team_id BIGINT,
        team_name VARCHAR(150),
        competition_title VARCHAR(255),
        applicant_id BIGINT NOT NULL,
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

    await pool.query(`
      CREATE TABLE IF NOT EXISTS solo_registrations (
        id BIGINT PRIMARY KEY,
        competition_id BIGINT NOT NULL,
        competition_title VARCHAR(255),
        user_id BIGINT NOT NULL,
        user_name VARCHAR(150),
        user_email VARCHAR(150),
        user_nim VARCHAR(50),
        status VARCHAR(30) DEFAULT 'waiting',
        notes TEXT,
        assigned_team_id BIGINT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_solo_comp (competition_id),
        INDEX idx_solo_user (user_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS activities (
        id VARCHAR(50) PRIMARY KEY,
        entity_type VARCHAR(30) NOT NULL,
        entity_id VARCHAR(50) NULL,
        action VARCHAR(50) NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        actor_id BIGINT NULL,
        actor_name VARCHAR(150),
        actor_role VARCHAR(30),
        metadata JSON,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_activities_entity (entity_type, entity_id),
        INDEX idx_activities_created (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS password_resets (
        id BIGINT PRIMARY KEY,
        user_id BIGINT NOT NULL,
        email VARCHAR(150) NOT NULL,
        user_name VARCHAR(150),
        status VARCHAR(30) DEFAULT 'pending',
        code_hash VARCHAR(255),
        attempts INT DEFAULT 0,
        max_attempts INT DEFAULT 5,
        expires_at DATETIME NULL,
        sent_at DATETIME NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NULL,
        INDEX idx_pr_email (email),
        INDEX idx_pr_status (status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 3b. Column migrations for databases created before this schema:
    // - ID columns must be BIGINT (web-created records use Date.now() IDs ~1.79e12).
    //   MySQL refuses incompatible type changes while FKs exist, so drop → alter → re-add.
    // - competitions gained extra columns after the original schema was created.
    try {
      await migrateIdTypes(pool);
    } catch (e) {
      console.warn(`⚠️ [MySQL] ID migration gagal: ${e.message}`);
    }

    const competitionCols = [
      'ADD COLUMN needs_advisor TINYINT(1) DEFAULT 0',
      'ADD COLUMN max_advisors INT DEFAULT 1',
      'ADD COLUMN location VARCHAR(255) DEFAULT ""',
      'ADD COLUMN registration_fee VARCHAR(100) DEFAULT ""',
      'ADD COLUMN registration_url TEXT',
      'ADD COLUMN guidebook_url TEXT',
      'ADD COLUMN created_by BIGINT NULL',
    ];
    for (const alter of competitionCols) {
      try {
        await pool.query(`ALTER TABLE competitions ${alter}`);
      } catch (e) {
        if (!/duplicate column/i.test(e.message)) {
          console.warn(`⚠️ [MySQL] Migration skipped: ${e.message}`);
        }
      }
    }

    const userCols = [
      'ADD COLUMN program_studi VARCHAR(100)',
      'ADD COLUMN tempat_lahir VARCHAR(100)',
      'ADD COLUMN tanggal_lahir DATE NULL',
      'ADD COLUMN instagram VARCHAR(150)',
      'ADD COLUMN linkedin VARCHAR(150)',
      'ADD COLUMN foto_pribadi TEXT',
      'ADD COLUMN tanda_tangan TEXT',
    ];
    for (const alter of userCols) {
      try {
        await pool.query(`ALTER TABLE users ${alter}`);
      } catch (e) {
        if (!/duplicate column/i.test(e.message)) {
          console.warn(`⚠️ [MySQL] Migration skipped: ${e.message}`);
        }
      }
    }

    // activities.entity_id harus menampung ID string (mis. broadcast "BC-004") sekaligus ID numerik.
    try {
      const [actCol] = await pool.query(
        `SELECT DATA_TYPE FROM information_schema.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'activities' AND COLUMN_NAME = 'entity_id'`
      );
      if (actCol[0] && actCol[0].DATA_TYPE !== 'varchar') {
        await pool.query('ALTER TABLE activities MODIFY COLUMN entity_id VARCHAR(50) NULL');
        console.log('✅ [MySQL] activities.entity_id dimigrasi BIGINT → VARCHAR(50)');
      }
    } catch (e) {
      console.warn(`⚠️ [MySQL] Migration activities.entity_id gagal: ${e.message}`);
    }

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

const getDataType = async (pool, table, column) => {
  const [rows] = await pool.query(
    `SELECT DATA_TYPE FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
    [table, column]
  );
  return rows[0]?.DATA_TYPE || null;
};

/** Drop every foreign key constraint on a table. Returns how many were dropped. */
const dropFks = async (pool, table) => {
  const [rows] = await pool.query(
    `SELECT CONSTRAINT_NAME FROM information_schema.KEY_COLUMN_USAGE
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?
       AND REFERENCED_TABLE_NAME IS NOT NULL`,
    [table]
  );
  for (const r of rows) {
    await pool.query(`ALTER TABLE \`${table}\` DROP FOREIGN KEY \`${r.CONSTRAINT_NAME}\``);
  }
  return rows.length;
};

/**
 * Migrate legacy INT id columns to BIGINT. MySQL rejects type changes on any
 * FK-linked column (even FKs from OTHER tables pointing at this one) and
 * ignores FOREIGN_KEY_CHECKS for DDL, so the sequence is:
 * drop every FK on users & teams → alter columns → clean dangling refs → re-add FKs.
 * Idempotent: no-op when every id column is already BIGINT.
 */
const migrateIdTypes = async (pool) => {
  const needUsers = (await getDataType(pool, 'startups', 'id')) !== 'bigint'
    || (await getDataType(pool, 'users', 'id')) !== 'bigint';
  const needComps = (await getDataType(pool, 'competitions', 'id')) !== 'bigint'
    || (await getDataType(pool, 'teams', 'id')) !== 'bigint';
  const needSubs = (await getDataType(pool, 'submissions', 'id')) !== 'bigint';

  if (!needUsers && !needComps && !needSubs) return;

  // Drop ALL FKs on both tables — teams FKs reference users.id (incoming), so
  // changing users.id requires them dropped too, not just users_ibfk_1.
  const droppedTeamsFks = await dropFks(pool, 'teams');
  const droppedUsersFks = await dropFks(pool, 'users');

  if (needUsers) {
    await pool.query('ALTER TABLE startups MODIFY id BIGINT NOT NULL AUTO_INCREMENT');
    await pool.query('ALTER TABLE users MODIFY id BIGINT NOT NULL AUTO_INCREMENT, MODIFY startup_id BIGINT NULL');
    console.log('🔧 [MySQL] Migrasi kolom id users/startups → BIGINT selesai');
  }

  if (needComps) {
    await pool.query('ALTER TABLE competitions MODIFY id BIGINT NOT NULL AUTO_INCREMENT');
    await pool.query(
      'ALTER TABLE teams MODIFY id BIGINT NOT NULL AUTO_INCREMENT, MODIFY competition_id BIGINT NOT NULL, MODIFY leader_id BIGINT NOT NULL, MODIFY advisor_id BIGINT NULL'
    );
    console.log('🔧 [MySQL] Migrasi kolom id competitions/teams → BIGINT selesai');
  }

  if (needSubs) {
    await pool.query(
      'ALTER TABLE submissions MODIFY id BIGINT NOT NULL AUTO_INCREMENT, MODIFY team_id BIGINT NULL, MODIFY applicant_id BIGINT NOT NULL'
    );
    console.log('🔧 [MySQL] Migrasi kolom id submissions → BIGINT selesai');
  }

  // Clean dangling references before restoring FK constraints
  await pool.query(
    'UPDATE users SET startup_id = NULL WHERE startup_id IS NOT NULL AND startup_id NOT IN (SELECT id FROM startups)'
  );
  await pool.query(
    'DELETE t FROM teams t LEFT JOIN competitions c ON c.id = t.competition_id WHERE c.id IS NULL'
  );
  await pool.query(
    'DELETE t FROM teams t LEFT JOIN users u ON u.id = t.leader_id WHERE u.id IS NULL'
  );
  await pool.query(
    'UPDATE teams SET advisor_id = NULL WHERE advisor_id IS NOT NULL AND advisor_id NOT IN (SELECT id FROM users)'
  );

  // Re-add all FKs (ignore "already exists"; warn on anything else)
  const fkDefs = [
    ['users', 'users_ibfk_1', 'startup_id', 'startups(id)', 'ON DELETE SET NULL'],
    ['teams', 'teams_ibfk_1', 'competition_id', 'competitions(id)', 'ON DELETE CASCADE'],
    ['teams', 'teams_ibfk_2', 'leader_id', 'users(id)', 'ON DELETE CASCADE'],
    ['teams', 'teams_ibfk_3', 'advisor_id', 'users(id)', 'ON DELETE SET NULL'],
  ];
  const shouldRestore = (table) =>
    (table === 'users' && (droppedUsersFks > 0 || needUsers)) ||
    (table === 'teams' && (droppedTeamsFks > 0 || needComps));
  for (const [table, name, col, ref, onDelete] of fkDefs) {
    if (!shouldRestore(table)) continue;
    try {
      await pool.query(
        `ALTER TABLE \`${table}\` ADD CONSTRAINT ${name} FOREIGN KEY (${col}) REFERENCES ${ref} ${onDelete}`
      );
    } catch (e) {
      if (!/duplicate foreign key/i.test(e.message)) {
        console.warn(`⚠️ [MySQL] Gagal memulihkan FK ${name}: ${e.message}`);
      }
    }
  }
  console.log('✅ [MySQL] Semua foreign key dipulihkan');
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
    INSERT INTO users (id, name, email, password, role, nip_nim, phone, startup_id, startup_name, position) VALUES
    (1, 'Admin Ko+Lab System', 'admin@kolab.id', '${hashedPassword}', 'admin', 'ADM-2026-001', '081234567890', 1, 'Teknologi Informasi', 'Admin System'),
    (2, 'Dr. Budi Santoso, M.T.', 'dosen@kolab.id', '${hashedPassword}', 'dosen', '198503122010121001', '081298765432', 1, 'Teknologi Informasi', 'Dosen Pembimbing'),
    (3, 'Prof. Siti Aminah, Ph.D.', 'siti.aminah@kolab.id', '${hashedPassword}', 'dosen', '197804152005012002', '081311223344', 2, 'Sistem Informasi', 'Dosen Pembimbing'),
    (4, 'Rina Wijaya', 'mahasiswa@kolab.id', '${hashedPassword}', 'mahasiswa', '2241720088', '085712348899', 1, 'Teknologi Informasi', 'CEO'),
    (5, 'Ahmad Fauzi', 'ahmad.fauzi@student.kolab.id', '${hashedPassword}', 'mahasiswa', '2241720102', '081987654321', 1, 'Teknologi Informasi', 'CTO'),
    (6, 'Dewi Lestari', 'dewi.lestari@student.kolab.id', '${hashedPassword}', 'mahasiswa', '2241720150', '085234567891', 2, 'Sistem Informasi', 'UI/UX Lead')
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
