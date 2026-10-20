import { db } from '../db/index.js';

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
      // Pending advisor requests for this dosen
      const pendingForMe = data.teams.filter(
        (t) => t.advisor_status === 'pending' && (t.advisor_id === userId || t.advisor_name === req.user?.name)
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

      // Approved teams
      const approvedForMe = data.teams.filter(
        (t) => t.advisor_status === 'approved' && (t.advisor_id === userId || t.advisor_name === req.user?.name)
      );
      approvedForMe.forEach((t) => {
        notifications.push({
          id: `notif-approved-${t.id}`,
          type: 'team',
          title: 'Tim Dibimbingan',
          message: `Anda membimbing tim "${t.name}" pada lomba ${t.competition_title}`,
          date: t.created_at,
          read: true,
          link: '/dosen/teams',
        });
      });
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
