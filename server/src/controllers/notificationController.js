import { db } from '../db/index.js';
import { isAdvisorOf } from '../utils/advisorHelpers.js';

/** Notifikasi hasil keputusan admin atas pengajuan milik user (dosen). */
const buildDosenSubmissionNotifs = (data, userId) => {
  const out = [];
  for (const s of data.submissions || []) {
    if (s.applicant_id !== userId) continue;
    if (!['approved', 'rejected'].includes(s.status)) continue;
    if (!s.processed_at) continue;

    const label = s.type_label || s.type;
    out.push({
      id: `notif-sub-${s.id}`,
      type: 'submission',
      title: `Pengajuan ${label} ${s.status === 'approved' ? 'Disetujui' : 'Ditolak'}`,
      message:
        s.status === 'approved'
          ? `Pengajuan "${label}"${s.team_name ? ` untuk tim "${s.team_name}"` : ''} telah disetujui admin.`
          : `Pengajuan "${label}"${s.team_name ? ` untuk tim "${s.team_name}"` : ''} ditolak admin${s.admin_notes ? `: ${s.admin_notes}` : '.'}`,
      date: s.processed_at,
      read: false,
      link: s.type === 'team_change' ? '/dosen/team-change-requests' : '/dosen/self-assign',
    });
  }
  return out;
};

/** Notifikasi untuk ketua tim saat pengajuan pembimbingnya direspons dosen/admin. */
const buildLeaderAdvisorNotifs = (data, userId) => {
  const out = [];
  const myTeamIds = (data.teams || [])
    .filter((t) => t.leader_id === userId)
    .map((t) => t.id);

  for (const s of data.submissions || []) {
    if (!myTeamIds.includes(s.team_id)) continue;
    if (s.type !== 'advisor_request' && s.type !== 'advisor_self_assign') continue;
    if (!['approved', 'rejected'].includes(s.status)) continue;
    if (!s.processed_at) continue;

    const advisorName = s.advisor_name || s.applicant_name || 'Dosen';
    out.push({
      id: `notif-leader-${s.id}`,
      type: 'advisor',
      title: s.status === 'approved' ? 'Dosen Pembimbing Disetujui' : 'Pengajuan Dosen Ditolak',
      message:
        s.status === 'approved'
          ? `${advisorName} telah menjadi dosen pembimbing tim "${s.team_name}".`
          : `Pengajuan dosen pembimbing untuk tim "${s.team_name}" ditolak${s.rejection_reason ? `: ${s.rejection_reason}` : '.'}`,
      date: s.processed_at,
      read: false,
      link: `/mahasiswa/teams/${s.team_id}`,
    });
  }
  return out;
};

export const getNotifications = (req, res) => {
  try {
    const data = db.read();
    const role = req.user?.role || 'mahasiswa';
    const userId = req.user?.id;
    const notifications = [];

    if (role === 'admin') {
      // Pending advisor requests
      const pendingTeams = data.teams.filter((t) => t.advisor_status === 'pending');
      pendingTeams.forEach((t) => {
        notifications.push({
          id: `notif-adv-${t.id}`,
          type: 'advisor_request',
          title: 'Pengajuan Dosen Pembimbing',
          message: `Tim "${t.name}" mengajukan dosen pembimbing`,
          date: t.created_at,
          read: false,
          link: '/admin/submissions',
        });
      });

      // New teams
      data.teams.slice(-10).reverse().forEach((t) => {
        notifications.push({
          id: `notif-team-${t.id}`,
          type: 'team',
          title: 'Tim Baru Dibentuk',
          message: `Tim "${t.name}" dibentuk untuk lomba ${t.competition_title}`,
          date: t.created_at,
          read: false,
          link: '/admin/teams',
        });
      });

      // Competitions with deadlines approaching
      data.competitions.forEach((c) => {
        if (c.registration_deadline) {
          const daysLeft = Math.ceil((new Date(c.registration_deadline) - new Date()) / (1000 * 60 * 60 * 24));
          if (daysLeft > 0 && daysLeft <= 7) {
            notifications.push({
              id: `notif-deadline-${c.id}`,
              type: 'deadline',
              title: `Deadline ${daysLeft} Hari Lagi!`,
              message: `Pendaftaran "${c.title}" ditutup ${daysLeft} hari lagi`,
              date: new Date().toISOString().split('T')[0],
              read: false,
              link: '/admin/competitions',
            });
          }
        }
      });
    } else if (role === 'dosen') {
      // Pengajuan pembimbing yang menargetkan dosen ini (field lama + multi-advisor).
      const pendingForMe = data.teams.filter(
        (t) =>
          t.advisor_status === 'pending' &&
          (t.advisor_id === userId ||
            t.advisor_name === req.user?.name ||
            (t.advisors || []).some((a) => a.id === userId && a.status === 'pending'))
      );
      pendingForMe.forEach((t) => {
        notifications.push({
          id: `notif-adv-${t.id}`,
          type: 'advisor_request',
          title: 'Pengajuan Bimbingan Baru',
          message: `Tim "${t.name}" mengajukan Anda sebagai dosen pembimbing`,
          date: t.created_at,
          read: false,
          link: '/dosen/advisor-requests',
        });
      });

      // Tim yang sudah dibimbing (field lama + multi-advisor)
      const approvedForMe = data.teams.filter((t) => isAdvisorOf(t, userId));
      approvedForMe.forEach((t) => {
        notifications.push({
          id: `notif-approved-${t.id}`,
          type: 'team',
          title: 'Tim Dibimbingan',
          message: `Anda membimbing tim "${t.name}" pada lomba ${t.competition_title}`,
          date: t.created_at,
          read: true,
          link: '/dosen/my-teams',
        });
      });

      // Hasil keputusan admin atas pengajuan dosen (ajukan diri / perubahan tim)
      notifications.push(...buildDosenSubmissionNotifs(data, userId));
    } else {
      // Mahasiswa: teams they're in
      const myTeams = data.teams.filter(
        (t) => t.leader_id === userId || (t.members || []).some((m) => m.user_id === userId)
      );
      myTeams.forEach((t) => {
        notifications.push({
          id: `notif-myteam-${t.id}`,
          type: 'team',
          title: 'Tim Anda',
          message: `Anda tergabung dalam tim "${t.name}" untuk lomba ${t.competition_title}`,
          date: t.created_at,
          read: true,
          link: '/mahasiswa/history',
        });

        if (t.advisor_status === 'approved') {
          notifications.push({
            id: `notif-adv-approved-${t.id}`,
            type: 'advisor',
            title: 'Dosen Pembimbing Disetujui',
            message: `${t.advisor_name} telah menyetujui bimbingan tim "${t.name}"`,
            date: t.created_at,
            read: true,
            link: '/mahasiswa/history',
          });
        }
      });

      // Upcoming competitions
      data.competitions.forEach((c) => {
        if (c.event_date) {
          const daysLeft = Math.ceil((new Date(c.event_date) - new Date()) / (1000 * 60 * 60 * 24));
          if (daysLeft > 0 && daysLeft <= 14) {
            notifications.push({
              id: `notif-event-${c.id}`,
              type: 'event',
              title: `${daysLeft} Hari Lagi!`,
              message: `Lomba "${c.title}" akan berlangsung ${daysLeft} hari lagi`,
              date: new Date().toISOString().split('T')[0],
              read: false,
              link: '/mahasiswa/competitions',
            });
          }
        }
      });

      // Ketua tim: hasil keputusan pengajuan dosen pembimbing (F-10/F-11/F-12)
      notifications.push(...buildLeaderAdvisorNotifs(data, userId));
    }

    // Sort by date descending
    notifications.sort((a, b) => new Date(b.date) - new Date(a.date));

    const unreadCount = notifications.filter((n) => !n.read).length;

    return res.json({ success: true, data: { notifications, unread_count: unreadCount } });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const markAllRead = (req, res) => {
  try {
    return res.json({ success: true, message: 'Semua notifikasi ditandai sudah dibaca' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
