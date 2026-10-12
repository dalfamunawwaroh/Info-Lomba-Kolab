import { db } from '../db/index.js';

export const getAdvisorRequests = (req, res) => {
  try {
    const data = db.read();
    const requests = data.submissions.filter((s) => s.type === 'advisor_self_assign' || s.type === 'advisor_assign');
    return res.json({ success: true, data: requests });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const respondToRequest = (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const data = db.read();

    const request = data.submissions.find((s) => s.id === Number(id));
    if (!request) {
      return res.status(404).json({ success: false, message: 'Permintaan tidak ditemukan' });
    }

    request.status = status;
    db.write(data);

    return res.json({ success: true, message: `Permintaan berhasil di-${status}`, data: request });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const selfAssign = (req, res) => {
  try {
    const { team_id, notes } = req.body;
    const data = db.read();

    const team = data.teams.find((t) => t.id === Number(team_id));
    if (!team) {
      return res.status(404).json({ success: false, message: 'Tim tidak ditemukan' });
    }

    const newSubmission = {
      id: Date.now(),
      type: 'advisor_self_assign',
      type_label: 'Pengajuan Pembimbingan Dosen',
      team_id: team.id,
      team_name: team.name,
      competition_title: team.competition_title,
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

    return res.status(201).json({ success: true, message: 'Pengajuan diri sebagai pembimbing berhasil dikirim', data: newSubmission });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const assignByAdmin = (req, res) => {
  try {
    const { team_id, advisor_id } = req.body;
    const data = db.read();

    const team = data.teams.find((t) => t.id === Number(team_id));
    const advisor = data.users.find((u) => u.id === Number(advisor_id));

    if (!team || !advisor) {
      return res.status(404).json({ success: false, message: 'Tim atau Dosen tidak ditemukan' });
    }

    team.advisor_id = advisor.id;
    team.advisor_name = advisor.name;
    team.advisor_status = 'approved';
    db.write(data);

    return res.json({ success: true, message: 'Dosen Pembimbing berhasil ditugaskan oleh Admin', data: team });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const replaceAdvisor = (req, res) => {
  try {
    const { id } = req.params;
    const { new_advisor_id } = req.body;
    const data = db.read();

    const team = data.teams.find((t) => t.id === Number(id));
    const newAdvisor = data.users.find((u) => u.id === Number(new_advisor_id));

    if (!team || !newAdvisor) {
      return res.status(404).json({ success: false, message: 'Tim atau Dosen Baru tidak ditemukan' });
    }

    team.advisor_id = newAdvisor.id;
    team.advisor_name = newAdvisor.name;
    team.advisor_status = 'approved';
    db.write(data);

    return res.json({ success: true, message: 'Dosen pembimbing berhasil diganti', data: team });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getMyTeams = (req, res) => {
  try {
    const data = db.read();
    const myTeams = data.teams.filter((t) => t.advisor_id === req.user.id);
    return res.json({ success: true, data: myTeams });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
