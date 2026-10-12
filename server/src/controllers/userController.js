import bcrypt from 'bcryptjs';
import { db } from '../db/index.js';

export const getUsers = (req, res) => {
  try {
    const { role, search, status, page = 1, limit = 50 } = req.query;
    const data = db.read();
    let users = data.users.map(({ password, ...u }) => u);

    if (role) {
      users = users.filter((u) => u.role === role);
    }
    if (status) {
      users = users.filter((u) => u.status === status);
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
    const { name, email, password, role, nip_nim, phone, startup_id, expertise, skills } = req.body;

    if (!name || !email) {
      return res.status(400).json({ success: false, message: 'Nama dan email wajib diisi' });
    }

    const data = db.read();
    const existing = data.users.find((u) => u.email.toLowerCase() === email.toLowerCase());

    if (existing) {
      return res.status(400).json({ success: false, message: 'Email sudah terdaftar' });
    }

    const startup = data.startups.find((s) => s.id === Number(startup_id));
    const hashedPassword = bcrypt.hashSync(password || 'KoLab2026!', 10);

    const newUser = {
      id: Date.now(),
      name,
      email,
      password: hashedPassword,
      role: role || 'mahasiswa',
      nip_nim: nip_nim || '',
      phone: phone || '',
      startup_id: startup ? startup.id : 1,
      startup_name: startup ? startup.name : 'Teknologi Informasi',
      expertise: expertise || [],
      skills: skills || [],
      status: 'active',
      avatar: null,
      created_at: new Date().toISOString(),
    };

    data.users.push(newUser);
    db.write(data);

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
    }

    const updatedUser = { ...existingUser, ...updateData };
    data.users[index] = updatedUser;
    db.write(data);

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

    data.users.splice(index, 1);
    db.write(data);

    return res.json({ success: true, message: 'User berhasil dihapus' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
