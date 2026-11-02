import bcrypt from 'bcryptjs';
import { db } from '../db/index.js';
import { syncPasswordReset, logActivity } from '../db/sync.js';
import { sendPasswordResetOtp, isMailEnabled } from '../services/mailer.js';

const OTP_TTL_MINUTES = 10;
const ACTIVE_STATUSES = ['pending', 'sent'];

/**
 * GET /admin/resets — daftar permintaan reset password (admin).
 * Query: status (default: yang masih aktif = pending + sent)
 * Hash kode TIDAK pernah ikut di response.
 */
export const getResetRequests = (req, res) => {
  try {
    const { status } = req.query;
    const data = db.read();

    let list = [...(data.password_resets || [])];
    // status='all' → semua; selain itu default hanya yang masih aktif
    if (status && status !== 'all') {
      list = list.filter((r) => r.status === status);
    } else if (!status) {
      list = list.filter((r) => ACTIVE_STATUSES.includes(r.status));
    }
    list.sort((a, b) => b.id - a.id);

    const payload = list.map((r) => {
      const user = data.users.find((u) => u.id === r.user_id) || null;
      const { code_hash, ...rest } = r;
      return {
        ...rest,
        user: user
          ? { id: user.id, name: user.name, email: user.email, role: user.role, status: user.status }
          : null,
        is_expired: r.expires_at ? new Date(r.expires_at).getTime() < Date.now() : false,
      };
    });

    return res.json({
      success: true,
      data: payload,
      meta: { total: payload.length, smtp_enabled: isMailEnabled(), otp_ttl_minutes: OTP_TTL_MINUTES },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * POST /admin/resets/:id/send-code — admin memicu pengiriman kode verifikasi
 * 6 digit ke email pemohon (via SMTP). Bisa dipanggil ulang untuk resend
 * (kode lama diganti, percobaan direset).
 */
export const sendResetCode = async (req, res) => {
  try {
    const { id } = req.params;
    const data = db.read();
    if (!Array.isArray(data.password_resets)) data.password_resets = [];

    const record = data.password_resets.find((r) => r.id === Number(id));
    if (!record) {
      return res.status(404).json({ success: false, message: 'Permintaan reset tidak ditemukan' });
    }
    if (!ACTIVE_STATUSES.includes(record.status)) {
      return res.status(400).json({
        success: false,
        message: `Permintaan sudah diproses (${record.status}) dan tidak dapat dikirim ulang`,
      });
    }

    const user = data.users.find((u) => u.id === record.user_id);
    if (!user) {
      return res.status(400).json({ success: false, message: 'User pemohon sudah tidak ditemukan' });
    }
    if ((user.status || 'active') !== 'active') {
      return res.status(400).json({ success: false, message: 'Akun pemohon tidak aktif' });
    }

    const code = String(Math.floor(100000 + Math.random() * 900000));
    const now = new Date().toISOString();
    const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000).toISOString();

    record.code_hash = bcrypt.hashSync(code, 10);
    record.attempts = 0;
    record.status = 'sent';
    record.sent_at = now;
    record.expires_at = expiresAt;
    record.updated_at = now;
    db.write(data);
    syncPasswordReset(record);

    let messageId = null;
    try {
      messageId = await sendPasswordResetOtp({
        to: record.email,
        name: record.user_name || user.name,
        code,
        minutes: OTP_TTL_MINUTES,
      });
    } catch (mailError) {
      // Email gagal → kembalikan ke pending supaya admin bisa coba lagi
      record.status = 'pending';
      record.code_hash = null;
      record.updated_at = new Date().toISOString();
      db.write(data);
      syncPasswordReset(record);
      return res.status(502).json({
        success: false,
        message: `Gagal mengirim email ke ${record.email}: ${mailError.message}`,
      });
    }

    logActivity({
      entity_type: 'password_reset',
      entity_id: record.id,
      action: 'send_code',
      title: `Kode verifikasi reset password dikirim ke "${record.email}"`,
      description: `Berlaku ${OTP_TTL_MINUTES} menit • Email message-id: ${messageId}`,
      actor: req.user,
    });

    return res.json({
      success: true,
      message: `Kode verifikasi berhasil dikirim ke ${record.email}`,
      data: {
        id: record.id,
        email: record.email,
        status: record.status,
        sent_at: record.sent_at,
        expires_at: record.expires_at,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * POST /admin/resets/:id/cancel — admin menolak/membatalkan permintaan reset.
 */
export const cancelResetRequest = (req, res) => {
  try {
    const { id } = req.params;
    const data = db.read();

    const record = (data.password_resets || []).find((r) => r.id === Number(id));
    if (!record) {
      return res.status(404).json({ success: false, message: 'Permintaan reset tidak ditemukan' });
    }
    if (!ACTIVE_STATUSES.includes(record.status)) {
      return res.status(400).json({ success: false, message: `Permintaan sudah diproses (${record.status})` });
    }

    record.status = 'cancelled';
    record.code_hash = null;
    record.updated_at = new Date().toISOString();
    db.write(data);
    syncPasswordReset(record);

    logActivity({
      entity_type: 'password_reset',
      entity_id: record.id,
      action: 'cancel',
      title: `Permintaan reset password "${record.email}" dibatalkan admin`,
      actor: req.user,
    });

    return res.json({ success: true, message: `Permintaan reset untuk ${record.email} dibatalkan` });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
