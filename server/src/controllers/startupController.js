import { db } from '../db/index.js';
import { syncStartup, deleteRow, logActivity } from '../db/sync.js';

export const getStartups = (req, res) => {
  try {
    const data = db.read();
    const startupsWithCount = data.startups.map((s) => ({
      ...s,
      _count: {
        users: data.users.filter((u) => u.startup_id === s.id).length,
      },
    }));
    return res.json({ success: true, data: startupsWithCount });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const createStartup = (req, res) => {
  try {
    const { name, code, description } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, message: 'Nama startup wajib diisi' });
    }

    const data = db.read();
    const newStartup = {
      id: Date.now(),
      name,
      code: code || name.substring(0, 3).toUpperCase(),
      description: description || '',
      status: 'active',
      created_at: new Date().toISOString().split('T')[0],
    };

    data.startups.push(newStartup);
    db.write(data);

    syncStartup(newStartup);
    logActivity({
      entity_type: 'startup',
      entity_id: newStartup.id,
      action: 'create',
      title: `Startup "${newStartup.name}" dibuat`,
      description: `Kode: ${newStartup.code}`,
      actor: req.user,
    });

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

    syncStartup(updated);
    logActivity({
      entity_type: 'startup',
      entity_id: updated.id,
      action: 'update',
      title: `Startup "${updated.name}" diperbarui`,
      actor: req.user,
    });

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

    const removed = data.startups[index];
    data.startups.splice(index, 1);
    db.write(data);

    deleteRow('startups', Number(id));
    logActivity({
      entity_type: 'startup',
      entity_id: Number(id),
      action: 'delete',
      title: `Startup "${removed.name}" dihapus`,
      actor: req.user,
    });

    return res.json({ success: true, message: 'Startup berhasil dihapus' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
