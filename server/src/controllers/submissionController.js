import { db } from '../db/index.js';
import { syncSubmission, syncTeam, logActivity } from '../db/sync.js';

export const getSubmissions = (req, res) => {
  try {
    const { status, type } = req.query;
    const data = db.read();
    let submissions = [...data.submissions];

    if (status) {
      submissions = submissions.filter((s) => s.status === status);
    }
    if (type) {
      submissions = submissions.filter((s) => s.type === type);
    }

    return res.json({ success: true, data: submissions });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const respondToSubmission = (req, res) => {
  try {
    const { id } = req.params;
    const { status, admin_notes } = req.body;
    const data = db.read();

    const sub = data.submissions.find((s) => s.id === Number(id));
    if (!sub) {
      return res.status(404).json({ success: false, message: 'Pengajuan tidak ditemukan' });
    }

    sub.status = status || 'approved';
    sub.admin_notes = admin_notes || '';
    sub.processed_at = new Date().toISOString();

    // If it's advisor self assign, update team advisor status too
    let updatedTeam = null;
    if (sub.type === 'advisor_self_assign' && sub.team_id) {
      updatedTeam = data.teams.find((t) => t.id === sub.team_id);
      if (updatedTeam) {
        if (sub.status === 'approved') {
          updatedTeam.advisor_id = sub.applicant_id;
          updatedTeam.advisor_name = sub.applicant_name;
          updatedTeam.advisor_status = 'approved';
        } else if (sub.status === 'rejected') {
          updatedTeam.advisor_status = 'rejected';
        }
      }
    }

    db.write(data);

    syncSubmission(sub);
    if (updatedTeam) syncTeam(updatedTeam);
    logActivity({
      entity_type: 'submission',
      entity_id: sub.id,
      action: sub.status,
      title: `Pengajuan "${sub.type_label || sub.type}" ${sub.status === 'approved' ? 'disetujui' : 'ditolak'}`,
      description: `Pemohon: ${sub.applicant_name}${updatedTeam ? ` • Tim: ${updatedTeam.name}` : ''}`,
      actor: req.user,
    });

    return res.json({ success: true, message: `Pengajuan berhasil di-${status}`, data: sub });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
