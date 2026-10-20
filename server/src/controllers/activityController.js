import { db } from '../db/index.js';
import { readActivityLog } from '../db/sync.js';

/* ── Deterministic pseudo-random from seed ── */
const seededScore = (seed) => {
  let h = 0;
  const s = String(seed);
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) >>> 0;
  }
  return h;
};

/* ── Format tanggal pendek ── */
const shortDate = (d) => {
  if (!d) return null;
  try {
    const dt = typeof d === 'string' ? new Date(d) : d;
    if (isNaN(dt.getTime())) return String(d);
    return dt.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return String(d);
  }
};

const relativeTime = (dateStr) => {
  if (!dateStr) return '-';
  const then = new Date(dateStr).getTime();
  if (isNaN(then)) return String(dateStr);
  const diff = Math.max(0, Date.now() - then);
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `${minutes} menit yang lalu`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} jam yang lalu`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} hari yang lalu`;
  return shortDate(dateStr);
};

/* ── Build checklist items from competition requirements + team progress ── */
const buildChecklist = (comp, team) => {
  const requirements = Array.isArray(comp?.requirements) && comp.requirements.length > 0
    ? comp.requirements
    : ['Proposal Inovasi', 'Dokumen Teknis', 'Video Pitching'];
  const extraTasks = ['Review Feedback Dosen Pembimbing', 'Final Submission ke Portal Panitia'];
  const items = [...requirements.map((r) => ({ task: r })), ...extraTasks.map((t) => ({ task: t }))];

  // Progress heuristic: complete team → all done; approved advisor → ~75%; else ~40%
  let doneCount;
  if (team.status === 'complete') doneCount = items.length;
  else if (team.advisor_status === 'approved') doneCount = Math.max(1, Math.floor(items.length * 0.75));
  else doneCount = Math.max(1, Math.floor(items.length * 0.4));

  items.forEach((item, i) => { item.done = i < doneCount; });
  return { total: items.length, completed: doneCount, items };
};

/* ── Build latest document + similarity + dosen review from team data ── */
const buildDocument = (team, comp) => {
  const seed = seededScore(`doc-${team.id}`);
  const similarityNum = (seed % 35); // 0–34%
  const similarityStatus = similarityNum > 20 ? 'warning' : 'safe';
  const ext = 'pdf';
  const slug = team.name.replace(/[^a-zA-Z0-9]/g, '_');
  const filename = `${slug}_${(comp?.category || 'Dokumen').replace(/[^a-zA-Z0-9]/g, '')}_v${(seed % 3) + 1}.${ext}`;
  const filesizeNum = (seed % 120) / 10 + 1.5; // 1.5 – 13.5 MB
  const uploadedAt = team.created_at || new Date().toISOString();

  let reviewStatus, feedback, reviewDate;
  if (team.advisor_status === 'approved') {
    if (similarityStatus === 'warning') {
      reviewStatus = 'revision_required';
      feedback = `Tingkat kesamaan teks ${similarityNum}% masih terlalu tinggi. Segera parafrase sebelum submisi resmi.`;
    } else {
      reviewStatus = 'reviewed';
      feedback = 'Latar belakang masalah dan use-case sudah tajam. Perjelas arsitektur dan tambahkan data pendukung.';
    }
    reviewDate = uploadedAt;
  } else if (team.advisor_status === 'pending') {
    reviewStatus = 'pending';
    feedback = 'Menunggu review dari dosen pembimbing.';
    reviewDate = null;
  } else {
    reviewStatus = 'pending';
    feedback = 'Belum ada dosen pembimbing yang ditugaskan untuk tim ini.';
    reviewDate = null;
  }

  return {
    filename,
    filesize: `${filesizeNum.toFixed(1)} MB`,
    uploaded_by: team.leader_name || 'Ketua Tim',
    uploaded_at: `${shortDate(uploadedAt)}, ${(seed % 12) + 8}:00 WIB`,
    similarity_score: `${similarityNum}%`,
    similarity_status: similarityStatus,
    dosen_review: { status: reviewStatus, feedback, review_date: reviewDate ? `${shortDate(reviewDate)}, ${(seed % 10) + 8}:00 WIB` : null },
  };
};

/* ── GET /api/v1/activities?role=mahasiswa|dosen ── */
export const getActivities = async (req, res) => {
  try {
    const data = db.read();
    const role = req.query.role || 'mahasiswa';
    const activity_log = await readActivityLog(100);

    if (role === 'dosen') {
      const dosenUsers = data.users.filter((u) => u.role === 'dosen');
      const dosenActivities = dosenUsers.map((d) => {
        const myTeams = data.teams.filter((t) => t.advisor_id === d.id || t.advisor_name === d.name);
        const approvedCount = myTeams.filter((t) => t.advisor_status === 'approved').length;

        // Build feed from teams + submissions
        const feed = [];
        myTeams.forEach((t) => {
          const comp = data.competitions.find((c) => c.id === t.competition_id);
          const doc = buildDocument(t, comp);
          if (doc.dosen_review.status === 'reviewed') {
            feed.push({ type: 'review', text: `Memberikan feedback pada ${doc.filename}`, time: relativeTime(doc.dosen_review.review_date || t.created_at) });
          } else if (doc.dosen_review.status === 'revision_required') {
            feed.push({ type: 'review', text: `Meminta revisi ${doc.filename} — similarity ${doc.similarity_score} terlalu tinggi`, time: relativeTime(doc.dosen_review.review_date || t.created_at) });
          }
          if (t.advisor_status === 'approved') {
            feed.push({ type: 'approve', text: `Menyetujui bimbingan tim "${t.name}"`, time: relativeTime(t.created_at) });
          } else if (t.advisor_status === 'pending') {
            feed.push({ type: 'assign', text: `Diajukan sebagai pembimbing tim "${t.name}"`, time: relativeTime(t.created_at) });
          }
        });

        // Submissions by this dosen
        data.submissions
          .filter((s) => s.applicant_id === d.id || s.applicant_name === d.name)
          .forEach((s) => {
            feed.push({ type: 'assign', text: `Mengajukan diri sebagai pembimbing ${s.team_name || 'tim'}`, time: relativeTime(s.submitted_at) });
          });

        // Reminder if teams nearing deadline
        myTeams.forEach((t) => {
          const comp = data.competitions.find((c) => c.id === t.competition_id);
          if (comp?.event_date) {
            const daysLeft = Math.ceil((new Date(comp.event_date) - Date.now()) / (1000 * 60 * 60 * 24));
            if (daysLeft > 0 && daysLeft <= 7) {
              feed.push({ type: 'reminder', text: `Mengirim reminder deadline ${comp.title} (H-${daysLeft}) untuk ${t.name}`, time: 'Hari ini' });
            }
          }
        });

        feed.sort((a, b) => String(b.time).localeCompare(String(a.time)));
        const reviewsGiven = feed.filter((f) => f.type === 'review').length;
        const avgHours = 1 + (seededScore(`resp-${d.id}`) % 12);
        const badge = avgHours <= 3 ? 'Sangat Responsif' : avgHours <= 8 ? 'Responsif' : 'Perlu Diperhatikan';

        return {
          id: `DSN-${d.id}`,
          name: d.name,
          specialty: d.position && d.position !== 'Dosen Pembimbing' ? d.position : 'Dosen Pembimbing',
          teams: myTeams.map((t) => t.name),
          reviews_given: Math.max(reviewsGiven, approvedCount),
          avg_response: `${avgHours} jam`,
          badge,
          feed,
        };
      }).filter((d) => d.teams.length > 0 || d.feed.length > 0);

      return res.json({ success: true, data: dosenActivities, activity_log });
    }

    // Mahasiswa: derive from teams
    const mahasiswaActivities = data.teams.map((t) => {
      const comp = data.competitions.find((c) => c.id === t.competition_id);
      const daysLeft = comp?.event_date
        ? Math.max(0, Math.ceil((new Date(comp.event_date) - Date.now()) / (1000 * 60 * 60 * 24)))
        : null;

      const checklist = buildChecklist(comp, t);
      const latestDocument = buildDocument(t, comp);
      const teamMembers = (t.members || []).map((m) => {
        const roleName = m.role && m.role.toLowerCase().includes('ketua') ? 'Ketua' : (m.role || 'Anggota');
        return `${m.name} (${roleName})`;
      });

      return {
        id: `ACT-${t.id}`,
        team_name: t.name,
        competition: t.competition_title,
        competition_id: t.competition_id,
        category: comp?.category || null,
        leader: t.leader_name,
        leader_id: t.leader_id,
        advisor: t.advisor_name || 'Belum ada dosen pembimbing',
        advisor_status: t.advisor_status,
        member_count: t.members?.length || 0,
        max_members: comp?.max_team_members || null,
        calendar_deadline: comp?.registration_deadline || null,
        days_left: daysLeft ?? 0,
        event_date: comp?.event_date || null,
        status: t.status,
        updated_at: relativeTime(t.created_at),
        checklist,
        latest_document: latestDocument,
        team_members: teamMembers.length > 0 ? teamMembers : [`${t.leader_name} (Ketua)`],
      };
    });

    return res.json({ success: true, data: mahasiswaActivities, activity_log });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
