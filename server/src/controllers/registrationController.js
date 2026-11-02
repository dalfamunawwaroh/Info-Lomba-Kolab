import { db } from '../db/index.js';
import { syncTeam, syncSoloRegistration, logActivity } from '../db/sync.js';

/**
 * GET /registrations — daftar pendaftar lomba tanpa tim (admin).
 * Query: status (default 'waiting'), competition_id
 * Tiap row diberi object user & competition lengkap agar UI tinggal pakai.
 */
export const getRegistrations = (req, res) => {
  try {
    const { status, competition_id } = req.query;
    const data = db.read();

    let regs = [...(data.solo_registrations || [])];
    if (status) regs = regs.filter((r) => r.status === status);
    if (competition_id) regs = regs.filter((r) => r.competition_id === Number(competition_id));

    regs.sort((a, b) => b.id - a.id);

    const payload = regs.map((r) => {
      const user = data.users.find((u) => u.id === r.user_id) || null;
      const comp = data.competitions.find((c) => c.id === r.competition_id) || null;
      return {
        ...r,
        user: user
          ? {
              id: user.id,
              name: user.name,
              email: user.email || '',
              nip_nim: user.nip_nim || '',
              program_studi: user.program_studi || '',
              status: user.status || 'active',
            }
          : null,
        competition: comp ? { ...comp, name: comp.title } : null,
        assigned_team: r.assigned_team_id
          ? data.teams.find((t) => t.id === r.assigned_team_id) || null
          : null,
      };
    });

    return res.json({
      success: true,
      data: payload,
      meta: { total: payload.length, status: status || 'all' },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * POST /registrations/:id/assign — admin membuatkan tim dari pendaftar solo.
 * Body: { team_name? } (opsional; default "Tim <Nama Depan>")
 */
export const assignRegistration = (req, res) => {
  try {
    const { id } = req.params;
    const { team_name } = req.body;
    const data = db.read();

    const reg = (data.solo_registrations || []).find((r) => r.id === Number(id));
    if (!reg) {
      return res.status(404).json({ success: false, message: 'Pendaftaran tidak ditemukan' });
    }
    if (reg.status === 'assigned') {
      return res.status(400).json({ success: false, message: 'Pendaftaran ini sudah diproses menjadi tim' });
    }

    const comp = data.competitions.find((c) => c.id === reg.competition_id);
    if (!comp) {
      return res.status(400).json({ success: false, message: 'Lomba terkait sudah tidak ada' });
    }

    const registrant = data.users.find((u) => u.id === reg.user_id);
    if (!registrant) {
      return res.status(400).json({ success: false, message: 'User pendaftar sudah tidak ditemukan' });
    }

    // User sudah punya tim di lomba ini?
    const existingTeam = (data.teams || []).find(
      (t) =>
        t.competition_id === reg.competition_id &&
        (t.leader_id === registrant.id ||
          (t.members || []).some((m) => m.user_id === registrant.id))
    );
    if (existingTeam) {
      reg.status = 'assigned';
      reg.assigned_team_id = existingTeam.id;
      db.write(data);
      syncSoloRegistration(reg);
      return res.json({
        success: true,
        message: `${registrant.name} sudah terdaftar di tim "${existingTeam.name}"`,
        data: { registration: reg, team: existingTeam },
      });
    }

    const firstName = String(registrant.name).split(' ')[0];
    const newTeam = {
      id: Date.now(),
      name: String(team_name || '').trim() || `Tim ${firstName}`,
      competition_id: comp.id,
      competition_title: comp.title,
      leader_id: registrant.id,
      leader_name: registrant.name,
      advisor_id: null,
      advisor_name: null,
      advisor_status: null,
      status: 'forming',
      members: [
        { user_id: registrant.id, name: registrant.name, role: 'Ketua Tim', status: 'confirmed' },
      ],
      created_at: new Date().toISOString(),
    };

    reg.status = 'assigned';
    reg.assigned_team_id = newTeam.id;

    data.teams.push(newTeam);
    db.write(data);

    syncTeam(newTeam);
    syncSoloRegistration(reg);
    logActivity({
      entity_type: 'team',
      entity_id: newTeam.id,
      action: 'create',
      title: `Tim "${newTeam.name}" dibuat dari pendaftaran solo "${registrant.name}"`,
      description: `Lomba: ${comp.title}`,
      actor: req.user,
    });

    return res.status(201).json({
      success: true,
      message: `Tim "${newTeam.name}" berhasil dibuat untuk ${registrant.name}`,
      data: { team: newTeam, registration: reg },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
