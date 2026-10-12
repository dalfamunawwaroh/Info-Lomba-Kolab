import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../db/index.js';
import { JWT_SECRET, JWT_REFRESH_SECRET, JWT_EXPIRES_IN, JWT_REFRESH_EXPIRES_IN } from '../config/index.js';

const generateTokens = (user) => {
  const payload = { id: user.id, email: user.email, role: user.role };
  const access_token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
  const refresh_token = jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: JWT_REFRESH_EXPIRES_IN });
  return { access_token, refresh_token };
};

export const login = (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email dan password wajib diisi',
      });
    }

    const data = db.read();
    const user = data.users.find((u) => u.email.toLowerCase() === email.toLowerCase());

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Email atau password salah',
      });
    }

    if (user.status === 'inactive') {
      return res.status(403).json({
        success: false,
        message: 'Akun Anda dinonaktifkan. Silakan hubungi admin.',
      });
    }

    const isMatch = bcrypt.compareSync(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Email atau password salah',
      });
    }

    const tokens = generateTokens(user);
    const { password: _, ...userWithoutPassword } = user;

    return res.json({
      success: true,
      message: 'Login berhasil',
      data: {
        user: userWithoutPassword,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const register = (req, res) => {
  try {
    const { name, email, password, role, nip_nim, phone, startup_id } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Nama, email, dan password wajib diisi',
      });
    }

    const data = db.read();
    const existing = data.users.find((u) => u.email.toLowerCase() === email.toLowerCase());

    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Email sudah terdaftar dalam sistem',
      });
    }

    const startup = data.startups.find((s) => s.id === Number(startup_id));
    const hashedPassword = bcrypt.hashSync(password, 10);

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
      status: 'active',
      avatar: null,
      created_at: new Date().toISOString(),
    };

    data.users.push(newUser);
    db.write(data);

    const tokens = generateTokens(newUser);
    const { password: _, ...userWithoutPassword } = newUser;

    return res.status(201).json({
      success: true,
      message: 'Registrasi berhasil',
      data: {
        user: userWithoutPassword,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const refreshToken = (req, res) => {
  try {
    const { refresh_token } = req.body;
    if (!refresh_token) {
      return res.status(400).json({ success: false, message: 'Refresh token dibutuhkan' });
    }

    jwt.verify(refresh_token, JWT_REFRESH_SECRET, (err, decoded) => {
      if (err) {
        return res.status(401).json({ success: false, message: 'Refresh token invalid/kadaluarsa' });
      }

      const data = db.read();
      const user = data.users.find((u) => u.id === decoded.id);

      if (!user) {
        return res.status(404).json({ success: false, message: 'Pengguna tidak ditemukan' });
      }

      const tokens = generateTokens(user);
      return res.json({
        success: true,
        data: {
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
        },
      });
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const logout = (req, res) => {
  return res.json({
    success: true,
    message: 'Logout berhasil',
  });
};

export const me = (req, res) => {
  const { password: _, ...userWithoutPassword } = req.user;
  return res.json({
    success: true,
    data: userWithoutPassword,
  });
};
