import { db } from '../db/index.js';

export const getBroadcasts = (req, res) => {
  try {
    const data = db.read();
    return res.json({ success: true, data: data.broadcasts });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const createBroadcast = (req, res) => {
  try {
    const { title, target, category, priority, message, actionUrl, scheduleDate } = req.body;

    if (!title || !message) {
      return res.status(400).json({ success: false, message: 'Judul dan isi pesan broadcast wajib diisi' });
    }

    const data = db.read();
    const count = data.broadcasts.length + 1;
    const newBroadcast = {
      id: `BC-00${count}`,
      title,
      target: target === 'all' ? 'Semua Pengguna' : target === 'mahasiswa' ? 'Mahasiswa' : 'Dosen Pembimbing',
      targetCode: target || 'all',
      category: category || 'Pengumuman Lomba',
      priority: priority || 'normal',
      message,
      actionUrl: actionUrl || '',
      scheduleDate: scheduleDate || null,
      sentAt: scheduleDate ? `${scheduleDate} (Scheduled)` : 'Baru saja',
      recipientsCount: target === 'all' ? data.users.length : data.users.filter((u) => u.role === target).length || 50,
      readCount: 0,
      status: scheduleDate ? 'Dijadualkan' : 'Terkirim',
      created_at: new Date().toISOString(),
    };

    data.broadcasts.unshift(newBroadcast);
    db.write(data);

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

    data.broadcasts.splice(index, 1);
    db.write(data);

    return res.json({ success: true, message: 'Broadcast berhasil dihapus' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
