import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../db/index.js';
import { syncUser, syncPasswordReset, logActivity } from '../db/sync.js';
import { JWT_SECRET, JWT_REFRESH_SECRET, JWT_EXPIRES_IN, JWT_REFRESH_EXPIRES_IN } from '../config/index.js';

// Role yang boleh didaftarkan sendiri oleh publik.
// Admin HARUS dibuat oleh admin lain lewat POST /users (bukan lewat register).
const PUBLIC_ROLES = ['mahasiswa', 'dosen'];

const validatePasswordStrength = (password) => {
  const pwd = String(password || '');
  if (!pwd || pwd.length < 8) return 'Password minimal 8 karakter';
  if (/\s/.test(pwd)) return 'Password tidak boleh mengandung spasi';
  if (!/[A-Z]/.test(pwd)) return 'Password harus ada minimal 1 huruf kapital (A-Z)';
  if (!/[0-9]/.test(pwd)) return 'Password harus ada minimal 1 angka (0-9)';
  if (!/[^A-Za-z0-9]/.test(pwd)) return 'Password harus ada minimal 1 simbol khusus (contoh: !@#$)';
  return null;
};

const validateEmailFormat = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).trim());

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

    if (!user.password) {
      return res.status(401).json({
        success: false,
        message: 'Email atau password salah',
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

    if (!validateEmailFormat(email)) {
      return res.status(400).json({
        success: false,
        message: 'Format email tidak valid',
      });
    }

    if (role && !PUBLIC_ROLES.includes(role)) {
      // Cegah pendaftaran mandiri sebagai admin lewat API
      return res.status(400).json({
        success: false,
        message: 'Pendaftaran mandiri hanya tersedia untuk mahasiswa dan dosen. Akun admin dibuat oleh admin.',
      });
    }

    const pwdError = validatePasswordStrength(password);
    if (pwdError) {
      return res.status(400).json({ success: false, message: pwdError });
    }

    const trimmedNim = String(nip_nim || '').trim();
    if (!trimmedNim) {
      return res.status(400).json({ success: false, message: 'NIM/NIP wajib diisi' });
    }
    if (trimmedNim.length > 30) {
      return res.status(400).json({ success: false, message: 'NIM/NIP maksimal 30 karakter' });
    }
    if (!/^[A-Za-z0-9.\-/]+$/.test(trimmedNim)) {
      return res.status(400).json({
        success: false,
        message: 'NIM/NIP hanya boleh berisi huruf, angka, titik, garis miring, dan tanda hubung',
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

    const duplicateNim = data.users.find(
      (u) => String(u.nip_nim || '').trim().toLowerCase() === trimmedNim.toLowerCase()
    );
    if (duplicateNim) {
      return res.status(400).json({
        success: false,
        message: 'NIM/NIP sudah terdaftar dalam sistem',
      });
    }

    const startup = data.startups.find((s) => s.id === Number(startup_id));
    if (!startup_id || !startup) {
      return res.status(400).json({
        success: false,
        message: 'Startup wajib dipilih',
      });
    }
    const hashedPassword = bcrypt.hashSync(password, 10);

    const newUser = {
      id: Date.now(),
      name,
      email,
      password: hashedPassword,
      role: role || 'mahasiswa',
      nip_nim: trimmedNim,
      phone: phone || '',
      startup_id: startup.id,
      startup_name: startup.name,
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
      action: 'register',
      title: `Registrasi user "${newUser.name}"`,
      description: `Role: ${newUser.role} • Email: ${newUser.email}`,
      actor: newUser,
    });

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

/**
 * POST /auth/check-availability — publik, dipakai form register step 1
 * (Data Diri) agar email/NIM duplikat ketahuan saat klik Lanjutkan,
 * bukan saat submit akhir. Body: { email?, nip_nim? }.
 * ponytail: tanpa rate-limit; tambah express-rate-limit bila diserang spam.
 */
export const checkAvailability = (req, res) => {
  try {
    const { email, nip_nim } = req.body || {};
    const data = db.read();
    const result = { email_taken: false, nim_taken: false };

    const normalizedEmail = String(email || '').trim().toLowerCase();
    if (normalizedEmail) {
      result.email_taken = data.users.some(
        (u) => String(u.email || '').toLowerCase() === normalizedEmail
      );
    }

    const trimmedNim = String(nip_nim || '').trim().toLowerCase();
    if (trimmedNim) {
      result.nim_taken = data.users.some(
        (u) => String(u.nip_nim || '').trim().toLowerCase() === trimmedNim
      );
    }

    return res.json({ success: true, data: result });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * POST /auth/forgot-password — langkah 1: user mengajukan reset dengan emailnya.
 * Permintaan disimpan berstatus 'pending' dan MENUNGGU admin mengirimkan
 * kode verifikasi (POST /admin/resets/:id/send-code).
 * Respons selalu generik agar tidak membocorkan email terdaftar atau tidak.
 */
export const requestPasswordReset = (req, res) => {
  try {
    const { email } = req.body;
    if (!email || !String(email).trim()) {
      return res.status(400).json({ success: false, message: 'Email wajib diisi' });
    }
    if (!validateEmailFormat(email)) {
      return res.status(400).json({ success: false, message: 'Format email tidak valid' });
    }

    const data = db.read();
    if (!Array.isArray(data.password_resets)) data.password_resets = [];

    const normalized = String(email).trim().toLowerCase();
    const user = data.users.find((u) => String(u.email || '').toLowerCase() === normalized);

    const genericResponse = {
      success: true,
      message:
        'Jika email terdaftar, permintaan reset password telah diterima dan menunggu verifikasi admin untuk pengiriman kode.',
    };

    if (!user) {
      // Sengaja dibalas sama saja agar email tidak bocorkan status terdaftar/tidak
      return res.json(genericResponse);
    }

    if ((user.status || 'active') !== 'active') {
      return res.status(403).json({ success: false, message: 'Akun dinonaktifkan. Hubungi admin.' });
    }

    const now = new Date().toISOString();

    // Permintaan sebelumnya yang masih aktif → dibatalkan, hanya yang terbaru berlaku
    for (const r of data.password_resets) {
      if (r.user_id === user.id && (r.status === 'pending' || r.status === 'sent')) {
        r.status = 'superseded';
        r.updated_at = now;
        syncPasswordReset(r);
      }
    }

    const request = {
      id: Date.now(),
      user_id: user.id,
      email: user.email,
      user_name: user.name,
      status: 'pending', // menunggu admin kirim kode
      code_hash: null,
      attempts: 0,
      max_attempts: 5,
      expires_at: null,
      sent_at: null,
      created_at: now,
      updated_at: now,
    };

    data.password_resets.push(request);
    db.write(data);
    syncPasswordReset(request);

    logActivity({
      entity_type: 'password_reset',
      entity_id: request.id,
      action: 'request',
      title: `Permintaan reset password "${user.email}"`,
      actor: user,
    });

    return res.json(genericResponse);
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * POST /auth/reset-password — langkah 3: user memasukkan kode verifikasi
 * (yang dikirim via email oleh admin) + password baru.
 */
export const resetPasswordWithCode = (req, res) => {
  try {
    const { email, code, password } = req.body;

    if (!email || !code || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email, kode verifikasi, dan password baru wajib diisi',
      });
    }

    const pwdError = validatePasswordStrength(password);
    if (pwdError) {
      return res.status(400).json({ success: false, message: pwdError });
    }

    const data = db.read();
    if (!Array.isArray(data.password_resets)) data.password_resets = [];

    const normalized = String(email).trim().toLowerCase();
    const user = data.users.find((u) => String(u.email || '').toLowerCase() === normalized);
    if (!user) {
      return res.status(400).json({ success: false, message: 'Permintaan tidak ditemukan. Ajukan ulang reset password.' });
    }

    const record = data.password_resets
      .filter((r) => r.user_id === user.id && (r.status === 'pending' || r.status === 'sent'))
      .sort((a, b) => b.id - a.id)[0];

    if (!record || record.status !== 'sent') {
      return res.status(400).json({
        success: false,
        message: 'Kode verifikasi belum dikirim. Ajukan ulang reset password.',
      });
    }

    const now = new Date().toISOString();
    const expiresAt = new Date(record.expires_at).getTime();
    if (!Number.isFinite(expiresAt) || expiresAt < Date.now()) {
      record.status = 'expired';
      record.updated_at = now;
      db.write(data);
      syncPasswordReset(record);
      return res.status(400).json({ success: false, message: 'Kode verifikasi kedaluwarsa. Ajukan ulang reset password.' });
    }

    const maxAttempts = record.max_attempts || 5;
    if ((record.attempts || 0) >= maxAttempts) {
      record.status = 'expired';
      record.updated_at = now;
      db.write(data);
      syncPasswordReset(record);
      return res.status(400).json({
        success: false,
        message: 'Terlalu banyak percobaan kode yang salah. Ajukan ulang reset password.',
      });
    }

    const codeOk = bcrypt.compareSync(String(code).trim(), record.code_hash || '');
    if (!codeOk) {
      record.attempts = (record.attempts || 0) + 1;
      record.updated_at = now;
      db.write(data);
      syncPasswordReset(record);
      const left = maxAttempts - record.attempts;
      return res.status(400).json({
        success: false,
        message: left > 0 ? `Kode verifikasi salah. Sisa percobaan: ${left}` : 'Kode verifikasi salah. Ajukan ulang reset password.',
      });
    }

    // Kode cocok → ganti password
    user.password = bcrypt.hashSync(password, 10);
    record.status = 'used';
    record.updated_at = now;

    for (const r of data.password_resets) {
      if (r.user_id === user.id && r.id !== record.id && (r.status === 'pending' || r.status === 'sent')) {
        r.status = 'superseded';
        r.updated_at = now;
        syncPasswordReset(r);
      }
    }

    db.write(data);
    syncUser(user);
    syncPasswordReset(record);

    logActivity({
      entity_type: 'user',
      entity_id: user.id,
      action: 'reset_password',
      title: `Password akun "${user.email}" direset via kode verifikasi`,
      actor: user,
    });

    return res.json({ success: true, message: 'Password berhasil diubah. Silakan login dengan password baru.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
