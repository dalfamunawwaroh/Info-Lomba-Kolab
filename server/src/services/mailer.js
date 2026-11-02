import nodemailer from 'nodemailer';
import { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM, SMTP_ENABLED } from '../config/index.js';

let transporter = null;

const getTransporter = () => {
  if (!SMTP_ENABLED) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_PORT === 465,
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    });
  }
  return transporter;
};

export const isMailEnabled = () => SMTP_ENABLED;

/**
 * Kirim email OTP reset password (6 digit) ke user.
 * Melempar error bila SMTP belum dikonfigurasi atau pengiriman gagal.
 */
export const sendPasswordResetOtp = async ({ to, name, code, minutes = 10 }) => {
  const transport = getTransporter();
  if (!transport) {
    throw new Error('SMTP belum dikonfigurasi (lengkapi SMTP_HOST/SMTP_USER/SMTP_PASS di .env)');
  }

  const html = `
  <div style="font-family:Arial,Helvetica,sans-serif;max-width:520px;margin:0 auto;padding:24px;background:#ffffff;border:1px solid #e5e7eb;border-radius:16px">
    <div style="text-align:center;margin-bottom:16px">
      <span style="display:inline-block;background:linear-gradient(90deg,#6C1B75,#9333EA);color:#fff;font-weight:800;padding:8px 18px;border-radius:999px;letter-spacing:1px">Ko+Lab</span>
    </div>
    <h2 style="margin:0 0 8px;color:#0f172a;font-size:18px">Reset Password</h2>
    <p style="margin:0 0 16px;color:#475569;font-size:14px;line-height:1.6">
      Halo <b>${name}</b>,<br/>
      Admin telah mengirimkan kode verifikasi untuk mereset password akunmu.
      Masukkan kode di bawah ini pada halaman reset password.
    </p>
    <div style="text-align:center;margin:24px 0">
      <span style="display:inline-block;background:#f5f3ff;border:2px dashed #9333EA;color:#6C1B75;font-size:34px;font-weight:800;letter-spacing:10px;padding:16px 10px;border-radius:12px">${code}</span>
    </div>
    <p style="margin:0 0 6px;color:#475569;font-size:13px">Kode berlaku selama <b>${minutes} menit</b> dan hanya dapat digunakan sekali.</p>
    <p style="margin:0;color:#94a3b8;font-size:12px">Jika kamu tidak meminta reset password, abaikan email ini. Password akunmu tidak akan berubah.</p>
    <hr style="border:none;border-top:1px solid #e5e7eb;margin:18px 0"/>
    <p style="margin:0;color:#94a3b8;font-size:11px;text-align:center">Email ini dikirim otomatis oleh sistem Info Lomba Ko+Lab.</p>
  </div>`;

  const info = await transport.sendMail({
    from: SMTP_FROM || `Ko+Lab <${SMTP_USER}>`,
    to,
    subject: `Kode Verifikasi Reset Password - Ko+Lab`,
    text: `Halo ${name}, kode verifikasi reset password kamu adalah: ${code}. Berlaku ${minutes} menit. Jika kamu tidak meminta ini, abaikan email ini.`,
    html,
  });

  return info.messageId;
};
