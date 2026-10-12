import { db } from '../db/index.js';

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
    const { name, competition_id, members } = req.body;
    if (!name || !competition_id) {
      return res.status(400).json({ success: false, message: 'Nama tim dan ID lomba wajib diisi' });
    }

    const data = db.read();
    const comp = data.competitions.find((c) => c.id === Number(competition_id));

    const newTeam = {
      id: Date.now(),
      name,
      competition_id: Number(competition_id),
      competition_title: comp ? comp.title : 'Lomba Ko+Lab',
      leader_id: req.user.id,
      leader_name: req.user.name,
      advisor_id: null,
      advisor_name: null,
      advisor_status: 'none',
      status: 'forming',
      members: members || [{ user_id: req.user.id, name: req.user.name, role: 'Ketua Tim', status: 'confirmed' }],
      created_at: new Date().toISOString().split('T')[0],
    };

    data.teams.push(newTeam);
    db.write(data);

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

    data.teams.splice(index, 1);
    db.write(data);

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

    return res.json({ success: true, message: 'Anggota tim berhasil diperbarui', data: team });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
