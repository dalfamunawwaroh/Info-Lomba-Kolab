import { db } from '../db/index.js';
import { syncTeam, deleteRow, logActivity } from '../db/sync.js';

export const getTeams = (req, res) => {
  try {
    const data = db.read();
    return res.json({ success: true, data: data.teams });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getTeamById = (req, res) => {
  try {
    const { id } = req.params;
    const data = db.read();
    const team = data.teams.find((t) => t.id === Number(id));

    if (!team) {
      return res.status(404).json({ success: false, message: 'Tim tidak ditemukan' });
    }

    return res.json({ success: true, data: team });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const createTeam = (req, res) => {
  try {
    const { name, competition_id, members, leader_id, leader_name, advisor_id, advisor_name } = req.body;
    if (!name || !String(name).trim()) {
      return res.status(400).json({ success: false, message: 'Nama tim wajib diisi' });
    }
    if (!competition_id) {
      return res.status(400).json({ success: false, message: 'Lomba wajib dipilih' });
    }

    const data = db.read();
    const compId = Number(competition_id);
    const comp = data.competitions.find((c) => c.id === compId);
    if (!comp) {
      return res.status(400).json({ success: false, message: 'Lomba tidak ditemukan. Muat ulang halaman dan pilih lomba lain.' });
    }

    // Resolve leader: explicit from body, or fallback to requester
    const lid = leader_id ? Number(leader_id) : (req.user ? req.user.id : null);
    if (!lid) {
      return res.status(400).json({ success: false, message: 'Ketua tim wajib dipilih' });
    }
    const leaderUser = data.users.find((u) => u.id === lid);
    if (!leaderUser) {
      return res.status(400).json({ success: false, message: 'Ketua tim tidak ditemukan di data user. Pastikan dropdown mahasiswa terload dengan benar.' });
    }
    const lName = leader_name || leaderUser.name;

    // Validate advisor if provided
    let advId = advisor_id ? Number(advisor_id) : null;
    let advName = advisor_name || null;
    if (advId) {
      const advUser = data.users.find((u) => u.id === advId);
      if (!advUser) {
        return res.status(400).json({ success: false, message: 'Dosen pembimbing tidak ditemukan' });
      }
      advName = advUser.name;
    }

    const memberList = Array.isArray(members) && members.length > 0
      ? members
      : [{ user_id: lid, name: leaderUser.name, role: 'Ketua Tim', status: 'confirmed' }];

    const newTeam = {
      id: Date.now(),
      name: String(name).trim(),
      competition_id: compId,
      competition_title: comp.title,
      leader_id: lid,
      leader_name: leaderUser.name,
      advisor_id: advId,
      advisor_name: advName,
      advisor_status: advId ? 'approved' : 'none',
      status: 'forming',
      members: memberList,
      created_at: new Date().toISOString().split('T')[0],
    };

    data.teams.push(newTeam);
    db.write(data);

    syncTeam(newTeam);
    logActivity({
      entity_type: 'team',
      entity_id: newTeam.id,
      action: 'create',
      title: `Tim "${newTeam.name}" dibuat`,
      description: `Lomba: ${newTeam.competition_title} • Anggota: ${newTeam.members.length}`,
      actor: req.user,
    });

    return res.status(201).json({ success: true, message: 'Tim berhasil dibuat', data: newTeam });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const updateTeam = (req, res) => {
  try {
    const { id } = req.params;
    const data = db.read();
    const index = data.teams.findIndex((t) => t.id === Number(id));

    if (index === -1) {
      return res.status(404).json({ success: false, message: 'Tim tidak ditemukan' });
    }

    const updated = { ...data.teams[index], ...req.body };
    data.teams[index] = updated;
    db.write(data);

    syncTeam(updated);
    if (req.body.advisor_status) {
      logActivity({
        entity_type: 'team',
        entity_id: updated.id,
        action: `advisor_${req.body.advisor_status}`,
        title: `Bimbingan tim "${updated.name}" → ${req.body.advisor_status}`,
        description: req.body.advisor_name ? `Pembimbing: ${req.body.advisor_name}` : '',
        actor: req.user,
      });
    }

    return res.json({ success: true, message: 'Tim berhasil diperbarui', data: updated });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteTeam = (req, res) => {
  try {
    const { id } = req.params;
    const data = db.read();
    const index = data.teams.findIndex((t) => t.id === Number(id));

    if (index === -1) {
      return res.status(404).json({ success: false, message: 'Tim tidak ditemukan' });
    }

    const removed = data.teams[index];
    data.teams.splice(index, 1);
    db.write(data);

    deleteRow('teams', Number(id));
    logActivity({
      entity_type: 'team',
      entity_id: Number(id),
      action: 'delete',
      title: `Tim "${removed.name}" dihapus`,
      actor: req.user,
    });

    return res.json({ success: true, message: 'Tim berhasil dihapus' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const updateMembers = (req, res) => {
  try {
    const { id } = req.params;
    const { members } = req.body;
    const data = db.read();

    const team = data.teams.find((t) => t.id === Number(id));
    if (!team) {
      return res.status(404).json({ success: false, message: 'Tim tidak ditemukan' });
    }

    team.members = members;
    db.write(data);

    syncTeam(team);

    return res.json({ success: true, message: 'Anggota tim berhasil diperbarui', data: team });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
