import { db } from '../db/index.js';

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
    if (sub.type === 'advisor_self_assign' && sub.team_id) {
      const team = data.teams.find((t) => t.id === sub.team_id);
      if (team) {
        if (sub.status === 'approved') {
          team.advisor_id = sub.applicant_id;
          team.advisor_name = sub.applicant_name;
          team.advisor_status = 'approved';
        } else if (sub.status === 'rejected') {
          team.advisor_status = 'rejected';
        }
      }
    }

    db.write(data);

    return res.json({ success: true, message: `Pengajuan berhasil di-${status}`, data: sub });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
