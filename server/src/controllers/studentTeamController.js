import { db } from '../db/index.js';
import { syncTeam, syncSubmission, deleteRow, logActivity } from '../db/sync.js';

/**
 * Aksi sisi mahasiswa untuk tim miliknya (PRD F-06, F-07, F-10):
 *  - GET    /teams/mine                     → tim yang saya ikuti + pendaftaran solo
 *  - PATCH  /teams/:id/leader               → ketua ganti nama / tambah / hapus anggota
 *  - POST   /teams/:id/advisor-request      → ketua ajukan dosen pembimbing
 *  - DELETE /teams/:id/advisor-request      → ketua batalkan pengajuan yang masih pending
 *  - DELETE /teams/:id/registration         → ketua batalkan pendaftaran (tim dihapus)
 *  - DELETE /teams/solo/:regId              → batalkan pendaftaran solo yang masih waiting
 */

const isLocked = (comp) => comp && (comp.status === 'ongoing' || comp.status === 'completed' || comp.status === 'cancelled');

const enrichTeam = (data, team) => {
  const comp = data.competitions.find((c) => c.id === team.competition_id) || null;
  const requests = (data.submissions || [])
    .filter((s) => s.type === 'advisor_request' && s.team_id === team.id)
    .sort((a, b) => String(b.submitted_at).localeCompare(String(a.submitted_at)));
  const members = (team.members || []).map((m) => {
    const u = data.users.find((x) => x.id === m.user_id);
    return { ...m, startup_name: u?.startup_name || null, email: u?.email || null };
  });
  return {
    ...team,
    members,
    competition: comp ? { ...comp, name: comp.title } : null,
    advisor_requests: requests,
  };
};

const loadLeaderTeam = (req, res, data) => {
  const team = data.teams.find((t) => t.id === Number(req.params.id));
  if (!team) {
    res.status(404).json({ success: false, message: 'Tim tidak ditemukan' });
    return null;
  }
  if (team.leader_id !== req.user.id) {
    res.status(403).json({ success: false, message: 'Hanya ketua tim yang dapat melakukan aksi ini' });
    return null;
  }
  return team;
};

export const getMyTeams = (req, res) => {
  try {
    const data = db.read();
    const uid = req.user.id;
    const teams = data.teams
      .filter((t) => t.leader_id === uid || (t.members || []).some((m) => m.user_id === uid))
      .map((t) => enrichTeam(data, t));

    const solo = (data.solo_registrations || [])
      .filter((r) => r.user_id === uid && r.status === 'waiting')
      .map((r) => {
        const comp = data.competitions.find((c) => c.id === r.competition_id) || null;
        return { ...r, competition: comp ? { ...comp, name: comp.title } : null };
      });

    return res.json({ success: true, data: { teams, solo } });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const updateTeamByLeader = (req, res) => {
  try {
    const data = db.read();
    const team = loadLeaderTeam(req, res, data);
    if (!team) return;
    const comp = data.competitions.find((c) => c.id === team.competition_id);
    const { name, add_member_id, remove_member_id } = req.body;

    if (name !== undefined) {
      if (!String(name).trim()) return res.status(400).json({ success: false, message: 'Nama tim tidak boleh kosong' });
      team.name = String(name).trim();
    }

    if (add_member_id) {
      const max = Number(comp?.max_team_members) || 10;
      if ((team.members || []).length >= max) {
        return res.status(400).json({ success: false, message: `Tim sudah penuh. Maksimal ${max} anggota.` });
      }
      const mu = data.users.find((u) => u.id === Number(add_member_id));
      if (!mu || mu.role !== 'mahasiswa' || (mu.status || 'active') !== 'active') {
        return res.status(400).json({ success: false, message: 'Mahasiswa tidak ditemukan atau tidak aktif' });
      }
      const other = data.teams.find(
        (t) => t.competition_id === team.competition_id && (t.members || []).some((m) => m.user_id === mu.id)
      );
      if (other) {
        return res.status(400).json({ success: false, message: `${mu.name} sudah terdaftar di lomba ini (tim ${other.name})` });
      }
      team.members = [...(team.members || []), { user_id: mu.id, name: mu.name, role: 'Anggota', status: 'confirmed' }];
    }

    if (remove_member_id) {
      const rid = Number(remove_member_id);
      if (rid === team.leader_id) return res.status(400).json({ success: false, message: 'Ketua tidak bisa dihapus dari tim' });
      if (isLocked(comp)) return res.status(400).json({ success: false, message: 'Anggota tidak bisa dihapus karena lomba sudah berjalan' });
      team.members = (team.members || []).filter((m) => m.user_id !== rid);
    }

    db.write(data);
    syncTeam(team);
    logActivity({
      entity_type: 'team',
      entity_id: team.id,
      action: 'update',
      title: `Ketua memperbarui tim "${team.name}"`,
      actor: req.user,
    });

    return res.json({ success: true, message: 'Tim berhasil diperbarui', data: enrichTeam(data, team) });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const requestAdvisor = (req, res) => {
  try {
    const data = db.read();
    const team = loadLeaderTeam(req, res, data);
    if (!team) return;
    const { advisor_id, notes } = req.body;

    if (team.advisor_id && team.advisor_status === 'approved') {
      return res.status(400).json({ success: false, message: 'Tim sudah memiliki dosen pembimbing' });
    }
    const dosen = data.users.find((u) => u.id === Number(advisor_id));
    if (!dosen || dosen.role !== 'dosen') {
      return res.status(400).json({ success: false, message: 'Dosen tidak ditemukan' });
    }
    const related = (data.submissions || []).filter((s) => s.type === 'advisor_request' && s.team_id === team.id);
    if (related.some((s) => s.status === 'pending')) {
      return res.status(400).json({ success: false, message: 'Masih ada pengajuan yang menunggu respons. Batalkan dulu untuk mengajukan dosen lain.' });
    }
    if (related.some((s) => s.status === 'rejected' && s.target_advisor_id === dosen.id)) {
      return res.status(400).json({ success: false, message: 'Dosen ini sudah menolak pengajuan dari tim kamu' });
    }

    const sub = {
      id: Date.now(),
      type: 'advisor_request',
      type_label: 'Pengajuan Dosen Pembimbing oleh Tim',
      team_id: team.id,
      team_name: team.name,
      competition_title: team.competition_title,
      applicant_id: req.user.id,
      applicant_name: req.user.name,
      applicant_role: 'mahasiswa',
      target_advisor_id: dosen.id,
      target_advisor_name: dosen.name,
      notes: notes || '',
      status: 'pending',
      submitted_at: new Date().toISOString(),
    };
    data.submissions.push(sub);
    team.advisor_status = 'pending';
    db.write(data);

    syncSubmission(sub);
    syncTeam(team);
    logActivity({
      entity_type: 'submission',
      entity_id: sub.id,
      action: 'create',
      title: `Tim "${team.name}" mengajukan ${dosen.name} sebagai pembimbing`,
      actor: req.user,
    });

    return res.status(201).json({ success: true, message: `Pengajuan terkirim. Menunggu respons dari ${dosen.name}`, data: sub });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const cancelAdvisorRequest = (req, res) => {
  try {
    const data = db.read();
    const team = loadLeaderTeam(req, res, data);
    if (!team) return;
    const idx = data.submissions.findIndex(
      (s) => s.type === 'advisor_request' && s.team_id === team.id && s.status === 'pending'
    );
    if (idx === -1) return res.status(404).json({ success: false, message: 'Tidak ada pengajuan pending' });

    const [removed] = data.submissions.splice(idx, 1);
    if (team.advisor_status === 'pending') team.advisor_status = null;
    db.write(data);

    deleteRow('submissions', removed.id);
    syncTeam(team);
    return res.json({ success: true, message: 'Pengajuan dibatalkan' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const cancelTeamRegistration = (req, res) => {
  try {
    const data = db.read();
    const team = loadLeaderTeam(req, res, data);
    if (!team) return;
    const comp = data.competitions.find((c) => c.id === team.competition_id);
    if (isLocked(comp)) {
      return res.status(400).json({ success: false, message: 'Pendaftaran tidak bisa dibatalkan karena lomba sudah berjalan' });
    }

    data.teams = data.teams.filter((t) => t.id !== team.id);
    const pendings = data.submissions.filter((s) => s.team_id === team.id && s.status === 'pending');
    data.submissions = data.submissions.filter((s) => !(s.team_id === team.id && s.status === 'pending'));
    db.write(data);

    deleteRow('teams', team.id);
    pendings.forEach((s) => deleteRow('submissions', s.id));
    logActivity({
      entity_type: 'team',
      entity_id: team.id,
      action: 'delete',
      title: `Pendaftaran tim "${team.name}" dibatalkan oleh ketua`,
      actor: req.user,
    });
    return res.json({ success: true, message: `Pendaftaran di ${team.competition_title} dibatalkan` });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const cancelSoloRegistration = (req, res) => {
  try {
    const data = db.read();
    const reg = (data.solo_registrations || []).find((r) => r.id === Number(req.params.regId));
    if (!reg || reg.user_id !== req.user.id) {
      return res.status(404).json({ success: false, message: 'Pendaftaran tidak ditemukan' });
    }
    if (reg.status !== 'waiting') {
      return res.status(400).json({ success: false, message: 'Pendaftaran sudah diproses admin' });
    }
    data.solo_registrations = data.solo_registrations.filter((r) => r.id !== reg.id);
    db.write(data);
    deleteRow('solo_registrations', reg.id);
    return res.json({ success: true, message: 'Pendaftaran dibatalkan' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
