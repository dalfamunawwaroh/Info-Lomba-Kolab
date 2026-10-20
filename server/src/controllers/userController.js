import bcrypt from 'bcryptjs';
import { db } from '../db/index.js';
import { syncUser, deleteRow, logActivity } from '../db/sync.js';

const DEFAULT_PASSWORD = 'KoLab2026!';

export const getUsers = (req, res) => {
  try {
    const { role, search, status, startup_id, page = 1, limit = 50 } = req.query;
    const data = db.read();
    let users = data.users.map(({ password, ...u }) => u);

    if (role) {
      users = users.filter((u) => u.role === role);
    }
    if (status) {
      users = users.filter((u) => u.status === status);
    }
    if (startup_id) {
      users = users.filter((u) => u.startup_id === Number(startup_id));
    }
    if (search) {
      const q = search.toLowerCase();
      users = users.filter(
        (u) =>
          u.name.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          (u.nip_nim && u.nip_nim.toLowerCase().includes(q))
      );
    }

    const total = users.length;
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const startIndex = (pageNum - 1) * limitNum;
    const paginatedUsers = users.slice(startIndex, startIndex + limitNum);

    return res.json({
      success: true,
      data: paginatedUsers,
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

export const getUserById = (req, res) => {
  try {
    const { id } = req.params;
    const data = db.read();
    const user = data.users.find((u) => u.id === Number(id));

    if (!user) {
      return res.status(404).json({ success: false, message: 'User tidak ditemukan' });
    }

    const { password, ...userWithoutPassword } = user;
    return res.json({ success: true, data: userWithoutPassword });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const createUser = (req, res) => {
  try {
    const {
      name, email, password, role, nip_nim, phone, startup_id, expertise, skills, position,
      program_studi, tempat_lahir, tanggal_lahir, instagram, linkedin, foto_pribadi, tanda_tangan,
    } = req.body;

    if (!name || !email) {
      return res.status(400).json({ success: false, message: 'Nama dan email wajib diisi' });
    }

    const data = db.read();
    const existing = data.users.find((u) => u.email.toLowerCase() === email.toLowerCase());

    if (existing) {
      return res.status(400).json({ success: false, message: 'Email sudah terdaftar' });
    }

    const startup = data.startups.find((s) => s.id === Number(startup_id));
    const hashedPassword = bcrypt.hashSync(password || DEFAULT_PASSWORD, 10);
    const finalRole = role || 'mahasiswa';

    const newUser = {
      id: Date.now(),
      name,
      email,
      password: hashedPassword,
      role: finalRole,
      nip_nim: nip_nim || '',
      phone: phone || '',
      startup_id: startup ? startup.id : 1,
      startup_name: startup ? startup.name : 'Teknologi Informasi',
      position: position || '',
      program_studi: finalRole === 'mahasiswa' ? program_studi || '' : '',
      tempat_lahir: tempat_lahir || '',
      tanggal_lahir: tanggal_lahir || '',
      instagram: instagram || '',
      linkedin: linkedin || '',
      foto_pribadi: foto_pribadi || null,
      tanda_tangan: tanda_tangan || null,
      expertise: expertise || [],
      skills: skills || [],
      status: 'active',
      avatar: null,
      created_at: new Date().toISOString(),
    };

    data.users.push(newUser);
    db.write(data);

    syncUser(newUser);
    logActivity({
      entity_type: 'user',
      entity_id: newUser.id,
      action: 'create',
      title: `User "${newUser.name}" dibuat`,
      description: `Role: ${newUser.role} • Email: ${newUser.email}`,
      actor: req.user,
    });

    const { password: _, ...userWithoutPassword } = newUser;
    return res.status(201).json({
      success: true,
      message: 'User berhasil dibuat',
      data: userWithoutPassword,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const updateUser = (req, res) => {
  try {
    const { id } = req.params;
    const data = db.read();
    const index = data.users.findIndex((u) => u.id === Number(id));

    if (index === -1) {
      return res.status(404).json({ success: false, message: 'User tidak ditemukan' });
    }

    const existingUser = data.users[index];
    const updateData = { ...req.body };

    if (updateData.password) {
      updateData.password = bcrypt.hashSync(updateData.password, 10);
    } else {
      delete updateData.password;
    }

    if (updateData.startup_id) {
      const startup = data.startups.find((s) => s.id === Number(updateData.startup_id));
      if (startup) {
        updateData.startup_name = startup.name;
      }
    } else if (updateData.startup_id === null) {
      updateData.startup_name = null;
    }

    // Program studi hanya berlaku untuk mahasiswa
    const finalRole = updateData.role || existingUser.role;
    if (finalRole !== 'mahasiswa') {
      updateData.program_studi = '';
    }
    if (updateData.tanggal_lahir) {
      updateData.tanggal_lahir = String(updateData.tanggal_lahir).slice(0, 10);
    }

    const updatedUser = { ...existingUser, ...updateData };
    data.users[index] = updatedUser;
    db.write(data);

    syncUser(updatedUser);
    logActivity({
      entity_type: 'user',
      entity_id: updatedUser.id,
      action: 'update',
      title: `User "${updatedUser.name}" diperbarui`,
      actor: req.user,
    });

    const { password: _, ...userWithoutPassword } = updatedUser;
    return res.json({
      success: true,
      message: 'User berhasil diperbarui',
      data: userWithoutPassword,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const activateUser = (req, res) => {
  try {
    const { id } = req.params;
    const data = db.read();
    const user = data.users.find((u) => u.id === Number(id));

    if (!user) {
      return res.status(404).json({ success: false, message: 'User tidak ditemukan' });
    }

    user.status = 'active';
    db.write(data);

    syncUser(user);
    logActivity({
      entity_type: 'user',
      entity_id: user.id,
      action: 'activate',
      title: `User "${user.name}" diaktifkan`,
      actor: req.user,
    });

    const { password, ...u } = user;
    return res.json({ success: true, message: 'User berhasil diaktifkan', data: u });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const deactivateUser = (req, res) => {
  try {
    const { id } = req.params;
    const data = db.read();
    const user = data.users.find((u) => u.id === Number(id));

    if (!user) {
      return res.status(404).json({ success: false, message: 'User tidak ditemukan' });
    }

    user.status = 'inactive';
    db.write(data);

    syncUser(user);
    logActivity({
      entity_type: 'user',
      entity_id: user.id,
      action: 'deactivate',
      title: `User "${user.name}" dinonaktifkan`,
      actor: req.user,
    });

    const { password, ...u } = user;
    return res.json({ success: true, message: 'User berhasil dinonaktifkan', data: u });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteUser = (req, res) => {
  try {
    const { id } = req.params;
    const data = db.read();
    const index = data.users.findIndex((u) => u.id === Number(id));

    if (index === -1) {
      return res.status(404).json({ success: false, message: 'User tidak ditemukan' });
    }

    const removed = data.users[index];
    data.users.splice(index, 1);
    db.write(data);

    deleteRow('users', Number(id));
    logActivity({
      entity_type: 'user',
      entity_id: Number(id),
      action: 'delete',
      title: `User "${removed.name}" dihapus`,
      actor: req.user,
    });

    return res.json({ success: true, message: 'User berhasil dihapus' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const resetPassword = (req, res) => {
  try {
    const { id } = req.params;
    const data = db.read();
    const user = data.users.find((u) => u.id === Number(id));

    if (!user) {
      return res.status(404).json({ success: false, message: 'User tidak ditemukan' });
    }

    user.password = bcrypt.hashSync(DEFAULT_PASSWORD, 10);
    db.write(data);

    syncUser(user);

    return res.json({
      success: true,
      message: `Password ${user.name} berhasil direset ke password default`,
      data: { id: user.id, email: user.email },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const sendMessageToUser = (req, res) => {
  try {
    const { id } = req.params;
    const { title, message } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, message: 'Isi pesan wajib diisi' });
    }

    const data = db.read();
    const user = data.users.find((u) => u.id === Number(id));

    if (!user) {
      return res.status(404).json({ success: false, message: 'User tidak ditemukan' });
    }

    if (!data.messages) data.messages = [];

    const newMessage = {
      id: `MSG-${Date.now()}`,
      recipient_id: user.id,
      recipient_name: user.name,
      recipient_email: user.email,
      sender_id: req.user.id,
      sender_name: req.user.name,
      title: title && title.trim() ? title.trim() : 'Pesan dari Admin',
      message: message.trim(),
      is_read: false,
      created_at: new Date().toISOString(),
    };

    data.messages.unshift(newMessage);
    db.write(data);

    return res.status(201).json({ success: true, message: 'Pesan berhasil dikirim', data: newMessage });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getUserMessages = (req, res) => {
  try {
    const { id } = req.params;
    const data = db.read();
    const messages = (data.messages || []).filter((m) => m.recipient_id === Number(id));
    return res.json({ success: true, data: messages });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
