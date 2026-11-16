import { db } from '../db/index.js';
import { syncTeam, syncSubmission, logActivity } from '../db/sync.js';
import {
  getApprovedAdvisors,
  countApprovedAdvisors,
  advisorQuota,
  isAdvisorOf,
  advisorListOnTeam,
  competitionNeedsAdvisor,
  syncPrimaryAdvisor,
} from '../utils/advisorHelpers.js';

/* ------------------------------------------------------------------ helpers */

/** Apakah user adalah ketua tim? */
const isTeamLeader = (team, userId) => Boolean(team) && team.leader_id === userId;
const enrichTeam = (data, team) => {
  if (!team) return null;
  const comp = (data.competitions || []).find((c) => c.id === team.competition_id) || null;
  const leader = (data.users || []).find((u) => u.id === team.leader_id) || null;
  const advisor = team.advisor_id
    ? (data.users || []).find((u) => u.id === team.advisor_id) || null
    : null;

  return {
    ...team,
    competition: comp ? { ...comp, name: comp.title } : null,
    leader: leader
      ? { id: leader.id, name: leader.name, email: leader.email, startup_name: leader.startup_name || null }
      : team.leader_name
        ? { id: team.leader_id, name: team.leader_name }
        : null,
    advisor: advisor
      ? { id: advisor.id, name: advisor.name, email: advisor.email, expertise: advisor.expertise || [] }
      : team.advisor_name
        ? { id: team.advisor_id, name: team.advisor_name }
        : null,
    members: (team.members || []).map((m) => {
      const u = (data.users || []).find((x) => x.id === m.user_id) || null;
      return {
        ...m,
        user: u
          ? {
              id: u.id,
              name: u.name,
              email: u.email || '',
              nip_nim: u.nip_nim || '',
              startup_name: u.startup_name || null,
              program_studi: u.program_studi || '',
              avatar: u.avatar || null,
            }
          : { id: m.user_id, name: m.name || 'Tanpa nama' },
      };
    }),
  };
};

/** Lengkapi submission dengan tim, lomba, dan pemohon. */
export const enrichSubmission = (data, s) => {
  const team = (data.teams || []).find((t) => t.id === s.team_id) || null;
  const comp = team
    ? (data.competitions || []).find((c) => c.id === team.competition_id) || null
    : null;
  const applicant = (data.users || []).find((u) => u.id === s.applicant_id) || null;

  return {
    ...s,
    team: enrichTeam(data, team),
    competition: comp ? { ...comp, name: comp.title } : null,
    applicant: applicant
      ? { id: applicant.id, name: applicant.name, email: applicant.email, role: applicant.role }
      : s.applicant_name
        ? { id: s.applicant_id, name: s.applicant_name, role: s.applicant_role || null }
        : null,
    requester: { id: s.applicant_id, name: s.applicant_name, role: s.applicant_role },
    description: s.notes || s.description || '',
    created_at: s.submitted_at || s.created_at || null,
  };
};

/* -------------------------------------------------------------- controller */

/**
 * GET /advisors/requests
 * Dosen melihat pengajuan yang menargetkan dirinya:
 *   - advisor_request (mahasiswa → dosen): advisor_id === dosen
 *   - advisor_self_assign (dosen → admin): applicant_id === dosen
 *   - advisor_assign (admin → dosen): advisor_id === dosen
 * Admin melihat semua.
 */
export const getAdvisorRequests = (req, res) => {
  try {
    const { status, type } = req.query;
    const data = db.read();
    const isAdmin = req.user.role === 'admin';

    let requests = (data.submissions || []).filter(
      (s) => s.type === 'advisor_self_assign' || s.type === 'advisor_assign' || s.type === 'advisor_request'
    );

    if (!isAdmin) {
      // Dosen melihat: pengajuan diri miliknya, pengajuan yang ditujukan kepadanya
      // (advisor_request), atau entri yang mencatat dirinya sebagai advisor.
      requests = requests.filter(
        (s) =>
          s.applicant_id === req.user.id ||
          s.advisor_id === req.user.id ||
          s.target_advisor_id === req.user.id
      );
    }
    if (status) requests = requests.filter((s) => s.status === status);
    if (type) requests = requests.filter((s) => s.type === type);

    const payload = requests
      .map((s) => enrichSubmission(data, s))
      .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));

    return res.json({ success: true, data: payload, meta: { total: payload.length } });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/** GET /advisors/summary — angka ringkas untuk dashboard dosen. */
export const getAdvisorSummary = (req, res) => {
  try {
    const data = db.read();
    // Dukung multi-advisor: dosen bisa membimbing lewat `advisors[]`, bukan
    // hanya lewat field lama `advisor_id`.
    const myTeams = (data.teams || []).filter((t) => isAdvisorOf(t, req.user.id));

    const submissions = data.submissions || [];
    const myRequests = submissions.filter(
      (s) =>
        (s.type === 'advisor_self_assign' || s.type === 'advisor_assign') &&
        (s.applicant_id === req.user.id || s.advisor_id === req.user.id)
    );

    const competitionIds = new Set(myTeams.map((t) => t.competition_id));
    const competitionTitles = [...competitionIds]
      .map((id) => (data.competitions || []).find((c) => c.id === id)?.title)
      .filter(Boolean);

    return res.json({
      success: true,
      data: {
        active_teams: myTeams.filter((t) => t.advisor_status === 'approved').length,
        total_teams: myTeams.length,
        pending_requests: myRequests.filter((s) => s.status === 'pending').length,
        total_requests: myRequests.length,
        approved_requests: myRequests.filter((s) => s.status === 'approved').length,
        rejected_requests: myRequests.filter((s) => s.status === 'rejected').length,
        my_competitions: competitionIds.size,
        competition_titles: competitionTitles,
        members_count: myTeams.reduce((acc, t) => acc + (t.members || []).length, 0),
        pending_team_changes: submissions.filter(
          (s) => s.type === 'team_change' && s.applicant_id === req.user.id && s.status === 'pending'
        ).length,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/** GET /advisors/teams-needing — tim yang masih butuh dosen pembimbing. */
export const getTeamsNeedingAdvisor = (req, res) => {
  try {
    const { competition_id, search } = req.query;
    const data = db.read();

    const result = [];

    for (const team of data.teams || []) {
      const comp = (data.competitions || []).find((c) => c.id === team.competition_id);
      if (!comp) continue;
      if (comp.status === 'completed' || comp.status === 'cancelled') continue;
      if (!competitionNeedsAdvisor(comp)) continue;
      if (competition_id && comp.id !== Number(competition_id)) continue;

      // Hitung SEMUA pembimbing approved (field lama + `advisors[]`) agar tim
      // yang sudah cukup pembimbing tidak muncul lagi sebagai "butuh pembimbing".
      const approvedCount = countApprovedAdvisors(team);
      const quota = advisorQuota(comp);
      if (approvedCount >= quota) continue;

      const myPending = (data.submissions || []).find(
        (s) =>
          s.type === 'advisor_self_assign' &&
          s.team_id === team.id &&
          s.applicant_id === req.user.id &&
          s.status === 'pending'
      );

      if (search) {
        const q = String(search).toLowerCase();
        const hay = `${team.name} ${comp.title} ${team.leader_name || ''}`.toLowerCase();
        if (!hay.includes(q)) continue;
      }

      result.push({
        team: enrichTeam(data, team),
        competition: { ...comp, name: comp.title },
        quota,
        approved_advisors: approvedCount,
        my_request: myPending ? { id: myPending.id, status: myPending.status } : null,
        // Hanya pengajuan pending milik dosen INI yang relevan untuk UI.
        // Pengajuan dosen lain tidak boleh memblokir (multi-pembimbing).
        has_pending_request: Boolean(myPending),
      });
    }

    return res.json({ success: true, data: result, meta: { total: result.length } });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/** GET /advisors/my-requests — riwayat pengajuan diri milik dosen. */
export const getMyRequests = (req, res) => {
  try {
    const { status } = req.query;
    const data = db.read();
    let list = (data.submissions || []).filter(
      (s) =>
        s.type === 'advisor_self_assign' &&
        s.applicant_id === req.user.id
    );
    if (status) list = list.filter((s) => s.status === status);

    const payload = list
      .map((s) => enrichSubmission(data, s))
      .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));

    return res.json({ success: true, data: payload });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/* -------------------------------------------------------- F-10: ketua tim */

/**
 * POST /advisors/request
 * Ketua tim mengajukan dosen pembimbing untuk timnya.
 * Body: { team_id, advisor_id, notes? }
 */
export const requestAdvisor = (req, res) => {
  try {
    const { team_id, advisor_id, notes } = req.body;
    if (!team_id || !advisor_id) {
      return res.status(400).json({ success: false, message: 'Tim dan dosen wajib dipilih' });
    }

    const data = db.read();
    const team = (data.teams || []).find((t) => t.id === Number(team_id));
    if (!team) {
      return res.status(404).json({ success: false, message: 'Tim tidak ditemukan' });
    }
    if (!isTeamLeader(team, req.user.id)) {
      return res.status(403).json({ success: false, message: 'Hanya ketua tim yang dapat mengajukan dosen pembimbing' });
    }

    const advisor = (data.users || []).find((u) => u.id === Number(advisor_id));
    if (!advisor || advisor.role !== 'dosen') {
      return res.status(400).json({ success: false, message: 'Dosen tidak ditemukan' });
    }

    const comp = (data.competitions || []).find((c) => c.id === team.competition_id);
    if (comp && !competitionNeedsAdvisor(comp)) {
      return res.status(400).json({ success: false, message: 'Lomba ini tidak membutuhkan dosen pembimbing' });
    }

    const quota = advisorQuota(comp);
    if (countApprovedAdvisors(team) >= quota) {
      return res.status(400).json({
        success: false,
        message: `Tim sudah memiliki jumlah dosen pembimbing maksimal (${quota})`,
      });
    }

    const alreadyRequested = (data.submissions || []).find(
      (s) =>
        s.type === 'advisor_request' &&
        s.team_id === team.id &&
        s.advisor_id === advisor.id &&
        s.status === 'pending'
    );
    if (alreadyRequested) {
      return res.status(400).json({ success: false, message: 'Pengajuan ke dosen ini masih menunggu respons' });
    }

    const alreadyRejected = (data.submissions || []).find(
      (s) =>
        s.type === 'advisor_request' &&
        s.team_id === team.id &&
        s.advisor_id === advisor.id &&
        s.status === 'rejected'
    );
    if (alreadyRejected) {
      return res.status(400).json({ success: false, message: 'Dosen ini sudah menolak pengajuan dari tim kamu' });
    }

    if (advisorListOnTeam(team).find((a) => a.id === advisor.id && a.status === 'approved')) {
      return res.status(400).json({ success: false, message: 'Dosen ini sudah menjadi pembimbing tim kamu' });
    }

    const newSubmission = {
      id: Date.now(),
      type: 'advisor_request',
      type_label: 'Pengajuan Pembimbingan Dosen',
      team_id: team.id,
      team_name: team.name,
      competition_title: comp?.title || team.competition_title || '',
      advisor_id: advisor.id,
      advisor_name: advisor.name,
      applicant_id: req.user.id,
      applicant_name: req.user.name,
      applicant_role: 'mahasiswa',
      notes: notes || '',
      status: 'pending',
      submitted_at: new Date().toISOString(),
    };

    data.submissions.push(newSubmission);
    db.write(data);

    syncSubmission(newSubmission);
    logActivity({
      entity_type: 'submission',
      entity_id: newSubmission.id,
      action: 'create',
      title: `Pengajuan dosen pembimbing "${advisor.name}" oleh ketua "${team.name}"`,
      description: `Lomba: ${comp?.title || team.competition_title || '-'}`,
      actor: req.user,
    });

    return res.status(201).json({
      success: true,
      message: `Pengajuan ke ${advisor.name} berhasil dikirim`,
      data: enrichSubmission(data, newSubmission),
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * DELETE /advisors/requests/:id/cancel
 * Ketua tim membatalkan pengajuan dosen pembimbing yang masih pending.
 */
export const cancelAdvisorRequest = (req, res) => {
  try {
    const { id } = req.params;
    const data = db.read();

    const idx = (data.submissions || []).findIndex((s) => s.id === Number(id));
    if (idx === -1) {
      return res.status(404).json({ success: false, message: 'Pengajuan tidak ditemukan' });
    }
    const request = data.submissions[idx];

    if (request.type !== 'advisor_request') {
      return res.status(400).json({ success: false, message: 'Tipe pengajuan tidak bisa dibatalkan dari sini' });
    }
    if (request.applicant_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Hanya pemohon yang bisa membatalkan' });
    }
    if (request.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Pengajuan sudah diproses, tidak bisa dibatalkan' });
    }

    data.submissions.splice(idx, 1);
    db.write(data);

    logActivity({
      entity_type: 'submission',
      entity_id: request.id,
      action: 'delete',
      title: `Pengajuan dosen pembimbing dibatalkan`,
      description: `Tim: ${request.team_name || '-'} • Dosen: ${request.advisor_name || '-'}`,
      actor: req.user,
    });

    return res.json({ success: true, message: 'Pengajuan berhasil dibatalkan' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /advisors/team-requests
 * Ketua tim melihat semua pengajuan dosen untuk tim-tim yang dipimpinnya.
 */
export const getTeamAdvisorRequests = (req, res) => {
  try {
    const { status } = req.query;
    const data = db.read();

    const myTeamIds = new Set(
      (data.teams || [])
        .filter((t) => t.leader_id === req.user.id)
        .map((t) => t.id)
    );

    let list = (data.submissions || []).filter(
      (s) => s.type === 'advisor_request' && myTeamIds.has(s.team_id)
    );
    if (status) list = list.filter((s) => s.status === status);

    const payload = list
      .map((s) => enrichSubmission(data, s))
      .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));

    return res.json({ success: true, data: payload });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/** PATCH /advisors/requests/:id — approve / reject pengajuan. */
export const respondToRequest = (req, res) => {
  try {
    const { id } = req.params;
    const { status, rejection_reason } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Status harus approved atau rejected' });
    }

    const data = db.read();
    const request = (data.submissions || []).find((s) => s.id === Number(id));
    if (!request) {
      return res.status(404).json({ success: false, message: 'Permintaan tidak ditemukan' });
    }

    const isAdmin = req.user.role === 'admin';
    const isMine = request.applicant_id === req.user.id || request.advisor_id === req.user.id;
    if (!isAdmin && !isMine) {
      return res.status(403).json({ success: false, message: 'Pengajuan ini bukan milik Anda' });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Pengajuan sudah diproses (${request.status})`,
      });
    }

    if (status === 'rejected' && !String(rejection_reason || '').trim()) {
      return res.status(400).json({ success: false, message: 'Alasan penolakan wajib diisi' });
    }
    if (request.type === 'advisor_request' && req.user.role === 'dosen' && request.target_advisor_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Pengajuan ini tidak ditujukan kepada Anda' });
    }

    request.status = status;
    request.processed_at = new Date().toISOString();
    if (rejection_reason) request.rejection_reason = String(rejection_reason).trim();

    const team = (data.teams || []).find((t) => t.id === request.team_id) || null;
    let message = status === 'approved' ? 'Pengajuan berhasil disetujui' : 'Pengajuan berhasil ditolak';

    if (team && status === 'approved') {
      if (request.type === 'advisor_self_assign') {
        // Multi-pembimbing: dorong ke `advisors[]`, jangan timpa field tunggal.
        const comp = (data.competitions || []).find((c) => c.id === team.competition_id);
        const quota = advisorQuota(comp);
        if (countApprovedAdvisors(team) >= quota) {
          return res.status(400).json({
            success: false,
            message: `Tim sudah memiliki jumlah dosen pembimbing maksimal (${quota})`,
          });
        }
        team.advisors = (team.advisors || []).filter((a) => a.id !== request.applicant_id);
        team.advisors.push({
          id: request.applicant_id,
          name: request.applicant_name,
          status: 'approved',
        });
        syncPrimaryAdvisor(team);
        syncTeam(team);
        message = `${request.applicant_name} resmi menjadi dosen pembimbing "${team.name}"`;
      } else if (request.type === 'advisor_request') {
        // Pengajuan ketua tim ke dosen. Dosen sasaran bisa tercatat di
        // `target_advisor_id` (main) atau `advisor_id` (skema lama dalfa).
        const targetId = request.target_advisor_id ?? request.advisor_id;
        const targetName = request.target_advisor_name ?? request.advisor_name;
        if (!targetId) {
          return res.status(400).json({
            success: false,
            message: 'Pengajuan tidak memiliki dosen sasaran',
          });
        }
        const comp = (data.competitions || []).find((c) => c.id === team.competition_id);
        const quota = advisorQuota(comp);
        if (countApprovedAdvisors(team) >= quota) {
          return res.status(400).json({
            success: false,
            message: `Tim sudah memiliki jumlah dosen pembimbing maksimal (${quota})`,
          });
        }
        team.advisors = team.advisors || [];
        const existing = advisorListOnTeam(team);
        if (!existing.find((a) => a.id === targetId)) {
          team.advisors.push({ id: targetId, name: targetName, status: 'approved' });
        } else {
          team.advisors = team.advisors.map((a) =>
            a.id === targetId ? { ...a, status: 'approved' } : a
          );
        }
        // backward-compat: field lama selalu mencerminkan pembimbing utama
        syncPrimaryAdvisor(team);
        syncTeam(team);
        message = `${targetName} resmi menjadi dosen pembimbing "${team.name}"`;
      }
    } else if (team && status === 'rejected') {
      // Jangan turunkan status bila dosen ini masih approved di tim tersebut.
      // `advisor_self_assign` memakai applicant_id, bukan advisor_id.
      const rejectedId =
        request.type === 'advisor_self_assign'
          ? request.applicant_id
          : (request.target_advisor_id ?? request.advisor_id);
      const stillApproved = getApprovedAdvisors(team).some((a) => a.id === rejectedId);
      if (!stillApproved) {
        syncPrimaryAdvisor(team);
      }
      syncTeam(team);
    }

    db.write(data);
    syncSubmission(request);
    logActivity({
      entity_type: 'submission',
      entity_id: request.id,
      action: status === 'approved' ? 'approve' : 'reject',
      title: `Pengajuan "${request.type_label || request.type}" di-${status}`,
      description: `Tim: ${request.team_name || '-'} • Pemohon: ${request.applicant_name || '-'}`,
      actor: req.user,
    });

    return res.json({ success: true, message, data: enrichSubmission(data, request) });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/** POST /advisors/self-assign — dosen mengajukan diri membimbing sebuah tim. */
export const selfAssign = (req, res) => {
  try {
    if (req.user.role !== 'dosen') {
      return res.status(403).json({ success: false, message: 'Hanya dosen yang dapat mengajukan diri sebagai pembimbing' });
    }

    const { team_id, notes } = req.body;
    const data = db.read();

    const team = (data.teams || []).find((t) => t.id === Number(team_id));
    if (!team) {
      return res.status(404).json({ success: false, message: 'Tim tidak ditemukan' });
    }

    const comp = (data.competitions || []).find((c) => c.id === team.competition_id) || null;
    if (comp && !competitionNeedsAdvisor(comp)) {
      return res.status(400).json({ success: false, message: 'Lomba ini tidak membutuhkan dosen pembimbing' });
    }

    // Hitung seluruh pembimbing approved, bukan hanya field lama `advisor_id`.
    const quota = advisorQuota(comp);
    if (countApprovedAdvisors(team) >= quota) {
      return res.status(400).json({
        success: false,
        message: `Tim sudah memiliki jumlah dosen pembimbing maksimal (${quota})`,
      });
    }

    // Dosen tidak boleh mengajukan diri dua kali ke tim yang sama.
    if (isAdvisorOf(team, req.user.id)) {
      return res.status(400).json({ success: false, message: 'Anda sudah membimbing tim ini' });
    }

    // Cegah dosen yang SAMA mengajukan dua kali ke tim yang sama.
    // Dosen lain tetap boleh mengajukan diri ke tim ini (multi-pembimbing),
    // selama kuota lomba belum penuh.
    const duplicate = (data.submissions || []).find(
      (s) =>
        s.type === 'advisor_self_assign' &&
        s.team_id === team.id &&
        s.applicant_id === req.user.id &&
        s.status === 'pending'
    );
    if (duplicate) {
      return res.status(400).json({
        success: false,
        message: 'Anda sudah mengajukan diri untuk tim ini. Menunggu persetujuan admin.',
      });
    }

    const newSubmission = {
      id: Date.now(),
      type: 'advisor_self_assign',
      type_label: 'Pengajuan Pembimbingan Dosen',
      team_id: team.id,
      team_name: team.name,
      competition_title: comp?.title || team.competition_title || '',
      applicant_id: req.user.id,
      applicant_name: req.user.name,
      applicant_role: 'dosen',
      notes: notes || '',
      status: 'pending',
      submitted_at: new Date().toISOString(),
    };

    data.submissions.push(newSubmission);
    team.advisor_status = 'pending';
    db.write(data);

    syncSubmission(newSubmission);
    syncTeam(team);
    logActivity({
      entity_type: 'submission',
      entity_id: newSubmission.id,
      action: 'create',
      title: `Pengajuan dosen pembimbing "${req.user.name}" untuk tim "${team.name}"`,
      actor: req.user,
    });

    return res.status(201).json({
      success: true,
      message: 'Pengajuan diri sebagai pembimbing berhasil dikirim',
      data: enrichSubmission(data, newSubmission),
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/** POST /advisors/assign — admin menetapkan dosen ke tim. */
export const assignByAdmin = (req, res) => {
  try {
    const { team_id, advisor_id } = req.body;
    const data = db.read();

    const team = (data.teams || []).find((t) => t.id === Number(team_id));
    const advisor = (data.users || []).find((u) => u.id === Number(advisor_id));

    if (!team || !advisor) {
      return res.status(404).json({ success: false, message: 'Tim atau Dosen tidak ditemukan' });
    }
    if (advisor.role !== 'dosen') {
      return res.status(400).json({ success: false, message: 'User terpilih bukan dosen' });
    }

    // Jangan menimpa pembimbing yang sudah ada bila kuota lomba masih tersedia.
    const comp = (data.competitions || []).find((c) => c.id === team.competition_id) || null;
    const quota = advisorQuota(comp);
    if (isAdvisorOf(team, advisor.id)) {
      return res.status(400).json({ success: false, message: `${advisor.name} sudah membimbing tim ini` });
    }
    if (countApprovedAdvisors(team) >= quota) {
      return res.status(400).json({
        success: false,
        message: `Tim sudah memiliki jumlah dosen pembimbing maksimal (${quota})`,
      });
    }

    team.advisors = team.advisors || [];
    if (!team.advisors.find((a) => a.id === advisor.id)) {
      team.advisors.push({ id: advisor.id, name: advisor.name, status: 'approved' });
    }
    syncPrimaryAdvisor(team);
    db.write(data);

    syncTeam(team);
    logActivity({
      entity_type: 'team',
      entity_id: team.id,
      action: 'update',
      title: `Dosen pembimbing "${advisor.name}" ditugaskan ke tim "${team.name}"`,
      actor: req.user,
    });

    return res.json({
      success: true,
      message: 'Dosen Pembimbing berhasil ditugaskan oleh Admin',
      data: enrichTeam(data, team),
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/** PATCH /advisors/:id/replace — admin mengganti dosen pembimbing. */
export const replaceAdvisor = (req, res) => {
  try {
    const { id } = req.params;
    const { new_advisor_id } = req.body;
    const data = db.read();

    const team = (data.teams || []).find((t) => t.id === Number(id));
    const newAdvisor = (data.users || []).find((u) => u.id === Number(new_advisor_id));

    if (!team || !newAdvisor) {
      return res.status(404).json({ success: false, message: 'Tim atau Dosen Baru tidak ditemukan' });
    }
    if (newAdvisor.role !== 'dosen') {
      return res.status(400).json({ success: false, message: 'User terpilih bukan dosen' });
    }

    const oldAdvisorName = team.advisor_name || null;
    // Ganti pembimbing utama: keluarkan yang lama dari daftar, masukkan yang baru.
    team.advisors = (team.advisors || []).filter((a) => a.id !== newAdvisor.id);
    if (oldAdvisorName) {
      const oldId = team.advisor_id;
      team.advisors = team.advisors.filter((a) => a.id !== oldId);
    }
    team.advisors.push({ id: newAdvisor.id, name: newAdvisor.name, status: 'approved' });
    syncPrimaryAdvisor(team);
    db.write(data);

    syncTeam(team);
    logActivity({
      entity_type: 'team',
      entity_id: team.id,
      action: 'update',
      title: `Dosen pembimbing tim "${team.name}" diganti`,
      description: `${oldAdvisorName || '-'} → ${newAdvisor.name}`,
      actor: req.user,
    });

    return res.json({ success: true, message: 'Dosen pembimbing berhasil diganti', data: enrichTeam(data, team) });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /advisors/my-teams
 * Dikembalikan dengan bentuk `{ id, status, team: {...} }` agar halaman dosen
 * bisa langsung memakai `item.team.name` dan `item.status`.
 */
export const getMyTeams = (req, res) => {
  try {
    const data = db.read();
    // Dukung multi-advisor: sertakan tim di mana dosen terdaftar di `advisors[]`.
    const myTeams = (data.teams || []).filter((t) => isAdvisorOf(t, req.user.id));

    const payload = myTeams.map((t) => ({
      id: `adv-${t.id}`,
      team_id: t.id,
      status: t.advisor_status || 'approved',
      joined_at: t.created_at || null,
      team: enrichTeam(data, t),
    }));

    return res.json({ success: true, data: payload, meta: { total: payload.length } });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/** GET /advisors/teams/:id — detail satu tim (khusus dosen pembimbing / admin). */
export const getMyTeamDetail = (req, res) => {
  try {
    const { id } = req.params;
    const data = db.read();
    const team = (data.teams || []).find((t) => t.id === Number(id));

    if (!team) {
      return res.status(404).json({ success: false, message: 'Tim tidak ditemukan' });
    }

    const isAdmin = req.user.role === 'admin';
    if (!isAdmin && !isAdvisorOf(team, req.user.id)) {
      return res.status(403).json({ success: false, message: 'Anda bukan pembimbing tim ini' });
    }

    const submissions = (data.submissions || [])
      .filter((s) => s.team_id === team.id)
      .map((s) => enrichSubmission(data, s))
      .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));

    return res.json({
      success: true,
      data: {
        ...enrichTeam(data, team),
        submissions,
        my_requests: submissions.filter((s) => s.applicant_id === req.user.id),
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/* ------------------------------------------------ F-14: perubahan tim (dosen) */

const CHANGE_TYPE_LABELS = {
  add_member: 'Tambah Anggota',
  remove_member: 'Hapus Anggota',
  change_leader: 'Ganti Ketua',
};

/**
 * POST /advisors/teams/:id/change-request
 * Dosen pembimbing mengajukan perubahan komposisi tim ke admin.
 * Body: { change_type, target_user_id?, target_user_name?, description }
 */
export const createTeamChangeRequest = (req, res) => {
  try {
    const { id } = req.params;
    const { change_type, target_user_id, target_user_name, description } = req.body;

    if (!CHANGE_TYPE_LABELS[change_type]) {
      return res.status(400).json({ success: false, message: 'Jenis perubahan tidak valid' });
    }
    if (!String(description || '').trim()) {
      return res.status(400).json({ success: false, message: 'Alasan / deskripsi perubahan wajib diisi' });
    }

    const data = db.read();
    const team = (data.teams || []).find((t) => t.id === Number(id));
    if (!team) {
      return res.status(404).json({ success: false, message: 'Tim tidak ditemukan' });
    }
    if (req.user.role !== 'admin' && !isAdvisorOf(team, req.user.id)) {
      return res.status(403).json({ success: false, message: 'Anda bukan pembimbing tim ini' });
    }

    let targetUser = null;
    if (change_type === 'add_member' || change_type === 'change_leader') {
      if (!target_user_id) {
        return res.status(400).json({ success: false, message: 'Pilih mahasiswa yang dituju' });
      }
      targetUser = (data.users || []).find((u) => u.id === Number(target_user_id));
      if (!targetUser) {
        return res.status(400).json({ success: false, message: 'Mahasiswa tidak ditemukan' });
      }
      if (targetUser.role !== 'mahasiswa') {
        return res.status(400).json({ success: false, message: 'User yang dipilih bukan mahasiswa' });
      }
      const alreadyMember = (team.members || []).some((m) => m.user_id === targetUser.id);
      if (change_type === 'add_member' && alreadyMember) {
        return res.status(400).json({ success: false, message: `${targetUser.name} sudah menjadi anggota tim ini` });
      }
      if (change_type === 'change_leader' && !alreadyMember) {
        return res.status(400).json({ success: false, message: 'Ketua baru harus anggota tim ini' });
      }
      if (change_type === 'add_member') {
        const comp = (data.competitions || []).find((c) => c.id === team.competition_id);
        const maxMembers = Number(comp?.max_team_members) || 10;
        if ((team.members || []).length + 1 > maxMembers) {
          return res.status(400).json({ success: false, message: `Anggota tim sudah mencapai batas maksimal (${maxMembers})` });
        }
      }
    }

    if (change_type === 'remove_member') {
      if (!target_user_id) {
        return res.status(400).json({ success: false, message: 'Pilih anggota yang akan dihapus' });
      }
      targetUser = (data.users || []).find((u) => u.id === Number(target_user_id));
      const isMember = (team.members || []).some((m) => m.user_id === Number(target_user_id));
      if (!isMember) {
        return res.status(400).json({ success: false, message: 'User tersebut bukan anggota tim ini' });
      }
      if (Number(target_user_id) === team.leader_id) {
        return res.status(400).json({ success: false, message: 'Ketua tim tidak bisa dihapus. Ganti ketua terlebih dahulu.' });
      }
    }

    const duplicate = (data.submissions || []).find(
      (s) =>
        s.type === 'team_change' &&
        s.team_id === team.id &&
        s.status === 'pending' &&
        s.applicant_id === req.user.id
    );
    if (duplicate) {
      return res.status(400).json({
        success: false,
        message: 'Masih ada pengajuan perubahan yang menunggu persetujuan admin untuk tim ini',
      });
    }

    const comp = (data.competitions || []).find((c) => c.id === team.competition_id) || null;
    const newSubmission = {
      id: Date.now(),
      type: 'team_change',
      type_label: `Perubahan Tim — ${CHANGE_TYPE_LABELS[change_type]}`,
      team_id: team.id,
      team_name: team.name,
      competition_title: comp?.title || team.competition_title || '',
      applicant_id: req.user.id,
      applicant_name: req.user.name,
      applicant_role: req.user.role,
      change_type,
      change_type_label: CHANGE_TYPE_LABELS[change_type],
      target_user_id: targetUser?.id || null,
      target_user_name: targetUser?.name || target_user_name || null,
      notes: String(description).trim(),
      status: 'pending',
      submitted_at: new Date().toISOString(),
    };

    data.submissions.push(newSubmission);
    db.write(data);

    syncSubmission(newSubmission);
    logActivity({
      entity_type: 'submission',
      entity_id: newSubmission.id,
      action: 'create',
      title: `Pengajuan perubahan tim "${team.name}" (${CHANGE_TYPE_LABELS[change_type]})`,
      description: `Diajukan oleh ${req.user.name}${targetUser ? ` • Target: ${targetUser.name}` : ''}`,
      actor: req.user,
    });

    return res.status(201).json({
      success: true,
      message: 'Pengajuan perubahan tim berhasil dikirim. Menunggu persetujuan admin.',
      data: enrichSubmission(data, newSubmission),
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/** GET /advisors/change-requests — riwayat pengajuan perubahan tim milik dosen. */
export const getMyChangeRequests = (req, res) => {
  try {
    const { status } = req.query;
    const data = db.read();
    let list = (data.submissions || []).filter(
      (s) => s.type === 'team_change' && s.applicant_id === req.user.id
    );
    if (status) list = list.filter((s) => s.status === status);

    const payload = list
      .map((s) => enrichSubmission(data, s))
      .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));

    return res.json({ success: true, data: payload });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
