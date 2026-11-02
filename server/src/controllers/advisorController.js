import { db } from '../db/index.js';
import { syncTeam, syncSubmission, logActivity } from '../db/sync.js';

export const getAdvisorRequests = (req, res) => {
  try {
    const data = db.read();
    const requests = data.submissions.filter((s) => s.type === 'advisor_self_assign' || s.type === 'advisor_assign');
    // Embed tim + lomba agar halaman dosen/admin bisa menampilkan nama & lomba tim
    const payload = requests.map((s) => {
      const team = data.teams.find((t) => t.id === s.team_id) || null;
      const comp = team ? data.competitions.find((c) => c.id === team.competition_id) : null;
      return {
        ...s,
        team: team
          ? { ...team, competition: comp ? { ...comp, name: comp.title } : null }
          : null,
        competition: comp ? { ...comp, name: comp.title } : null,
      };
    });
    return res.json({ success: true, data: payload });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const respondToRequest = (req, res) => {
  try {
    const { id } = req.params;
    const { status, rejection_reason } = req.body;
    const data = db.read();

    const request = data.submissions.find((s) => s.id === Number(id));
    if (!request) {
      return res.status(404).json({ success: false, message: 'Permintaan tidak ditemukan' });
    }
    if (request.status !== 'pending') {
      return res.status(400).json({ success: false, message: `Pengajuan sudah diproses (${request.status})` });
    }

    request.status = status;
    request.processed_at = new Date().toISOString();
    if (rejection_reason) request.rejection_reason = rejection_reason;

    const team = data.teams.find((t) => t.id === request.team_id) || null;
    let message = `Permintaan berhasil di-${status}`;

    if (team && status === 'approved' && request.type === 'advisor_self_assign' && request.applicant_role === 'dosen') {
      // Persetujuan = dosen pemohon resmi jadi pembimbing tim
      team.advisor_id = request.applicant_id;
      team.advisor_name = request.applicant_name;
      team.advisor_status = 'approved';
      syncTeam(team);
      message = `${request.applicant_name} resmi menjadi dosen pembimbing "${team.name}"`;
    } else if (team && status === 'rejected' && team.advisor_status === 'pending') {
      team.advisor_status = 'rejected';
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

    return res.json({ success: true, message, data: request });
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
    if (team.advisor_status === 'approved' && team.advisor_id) {
      return res.status(400).json({ success: false, message: 'Tim sudah punya dosen pembimbing' });
    }
    const duplicate = data.submissions.find(
      (s) => s.type === 'advisor_self_assign' && s.team_id === team.id && s.status === 'pending'
    );
    if (duplicate) {
      return res.status(400).json({ success: false, message: 'Sudah ada pengajuan pembimbingan yang menunggu untuk tim ini' });
    }
    if (req.user.role !== 'dosen') {
      return res.status(403).json({ success: false, message: 'Hanya dosen yang dapat mengajukan diri sebagai pembimbing' });
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

    syncSubmission(newSubmission);
    syncTeam(team);
    logActivity({
      entity_type: 'submission',
      entity_id: newSubmission.id,
      action: 'create',
      title: `Pengajuan dosen pembimbing "${req.user.name}" untuk tim "${team.name}"`,
      actor: req.user,
    });

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
    if (advisor.role !== 'dosen') {
      return res.status(400).json({ success: false, message: 'User terpilih bukan dosen' });
    }

    team.advisor_id = advisor.id;
    team.advisor_name = advisor.name;
    team.advisor_status = 'approved';
    db.write(data);

    syncTeam(team);
    logActivity({
      entity_type: 'team',
      entity_id: team.id,
      action: 'update',
      title: `Dosen pembimbing "${advisor.name}" ditugaskan ke tim "${team.name}"`,
      actor: req.user,
    });

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
    if (newAdvisor.role !== 'dosen') {
      return res.status(400).json({ success: false, message: 'User terpilih bukan dosen' });
    }

    const oldAdvisorName = team.advisor_name || null;
    team.advisor_id = newAdvisor.id;
    team.advisor_name = newAdvisor.name;
    team.advisor_status = 'approved';
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
