import { db } from '../db/index.js';

export const getStartups = (req, res) => {
  try {
    const data = db.read();
    return res.json({ success: true, data: data.startups });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const createStartup = (req, res) => {
  try {
    const { name, code, description } = req.body;
    if (!name || !code) {
      return res.status(400).json({ success: false, message: 'Nama dan kode startup / prodi wajib diisi' });
    }

    const data = db.read();
    const newStartup = {
      id: Date.now(),
      name,
      code,
      description: description || '',
      status: 'active',
      created_at: new Date().toISOString().split('T')[0],
    };

    data.startups.push(newStartup);
    db.write(data);

    return res.status(201).json({
      success: true,
      message: 'Startup/Program studi berhasil dibuat',
      data: newStartup,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const updateStartup = (req, res) => {
  try {
    const { id } = req.params;
    const data = db.read();
    const index = data.startups.findIndex((s) => s.id === Number(id));

    if (index === -1) {
      return res.status(404).json({ success: false, message: 'Startup tidak ditemukan' });
    }

    const updated = { ...data.startups[index], ...req.body };
    data.startups[index] = updated;
    db.write(data);

    return res.json({ success: true, message: 'Startup berhasil diperbarui', data: updated });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteStartup = (req, res) => {
  try {
    const { id } = req.params;
    const data = db.read();
    const index = data.startups.findIndex((s) => s.id === Number(id));

    if (index === -1) {
      return res.status(404).json({ success: false, message: 'Startup tidak ditemukan' });
    }

    data.startups.splice(index, 1);
    db.write(data);

    return res.json({ success: true, message: 'Startup berhasil dihapus' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
