import dotenv from 'dotenv';
dotenv.config();

export const PORT = process.env.PORT || 5000;
export const JWT_SECRET = process.env.JWT_SECRET || 'kolab-super-secret-jwt-key-2026';
export const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'kolab-super-secret-refresh-key-2026';
export const JWT_EXPIRES_IN = '1d';
export const JWT_REFRESH_EXPIRES_IN = '7d';

// SMTP untuk pengiriman email (OTP reset password)
export const SMTP_HOST = process.env.SMTP_HOST || '';
export const SMTP_PORT = Number(process.env.SMTP_PORT) || 465;
export const SMTP_USER = process.env.SMTP_USER || '';
export const SMTP_PASS = process.env.SMTP_PASS || '';
export const SMTP_FROM = process.env.SMTP_FROM || '';
export const SMTP_ENABLED = Boolean(SMTP_HOST && SMTP_USER && SMTP_PASS);
