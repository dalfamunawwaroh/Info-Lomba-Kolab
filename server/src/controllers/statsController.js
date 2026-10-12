import { db } from '../db/index.js';

export const getAdminStats = (req, res) => {
  try {
    const data = db.read();

    const totalUsers = data.users.length;
    const totalStudents = data.users.filter((u) => u.role === 'mahasiswa').length;
    const totalLecturers = data.users.filter((u) => u.role === 'dosen').length;
    const totalCompetitions = data.competitions.length;
    const ongoingCompetitions = data.competitions.filter((c) => c.status === 'ongoing').length;
    const totalTeams = data.teams.length;
    const pendingSubmissions = data.submissions.filter((s) => s.status === 'pending').length;
    const totalStartups = data.startups.length;
    const totalBroadcasts = data.broadcasts.length;

    return res.json({
      success: true,
      data: {
        total_users: totalUsers,
        total_students: totalStudents,
        total_lecturers: totalLecturers,
        total_competitions: totalCompetitions,
        ongoing_competitions: ongoingCompetitions,
        total_teams: totalTeams,
        pending_submissions: pendingSubmissions,
        total_startups: totalStartups,
        total_broadcasts: totalBroadcasts,
        system_status: 'Operational 99.9%',
        uptime: '15d 4h 32m',
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
