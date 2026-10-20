import { db } from '../db/index.js';
import { syncCompetition, deleteRow, logActivity } from '../db/sync.js';

export const getCompetitions = (req, res) => {
  try {
    const { status, category, search } = req.query;
    const data = db.read();
    let competitions = [...data.competitions];

    if (status) {
      competitions = competitions.filter((c) => c.status === status);
    }
    if (category) {
      competitions = competitions.filter((c) => c.category === category);
    }
    if (search) {
      const q = search.toLowerCase();
      competitions = competitions.filter(
        (c) =>
          c.title.toLowerCase().includes(q) ||
          c.description.toLowerCase().includes(q) ||
          c.organizer.toLowerCase().includes(q)
      );
    }

    // Hitung jumlah tim per lomba (real, dari data.tim yang baru dibuat)
    const teamCount = {};
    for (const t of data.teams) {
      teamCount[t.competition_id] = (teamCount[t.competition_id] || 0) + 1;
    }
    const payload = competitions.map((c) => ({
      ...c,
      _count: { teams: teamCount[c.id] || 0 },
    }));

    return res.json({ success: true, data: payload });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getCompetitionById = (req, res) => {
  try {
    const { id } = req.params;
    const data = db.read();
    const competition = data.competitions.find((c) => c.id === Number(id));

    if (!competition) {
      return res.status(404).json({ success: false, message: 'Kompetisi tidak ditemukan' });
    }

    // Sertakan daftar tim lomba ini agar tampilan "Tim Terdaftar" selalu ter-update
    const teams = data.teams.filter((t) => t.competition_id === competition.id);

    return res.json({
      success: true,
      data: { ...competition, teams, _count: { teams: teams.length } },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const createCompetition = (req, res) => {
  try {
    const {
      title, category, organizer, description, prize_pool,
      registration_deadline, event_date, max_team_members,
      requirements, image_url, guidebook_url, status,
      needs_advisor, max_advisors, location,
      registration_fee, registration_url,
    } = req.body;

    if (!title || !registration_deadline) {
      return res.status(400).json({ success: false, message: 'Judul dan batas pendaftaran wajib diisi' });
    }

    const data = db.read();
    const newComp = {
      id: Date.now(),
      title,
      category: category || 'General Innovation',
      organizer: organizer || '',
      description: description || '',
      prize_pool: prize_pool || '',
      registration_fee: registration_fee || 'Gratis',
      registration_url: registration_url || '',
      registration_deadline,
      event_date: event_date || registration_deadline,
      status: status || 'upcoming',
      max_team_members: Number(max_team_members) || 3,
      needs_advisor: needs_advisor === true || needs_advisor === 'true',
      max_advisors: needs_advisor ? (Number(max_advisors) || 1) : 1,
      location: location || '',
      requirements: requirements || [],
      guidebook_url: guidebook_url || '',
      image_url: image_url || '',
      created_by: req.user ? req.user.id : null,
      created_at: new Date().toISOString().split('T')[0],
    };

    data.competitions.push(newComp);
    db.write(data);

    syncCompetition(newComp);
    logActivity({
      entity_type: 'competition',
      entity_id: newComp.id,
      action: 'create',
      title: `Lomba "${newComp.title}" ditambahkan`,
      description: `Kategori: ${newComp.category} • Deadline: ${newComp.registration_deadline}`,
      actor: req.user,
    });

    return res.status(201).json({
      success: true,
      message: 'Kompetisi lomba berhasil ditambahkan',
      data: newComp,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const updateCompetition = (req, res) => {
  try {
    const { id } = req.params;
    const data = db.read();
    const index = data.competitions.findIndex((c) => c.id === Number(id));

    if (index === -1) {
      return res.status(404).json({ success: false, message: 'Kompetisi tidak ditemukan' });
    }

    const updated = { ...data.competitions[index], ...req.body };
    data.competitions[index] = updated;
    db.write(data);

    syncCompetition(updated);

    return res.json({ success: true, message: 'Kompetisi berhasil diperbarui', data: updated });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteCompetition = (req, res) => {
  try {
    const { id } = req.params;
    const data = db.read();
    const index = data.competitions.findIndex((c) => c.id === Number(id));

    if (index === -1) {
      return res.status(404).json({ success: false, message: 'Kompetisi tidak ditemukan' });
    }

    const removed = data.competitions[index];
    data.competitions.splice(index, 1);
    db.write(data);

    deleteRow('competitions', Number(id));
    logActivity({
      entity_type: 'competition',
      entity_id: Number(id),
      action: 'delete',
      title: `Lomba "${removed.title}" dihapus`,
      actor: req.user,
    });

    return res.json({ success: true, message: 'Kompetisi berhasil dihapus' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const registerToCompetition = (req, res) => {
  try {
    const { id } = req.params;
    const { team_id, user_id } = req.body;
    const data = db.read();

    const comp = data.competitions.find((c) => c.id === Number(id));
    if (!comp) {
      return res.status(404).json({ success: false, message: 'Kompetisi tidak ditemukan' });
    }

    return res.json({
      success: true,
      message: 'Berhasil mendaftar ke kompetisi',
      data: { competition_id: comp.id, team_id, user_id, status: 'registered' },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getSoloRegistrations = (req, res) => {
  try {
    const { id } = req.params;
    const data = db.read();
    const soloUsers = data.users.filter((u) => u.role === 'mahasiswa').slice(0, 3);
    return res.json({ success: true, data: soloUsers });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
