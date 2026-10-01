// App-wide constants

export const API_BASE_URL = '/api/v1';

export const ROLES = {
  ADMIN: 'admin',
  DOSEN: 'dosen',
  MAHASISWA: 'mahasiswa',
};

export const ROLE_LABELS = {
  admin: 'Admin',
  dosen: 'Dosen',
  mahasiswa: 'Mahasiswa',
};

export const COMPETITION_STATUS = {
  UPCOMING: 'upcoming',
  ONGOING: 'ongoing',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
};

export const STATUS_LABELS = {
  upcoming: 'Akan Datang',
  ongoing: 'Sedang Berlangsung',
  completed: 'Selesai',
  cancelled: 'Dibatalkan',
};

export const STATUS_COLORS = {
  upcoming: 'bg-green-100 text-green-800',
  ongoing: 'bg-blue-100 text-blue-800',
  completed: 'bg-gray-100 text-gray-800',
  cancelled: 'bg-red-100 text-red-800',
};

export const TEAM_STATUS = {
  FORMING: 'forming',
  COMPLETE: 'complete',
  WITHDRAWN: 'withdrawn',
};

export const TEAM_STATUS_LABELS = {
  forming: 'Sedang Dibentuk',
  complete: 'Lengkap',
  withdrawn: 'Batal',
};

export const ADVISOR_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
};

export const ADVISOR_STATUS_LABELS = {
  pending: 'Menunggu',
  approved: 'Disetujui',
  rejected: 'Ditolak',
};

export const ADVISOR_STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
};

export const SUBMISSION_TYPES = {
  TEAM_CHANGE: 'team_change',
  ADVISOR_SELF_ASSIGN: 'advisor_self_assign',
  OTHER: 'other',
};

export const SUBMISSION_TYPE_LABELS = {
  team_change: 'Perubahan Tim',
  advisor_self_assign: 'Ajukan Diri',
  other: 'Lainnya',
};

export const DEFAULT_PASSWORD = 'KoLab2026!';

export const APP_NAME = 'Info Lomba Ko+Lab';
