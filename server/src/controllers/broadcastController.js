import { db } from '../db/index.js';
import { syncBroadcast, deleteRow, logActivity } from '../db/sync.js';

export const getBroadcasts = (req, res) => {
  try {
    const data = db.read();
    return res.json({ success: true, data: data.broadcasts });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const TARGET_LABELS = {
  all: 'Semua Pengguna',
  mahasiswa: 'Mahasiswa',
  dosen: 'Dosen Pembimbing',
  leader: 'Ketua Tim Lomba',
};

const countRecipients = (data, target) => {
  if (target === 'all') return data.users.length;
  if (target === 'mahasiswa' || target === 'dosen') {
    return data.users.filter((u) => u.role === target && (u.status || 'active') === 'active').length;
  }
  if (target === 'leader') {
    const leaders = new Set();
    for (const t of data.teams) {
      if (t.leader_id) leaders.add(t.leader_id);
    }
    return leaders.size;
  }
  return data.users.length;
};

const formatNow = () => {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const generateBroadcastId = (broadcasts) => {
  let n = broadcasts.length + 1;
  let id = `BC-${String(n).padStart(3, '0')}`;
  while (broadcasts.some((b) => b.id === id)) {
    n += 1;
    id = `BC-${String(n).padStart(3, '0')}`;
  }
  return id;
};

export const createBroadcast = (req, res) => {
  try {
    const { title, target, category, priority, message, actionUrl, scheduleDate } = req.body;

    if (!title || !message) {
      return res.status(400).json({ success: false, message: 'Judul dan isi pesan broadcast wajib diisi' });
    }
    if (target && !TARGET_LABELS[target]) {
      return res.status(400).json({ success: false, message: 'Target broadcast tidak dikenal' });
    }

    const data = db.read();
    const targetCode = target || 'all';
    const newBroadcast = {
      id: generateBroadcastId(data.broadcasts),
      title,
      target: TARGET_LABELS[targetCode],
      targetCode,
      category: category || 'Pengumuman Lomba',
      priority: priority || 'normal',
      message,
      actionUrl: actionUrl || '',
      scheduleDate: scheduleDate || null,
      sentAt: scheduleDate ? `${scheduleDate} (Scheduled)` : formatNow(),
      recipientsCount: countRecipients(data, targetCode),
      readCount: 0,
      status: scheduleDate ? 'Dijadualkan' : 'Terkirim',
      created_at: new Date().toISOString(),
    };

    data.broadcasts.unshift(newBroadcast);
    db.write(data);

    syncBroadcast(newBroadcast);
    logActivity({
      entity_type: 'broadcast',
      entity_id: newBroadcast.id,
      action: 'create',
      title: `Broadcast "${newBroadcast.title}" ${newBroadcast.status === 'Dijadualkan' ? 'dijadwalkan' : 'dikirim'}`,
      description: `Target: ${newBroadcast.target} • Kategori: ${newBroadcast.category}`,
      actor: req.user,
    });

    return res.status(201).json({
      success: true,
      message: scheduleDate ? 'Broadcast berhasil dijadwalkan' : 'Broadcast berhasil dikirimkan',
      data: newBroadcast,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteBroadcast = (req, res) => {
  try {
    const { id } = req.params;
    const data = db.read();
    const index = data.broadcasts.findIndex((b) => b.id === id);

    if (index === -1) {
      return res.status(404).json({ success: false, message: 'Broadcast tidak ditemukan' });
    }

    const removed = data.broadcasts[index];
    data.broadcasts.splice(index, 1);
    db.write(data);

    deleteRow('broadcasts', removed.id);
    logActivity({
      entity_type: 'broadcast',
      entity_id: removed.id,
      action: 'delete',
      title: `Broadcast "${removed.title}" dihapus`,
      actor: req.user,
    });

    return res.json({ success: true, message: 'Broadcast berhasil dihapus' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
