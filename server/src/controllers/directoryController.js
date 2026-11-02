import { db } from '../db/index.js';

/**
 * GET /directory — Daftar anggota (admin, dosen, mahasiswa) untuk menu Direktori.
 * Query: page, limit, search, role, startup_id
 * Tiap orang disertai startup-nya dan statistik lomba (aktif/total) dari data tim.
 */
export const getDirectory = (req, res) => {
  try {
    const { page = 1, limit = 20, search, role, startup_id } = req.query;
    const data = db.read();

    let people = [...data.users];

    if (role) {
      people = people.filter((u) => u.role === role);
    }
    if (startup_id) {
      people = people.filter((u) => u.startup_id === Number(startup_id));
    }
    if (search) {
      const q = search.toLowerCase();
      people = people.filter(
        (u) =>
          u.name.toLowerCase().includes(q) ||
          (u.email || '').toLowerCase().includes(q) ||
          (u.nip_nim || '').toLowerCase().includes(q)
      );
    }

    // Status lomba yang dianggap "aktif" (belum selesai)
    const activeCompIds = new Set(
      data.competitions
        .filter((c) => c.status === 'upcoming' || c.status === 'ongoing')
        .map((c) => c.id)
    );

    const competitionStatsFor = (user) => {
      const compIds = new Set();
      for (const t of data.teams) {
        const isMember = (t.members || []).some((m) => m.user_id === user.id);
        const isAdvisor = t.advisor_id === user.id;
        if ((isMember || isAdvisor) && t.competition_id) {
          compIds.add(t.competition_id);
        }
      }
      let active = 0;
      compIds.forEach((id) => {
        if (activeCompIds.has(id)) active += 1;
      });
      return { active, total: compIds.size };
    };

    const total = people.length;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, parseInt(limit, 10) || 20);
    const startIndex = (pageNum - 1) * limitNum;
    const paged = people.slice(startIndex, startIndex + limitNum);

    const payload = paged.map((u) => {
      const startup = u.startup_id ? data.startups.find((s) => s.id === u.startup_id) : null;
      return {
        id: u.id,
        name: u.name,
        email: u.email || '',
        role: u.role,
        nip_nim: u.nip_nim || '',
        position: u.position || '',
        program_studi: u.program_studi || '',
        status: u.status || 'active',
        startup: startup
          ? { id: startup.id, name: startup.name }
          : u.startup_name
            ? { id: null, name: u.startup_name }
            : null,
        competition_stats: competitionStatsFor(u),
      };
    });

    return res.json({
      success: true,
      data: payload,
      meta: {
        total,
        page: pageNum,
        limit: limitNum,
        total_pages: Math.ceil(total / limitNum) || 1,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
