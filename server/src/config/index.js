import dotenv from 'dotenv';
dotenv.config();

export const PORT = process.env.PORT || 5000;
export const JWT_SECRET = process.env.JWT_SECRET || 'kolab-super-secret-jwt-key-2026';
export const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'kolab-super-secret-refresh-key-2026';
export const JWT_EXPIRES_IN = '1d';
export const JWT_REFRESH_EXPIRES_IN = '7d';
