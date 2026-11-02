import { db } from '../db/index.js';
import { syncCompetition, syncTeam, syncSoloRegistration, deleteRow, logActivity } from '../db/sync.js';

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
      name: c.title, // alias: banyak komponen frontend membaca .name
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
      data: { ...competition, name: competition.title, teams, _count: { teams: teams.length } },
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
    const { has_team, team_name, member_ids, notes } = req.body;
    const data = db.read();

    const comp = data.competitions.find((c) => c.id === Number(id));
    if (!comp) {
      return res.status(404).json({ success: false, message: 'Kompetisi tidak ditemukan' });
    }

    const user = req.user;
    if (!user || user.role !== 'mahasiswa') {
      return res.status(403).json({ success: false, message: 'Hanya mahasiswa yang dapat mendaftar lomba' });
    }
    if (comp.status === 'cancelled') {
      return res.status(400).json({ success: false, message: 'Lomba ini sudah dibatalkan' });
    }
    if (comp.registration_deadline) {
      const dl = new Date(comp.registration_deadline).getTime();
      if (Number.isFinite(dl) && dl < Date.now()) {
        return res.status(400).json({
          success: false,
          message: `Pendaftaran ditutup pada ${String(comp.registration_deadline).slice(0, 10)}`,
        });
      }
    }

    // Cek duplikat: sudah jadi anggota/ketua tim di lomba ini, atau sudah daftar solo
    const inTeam = (data.teams || []).find(
      (t) =>
        t.competition_id === comp.id &&
        (t.leader_id === user.id || (t.members || []).some((m) => m.user_id === user.id))
    );
    const existingReg = (data.solo_registrations || []).find(
      (r) => r.competition_id === comp.id && r.user_id === user.id && r.status !== 'rejected'
    );
    if (inTeam || existingReg) {
      return res.status(400).json({ success: false, message: 'Anda sudah terdaftar pada lomba ini' });
    }

    if (has_team) {
      if (!team_name || !String(team_name).trim()) {
        return res.status(400).json({ success: false, message: 'Nama tim wajib diisi' });
      }

      const ids = [...new Set((Array.isArray(member_ids) ? member_ids : []).map(Number))];
      if (ids.length < 1) {
        return res.status(400).json({ success: false, message: 'Minimal 1 anggota selain ketua' });
      }
      const maxMembers = Number(comp.max_team_members) || 10;
      if (ids.length + 1 > maxMembers) {
        return res.status(400).json({ success: false, message: `Maksimal ${maxMembers} anggota tim` });
      }

      const memberList = [
        { user_id: user.id, name: user.name, role: 'Ketua Tim', status: 'confirmed' },
      ];
      for (const mid of ids) {
        if (mid === user.id) continue;
        const mu = data.users.find((u) => u.id === mid);
        if (!mu || mu.role !== 'mahasiswa') {
          return res.status(400).json({ success: false, message: 'Ada anggota yang tidak ditemukan atau bukan mahasiswa' });
        }
        if ((mu.status || 'active') !== 'active') {
          return res.status(400).json({ success: false, message: `${mu.name} tidak aktif` });
        }
        const already = (data.teams || []).find(
          (t) =>
            t.competition_id === comp.id &&
            (t.leader_id === mu.id || (t.members || []).some((m) => m.user_id === mu.id))
        );
        if (already) {
          return res.status(400).json({
            success: false,
            message: `${mu.name} sudah terdaftar di lomba ini (tim ${already.name})`,
          });
        }
        memberList.push({ user_id: mu.id, name: mu.name, role: 'Anggota', status: 'confirmed' });
      }

      const newTeam = {
        id: Date.now(),
        name: String(team_name).trim(),
        competition_id: comp.id,
        competition_title: comp.title,
        leader_id: user.id,
        leader_name: user.name,
        advisor_id: null,
        advisor_name: null,
        advisor_status: null,
        status: 'forming',
        members: memberList,
        created_at: new Date().toISOString(),
      };

      data.teams.push(newTeam);
      db.write(data);

      syncTeam(newTeam);
      logActivity({
        entity_type: 'team',
        entity_id: newTeam.id,
        action: 'create',
        title: `Tim "${newTeam.name}" dibuat via pendaftaran lomba`,
        description: `Lomba: ${comp.title} • Ketua: ${user.name}`,
        actor: user,
      });

      return res.status(201).json({
        success: true,
        message: 'Berhasil mendaftar! Tim berhasil dibuat.',
        data: newTeam,
      });
    }

    // Tanpa tim → daftar solo, menunggu admin menyesuaikan tim
    if (!Array.isArray(data.solo_registrations)) data.solo_registrations = [];
    const reg = {
      id: Date.now(),
      competition_id: comp.id,
      competition_title: comp.title,
      user_id: user.id,
      user_name: user.name,
      user_email: user.email || '',
      user_nim: user.nip_nim || '',
      status: 'waiting',
      notes: notes || '',
      assigned_team_id: null,
      created_at: new Date().toISOString(),
    };

    data.solo_registrations.unshift(reg);
    db.write(data);

    syncSoloRegistration(reg);
    logActivity({
      entity_type: 'registration',
      entity_id: reg.id,
      action: 'create',
      title: `Pendaftaran solo "${user.name}" ke lomba "${comp.title}"`,
      actor: user,
    });

    return res.status(201).json({
      success: true,
      message: 'Berhasil mendaftar. Tim akan disesuaikan oleh admin.',
      data: reg,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getSoloRegistrations = (req, res) => {
  try {
    const data = db.read();
    const regs = (data.solo_registrations || []).filter(
      (r) => r.competition_id === Number(req.params.id)
    );
    return res.json({ success: true, data: regs });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
