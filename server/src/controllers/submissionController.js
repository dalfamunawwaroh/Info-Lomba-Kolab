import { db } from '../db/index.js';
import { syncSubmission, syncTeam, logActivity } from '../db/sync.js';
import { enrichSubmission } from './advisorController.js';
import { getApprovedAdvisors, countApprovedAdvisors, advisorQuota, syncPrimaryAdvisor } from '../utils/advisorHelpers.js';

/** Tambah / perbarui satu entri pembimbing di `team.advisors[]`. */
const upsertAdvisorEntry = (team, advisorId, advisorName, status) => {
  team.advisors = team.advisors || [];
  const existing = team.advisors.find((a) => a.id === advisorId);
  if (existing) {
    existing.status = status;
    if (advisorName) existing.name = advisorName;
  } else {
    team.advisors.push({ id: advisorId, name: advisorName, status });
  }
};

/**
 * Terapkan perubahan komposisi tim yang disetujui admin (F-14).
 * Mengembalikan { ok, message, team } — `ok: false` berarti permintaan ditolak
 * dengan alasan yang layak ditampilkan ke admin.
 */
const applyTeamChange = (data, sub) => {
  const team = (data.teams || []).find((t) => t.id === sub.team_id);
  if (!team) {
    return { ok: false, message: 'Tim terkait tidak ditemukan, perubahan tidak dapat diterapkan' };
  }

  const target = sub.target_user_id
    ? (data.users || []).find((u) => u.id === sub.target_user_id) || null
    : null;
  team.members = team.members || [];

  switch (sub.change_type) {
    case 'add_member': {
      if (!target) return { ok: false, message: 'Mahasiswa yang akan ditambahkan tidak ditemukan' };
      if (team.members.some((m) => m.user_id === target.id)) {
        return { ok: false, message: `${target.name} sudah menjadi anggota tim ini` };
      }
      const comp = (data.competitions || []).find((c) => c.id === team.competition_id);
      const maxMembers = Number(comp?.max_team_members) || 10;
      if (team.members.length + 1 > maxMembers) {
        return { ok: false, message: `Anggota tim sudah mencapai batas maksimal (${maxMembers})` };
      }
      team.members.push({
        user_id: target.id,
        name: target.name,
        role: 'Anggota',
        status: 'confirmed',
      });
      return { ok: true, message: `${target.name} ditambahkan ke tim "${team.name}"`, team };
    }

    case 'remove_member': {
      const idx = team.members.findIndex((m) => m.user_id === sub.target_user_id);
      if (idx === -1) return { ok: false, message: 'Anggota tersebut bukan bagian dari tim ini' };
      if (team.members[idx].user_id === team.leader_id) {
        return { ok: false, message: 'Ketua tim tidak bisa dihapus. Ganti ketua terlebih dahulu.' };
      }
      const removed = team.members[idx];
      team.members.splice(idx, 1);
      return { ok: true, message: `${removed.name} dikeluarkan dari tim "${team.name}"`, team };
    }

    case 'change_leader': {
      if (!target) return { ok: false, message: 'Calon ketua baru tidak ditemukan' };
      if (!team.members.some((m) => m.user_id === target.id)) {
        return { ok: false, message: 'Ketua baru harus anggota tim ini' };
      }
      team.leader_id = target.id;
      team.leader_name = target.name;
      return { ok: true, message: `${target.name} kini menjadi ketua tim "${team.name}"`, team };
    }

    default:
      return { ok: false, message: `Jenis perubahan "${sub.change_type || '-'}" tidak dikenali` };
  }
};

/** GET /submissions — daftar pengajuan (admin). */
export const getSubmissions = (req, res) => {
  try {
    const { status, type } = req.query;
    const data = db.read();
    let submissions = [...(data.submissions || [])];

    if (status) {
      submissions = submissions.filter((s) => s.status === status);
    }
    if (type) {
      submissions = submissions.filter((s) => s.type === type);
    }

    // Kirim bentuk yang sudah diperkaya (requester, description, team, competition)
    // agar halaman admin tidak menampilkan field kosong.
    const payload = submissions
      .map((s) => enrichSubmission(data, s))
      .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));

    return res.json({ success: true, data: payload, meta: { total: payload.length } });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/** PATCH /submissions/:id — admin menyetujui / menolak pengajuan. */
export const respondToSubmission = (req, res) => {
  try {
    const { id } = req.params;
    const { status, admin_notes, review_notes } = req.body;
    const data = db.read();

    const sub = data.submissions.find((s) => s.id === Number(id));
    if (!sub) {
      return res.status(404).json({ success: false, message: 'Pengajuan tidak ditemukan' });
    }

    const nextStatus = status || 'approved';
    if (!['approved', 'rejected'].includes(nextStatus)) {
      return res.status(400).json({ success: false, message: 'Status harus approved atau rejected' });
    }
    if (sub.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Pengajuan sudah diproses (${sub.status})`,
      });
    }

    // Terima `review_notes` (dipakai frontend) maupun `admin_notes` (nama lama).
    const notes = String(review_notes ?? admin_notes ?? '').trim();

    let updatedTeam = null;
    let resultMessage = '';

    if (sub.type === 'team_change') {
      if (nextStatus === 'approved') {
        const applied = applyTeamChange(data, sub);
        if (!applied.ok) {
          // Jangan set status bila perubahan tidak bisa diterapkan — admin perlu tahu.
          return res.status(400).json({ success: false, message: applied.message });
        }
        updatedTeam = applied.team;
        resultMessage = applied.message;
      } else {
        resultMessage = 'Pengajuan perubahan tim ditolak';
      }
    } else if (sub.type === 'advisor_self_assign' || sub.type === 'advisor_request') {
      updatedTeam = data.teams.find((t) => t.id === sub.team_id) || null;
      if (updatedTeam) {
        const isTeamRequest = sub.type === 'advisor_request';
        // Dosen yang terlibat: ajukan diri memakai applicant_id, permintaan tim memakai target_advisor_id.
        const advisorId = isTeamRequest ? sub.target_advisor_id : sub.applicant_id;
        const advisorName = isTeamRequest ? sub.target_advisor_name : sub.applicant_name;

        if (nextStatus === 'approved') {
          const comp = (data.competitions || []).find((c) => c.id === updatedTeam.competition_id);
          if (countApprovedAdvisors(updatedTeam) >= advisorQuota(comp)) {
            return res.status(400).json({
              success: false,
              message: `Tim sudah memiliki jumlah dosen pembimbing maksimal (${advisorQuota(comp)})`,
            });
          }
          // Multi-pembimbing: dorong ke `advisors[]`, field lama disinkronkan helper.
          upsertAdvisorEntry(updatedTeam, advisorId, advisorName, 'approved');
          syncPrimaryAdvisor(updatedTeam);
          resultMessage = `${advisorName} resmi menjadi dosen pembimbing "${updatedTeam.name}"`;
        } else {
          // Hanya turunkan status bila dosen ini belum approved di tim tersebut.
          const stillApproved = getApprovedAdvisors(updatedTeam).some((a) => a.id === advisorId);
          if (!stillApproved) {
            updatedTeam.advisors = (updatedTeam.advisors || []).filter((a) => a.id !== advisorId);
            syncPrimaryAdvisor(updatedTeam);
          }
          resultMessage = isTeamRequest
            ? 'Pengajuan dosen pembimbing ditolak'
            : 'Pengajuan ajukan diri ditolak';
        }
      }
    }

    sub.status = nextStatus;
    sub.admin_notes = notes;
    sub.processed_at = new Date().toISOString();
    if (nextStatus === 'rejected' && notes) sub.rejection_reason = notes;

    db.write(data);

    syncSubmission(sub);
    if (updatedTeam) syncTeam(updatedTeam);
    logActivity({
      entity_type: 'submission',
      entity_id: sub.id,
      action: nextStatus,
      title: `Pengajuan "${sub.type_label || sub.type}" ${nextStatus === 'approved' ? 'disetujui' : 'ditolak'}`,
      description: `Pemohon: ${sub.applicant_name}${updatedTeam ? ` • Tim: ${updatedTeam.name}` : ''}`,
      actor: req.user,
    });

    return res.json({
      success: true,
      message: resultMessage || `Pengajuan berhasil di-${nextStatus}`,
      data: enrichSubmission(data, sub),
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
