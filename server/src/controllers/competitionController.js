import { db } from '../db/index.js';

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

    return res.json({ success: true, data: competitions });
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

    return res.json({ success: true, data: competition });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const createCompetition = (req, res) => {
  try {
    const { title, category, organizer, description, prize_pool, registration_deadline, event_date, max_team_members, requirements, image_url } = req.body;

    if (!title || !registration_deadline) {
      return res.status(400).json({ success: false, message: 'Judul dan batas pendaftaran wajib diisi' });
    }

    const data = db.read();
    const newComp = {
      id: Date.now(),
      title,
      category: category || 'General Innovation',
      organizer: organizer || 'Ko+Lab Network',
      description: description || '',
      prize_pool: prize_pool || 'TBD',
      registration_deadline,
      event_date: event_date || registration_deadline,
      status: 'ongoing',
      max_team_members: Number(max_team_members) || 3,
      requirements: requirements || [],
      image_url: image_url || 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=800&q=80',
      created_at: new Date().toISOString().split('T')[0],
    };

    data.competitions.push(newComp);
    db.write(data);

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

    data.competitions.splice(index, 1);
    db.write(data);

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
