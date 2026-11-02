import { db } from './index.js';
import { getMySQLPool, isMySQLConnected } from './mysql.js';

/**
 * Sync layer: data.json remains the source of truth for all controllers.
 * These helpers mirror writes into MySQL so the `info_lomba_kolab` database
 * always reflects what the app stores, plus an `activities` audit log.
 */

const toJsDate = (v) => {
  if (!v) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
};

const toJson = (v) => {
  if (v === null || v === undefined) return null;
  if (typeof v === 'string') return v;
  try {
    return JSON.stringify(v);
  } catch {
    return null;
  }
};

// ---------------------------------------------------------------- activities

/**
 * Append an activity log entry to both data.json and the MySQL `activities` table.
 * Safe to fire-and-forget (the JSON write happens synchronously before the first await).
 *
 * @param {object} entry
 * @param {string} entry.entity_type - 'user' | 'startup' | 'team' | 'competition' | 'submission' | 'broadcast'
 * @param {number|string} [entry.entity_id]
 * @param {string} entry.action - 'create' | 'update' | 'delete' | 'approve' | ...
 * @param {string} entry.title
 * @param {string} [entry.description]
 * @param {{id:number,name:string,role:string}} [entry.actor]
 * @param {object} [entry.metadata]
 */
export const logActivity = async (entry) => {
  try {
    const data = db.read();
    if (!Array.isArray(data.activities)) data.activities = [];
    const row = {
      id: `${Date.now()}-${Math.floor(Math.random() * 100000)}`,
      entity_type: entry.entity_type,
      entity_id: entry.entity_id ?? null,
      action: entry.action,
      title: entry.title,
      description: entry.description || '',
      actor_id: entry.actor?.id ?? null,
      actor_name: entry.actor?.name || null,
      actor_role: entry.actor?.role || null,
      metadata: entry.metadata || null,
      created_at: new Date().toISOString(),
    };
    data.activities.unshift(row);
    if (data.activities.length > 500) data.activities.length = 500;
    db.write(data);

    if (isMySQLConnected()) {
      const pool = getMySQLPool();
      await pool.query(
        `INSERT INTO activities
           (id, entity_type, entity_id, action, title, description, actor_id, actor_name, actor_role, metadata, created_at)
         VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
        [
          row.id,
          row.entity_type,
          row.entity_id,
          row.action,
          row.title,
          row.description,
          row.actor_id,
          row.actor_name,
          row.actor_role,
          toJson(row.metadata),
          toJsDate(row.created_at),
        ]
      );
    }
    return row;
  } catch (e) {
    console.warn('[Sync] logActivity gagal:', e.message);
    return null;
  }
};

/** Read the activity log (MySQL first, JSON fallback). Newest first. */
export const readActivityLog = async (limit = 100) => {
  try {
    if (isMySQLConnected()) {
      const pool = getMySQLPool();
      const [rows] = await pool.query(
        'SELECT * FROM activities ORDER BY created_at DESC LIMIT ?',
        [limit]
      );
      // entity_id kini VARCHAR (menampung ID numerik & string seperti "BC-004");
      // konversi ke number hanya bila benar-benar numerik, agar string tidak jadi NaN.
      const normId = (v) => {
        if (v === null || v === undefined || v === '') return null;
        const n = Number(v);
        return Number.isFinite(n) ? n : String(v);
      };
      return rows.map((r) => ({
        id: r.id,
        entity_type: r.entity_type,
        entity_id: normId(r.entity_id),
        action: r.action,
        title: r.title,
        description: r.description || '',
        actor_id: r.actor_id !== null ? Number(r.actor_id) : null,
        actor_name: r.actor_name,
        actor_role: r.actor_role,
        metadata: typeof r.metadata === 'string' ? safeParse(r.metadata) : r.metadata,
        created_at: r.created_at ? new Date(r.created_at).toISOString() : null,
      }));
    }
  } catch (e) {
    console.warn('[Sync] readActivityLog MySQL gagal:', e.message);
  }
  const data = db.read();
  return (Array.isArray(data.activities) ? data.activities : []).slice(0, limit);
};

const safeParse = (s) => {
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
};

// ------------------------------------------------------------------- upserts

const resolveStartupId = async (pool, startupId) => {
  if (!startupId) return null;
  try {
    const [rows] = await pool.query('SELECT id FROM startups WHERE id = ?', [startupId]);
    return rows.length > 0 ? Number(startupId) : null;
  } catch {
    return null;
  }
};

export const syncStartup = async (startup) => {
  if (!isMySQLConnected() || !startup) return;
  try {
    const pool = getMySQLPool();
    await pool.query(
      `INSERT INTO startups (id, name, code, description, status, created_at)
       VALUES (?,?,?,?,?,?)
       ON DUPLICATE KEY UPDATE
         name=VALUES(name), code=VALUES(code), description=VALUES(description),
         status=VALUES(status)`,
      [
        startup.id,
        startup.name,
        startup.code || '',
        startup.description || '',
        startup.status || 'active',
        toJsDate(startup.created_at) || new Date(),
      ]
    );
  } catch (e) {
    console.warn('[Sync] syncStartup gagal:', e.message);
  }
};

export const syncUser = async (user) => {
  if (!isMySQLConnected() || !user) return;
  try {
    const pool = getMySQLPool();
    const startupId = await resolveStartupId(pool, user.startup_id);
    await pool.query(
      `INSERT INTO users
         (id, name, email, password, role, nip_nim, phone, startup_id, startup_name,
          position, program_studi, tempat_lahir, tanggal_lahir, instagram, linkedin,
          foto_pribadi, tanda_tangan, expertise, skills, status, avatar, created_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
       ON DUPLICATE KEY UPDATE
         name=VALUES(name), email=VALUES(email), password=VALUES(password), role=VALUES(role),
         nip_nim=VALUES(nip_nim), phone=VALUES(phone), startup_id=VALUES(startup_id),
         startup_name=VALUES(startup_name), position=VALUES(position),
         program_studi=VALUES(program_studi), tempat_lahir=VALUES(tempat_lahir),
         tanggal_lahir=VALUES(tanggal_lahir), instagram=VALUES(instagram),
         linkedin=VALUES(linkedin), foto_pribadi=VALUES(foto_pribadi),
         tanda_tangan=VALUES(tanda_tangan),
         expertise=VALUES(expertise), skills=VALUES(skills), status=VALUES(status),
         avatar=VALUES(avatar)`,
      [
        user.id,
        user.name,
        user.email,
        user.password,
        user.role || 'mahasiswa',
        user.nip_nim || null,
        user.phone || null,
        startupId,
        startupId ? user.startup_name || null : user.startup_name || null,
        user.position || null,
        user.role === 'mahasiswa' ? user.program_studi || null : null,
        user.tempat_lahir || null,
        user.tanggal_lahir ? String(user.tanggal_lahir).slice(0, 10) : null,
        user.instagram || null,
        user.linkedin || null,
        user.foto_pribadi || null,
        user.tanda_tangan || null,
        toJson(user.expertise || []),
        toJson(user.skills || []),
        user.status || 'active',
        user.avatar || null,
        toJsDate(user.created_at) || new Date(),
      ]
    );
  } catch (e) {
    console.warn('[Sync] syncUser gagal:', e.message);
  }
};

export const syncCompetition = async (comp) => {
  if (!isMySQLConnected() || !comp) return;
  try {
    const pool = getMySQLPool();
    const deadline = comp.registration_deadline || comp.deadline || '2026-12-31';
    await pool.query(
      `INSERT INTO competitions
         (id, title, category, organizer, description, prize_pool, registration_deadline,
          event_date, status, max_team_members, requirements, image_url, created_at,
          needs_advisor, max_advisors, location, registration_fee, registration_url,
          guidebook_url, created_by)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
       ON DUPLICATE KEY UPDATE
         title=VALUES(title), category=VALUES(category), organizer=VALUES(organizer),
         description=VALUES(description), prize_pool=VALUES(prize_pool),
         registration_deadline=VALUES(registration_deadline), event_date=VALUES(event_date),
         status=VALUES(status), max_team_members=VALUES(max_team_members),
         requirements=VALUES(requirements), image_url=VALUES(image_url),
         needs_advisor=VALUES(needs_advisor), max_advisors=VALUES(max_advisors),
         location=VALUES(location), registration_fee=VALUES(registration_fee),
         registration_url=VALUES(registration_url), guidebook_url=VALUES(guidebook_url)`,
      [
        comp.id,
        comp.title,
        comp.category || 'Lainnya',
        comp.organizer || '-',
        comp.description || '',
        comp.prize_pool || null,
        String(deadline).slice(0, 10),
        comp.event_date ? String(comp.event_date).slice(0, 10) : null,
        comp.status || 'ongoing',
        comp.max_team_members || 3,
        toJson(comp.requirements || []),
        comp.image_url || null,
        toJsDate(comp.created_at) || new Date(),
        comp.needs_advisor ? 1 : 0,
        comp.max_advisors ?? 1,
        comp.location || '',
        comp.registration_fee || '',
        comp.registration_url || null,
        comp.guidebook_url || null,
        comp.created_by ?? null,
      ]
    );
  } catch (e) {
    console.warn('[Sync] syncCompetition gagal:', e.message);
  }
};

export const syncTeam = async (team) => {
  if (!isMySQLConnected() || !team) return;
  try {
    const pool = getMySQLPool();
    // Validate FKs (competition + leader must exist in MySQL)
    const [comps] = await pool.query('SELECT id FROM competitions WHERE id = ?', [team.competition_id]);
    if (comps.length === 0) return;
    const [leaders] = await pool.query('SELECT id FROM users WHERE id = ?', [team.leader_id]);
    if (leaders.length === 0) return;
    let advisorId = team.advisor_id ?? null;
    if (advisorId) {
      const [advisors] = await pool.query('SELECT id FROM users WHERE id = ?', [advisorId]);
      if (advisors.length === 0) advisorId = null;
    }
    await pool.query(
      `INSERT INTO teams
         (id, name, competition_id, competition_title, leader_id, leader_name,
          advisor_id, advisor_name, advisor_status, status, members, created_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?)
       ON DUPLICATE KEY UPDATE
         name=VALUES(name), competition_id=VALUES(competition_id),
         competition_title=VALUES(competition_title), leader_id=VALUES(leader_id),
         leader_name=VALUES(leader_name), advisor_id=VALUES(advisor_id),
         advisor_name=VALUES(advisor_name), advisor_status=VALUES(advisor_status),
         status=VALUES(status), members=VALUES(members)`,
      [
        team.id,
        team.name,
        team.competition_id,
        team.competition_title || null,
        team.leader_id,
        team.leader_name || null,
        advisorId,
        advisorId ? team.advisor_name || null : null,
        team.advisor_status || 'none',
        team.status || 'forming',
        toJson(team.members || []),
        toJsDate(team.created_at) || new Date(),
      ]
    );
  } catch (e) {
    console.warn('[Sync] syncTeam gagal:', e.message);
  }
};

export const syncSubmission = async (sub) => {
  if (!isMySQLConnected() || !sub) return;
  try {
    const pool = getMySQLPool();
    await pool.query(
      `INSERT INTO submissions
         (id, type, type_label, team_id, team_name, competition_title, applicant_id,
          applicant_name, applicant_role, notes, admin_notes, status, submitted_at, processed_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)
       ON DUPLICATE KEY UPDATE
         type=VALUES(type), type_label=VALUES(type_label), team_id=VALUES(team_id),
         team_name=VALUES(team_name), competition_title=VALUES(competition_title),
         applicant_id=VALUES(applicant_id), applicant_name=VALUES(applicant_name),
         applicant_role=VALUES(applicant_role), notes=VALUES(notes),
         admin_notes=VALUES(admin_notes), status=VALUES(status),
         processed_at=VALUES(processed_at)`,
      [
        sub.id,
        sub.type,
        sub.type_label || sub.type,
        sub.team_id ?? null,
        sub.team_name || null,
        sub.competition_title || null,
        sub.applicant_id,
        sub.applicant_name || null,
        sub.applicant_role || null,
        sub.notes || null,
        sub.admin_notes || null,
        sub.status || 'pending',
        toJsDate(sub.submitted_at) || new Date(),
        toJsDate(sub.processed_at),
      ]
    );
  } catch (e) {
    console.warn('[Sync] syncSubmission gagal:', e.message);
  }
};

export const syncSoloRegistration = async (reg) => {
  if (!isMySQLConnected() || !reg) return;
  try {
    const pool = getMySQLPool();
    await pool.query(
      `INSERT INTO solo_registrations
         (id, competition_id, competition_title, user_id, user_name, user_email,
          user_nim, status, notes, assigned_team_id, created_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,?)
       ON DUPLICATE KEY UPDATE
         competition_id=VALUES(competition_id), competition_title=VALUES(competition_title),
         user_id=VALUES(user_id), user_name=VALUES(user_name), user_email=VALUES(user_email),
         user_nim=VALUES(user_nim), status=VALUES(status), notes=VALUES(notes),
         assigned_team_id=VALUES(assigned_team_id), created_at=VALUES(created_at)`,
      [
        reg.id,
        reg.competition_id,
        reg.competition_title || null,
        reg.user_id,
        reg.user_name || null,
        reg.user_email || null,
        reg.user_nim || null,
        reg.status || 'waiting',
        reg.notes || null,
        reg.assigned_team_id ?? null,
        toJsDate(reg.created_at) || new Date(),
      ]
    );
  } catch (e) {
    console.warn('[Sync] syncSoloRegistration gagal:', e.message);
  }
};

export const syncPasswordReset = async (r) => {
  if (!isMySQLConnected() || !r) return;
  try {
    const pool = getMySQLPool();
    await pool.query(
      `INSERT INTO password_resets
         (id, user_id, email, user_name, status, code_hash, attempts, max_attempts,
          expires_at, sent_at, created_at, updated_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?)
       ON DUPLICATE KEY UPDATE
         user_id=VALUES(user_id), email=VALUES(email), user_name=VALUES(user_name),
         status=VALUES(status), code_hash=VALUES(code_hash), attempts=VALUES(attempts),
         max_attempts=VALUES(max_attempts), expires_at=VALUES(expires_at),
         sent_at=VALUES(sent_at), updated_at=VALUES(updated_at)`,
      [
        r.id,
        r.user_id,
        r.email,
        r.user_name || null,
        r.status || 'pending',
        r.code_hash || null,
        r.attempts || 0,
        r.max_attempts || 5,
        toJsDate(r.expires_at),
        toJsDate(r.sent_at),
        toJsDate(r.created_at) || new Date(),
        toJsDate(r.updated_at),
      ]
    );
  } catch (e) {
    console.warn('[Sync] syncPasswordReset gagal:', e.message);
  }
};

export const syncBroadcast = async (b) => {
  if (!isMySQLConnected() || !b) return;
  try {
    const pool = getMySQLPool();
    await pool.query(
      `INSERT INTO broadcasts
         (id, title, target, targetCode, category, priority, message, actionUrl,
          scheduleDate, sentAt, recipientsCount, readCount, status, created_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)
       ON DUPLICATE KEY UPDATE
         title=VALUES(title), target=VALUES(target), targetCode=VALUES(targetCode),
         category=VALUES(category), priority=VALUES(priority), message=VALUES(message),
         actionUrl=VALUES(actionUrl), scheduleDate=VALUES(scheduleDate), sentAt=VALUES(sentAt),
         recipientsCount=VALUES(recipientsCount), readCount=VALUES(readCount), status=VALUES(status)`,
      [
        b.id,
        b.title,
        b.target || 'Semua Pengguna',
        b.targetCode || b.target_role || 'all',
        b.category || 'Pengumuman',
        b.priority || 'normal',
        b.message || b.content || '',
        b.actionUrl || b.action_url || null,
        b.scheduleDate || b.schedule_date || null,
        b.sentAt || b.sent_at || null,
        b.recipientsCount ?? b.recipients_count ?? 0,
        b.readCount ?? b.read_count ?? 0,
        b.status || 'Terkirim',
        toJsDate(b.created_at) || new Date(),
      ]
    );
  } catch (e) {
    console.warn('[Sync] syncBroadcast gagal:', e.message);
  }
};

export const deleteRow = async (table, id) => {
  if (!isMySQLConnected()) return;
  const allowed = ['users', 'startups', 'competitions', 'teams', 'submissions', 'activities', 'broadcasts', 'solo_registrations', 'password_resets'];
  if (!allowed.includes(table)) return;
  try {
    const pool = getMySQLPool();
    await pool.query(`DELETE FROM ${table} WHERE id = ?`, [id]);
  } catch (e) {
    console.warn(`[Sync] deleteRow(${table}) gagal:`, e.message);
  }
};

// --------------------------------------------------------------- reconcile

/**
 * Full mirror: wipe MySQL tables and re-insert everything from data.json.
 * Called once at boot so MySQL always reflects the app's actual data.
 * FOREIGN_KEY_CHECKS is disabled during the rebuild.
 */
export const reconcileMySQL = async () => {
  if (!isMySQLConnected()) return;
  const pool = getMySQLPool();
  const data = db.read();
  try {
    await pool.query('SET FOREIGN_KEY_CHECKS=0');
    for (const t of ['activities', 'submissions', 'teams', 'users', 'startups', 'competitions', 'broadcasts', 'solo_registrations', 'password_resets']) {
      await pool.query(`DELETE FROM ${t}`);
    }

    for (const s of data.startups || []) await syncStartup(s);

    for (const u of data.users || []) await syncUser(u);

    for (const c of data.competitions || []) await syncCompetition(c);

    for (const t of data.teams || []) await syncTeam(t);

    for (const s of data.submissions || []) await syncSubmission(s);

    for (const r of data.solo_registrations || []) await syncSoloRegistration(r);

    for (const r of data.password_resets || []) await syncPasswordReset(r);

    for (const b of data.broadcasts || []) await syncBroadcast(b);

    for (const a of data.activities || []) {
      await pool.query(
        `INSERT INTO activities
           (id, entity_type, entity_id, action, title, description, actor_id, actor_name, actor_role, metadata, created_at)
         VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
        [
          String(a.id),
          a.entity_type,
          a.entity_id ?? null,
          a.action,
          a.title,
          a.description || '',
          a.actor_id ?? null,
          a.actor_name || null,
          a.actor_role || null,
          toJson(a.metadata),
          toJsDate(a.created_at) || new Date(),
        ]
      );
    }

    const counts = {};
    for (const t of ['users', 'startups', 'competitions', 'teams', 'submissions', 'broadcasts', 'solo_registrations', 'password_resets', 'activities']) {
      const [[{ count }]] = await pool.query(`SELECT COUNT(*) as count FROM ${t}`);
      counts[t] = count;
    }
    console.log(
      `🔄 [Sync] MySQL direkonfiliasi dari data.json → ` +
      `${counts.users} users, ${counts.startups} startups, ${counts.competitions} lomba, ` +
      `${counts.teams} tim, ${counts.submissions} pengajuan, ${counts.solo_registrations} pendaftar solo, ${counts.broadcasts} siaran, ${counts.activities} activities`
    );
  } catch (e) {
    console.warn('[Sync] reconcileMySQL gagal:', e.message);
  } finally {
    await pool.query('SET FOREIGN_KEY_CHECKS=1');
  }
};
