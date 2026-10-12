import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config/index.js';
import { db } from '../db/index.js';

export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Akses ditolak: Token autentikasi tidak ditemukan',
    });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).json({
        success: false,
        message: 'Akses ditolak: Token tidak valid atau telah kadaluarsa',
      });
    }

    const data = db.read();
    const user = data.users.find((u) => u.id === decoded.id);

    if (!user || user.status === 'inactive') {
      return res.status(401).json({
        success: false,
        message: 'Pengguna tidak aktif atau tidak ditemukan',
      });
    }

    req.user = user;
    next();
  });
};

export const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Belum terautentikasi',
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Akses dilarang: Fitur ini hanya untuk role ${roles.join(', ')}`,
      });
    }

    next();
  };
};
