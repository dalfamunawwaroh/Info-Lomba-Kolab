import { db } from '../db/index.js';

/**
 * GET /history/:id — Riwayat lomba seorang user (untuk halaman History,
 * Dashboard, DaftarLomba, DetailLomba badge "Sudah Terdaftar", dan Profile).
 *
 * Sumber:
 *  - tim tempat user menjadi anggota ATAU dosen pembimbing
 *  - pendaftaran solo berstatus 'waiting' (belum jadi tim)
 *
 * Response:
 * {
 *   competitions: { upcoming: [], ongoing: [], completed: [] },
 *   stats: { total, upcoming, ongoing, completed }
 * }
 * Tiap item: { competition: {..., name: title}, team, advisors }
 */

const bucketFor = (status) => {
  if (status === 'ongoing') return 'ongoing';
  if (status === 'completed' || status === 'cancelled') return 'completed';
  return 'upcoming';
};

const makeItem = (comp, team, advisors) => ({
  competition: { ...comp, name: comp.title },
  team: team || null,
  advisors: advisors || [],
});

export const getUserHistory = (req, res) => {
  try {
    const userId = Number(req.params.id);
    const data = db.read();

    const user = data.users.find((u) => u.id === userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User tidak ditemukan' });
    }

    const items = [];

    // 1) Lewat tim (anggota / ketua / dosen pembimbing)
    for (const t of data.teams || []) {
      const member = (t.members || []).find((m) => m.user_id === userId);
      const isAdvisor = t.advisor_id === userId;
      if (!member && !isAdvisor) continue;
      const comp = data.competitions.find((c) => c.id === t.competition_id);
      if (!comp) continue;

      const roleInTeam = member ? (t.leader_id === userId ? 'leader' : 'member') : 'advisor';
      items.push(
        makeItem(
          comp,
          { id: t.id, name: t.name, role_in_team: roleInTeam, status: t.status },
          t.advisor_name ? [{ id: t.advisor_id, name: t.advisor_name }] : []
        )
      );
    }

    // 2) Pendaftaran solo yang masih menunggu admin (belum berubah jadi tim)
    const registeredCompIds = new Set(items.map((i) => i.competition.id));
    for (const r of data.solo_registrations || []) {
      if (r.user_id !== userId) continue;
      if (r.status !== 'waiting') continue; // yang 'assigned' sudah tercakup tim di atas
      if (registeredCompIds.has(r.competition_id)) continue;
      const comp = data.competitions.find((c) => c.id === r.competition_id);
      if (!comp) continue;
      items.push(
        makeItem(
          comp,
          r.assigned_team_id
            ? { id: r.assigned_team_id, name: r.team_name || 'Tim', role_in_team: 'member' }
            : null,
          []
        )
      );
    }

    const competitions = { upcoming: [], ongoing: [], completed: [] };
    for (const it of items) {
      competitions[bucketFor(it.competition.status)].push(it);
    }

    return res.json({
      success: true,
      data: {
        competitions,
        stats: {
          total: items.length,
          upcoming: competitions.upcoming.length,
          ongoing: competitions.ongoing.length,
          completed: competitions.completed.length,
        },
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
