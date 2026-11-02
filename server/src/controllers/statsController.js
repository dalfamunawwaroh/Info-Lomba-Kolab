import { db } from '../db/index.js';
import { isMySQLConnected } from '../db/mysql.js';

const formatUptime = (seconds) => {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (d > 0) return `${d}h ${h}m`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
};

export const getAdminStats = (req, res) => {
  try {
    const data = db.read();

    const totalUsers = data.users.length;
    const totalStudents = data.users.filter((u) => u.role === 'mahasiswa').length;
    const totalLecturers = data.users.filter((u) => u.role === 'dosen').length;
    const activeStudents = data.users.filter(
      (u) => u.role === 'mahasiswa' && (u.status || 'active') === 'active'
    ).length;
    const totalCompetitions = data.competitions.length;
    const ongoingCompetitions = data.competitions.filter((c) => c.status === 'ongoing').length;
    const upcomingCompetitions = data.competitions.filter((c) => c.status === 'upcoming').length;
    const totalTeams = data.teams.length;
    const pendingSubmissions = data.submissions.filter((s) => s.status === 'pending').length;
    const totalStartups = data.startups.length;
    const totalBroadcasts = data.broadcasts.length;
    const sentBroadcasts = data.broadcasts.filter((b) => b.status === 'Terkirim').length;
    const scheduledBroadcasts = data.broadcasts.filter((b) => b.status === 'Dijadualkan').length;

    return res.json({
      success: true,
      data: {
        total_users: totalUsers,
        total_students: totalStudents,
        total_lecturers: totalLecturers,
        active_users: activeStudents,
        total_competitions: totalCompetitions,
        ongoing_competitions: ongoingCompetitions,
        upcoming_competitions: upcomingCompetitions,
        total_teams: totalTeams,
        pending_submissions: pendingSubmissions,
        total_startups: totalStartups,
        total_broadcasts: totalBroadcasts,
        sent_broadcasts: sentBroadcasts,
        scheduled_broadcasts: scheduledBroadcasts,
        system_status: isMySQLConnected() ? 'Operational' : 'JSON Fallback (MySQL terputus)',
        database: isMySQLConnected() ? 'MySQL' : 'JSON',
        uptime: formatUptime(process.uptime()),
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
